import type { ResumeData } from "@reactive-resume/schema/resume/data";

const jsonMimeTypes = new Set(["application/json"]);
const pdfMimeTypes = new Set(["application/pdf"]);
const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const wordMimeTypes = new Set([
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function hasExtension(file: File, extensions: string[]) {
	const fileName = file.name.toLowerCase();
	return extensions.some((extension) => fileName.endsWith(extension));
}

export function isPdfResumeFile(file: File) {
	return pdfMimeTypes.has(file.type) || hasExtension(file, [".pdf"]);
}

export function isWordResumeFile(file: File) {
	return wordMimeTypes.has(file.type) || hasExtension(file, [".doc", ".docx"]);
}

export function isJsonResumeFile(file: File) {
	return jsonMimeTypes.has(file.type) || hasExtension(file, [".json"]);
}

export function isImageResumeFile(file: File) {
	return imageMimeTypes.has(file.type) || hasExtension(file, [".jpg", ".jpeg", ".png", ".webp", ".gif"]);
}

export function deriveImportedResumeName(data: ResumeData, fileName: string) {
	const parsedName = data.basics.name.trim();
	const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "").trim();

	return parsedName || fileNameWithoutExtension || undefined;
}
