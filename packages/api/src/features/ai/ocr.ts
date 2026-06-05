import { env } from "@reactive-resume/env/server";

type OcrProvider = "azure-document-intelligence";

export type CloudOcrCredentials = {
	apiKey: string;
	endpoint: string;
	provider: OcrProvider;
};

type ExtractTextWithCloudOcrInput = {
	credentials?: CloudOcrCredentials;
	file: { data: string; name: string };
	mediaType: string;
};

type CloudOcrResult = {
	provider: OcrProvider;
	text: string;
};

type AzureReadResponse = {
	analyzeResult?: {
		content?: string;
		pages?: Array<{ lines?: Array<{ content?: string }> }>;
	};
	error?: { message?: string };
	status?: "failed" | "notStarted" | "running" | "succeeded";
};

function normalizeOcrText(text: string) {
	return text
		.replace(/\r\n?/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function countMeaningfulCharacters(text: string) {
	return [...text.replace(/\s/g, "")].length;
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAzureEndpoint(endpoint: string) {
	const url = new URL(endpoint.trim().replace(/\/+$/, ""));

	if (url.protocol !== "https:") throw new Error("CLOUD_OCR_ENDPOINT_NOT_ALLOWED");

	const hostname = url.hostname.toLowerCase();
	const isAzureDocumentIntelligenceHost =
		hostname.endsWith(".cognitiveservices.azure.com") || hostname.endsWith(".api.cognitive.microsoft.com");
	if (!isAzureDocumentIntelligenceHost) throw new Error("CLOUD_OCR_ENDPOINT_NOT_ALLOWED");

	return url.origin;
}

function getAzureRuntime(credentials?: CloudOcrCredentials) {
	if (credentials?.provider === "azure-document-intelligence") {
		const apiKey = credentials.apiKey.trim();
		const endpoint = normalizeAzureEndpoint(credentials.endpoint);
		if (!apiKey) throw new Error("CLOUD_OCR_NOT_CONFIGURED");

		return { apiKey, endpoint };
	}

	const apiKey = env.OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim() ?? "";
	const endpoint = env.OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim() ?? "";
	if (!apiKey || !endpoint) throw new Error("CLOUD_OCR_NOT_CONFIGURED");

	return { apiKey, endpoint: normalizeAzureEndpoint(endpoint) };
}

export function shouldUseExtractedText(text: string | null | undefined) {
	if (!text) return false;
	return countMeaningfulCharacters(text) >= env.OCR_MIN_TEXT_CHARS;
}

export function isCloudOcrConfigured(credentials?: CloudOcrCredentials) {
	try {
		if (credentials) {
			getAzureRuntime(credentials);
			return true;
		}

		return env.OCR_PROVIDER === "azure-document-intelligence" && !!getAzureRuntime();
	} catch {
		return false;
	}
}

function getAzureAnalyzeUrl(endpoint: string) {
	return `${endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30`;
}

function readAzureContent(response: AzureReadResponse) {
	const content = normalizeOcrText(response.analyzeResult?.content ?? "");
	if (content) return content;

	return normalizeOcrText(
		response.analyzeResult?.pages
			?.flatMap((page) => page.lines?.map((line) => line.content ?? "") ?? [])
			.filter(Boolean)
			.join("\n") ?? "",
	);
}

async function extractTextWithAzureDocumentIntelligence({
	credentials,
	file,
	mediaType,
}: ExtractTextWithCloudOcrInput): Promise<CloudOcrResult> {
	const runtime = getAzureRuntime(credentials);

	const analyzeResponse = await fetch(getAzureAnalyzeUrl(runtime.endpoint), {
		method: "POST",
		headers: {
			"Content-Type": mediaType,
			"Ocp-Apim-Subscription-Key": runtime.apiKey,
		},
		body: Buffer.from(file.data, "base64"),
	});

	if (!analyzeResponse.ok || analyzeResponse.status !== 202) throw new Error("CLOUD_OCR_REQUEST_FAILED");

	const operationLocation = analyzeResponse.headers.get("Operation-Location");
	if (!operationLocation) throw new Error("CLOUD_OCR_OPERATION_MISSING");

	const startedAt = Date.now();

	while (Date.now() - startedAt <= env.OCR_TIMEOUT_MS) {
		const pollResponse = await fetch(operationLocation, {
			headers: { "Ocp-Apim-Subscription-Key": runtime.apiKey },
		});

		if (!pollResponse.ok) throw new Error("CLOUD_OCR_POLL_FAILED");

		const payload = (await pollResponse.json()) as AzureReadResponse;
		if (payload.status === "failed") throw new Error(payload.error?.message ?? "CLOUD_OCR_ANALYSIS_FAILED");
		if (payload.status === "succeeded") {
			const text = readAzureContent(payload);
			if (!text) throw new Error("CLOUD_OCR_TEXT_EMPTY");
			return { provider: "azure-document-intelligence", text };
		}

		await sleep(env.OCR_POLL_INTERVAL_MS);
	}

	throw new Error("CLOUD_OCR_TIMEOUT");
}

export async function extractTextWithCloudOcr(input: ExtractTextWithCloudOcrInput): Promise<CloudOcrResult | null> {
	if (!isCloudOcrConfigured(input.credentials)) return null;

	if (
		input.credentials?.provider === "azure-document-intelligence" ||
		env.OCR_PROVIDER === "azure-document-intelligence"
	) {
		return extractTextWithAzureDocumentIntelligence(input);
	}

	return null;
}
