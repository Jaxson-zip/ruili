import type { AIProvider } from "@reactive-resume/ai/types";
import type { ResumeAnalysis } from "@reactive-resume/schema/resume/analysis";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { ModelMessage, UIMessage } from "ai";
import type { fileInputSchema } from "./file-input";
import type { CloudOcrCredentials } from "./ocr";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamToEventIterator } from "@orpc/server";
import { convertToModelMessages, createGateway, generateText, Output, stepCountIs, streamText, tool } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { match } from "ts-pattern";
import { z } from "zod";
import {
	analyzeResumeSystemPrompt as analyzeResumeSystemPromptTemplate,
	chatSystemPromptTemplate,
	docxParserSystemPrompt,
	docxParserUserPrompt,
	pdfParserSystemPrompt,
	pdfParserUserPrompt,
} from "@reactive-resume/ai/prompts";
import { buildAiExtractionTemplate } from "@reactive-resume/ai/resume/extraction-template";
import { sanitizeAndParseResumeJson } from "@reactive-resume/ai/resume/sanitize";
import {
	normalizeResumePatchProposals,
	resumePatchProposalToolInputSchema,
	resumePatchProposalToolOutputSchema,
} from "@reactive-resume/ai/tools/patch-proposal";
import { aiProviderSchema } from "@reactive-resume/ai/types";
import { applyResumePatches } from "@reactive-resume/resume/patch";
import { resumeAnalysisOutputSchema, resumeAnalysisSchema } from "@reactive-resume/schema/resume/analysis";
import { supportsProviderNativeWebSearch } from "./capabilities";
import { extractDocxTextFromBase64 } from "./docx-text";
import { extractTextWithCloudOcr, shouldUseExtractedText } from "./ocr";
import { extractPdfTextFromBase64 } from "./pdf-text";
import { resolveAiBaseUrl } from "./url-policy";

const aiExtractionTemplate = buildAiExtractionTemplate();
const MAX_EXTRACTED_DOCUMENT_CHARS = 60_000;

function logAndRethrow(context: string, error: unknown): never {
	if (error instanceof Error) {
		console.error(`${context}:`, error);
		throw error;
	}

	console.error(`${context}:`, error);
	throw new Error(`An unknown error occurred during ${context}.`);
}

function parseAndValidateResumeJson(resultText: string): ResumeData {
	const { data, diagnostics } = sanitizeAndParseResumeJson(resultText);

	if (diagnostics.coercions.length === 0 && diagnostics.droppedSectionItems.length === 0) return data;

	const droppedBySection = diagnostics.droppedSectionItems.reduce<Record<string, number>>((acc, item) => {
		acc[item.section] = (acc[item.section] ?? 0) + 1;
		return acc;
	}, {});

	console.info("AI resume sanitization diagnostics", {
		coercions: diagnostics.coercions.length,
		droppedBySection,
		salvageApplied: diagnostics.salvageApplied,
	});

	return data;
}

type GetModelInput = {
	provider: AIProvider;
	model: string;
	apiKey: string;
	baseURL?: string;
};

export function getModel(input: GetModelInput) {
	const { provider, model, apiKey } = input;
	const baseURL = resolveAiBaseUrl(input);

	return match(provider)
		.with("openai", () => createOpenAI({ apiKey, baseURL }).chat(model))
		.with("anthropic", () => createAnthropic({ apiKey, baseURL }).languageModel(model))
		.with("gemini", () => createGoogleGenerativeAI({ apiKey, baseURL }).languageModel(model))
		.with("vercel-ai-gateway", () => createGateway({ apiKey, baseURL }).languageModel(model))
		.with("openrouter", () => createOpenAICompatible({ name: "openrouter", apiKey, baseURL }).languageModel(model))
		.with("openai-compatible", () =>
			createOpenAICompatible({ name: "openai-compatible", apiKey, baseURL }).languageModel(model),
		)
		.with("ollama", () => {
			const ollama = createOllama({
				name: "ollama",
				baseURL,
				...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {}),
			});

			return ollama.languageModel(model);
		})
		.exhaustive();
}

export function getAgentModel(input: GetModelInput) {
	if (!supportsProviderNativeWebSearch(input)) return getModel(input);

	return createOpenAI({ apiKey: input.apiKey, baseURL: resolveAiBaseUrl(input) }).responses(input.model);
}

const aiCredentialsSchema = z.object({
	provider: aiProviderSchema,
	model: z.string().trim().min(1),
	apiKey: z.string().trim().min(1),
	baseURL: z.string().optional().default(""),
});

type TestConnectionInput = z.infer<typeof aiCredentialsSchema>;

export async function testConnection(input: TestConnectionInput): Promise<boolean> {
	const RESPONSE_OK = "1";

	const result = await generateText({
		model: getModel(input),
		output: Output.choice({ options: [RESPONSE_OK] }),
		messages: [{ role: "user", content: `Respond only with JSON Object: { "result": "${RESPONSE_OK}" }` }],
	});

	return result.output === RESPONSE_OK;
}

type ParsePdfInput = z.infer<typeof aiCredentialsSchema> & {
	file: z.infer<typeof fileInputSchema>;
	ocr?: CloudOcrCredentials;
};

type BuildResumeParsingMessagesInput = {
	systemPrompt: string;
	userPrompt: string;
	file: z.infer<typeof fileInputSchema>;
	mediaType: string;
};

type BuildResumeTextParsingMessagesInput = {
	systemPrompt: string;
	userPrompt: string;
	fileName: string;
	sourceLabel: string;
	text: string;
};

function buildResumeExtractionSystemContent(systemPrompt: string) {
	return `${systemPrompt}\n\nIMPORTANT: You must return ONLY raw valid JSON. Do not return markdown, do not return explanations. Just the JSON object. Use the following JSON as a template and fill in the extracted values. For arrays, you MUST use the exact key names shown in the template (e.g. use 'description' instead of 'summary', 'website' instead of 'url'):\n\n${JSON.stringify(aiExtractionTemplate, null, 2)}`;
}

function buildResumeParsingMessages({
	systemPrompt,
	userPrompt,
	file,
	mediaType,
}: BuildResumeParsingMessagesInput): ModelMessage[] {
	return [
		{
			role: "system",
			content: buildResumeExtractionSystemContent(systemPrompt),
		},
		{
			role: "user",
			content: [
				{ type: "text", text: userPrompt },
				{ type: "file", data: file.data, mediaType, filename: file.name },
			],
		},
	];
}

function truncateExtractedDocumentText(text: string) {
	if (text.length <= MAX_EXTRACTED_DOCUMENT_CHARS) return text;

	return `${text.slice(0, MAX_EXTRACTED_DOCUMENT_CHARS)}\n\n[文档内容过长，后续文本已截断。]`;
}

function buildResumeTextParsingMessages({
	systemPrompt,
	userPrompt,
	fileName,
	sourceLabel,
	text,
}: BuildResumeTextParsingMessagesInput): ModelMessage[] {
	return [
		{
			role: "system",
			content: buildResumeExtractionSystemContent(systemPrompt),
		},
		{
			role: "user",
			content: `${userPrompt}\n\nFile name: ${fileName}\n\n## Extracted ${sourceLabel} Text\n\n${truncateExtractedDocumentText(text)}`,
		},
	];
}

async function parsePdf(input: ParsePdfInput): Promise<ResumeData> {
	const model = getModel(input);
	let extractedText: string | null = null;
	let sourceLabel = "PDF";

	try {
		extractedText = await extractPdfTextFromBase64(input.file.data);
	} catch (error) {
		console.warn("Failed to extract PDF text locally; falling back to model file input.", error);
	}

	if (!shouldUseExtractedText(extractedText)) {
		try {
			const ocrResult = await extractTextWithCloudOcr({
				file: input.file,
				mediaType: "application/pdf",
				...(input.ocr ? { credentials: input.ocr } : {}),
			});
			if (ocrResult) {
				extractedText = ocrResult.text;
				sourceLabel = `OCR ${ocrResult.provider}`;
			}
		} catch (error) {
			console.warn("Failed to extract PDF text with cloud OCR; falling back to model file input.", error);
		}
	}

	const textForParsing = shouldUseExtractedText(extractedText) ? extractedText : null;

	const result = await generateText({
		model,
		messages: textForParsing
			? buildResumeTextParsingMessages({
					systemPrompt: pdfParserSystemPrompt,
					userPrompt: pdfParserUserPrompt,
					fileName: input.file.name,
					sourceLabel,
					text: textForParsing,
				})
			: buildResumeParsingMessages({
					systemPrompt: pdfParserSystemPrompt,
					userPrompt: pdfParserUserPrompt,
					file: input.file,
					mediaType: "application/pdf",
				}),
	}).catch((error: unknown) => logAndRethrow("Failed to generate the text with the model", error));

	return parseAndValidateResumeJson(result.text);
}

type ParseImageInput = z.infer<typeof aiCredentialsSchema> & {
	file: z.infer<typeof fileInputSchema>;
	mediaType: "image/gif" | "image/jpeg" | "image/png" | "image/webp";
	ocr?: CloudOcrCredentials;
};

async function parseImage(input: ParseImageInput): Promise<ResumeData> {
	const model = getModel(input);
	const ocrResult = await extractTextWithCloudOcr({
		file: input.file,
		mediaType: input.mediaType,
		...(input.ocr ? { credentials: input.ocr } : {}),
	});

	if (!ocrResult) throw new Error("CLOUD_OCR_NOT_CONFIGURED");

	const result = await generateText({
		model,
		messages: buildResumeTextParsingMessages({
			systemPrompt: pdfParserSystemPrompt,
			userPrompt: pdfParserUserPrompt,
			fileName: input.file.name,
			sourceLabel: `image OCR ${ocrResult.provider}`,
			text: ocrResult.text,
		}),
	}).catch((error: unknown) => logAndRethrow("Failed to generate the text with the model", error));

	return parseAndValidateResumeJson(result.text);
}

type ParseDocxInput = z.infer<typeof aiCredentialsSchema> & {
	file: z.infer<typeof fileInputSchema>;
	mediaType: "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
};

async function parseDocx(input: ParseDocxInput): Promise<ResumeData> {
	const model = getModel(input);
	let extractedText: string | null = null;

	if (input.mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
		try {
			extractedText = extractDocxTextFromBase64(input.file.data);
		} catch (error) {
			console.warn("Failed to extract DOCX text locally; falling back to model file input.", error);
		}
	}

	const result = await generateText({
		model,
		messages: extractedText
			? buildResumeTextParsingMessages({
					systemPrompt: docxParserSystemPrompt,
					userPrompt: docxParserUserPrompt,
					fileName: input.file.name,
					sourceLabel: "Microsoft Word",
					text: extractedText,
				})
			: buildResumeParsingMessages({
					systemPrompt: docxParserSystemPrompt,
					userPrompt: docxParserUserPrompt,
					file: input.file,
					mediaType: input.mediaType,
				}),
	}).catch((error: unknown) => logAndRethrow("Failed to generate the text with the model", error));

	return parseAndValidateResumeJson(result.text);
}

function buildChatSystemPrompt(resumeData: ResumeData): string {
	return chatSystemPromptTemplate.replace("{{RESUME_DATA}}", JSON.stringify(resumeData, null, 2));
}

type ChatInput = z.infer<typeof aiCredentialsSchema> & {
	messages: UIMessage[];
	resumeData: ResumeData;
	resumeUpdatedAt: Date;
};

async function chat(input: ChatInput) {
	const model = getModel(input);
	const systemPrompt = buildChatSystemPrompt(input.resumeData);

	const result = streamText({
		model,
		system: systemPrompt,
		messages: await convertToModelMessages(input.messages),
		tools: {
			propose_resume_patches: tool({
				description:
					"Return one or more cohesive resume change proposals. Each proposal must include a title, optional summary, and valid JSON Patch operations against the current resume data. The tool validates but does not apply changes.",
				inputSchema: resumePatchProposalToolInputSchema,
				outputSchema: resumePatchProposalToolOutputSchema,
				execute: async (toolInput) => {
					const proposals = normalizeResumePatchProposals(toolInput, input.resumeUpdatedAt);

					for (const proposal of proposals) {
						applyResumePatches(input.resumeData, proposal.operations);
					}

					return { proposals };
				},
			}),
		},
		stopWhen: stepCountIs(3),
	});

	return streamToEventIterator(result.toUIMessageStream());
}

type AnalyzeResumeInput = z.infer<typeof aiCredentialsSchema> & {
	resumeData: ResumeData;
};

function buildAnalyzeResumeSystemPrompt(resumeData: ResumeData): string {
	return `${analyzeResumeSystemPromptTemplate}\n\n## Resume Data\n\n${JSON.stringify(resumeData, null, 2)}`;
}

async function analyzeResume(input: AnalyzeResumeInput): Promise<ResumeAnalysis> {
	const model = getModel(input);
	const systemPrompt = buildAnalyzeResumeSystemPrompt(input.resumeData);

	const result = await generateText({
		model,
		output: Output.object({ schema: resumeAnalysisOutputSchema }),
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content:
					"请用简体中文分析这份简历，并只返回结构化 JSON。报告需要包含评分维度、综合评分、当前优势和可执行的修改建议；不要返回英文解释、markdown 或额外字段。",
			},
		],
	});

	if (result.output == null) {
		throw new Error("AI returned no structured analysis output.");
	}

	return resumeAnalysisSchema.parse(result.output);
}

export const aiService = {
	analyzeResume,
	chat,
	parseImage,
	parseDocx,
	parsePdf,
	testConnection,
};
