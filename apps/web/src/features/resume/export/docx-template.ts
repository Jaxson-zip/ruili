import type { ResumeData } from "@reactive-resume/schema/resume/data";
import JSZip from "jszip";

export const DOCX_TEMPLATE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const placeholderPattern = /\{\{\s*([#/])?\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const repeatBlockPattern = /\{\{\s*#\s*([a-zA-Z0-9_.-]+)\s*\}\}([\s\S]*?)\{\{\s*\/\s*\1\s*\}\}/g;
const wordXmlPathPattern = /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/;

const repeatSectionKeys = ["experience", "education", "projects", "skills"] as const;

export type DocxTemplateInspection = {
	placeholders: string[];
	supportedPlaceholders: string[];
	unsupportedPlaceholders: string[];
	xmlFileCount: number;
};

export async function inspectDocxTemplate(file: Blob): Promise<DocxTemplateInspection> {
	const zip = await JSZip.loadAsync(file);
	const xmlPaths = getTemplateXmlPaths(zip);

	if (xmlPaths.length === 0) throw new Error("Invalid DOCX template: no editable Word XML files found.");

	const placeholders = new Set<string>();

	for (const path of xmlPaths) {
		const xml = await zip.file(path)?.async("string");
		if (!xml) continue;

		for (const placeholder of extractDocxTemplatePlaceholdersFromXml(xml)) {
			placeholders.add(placeholder);
		}
	}

	const placeholderList = [...placeholders];
	const supportedPlaceholders = placeholderList.filter(isSupportedDocxTemplatePlaceholder);

	return {
		placeholders: placeholderList,
		supportedPlaceholders,
		unsupportedPlaceholders: placeholderList.filter((placeholder) => !supportedPlaceholders.includes(placeholder)),
		xmlFileCount: xmlPaths.length,
	};
}

export async function buildDocxFromTemplate(file: Blob, data: ResumeData): Promise<Blob> {
	const zip = await JSZip.loadAsync(file);
	const xmlPaths = getTemplateXmlPaths(zip);

	if (xmlPaths.length === 0) throw new Error("Invalid DOCX template: no editable Word XML files found.");

	for (const path of xmlPaths) {
		const xml = await zip.file(path)?.async("string");
		if (!xml) continue;

		zip.file(path, renderDocxTemplateXml(xml, data));
	}

	return await zip.generateAsync({ type: "blob", mimeType: DOCX_TEMPLATE_MIME_TYPE });
}

export function extractDocxTemplatePlaceholdersFromXml(xml: string): string[] {
	const placeholders = new Set<string>();

	for (const match of xml.matchAll(placeholderPattern)) {
		const key = match[2]?.trim();
		if (key) placeholders.add(key);
	}

	return [...placeholders];
}

export function renderDocxTemplateXml(xml: string, data: ResumeData): string {
	const withRepeatBlocks = xml.replace(repeatBlockPattern, (match, sectionKey: string, body: string) => {
		const items = getRepeatSectionItems(data, sectionKey);
		if (!items) return match;

		return items.map((item) => renderRepeatBlockBody(body, item, data)).join("");
	});

	return replaceScalarPlaceholders(withRepeatBlocks, (key) => resolveDocxTemplateValue(data, key));
}

function renderRepeatBlockBody(body: string, item: Record<string, unknown>, data: ResumeData) {
	return replaceScalarPlaceholders(
		body,
		(key) => resolveContextValue(item, key) ?? resolveDocxTemplateValue(data, key),
	);
}

function replaceScalarPlaceholders(xml: string, resolveValue: (key: string) => string | undefined) {
	return xml.replace(placeholderPattern, (match, prefix: string | undefined, key: string) => {
		if (prefix) return match;

		const value = resolveValue(key);
		return value === undefined ? match : escapeXml(value);
	});
}

function getTemplateXmlPaths(zip: JSZip) {
	return Object.values(zip.files)
		.filter((file) => !file.dir && wordXmlPathPattern.test(file.name))
		.map((file) => file.name)
		.sort((a, b) => Number(b === "word/document.xml") - Number(a === "word/document.xml"));
}

function isSupportedDocxTemplatePlaceholder(key: string) {
	return (
		repeatSectionKeys.includes(key as (typeof repeatSectionKeys)[number]) ||
		resolveDocxTemplateValue(emptyResumeData, key) !== undefined
	);
}

function resolveDocxTemplateValue(data: ResumeData, key: string): string | undefined {
	switch (key) {
		case "basics.website":
			return formatWebsite(data.basics.website);
		case "summary.content":
			return htmlToPlainText(data.summary.content);
		case "experience":
			return renderExperienceSection(data);
		case "education":
			return renderEducationSection(data);
		case "projects":
			return renderProjectsSection(data);
		case "skills":
			return renderSkillsSection(data);
		default:
			return normalizeTemplateValue(readPath(data, key));
	}
}

function resolveContextValue(item: Record<string, unknown>, key: string): string | undefined {
	if (key === "website") return formatWebsite(item.website);
	if (key === "description" || key === "content") return htmlToPlainText(normalizeTemplateValue(item[key]) ?? "");
	if (key === "keywords") return normalizeTemplateValue(item.keywords);
	if (key === "roles") return renderRoles(item.roles);

	return normalizeTemplateValue(readPath(item, key));
}

function getRepeatSectionItems(data: ResumeData, sectionKey: string): Record<string, unknown>[] | undefined {
	switch (sectionKey) {
		case "experience":
			return data.sections.experience.items.filter((item) => !item.hidden) as unknown as Record<string, unknown>[];
		case "education":
			return data.sections.education.items.filter((item) => !item.hidden) as unknown as Record<string, unknown>[];
		case "projects":
			return data.sections.projects.items.filter((item) => !item.hidden) as unknown as Record<string, unknown>[];
		case "skills":
			return data.sections.skills.items.filter((item) => !item.hidden) as unknown as Record<string, unknown>[];
		default:
			return undefined;
	}
}

function renderExperienceSection(data: ResumeData) {
	return data.sections.experience.items
		.filter((item) => !item.hidden)
		.map((item) =>
			joinClean(
				[
					joinClean([item.position, item.company, item.period], " | "),
					htmlToPlainText(item.description),
					renderRoles(item.roles),
				],
				"\n",
			),
		)
		.filter(Boolean)
		.join("\n\n");
}

function renderEducationSection(data: ResumeData) {
	return data.sections.education.items
		.filter((item) => !item.hidden)
		.map((item) => joinClean([item.school, item.degree, item.area, item.period], " | "))
		.filter(Boolean)
		.join("\n");
}

function renderProjectsSection(data: ResumeData) {
	return data.sections.projects.items
		.filter((item) => !item.hidden)
		.map((item) => joinClean([joinClean([item.name, item.period], " | "), htmlToPlainText(item.description)], "\n"))
		.filter(Boolean)
		.join("\n\n");
}

function renderSkillsSection(data: ResumeData) {
	return data.sections.skills.items
		.filter((item) => !item.hidden)
		.map((item) => {
			const keywords = item.keywords.length > 0 ? item.keywords.join("、") : item.proficiency;
			return joinClean([item.name, keywords], "：");
		})
		.filter(Boolean)
		.join("\n");
}

function renderRoles(value: unknown) {
	if (!Array.isArray(value)) return "";

	return value
		.map((role) => {
			if (!isRecord(role)) return "";
			return joinClean(
				[
					joinClean([normalizeTemplateValue(role.position), normalizeTemplateValue(role.period)], " | "),
					htmlToPlainText(normalizeTemplateValue(role.description) ?? ""),
				],
				"\n",
			);
		})
		.filter(Boolean)
		.join("\n");
}

function htmlToPlainText(value: string) {
	return decodeHtmlEntities(
		value
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<li\b[^>]*>/gi, "")
			.replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/\r/g, "")
			.split("\n")
			.map((line) => line.replace(/[ \t]+/g, " ").trim())
			.filter(Boolean)
			.join("\n"),
	);
}

function decodeHtmlEntities(value: string) {
	if (typeof document !== "undefined") {
		const textarea = document.createElement("textarea");
		textarea.innerHTML = value;
		return textarea.value;
	}

	return value
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function normalizeTemplateValue(value: unknown): string | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === "string") return looksLikeHtml(value) ? htmlToPlainText(value) : value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) return value.map(normalizeTemplateValue).filter(Boolean).join("、");
	if (isWebsite(value)) return formatWebsite(value);

	return undefined;
}

function readPath(source: unknown, key: string): unknown {
	return key.split(".").reduce<unknown>((current, segment) => {
		if (Array.isArray(current) && /^\d+$/.test(segment)) return current[Number(segment)];
		if (isRecord(current)) return current[segment];

		return undefined;
	}, source);
}

function formatWebsite(value: unknown) {
	if (!isWebsite(value)) return "";
	return value.label || value.url;
}

function isWebsite(value: unknown): value is { label: string; url: string } {
	return isRecord(value) && typeof value.label === "string" && typeof value.url === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function looksLikeHtml(value: string) {
	return /<\/?(?:p|br|ul|ol|li|strong|em|b|i|div|span|h[1-6]|a|table|thead|tbody|tr|td|th)\b/i.test(value);
}

function joinClean(values: Array<string | undefined>, separator: string) {
	return values.filter((value): value is string => Boolean(value?.trim())).join(separator);
}

function escapeXml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

const emptyResumeData: ResumeData = {
	picture: {
		hidden: true,
		url: "",
		size: 80,
		rotation: 0,
		aspectRatio: 1,
		borderRadius: 0,
		borderColor: "",
		borderWidth: 0,
		shadowColor: "",
		shadowWidth: 0,
	},
	basics: {
		name: "",
		headline: "",
		email: "",
		phone: "",
		location: "",
		website: { label: "", url: "" },
		customFields: [],
	},
	summary: {
		title: "",
		columns: 1,
		hidden: false,
		content: "",
	},
	sections: {
		profiles: { title: "", columns: 1, hidden: false, items: [] },
		experience: { title: "", columns: 1, hidden: false, items: [] },
		education: { title: "", columns: 1, hidden: false, items: [] },
		projects: { title: "", columns: 1, hidden: false, items: [] },
		skills: { title: "", columns: 1, hidden: false, items: [] },
		languages: { title: "", columns: 1, hidden: false, items: [] },
		interests: { title: "", columns: 1, hidden: false, items: [] },
		awards: { title: "", columns: 1, hidden: false, items: [] },
		certifications: { title: "", columns: 1, hidden: false, items: [] },
		publications: { title: "", columns: 1, hidden: false, items: [] },
		volunteer: { title: "", columns: 1, hidden: false, items: [] },
		references: { title: "", columns: 1, hidden: false, items: [] },
	},
	customSections: [],
	metadata: {
		template: "onyx",
		layout: { sidebarWidth: 35, pages: [] },
		page: { gapX: 0, gapY: 0, marginX: 0, marginY: 0, format: "a4", locale: "zh-CN", hideIcons: false },
		design: {
			colors: { primary: "", text: "", background: "" },
			level: { icon: "", type: "hidden" },
		},
		typography: {
			body: { fontFamily: "", fontWeights: ["400"], fontSize: 10, lineHeight: 1 },
			heading: { fontFamily: "", fontWeights: ["400"], fontSize: 10, lineHeight: 1 },
		},
		notes: "",
		styleRules: [],
	},
};
