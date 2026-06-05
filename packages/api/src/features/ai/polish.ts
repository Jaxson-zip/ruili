import type { ModelMessage } from "ai";
import { z } from "zod";

export const polishResumeItemInputSchema = z.object({
	itemKind: z.enum(["experience", "project", "role"]),
	item: z.object({
		title: z.string().trim().max(160).optional().default(""),
		organization: z.string().trim().max(160).optional().default(""),
		period: z.string().trim().max(120).optional().default(""),
		location: z.string().trim().max(120).optional().default(""),
		descriptionHtml: z.string().max(6000).optional().default(""),
	}),
	targetJobDescription: z.string().trim().max(8000).optional(),
});

export const polishedResumeItemOutputSchema = z.object({
	headline: z.string().trim().max(160).optional().default(""),
	descriptionHtml: z.string().trim().min(1).max(6000),
});

export type PolishResumeItemInput = z.infer<typeof polishResumeItemInputSchema>;
export type PolishedResumeItemOutput = z.infer<typeof polishedResumeItemOutputSchema>;

function sanitizePolishedDescriptionHtml(html: string): string {
	return html
		.replace(/<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
		.replace(/<\s*(script|style|iframe|object|embed)\b[^>]*\/?\s*>/gi, "")
		.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
		.replace(/\s+(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "")
		.replace(/\s+(href|src)\s*=\s*javascript:[^\s>]+/gi, "");
}

export function normalizePolishedResumeItemOutput(output: PolishedResumeItemOutput): PolishedResumeItemOutput {
	return polishedResumeItemOutputSchema.parse({
		headline: output.headline?.trim() ?? "",
		descriptionHtml: sanitizePolishedDescriptionHtml(output.descriptionHtml).trim(),
	});
}

export function buildPolishResumeItemMessages(input: PolishResumeItemInput): ModelMessage[] {
	const itemKindLabel = {
		experience: "工作经历",
		project: "项目经历",
		role: "同一公司的岗位阶段",
	}[input.itemKind];

	return [
		{
			role: "system",
			content: [
				"你是面向中国求职者的中文简历优化助手。",
				"请把单条经历改写成更适合中文招聘场景和 ATS 扫描的表达。",
				"必须使用简体中文，语气专业、克制、结果导向。",
				"不要编造公司、岗位、项目、时间、地点、技术栈、指标、获奖、证书或任何用户没有提供的事实。",
				"如果原文没有明确数字，不要凭空添加百分比、金额、人数或规模。",
				"可以在不改变事实的前提下优化动词、结构、关键词和可读性。",
				"如果提供了目标 JD，只能围绕 JD 中的真实要求调整关键词侧重。",
				"只返回 JSON 对象，不要返回 markdown、解释或代码块。",
				"descriptionHtml 只能使用安全的富文本 HTML，例如 <p>、<ul>、<ol>、<li>、<strong>、<em>。",
			].join("\n"),
		},
		{
			role: "user",
			content: JSON.stringify(
				{
					task: "polish_resume_item",
					itemKind: itemKindLabel,
					targetJobDescription: input.targetJobDescription ?? "",
					item: input.item,
					expectedOutput: {
						headline: "可选，保留或优化一句短标题",
						descriptionHtml: "<ul><li>用 2-4 条中文要点呈现成果、职责和相关关键词。</li></ul>",
					},
				},
				null,
				2,
			),
		},
	];
}
