import type { ResumeData, SectionType } from "@reactive-resume/schema/resume/data";
import type { WordTemplateId, WordTemplateSlots } from "@reactive-resume/schema/resume/word-template";
import { getWordTemplateManifest, wordTemplateManifests } from "@reactive-resume/schema/resume/word-template";

export type { WordTemplateId };

export type WordTemplate = {
	id: WordTemplateId;
	name: string;
	description: string;
	previewUrl: string;
	docxUrl: string;
	badges: string[];
	tags: string[];
	suitableFor: string;
	modules: string[];
	capabilities: string[];
};

const wordTemplatePictureLeftSidebarSections = ["picture", "basics"] as const;

export const wordTemplateSupportedSectionIds = {
	"zh-internship-001": ["education", "awards", "experience", "projects"],
	"zh-ats-compact-001": ["education", "awards", "experience", "projects", "skills"],
	"zh-sidebar-clean-001": ["education", "awards", "experience", "projects", "skills"],
} as const satisfies Record<WordTemplateId, readonly SectionType[]>;

export type WordTemplateSupportedSectionId = (typeof wordTemplateSupportedSectionIds)[WordTemplateId][number];
export type WordTemplateLeftSidebarSectionId =
	| (typeof wordTemplatePictureLeftSidebarSections)[number]
	| "summary"
	| WordTemplateSupportedSectionId;

const selectionStorageKeyPrefix = "ruili.wordTemplate.selected.";
export const wordTemplateSelectionChangeEvent = "ruili.wordTemplate.selectionChange";

const wordTemplateMetadata = {
	"zh-internship-001": {
		id: "zh-internship-001",
		name: "校招实习标准模板",
		description: "面向实习、校招和初级岗位的可填充 Word 模板，保留证件照、信息栏、分隔线和紧凑内容排版。",
		badges: ["DOCX", "高保真", "结构化"],
		tags: ["实习", "校招", "中文简历"],
		suitableFor: "适合实习、校招和初级岗位投递：左侧填写结构化内容，右侧按 Word 版式预览并导出。",
		modules: ["证件照头部", "求职意向", "教育经历", "奖项荣誉", "工作经历", "项目经历"],
		capabilities: ["结构化字段填充", "DOCX 导出", "模板预览"],
	},
	"zh-ats-compact-001": {
		id: "zh-ats-compact-001",
		name: "ATS 单栏精简模板",
		description: "面向中文校招和通用岗位的单栏 DOCX 模板，弱化装饰，突出教育、经历、项目和技能关键词。",
		badges: ["DOCX", "ATS", "单栏"],
		tags: ["校招", "通用", "ATS"],
		suitableFor: "适合投递系统筛选、通用技术岗和需要稳定 DOCX 导出的中文简历。",
		modules: ["基本信息", "教育经历", "工作经历", "项目经历", "奖项荣誉", "技能"],
		capabilities: ["ATS 友好排版", "DOCX 导出", "模板预览"],
	},
	"zh-sidebar-clean-001": {
		id: "zh-sidebar-clean-001",
		name: "蓝灰侧栏双栏模板",
		description: "左侧集中展示联系方式、教育和技能，右侧突出工作与项目经历，适合想要更强视觉分区的中文简历。",
		badges: ["DOCX", "双栏", "侧栏"],
		tags: ["技术岗", "校招", "视觉分区"],
		suitableFor: "适合需要兼顾信息密度和页面层次的中文简历，导出后仍保留 Word 双栏结构。",
		modules: ["侧栏信息", "个人优势", "教育背景", "核心技能", "工作经历", "项目经历", "奖项荣誉"],
		capabilities: ["双栏信息分区", "DOCX 导出", "模板预览"],
	},
} as const satisfies Record<WordTemplateId, Omit<WordTemplate, "docxUrl" | "previewUrl">>;

const wordTemplateLibrary: readonly WordTemplate[] = wordTemplateManifests.map((manifest) => ({
	...wordTemplateMetadata[manifest.id],
	docxUrl: `/templates/word/${manifest.docxFileName}`,
	previewUrl: `/templates/word/${manifest.previewFileName}`,
}));

export function getWordTemplateLibrary(): readonly WordTemplate[] {
	return wordTemplateLibrary;
}

export function getWordTemplateDefaultResumeName(templateId: WordTemplateId | null | undefined) {
	const template = getWordTemplateById(templateId);
	return template ? `${template.name} 简历` : "中文 Word 模板简历";
}

export function isDefaultWordTemplateResumeName(name: string) {
	const normalizedName = name.trim();

	return wordTemplateLibrary.some(
		(template) => normalizedName === template.name || normalizedName === getWordTemplateDefaultResumeName(template.id),
	);
}

export function getWordTemplateById(id: string | null | undefined) {
	if (!id) return undefined;
	return wordTemplateLibrary.find((template) => template.id === id);
}

export function getWordTemplateSlots(templateId: WordTemplateId | null | undefined): WordTemplateSlots {
	return getWordTemplateManifest(templateId)?.slots ?? {};
}

export function getWordTemplateSectionSlotLimit(
	templateId: WordTemplateId | null | undefined,
	sectionId: SectionType,
): number | undefined {
	const slots = getWordTemplateSlots(templateId);

	switch (sectionId) {
		case "awards":
			return slots.awards;
		case "education":
			return slots.education;
		case "experience":
			return slots.experience;
		case "projects":
			return slots.projects;
		case "skills":
			return slots.skills;
		default:
			return undefined;
	}
}

export function getSelectedWordTemplateId(resumeId: string, data?: ResumeData) {
	return (
		getMetadataWordTemplateId(data) ??
		readSelectionStorage().getItem(getSelectionStorageKey(resumeId)) ??
		inferWordTemplateIdFromResumeData(data) ??
		null
	);
}

export function getSelectedWordTemplate(resumeId: string, data?: ResumeData) {
	return getWordTemplateById(getSelectedWordTemplateId(resumeId, data));
}

export function getWordTemplateSupportedSectionIds(
	templateId: WordTemplateId | null | undefined,
): readonly WordTemplateSupportedSectionId[] {
	if (!templateId) return [];
	return wordTemplateSupportedSectionIds[templateId] ?? [];
}

export function getWordTemplateLeftSidebarSectionIds(
	templateId: WordTemplateId | null | undefined,
): readonly WordTemplateLeftSidebarSectionId[] {
	if (!templateId) return [];
	const baseSections = wordTemplatePictureLeftSidebarSections;

	if (templateId === "zh-internship-001") {
		return [...baseSections, "education", "awards", "experience", "projects"];
	}

	if (templateId === "zh-ats-compact-001") {
		return [...baseSections, "education", "experience", "projects", "awards", "skills"];
	}

	if (templateId === "zh-sidebar-clean-001") {
		return [...baseSections, "summary", "education", "skills", "experience", "projects", "awards"];
	}

	return [...baseSections, ...getWordTemplateSupportedSectionIds(templateId)];
}

export function setSelectedWordTemplateId(resumeId: string, templateId: WordTemplateId) {
	readSelectionStorage().setItem(getSelectionStorageKey(resumeId), templateId);
	emitSelectionChange();
}

export function clearSelectedWordTemplateId(resumeId: string) {
	readSelectionStorage().removeItem(getSelectionStorageKey(resumeId));
	emitSelectionChange();
}

function getSelectionStorageKey(resumeId: string) {
	return `${selectionStorageKeyPrefix}${resumeId}`;
}

function readSelectionStorage() {
	if (typeof localStorage !== "undefined") return localStorage;
	return memorySelectionStorage;
}

function emitSelectionChange() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(wordTemplateSelectionChangeEvent));
}

function getMetadataWordTemplateId(data: ResumeData | undefined): WordTemplateId | undefined {
	const id = data?.metadata.wordTemplate?.id;
	return id && getWordTemplateById(id) ? id : undefined;
}

function inferWordTemplateIdFromResumeData(data: ResumeData | undefined): WordTemplateId | undefined {
	if (!data) return undefined;

	const customFieldIds = new Set((data.basics?.customFields ?? []).map((field) => field.id));
	if (customFieldIds.has("zh-internship-gender") || customFieldIds.has("zh-internship-birthday")) {
		return "zh-internship-001";
	}

	if (data.picture?.url?.includes("zh-internship-001")) {
		return "zh-internship-001";
	}

	return undefined;
}

const memorySelectionValues = new Map<string, string>();

const memorySelectionStorage: Pick<Storage, "getItem" | "removeItem" | "setItem"> = {
	getItem: (key) => memorySelectionValues.get(key) ?? null,
	removeItem: (key) => {
		memorySelectionValues.delete(key);
	},
	setItem: (key, value) => {
		memorySelectionValues.set(key, value);
	},
};
