import type { JsonPatchOperation } from "@reactive-resume/resume/patch";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import z from "zod";
import { applyResumePatches, jsonPatchOperationSchema } from "@reactive-resume/resume/patch";

const jsonPointerToken = /~1|~0/g;

const operationLabels: Record<JsonPatchOperation["op"], string> = {
	add: "新增",
	copy: "复制",
	move: "移动",
	remove: "删除",
	replace: "替换",
	test: "校验",
};

const sectionLabels: Record<string, string> = {
	basics: "基本信息",
	customSections: "自定义章节",
	metadata: "模板设置",
	picture: "照片",
	sections: "简历章节",
	summary: "个人总结",
};

const fieldLabels: Record<string, string> = {
	awards: "奖项荣誉",
	background: "背景色",
	basics: "基本信息",
	certifications: "证书",
	company: "公司",
	content: "内容",
	description: "描述",
	education: "教育经历",
	experience: "工作经历",
	format: "纸张尺寸",
	headline: "求职标题",
	interests: "兴趣爱好",
	items: "条目",
	languages: "语言能力",
	location: "城市",
	name: "名称",
	page: "页面",
	primary: "主色",
	profiles: "社交主页",
	projects: "项目经历",
	publications: "发表作品",
	references: "推荐人",
	skills: "技能清单",
	summary: "个人总结",
	text: "文字颜色",
	title: "标题",
	volunteer: "志愿经历",
};

export const resumePatchProposalSchema = z.object({
	id: z.string().min(1),
	title: z.string().trim().min(1),
	summary: z.string().trim().min(1).optional(),
	baseUpdatedAt: z.string().datetime().optional(),
	operations: z.array(jsonPatchOperationSchema).min(1),
});

export const resumePatchProposalToolInputSchema = z.object({
	proposals: z
		.array(
			resumePatchProposalSchema.omit({ id: true, baseUpdatedAt: true }).extend({
				id: z.string().min(1).optional(),
			}),
		)
		.min(1),
});

export const resumePatchProposalToolOutputSchema = z.object({
	proposals: z.array(resumePatchProposalSchema).min(1),
});

export type ResumePatchProposal = z.infer<typeof resumePatchProposalSchema>;
export type ResumePatchProposalToolInput = z.infer<typeof resumePatchProposalToolInputSchema>;
export type ResumePatchProposalToolOutput = z.infer<typeof resumePatchProposalToolOutputSchema>;

export type ResumePatchPreviewEntry = {
	operation: JsonPatchOperation["op"];
	operationLabel: string;
	path: string;
	label: string;
	before: unknown;
	after: unknown;
};

export type ResumePatchProposalPreview = {
	id: string;
	title: string;
	summary?: string;
	entries: ResumePatchPreviewEntry[];
};

function decodeJsonPointerPath(path: string): string[] {
	if (path === "") return [];
	if (!path.startsWith("/")) return [];

	return path
		.slice(1)
		.split("/")
		.map((segment) => segment.replace(jsonPointerToken, (token) => (token === "~1" ? "/" : "~")));
}

function getValueAtPath(data: unknown, path: string): unknown {
	const segments = decodeJsonPointerPath(path);

	return segments.reduce<unknown>((current, segment) => {
		if (current == null) return undefined;

		if (Array.isArray(current)) {
			if (segment === "-") return undefined;
			const index = Number(segment);
			return Number.isInteger(index) ? current[index] : undefined;
		}

		if (typeof current !== "object") return undefined;
		return (current as Record<string, unknown>)[segment];
	}, data);
}

function getSectionLabel(segments: string[]): string {
	if (segments[0] === "sections" && segments[1]) return fieldLabels[segments[1]] ?? titleize(segments[1]);
	if (segments[0] === "metadata" && segments[1]) {
		return `${sectionLabels.metadata} ${fieldLabels[segments[1]] ?? titleize(segments[1])}`;
	}
	if (segments[0]) return sectionLabels[segments[0]] ?? titleize(segments[0]);

	return "Resume";
}

function titleize(value: string): string {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^./, (char) => char.toUpperCase());
}

function formatPathLabel(operation: JsonPatchOperation): string {
	const path = operation.path;
	const segments = decodeJsonPointerPath(path);
	const section = getSectionLabel(segments);
	const field = segments.at(-1);

	if (!field) return section;
	if (field === "-") return operation.op === "add" ? `${section}新增条目` : section;
	if (/^\d+$/.test(field)) return `${section}第 ${Number(field) + 1} 项`;
	if (field === "items") return `${section}条目`;

	const fieldLabel = fieldLabels[field] ?? titleize(field);
	return section === fieldLabel ? section : `${section} ${fieldLabel}`;
}

function getPreviewAfterValue(patchedData: ResumeData, operation: JsonPatchOperation): unknown {
	if (operation.op === "remove") return undefined;
	if (operation.op === "add" && decodeJsonPointerPath(operation.path).at(-1) === "-") return operation.value;

	return getValueAtPath(patchedData, operation.path);
}

export function buildResumePatchProposalPreview(
	resumeData: ResumeData,
	proposal: ResumePatchProposal,
): ResumePatchProposalPreview {
	const patchedData = applyResumePatches(resumeData, proposal.operations);

	return {
		id: proposal.id,
		title: proposal.title,
		...(proposal.summary ? { summary: proposal.summary } : {}),
		entries: proposal.operations.map((operation) => ({
			operation: operation.op,
			operationLabel: operationLabels[operation.op],
			path: operation.path,
			label: formatPathLabel(operation),
			before: operation.op === "add" ? undefined : getValueAtPath(resumeData, operation.path),
			after: getPreviewAfterValue(patchedData, operation),
		})),
	};
}

export function normalizeResumePatchProposals(
	input: ResumePatchProposalToolInput,
	baseUpdatedAt?: Date,
): ResumePatchProposal[] {
	return input.proposals.map((proposal, index) => ({
		...proposal,
		id: proposal.id ?? `proposal-${index + 1}`,
		...(baseUpdatedAt ? { baseUpdatedAt: baseUpdatedAt.toISOString() } : {}),
	}));
}
