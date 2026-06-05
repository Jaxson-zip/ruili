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

type AiImportReadinessInput = {
	type: string;
	isLoadingAiProviders: boolean;
	hasAIProvider: boolean;
	hasOcrProvider: boolean;
};

export type AiImportReadiness = {
	blocked: boolean;
	title: string;
	description: string;
	actionLabel?: string;
};

export function getAiImportReadiness(input: AiImportReadinessInput): AiImportReadiness | null {
	if (!["docx", "pdf", "image"].includes(input.type)) return null;

	if (input.isLoadingAiProviders) {
		return {
			blocked: true,
			title: "正在检查 AI 配置",
			description: "请稍候，系统正在确认是否有已测试通过的 AI 模型服务商。",
		};
	}

	if (!input.hasAIProvider) {
		return {
			blocked: true,
			title: "需要先配置可用的 AI 模型",
			description: "PDF、Word 和图片导入需要 LLM 解析内容。请在设置里添加并测试一个 AI 模型服务商。",
			actionLabel: "去配置 AI",
		};
	}

	if (input.type === "image" && !input.hasOcrProvider) {
		return {
			blocked: true,
			title: "图片导入还需要 OCR 服务商",
			description: "图片和扫描件需要先通过 OCR 识别文字，再交给 AI 结构化成简历。",
			actionLabel: "去配置 OCR",
		};
	}

	if (input.type === "pdf" && !input.hasOcrProvider) {
		return {
			blocked: false,
			title: "扫描版 PDF 建议先配置 OCR",
			description: "普通文本 PDF 可以直接尝试导入；如果 PDF 是截图或扫描件，请先配置 OCR，否则可能解析失败。",
			actionLabel: "去配置 OCR",
		};
	}

	return null;
}
