import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WordTemplateRenderData } from "@reactive-resume/schema/resume/word-template";
import JSZip from "jszip";
import sharp from "sharp";
import { env } from "@reactive-resume/env/server";
import { buildWordTemplateRenderData } from "@reactive-resume/schema/resume/word-template";

const placeholderPattern = /\{\{\s*([#/])?\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const repeatBlockPattern = /\{\{\s*#\s*([a-zA-Z0-9_.-]+)\s*\}\}([\s\S]*?)\{\{\s*\/\s*\1\s*\}\}/g;
const wordXmlPathPattern = /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/;
const wordMediaImagePattern = /^word\/media\/image\d+\.(?:jpe?g|png|webp)$/i;
type TemplateRenderData = WordTemplateRenderData & Record<string, unknown>;

export async function renderWordTemplateDocx(template: Uint8Array, data: ResumeData): Promise<Buffer> {
	const zip = await JSZip.loadAsync(template);
	const xmlPaths = Object.values(zip.files)
		.filter((file) => !file.dir && wordXmlPathPattern.test(file.name))
		.map((file) => file.name);

	if (xmlPaths.length === 0) throw new Error("Invalid DOCX template: no editable Word XML files found.");

	for (const path of xmlPaths) {
		const xml = await zip.file(path)?.async("string");
		if (!xml) continue;

		zip.file(path, renderTemplateXml(xml, data));
	}

	await replaceTemplatePicture(zip, data);

	return await zip.generateAsync({ type: "nodebuffer" });
}

async function replaceTemplatePicture(zip: JSZip, data: ResumeData) {
	if (data.picture.hidden || !data.picture.url.trim()) return;

	const targetPath = getPrimaryTemplatePicturePath(zip);
	if (!targetPath) return;

	const picture = await loadPictureBytes(data.picture.url);
	if (!picture) return;

	const normalizedPicture = await normalizePictureForWordMedia(picture, targetPath);
	zip.file(targetPath, normalizedPicture);
}

function getPrimaryTemplatePicturePath(zip: JSZip) {
	const mediaPaths = Object.values(zip.files)
		.filter((file) => !file.dir && wordMediaImagePattern.test(file.name))
		.map((file) => file.name)
		.sort();

	return mediaPaths.find((path) => /image1\.jpe?g$/i.test(path)) ?? mediaPaths.find((path) => /\.jpe?g$/i.test(path));
}

async function loadPictureBytes(url: string): Promise<Buffer | null> {
	const resolvedUrl = resolvePictureUrl(url);
	const response = await fetch(resolvedUrl);

	if (!response.ok) return null;
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType && !contentType.startsWith("image/")) return null;

	return Buffer.from(await response.arrayBuffer());
}

function resolvePictureUrl(url: string) {
	return new URL(url, env.APP_URL).toString();
}

async function normalizePictureForWordMedia(picture: Buffer, targetPath: string) {
	if (/\.png$/i.test(targetPath)) return await sharp(picture).png().toBuffer();
	if (/\.webp$/i.test(targetPath)) return await sharp(picture).webp().toBuffer();
	return await sharp(picture).jpeg().toBuffer();
}

function renderTemplateXml(xml: string, data: ResumeData) {
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
			const value = normalizeTemplateValue(readPath(data, key));
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
		.map((item) => joinClean([item.name, item.keywords.join(", ") || item.proficiency], " | "))
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
			.replace(/<li\b[^>]*>/gi, "\n")
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
	if (Array.isArray(value)) return value.map(normalizeTemplateValue).filter(Boolean).join(", ");
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
