export type WordTemplateId = "compact-blue-grid" | "dark-orange-sidebar";

export type WordTemplate = {
	id: WordTemplateId;
	name: string;
	description: string;
	previewUrl: string;
	docxUrl: string;
	badges: string[];
	tags: string[];
	suitableFor: string;
};

const selectionStorageKeyPrefix = "ruili.wordTemplate.selected.";
export const wordTemplateSelectionChangeEvent = "ruili.wordTemplate.selectionChange";

const wordTemplateLibrary = [
	{
		id: "compact-blue-grid",
		name: "1.docx 中文模板",
		description: "来自根目录 1.docx 的 Word 模板，保留原 DOCX 版式，导出时用当前简历内容填充。",
		previewUrl: "/templates/word/compact-blue-grid.svg",
		docxUrl: "/templates/word/compact-blue-grid.docx",
		badges: ["DOCX", "可编辑", "表格式"],
		tags: ["校招", "实习", "技术岗"],
		suitableFor: "适合直接基于现成 Word 模板生成中文简历。",
	},
	{
		id: "dark-orange-sidebar",
		name: "深灰橙色侧栏",
		description: "左右分栏、深色个人信息栏和橙色标题线，适合技术、设计、运营等一页式中文简历。",
		previewUrl: "/templates/word/dark-orange-sidebar.jpg",
		docxUrl: "/templates/word/dark-orange-sidebar.docx",
		badges: ["DOCX", "可编辑", "侧栏"],
		tags: ["技术岗", "设计岗", "一页式"],
		suitableFor: "适合需要强视觉区分和清晰信息分区的中文简历。",
	},
] as const satisfies readonly WordTemplate[];

export function getWordTemplateLibrary() {
	return wordTemplateLibrary;
}

export function getWordTemplateById(id: string | null | undefined) {
	if (!id) return undefined;
	return wordTemplateLibrary.find((template) => template.id === id);
}

export function getSelectedWordTemplateId(resumeId: string) {
	return readSelectionStorage().getItem(getSelectionStorageKey(resumeId));
}

export function getSelectedWordTemplate(resumeId: string) {
	return getWordTemplateById(getSelectedWordTemplateId(resumeId));
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
