import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WordTemplateRenderData } from "@reactive-resume/schema/resume/word-template";
import JSZip from "jszip";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { buildWordTemplateRenderData } from "@reactive-resume/schema/resume/word-template";

export const DOCX_TEMPLATE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const placeholderPattern = /\{\{\s*([#/])?\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const repeatBlockPattern = /\{\{\s*#\s*([a-zA-Z0-9_.-]+)\s*\}\}([\s\S]*?)\{\{\s*\/\s*\1\s*\}\}/g;
const wordXmlPathPattern = /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/;
const wordMediaImagePattern = /^word\/media\/image\d+\.(?:jpe?g|png|webp)$/i;
const repeatSectionKeys = ["awards", "experience", "education", "projects", "skills"] as const;
const unresolvedVisibleIndexedSectionPath = Symbol("unresolvedVisibleIndexedSectionPath");

type TemplateRenderData = WordTemplateRenderData & Record<string, unknown>;

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
		for (const placeholder of extractDocxTemplatePlaceholdersFromXml(xml)) placeholders.add(placeholder);
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

	await replaceTemplatePicture(zip, data);

	return await zip.generateAsync({ type: "blob", mimeType: DOCX_TEMPLATE_MIME_TYPE });
}

async function replaceTemplatePicture(zip: JSZip, data: ResumeData) {
	if (data.picture.hidden || !data.picture.url.trim()) return;

	const targetPath = getPrimaryTemplatePicturePath(zip);
	if (!targetPath) return;

	const picture = await loadPictureBytes(data.picture.url);
	if (!picture) return;

	zip.file(targetPath, picture);
}

function getPrimaryTemplatePicturePath(zip: JSZip) {
	const mediaPaths = Object.values(zip.files)
		.filter((file) => !file.dir && wordMediaImagePattern.test(file.name))
		.map((file) => file.name)
		.sort();

	return mediaPaths.find((path) => /image1\.jpe?g$/i.test(path)) ?? mediaPaths.find((path) => /\.jpe?g$/i.test(path));
}

async function loadPictureBytes(url: string) {
	const response = await fetch(resolvePictureUrl(url));

	if (!response.ok) return null;
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType && !contentType.startsWith("image/")) return null;

	return await response.arrayBuffer();
}

function resolvePictureUrl(url: string) {
	return new URL(url, window.location.origin).toString();
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
	const renderData = buildWordTemplateRenderData(data) as TemplateRenderData;
	const withRepeatBlocks = xml.replace(repeatBlockPattern, (match, sectionKey: string, body: string) => {
		const items = getRepeatSectionItems(renderData, sectionKey);
		if (!items) return match;
		return items.map((item) => renderRepeatBlockBody(body, item, renderData)).join("");
	});

	const withoutEmptyParagraphs = removeEmptyPlaceholderParagraphs(withRepeatBlocks, (key) =>
		resolveDocxTemplateValue(renderData, key),
	);

	return replaceScalarPlaceholders(withoutEmptyParagraphs, (key) => resolveDocxTemplateValue(renderData, key));
}

function renderRepeatBlockBody(body: string, item: Record<string, unknown>, data: TemplateRenderData) {
	return replaceScalarPlaceholders(
		body,
		(key) => resolveContextValue(item, key) ?? resolveDocxTemplateValue(data, key),
	);
}

function replaceScalarPlaceholders(xml: string, resolveValue: (key: string) => string | undefined) {
	return xml.replace(placeholderPattern, (match, prefix: string | undefined, key: string) => {
		if (prefix) return match;

		const value = resolveValue(key);
		return value === undefined ? match : escapeWordTextXml(value);
	});
}

function removeEmptyPlaceholderParagraphs(xml: string, resolveValue: (key: string) => string | undefined) {
	return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
		const text = getWordParagraphText(paragraph);
		if (!text.includes("{{")) return paragraph;

		let hasPlaceholder = false;
		let allPlaceholdersEmpty = true;
		const textWithoutPlaceholders = text.replace(
			placeholderPattern,
			(_match, prefix: string | undefined, key: string) => {
				if (prefix) {
					allPlaceholdersEmpty = false;
					return _match;
				}

				hasPlaceholder = true;
				const value = resolveValue(key);
				if (value === undefined || value.trim()) allPlaceholdersEmpty = false;
				return "";
			},
		);

		return hasPlaceholder && allPlaceholdersEmpty && !textWithoutPlaceholders.trim() ? "" : paragraph;
	});
}

function getWordParagraphText(paragraphXml: string) {
	return [...paragraphXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
		.map((match) => decodeXmlText(match[1] ?? ""))
		.join("");
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
		key.startsWith("chinese.") ||
		key.startsWith("zhInternship.") ||
		isSupportedIndexedSectionPlaceholder(key) ||
		resolveDocxTemplateValue(buildWordTemplateRenderData(defaultResumeData) as TemplateRenderData, key) !== undefined
	);
}

function isSupportedIndexedSectionPlaceholder(key: string) {
	return /^sections\.(?:awards|education|experience|projects|skills)\.items\.\d+\.[a-zA-Z0-9_.-]+$/.test(key);
}

function resolveDocxTemplateValue(data: TemplateRenderData, key: string): string | undefined {
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
		case "awards":
			return renderAwardsSection(data);
		default: {
			const visibleIndexedValue = readVisibleIndexedSectionPath(data, key);
			const value = normalizeTemplateValue(
				visibleIndexedValue === unresolvedVisibleIndexedSectionPath ? readPath(data, key) : visibleIndexedValue,
			);
			if (value !== undefined) return value;
			return isKnownOptionalTemplatePath(key) ? "" : undefined;
		}
	}
}

function resolveContextValue(item: Record<string, unknown>, key: string): string | undefined {
	if (key === "website") return formatWebsite(item.website);
	if (key === "description" || key === "content") return htmlToPlainText(normalizeTemplateValue(item[key]) ?? "");
	if (key === "keywords") return normalizeTemplateValue(item.keywords);
	if (key === "roles") return renderRoles(item.roles);

	return normalizeTemplateValue(readPath(item, key));
}

function getRepeatSectionItems(data: TemplateRenderData, sectionKey: string): Record<string, unknown>[] | undefined {
	const value = readPath(data, sectionKey);
	if (Array.isArray(value)) return value.filter(isRecord);

	switch (sectionKey) {
		case "awards":
			return getVisibleItems(data.sections.awards) as unknown as Record<string, unknown>[];
		case "education":
			return getVisibleItems(data.sections.education) as unknown as Record<string, unknown>[];
		case "experience":
			return getVisibleItems(data.sections.experience) as unknown as Record<string, unknown>[];
		case "projects":
			return getVisibleItems(data.sections.projects) as unknown as Record<string, unknown>[];
		case "skills":
			return getVisibleItems(data.sections.skills) as unknown as Record<string, unknown>[];
		default:
			return undefined;
	}
}

function renderExperienceSection(data: ResumeData) {
	return getVisibleItems(data.sections.experience)
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
	return getVisibleItems(data.sections.education)
		.map((item) => joinClean([item.school, item.degree, item.area, item.period], " | "))
		.filter(Boolean)
		.join("\n");
}

function renderProjectsSection(data: ResumeData) {
	return getVisibleItems(data.sections.projects)
		.map((item) => joinClean([joinClean([item.name, item.period], " | "), htmlToPlainText(item.description)], "\n"))
		.filter(Boolean)
		.join("\n\n");
}

function renderSkillsSection(data: ResumeData) {
	return getVisibleItems(data.sections.skills)
		.map((item) => {
			const keywords = item.keywords.length > 0 ? item.keywords.join("、") : item.proficiency;
			return joinClean([item.name, keywords], "：");
		})
		.filter(Boolean)
		.join("\n");
}

function renderAwardsSection(data: ResumeData) {
	return getVisibleItems(data.sections.awards)
		.map((item) => joinClean([item.date, item.awarder, item.title, htmlToPlainText(item.description)], " | "))
		.filter(Boolean)
		.join("\n");
}

function getVisibleItems<TSection extends { hidden?: boolean; items: Array<{ hidden?: boolean }> }>(
	section: TSection,
): TSection["items"] {
	if (section.hidden) return [];
	return section.items.filter((item) => !item.hidden) as TSection["items"];
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

function decodeXmlText(value: string) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'");
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

function readVisibleIndexedSectionPath(
	data: ResumeData,
	key: string,
): unknown | typeof unresolvedVisibleIndexedSectionPath {
	const match = key.match(/^sections\.(awards|education|experience|projects|skills)\.items\.(\d+)\.(.+)$/);
	if (!match) return unresolvedVisibleIndexedSectionPath;

	const [, sectionId, index, fieldPath] = match;
	if (!sectionId || !index || !fieldPath) return undefined;

	const section =
		data.sections[
			sectionId as keyof Pick<ResumeData["sections"], "awards" | "education" | "experience" | "projects" | "skills">
		];
	const item = getVisibleItems(section)[Number(index)];

	return item ? readPath(item, fieldPath) : undefined;
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

function isKnownOptionalTemplatePath(key: string) {
	return /^(?:chinese|zhInternship|basics\.customFields\.\d+|sections\.(?:awards|education|experience|projects|skills)\.items\.\d+)\.[a-zA-Z0-9_.-]+$/.test(
		key,
	);
}

function joinClean(values: Array<string | undefined>, separator: string) {
	return values.filter((value): value is string => Boolean(value?.trim())).join(separator);
}

function escapeWordTextXml(value: string) {
	return value.split(/\r?\n/).map(escapeXml).join("</w:t><w:br/><w:t>");
}

function escapeXml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
