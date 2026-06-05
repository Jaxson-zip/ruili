import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import {
	deriveImportedResumeName,
	getAiImportReadiness,
	isImageResumeFile,
	isJsonResumeFile,
	isPdfResumeFile,
	isWordResumeFile,
} from "./import-file";

describe("resume import file helpers", () => {
	it("accepts Word files by MIME type or extension", () => {
		expect(
			isWordResumeFile(
				new File([""], "resume.docx", {
					type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				}),
			),
		).toBe(true);
		expect(isWordResumeFile(new File([""], "resume.docx", { type: "" }))).toBe(true);
		expect(isWordResumeFile(new File([""], "resume.doc", { type: "" }))).toBe(true);
	});

	it("accepts PDF and JSON files by MIME type or extension", () => {
		expect(isPdfResumeFile(new File([""], "resume.pdf", { type: "" }))).toBe(true);
		expect(isJsonResumeFile(new File(["{}"], "resume.json", { type: "" }))).toBe(true);
	});

	it("accepts raster image files by MIME type or extension for OCR import", () => {
		expect(isImageResumeFile(new File([""], "resume.png", { type: "image/png" }))).toBe(true);
		expect(isImageResumeFile(new File([""], "resume.jpg", { type: "" }))).toBe(true);
		expect(isImageResumeFile(new File([""], "resume.jpeg", { type: "" }))).toBe(true);
		expect(isImageResumeFile(new File([""], "resume.webp", { type: "" }))).toBe(true);
		expect(isImageResumeFile(new File([""], "resume.svg", { type: "image/svg+xml" }))).toBe(false);
	});

	it("derives the imported resume title from candidate name before file name", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.name = "陈嘉行";

		expect(deriveImportedResumeName(data, "frontend-resume.docx")).toBe("陈嘉行");
	});

	it("uses the uploaded file name when parsed resume data has no candidate name", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.name = "";

		expect(deriveImportedResumeName(data, "frontend-resume.docx")).toBe("frontend-resume");
	});

	it("blocks AI imports until the required provider setup is available", () => {
		expect(
			getAiImportReadiness({
				type: "docx",
				isLoadingAiProviders: false,
				hasAIProvider: false,
				hasOcrProvider: false,
			}),
		).toMatchObject({ blocked: true, title: "需要先配置可用的 AI 模型" });

		expect(
			getAiImportReadiness({
				type: "image",
				isLoadingAiProviders: false,
				hasAIProvider: true,
				hasOcrProvider: false,
			}),
		).toMatchObject({ blocked: true, title: "图片导入还需要 OCR Provider" });

		expect(
			getAiImportReadiness({
				type: "pdf",
				isLoadingAiProviders: false,
				hasAIProvider: true,
				hasOcrProvider: false,
			}),
		).toMatchObject({ blocked: false, title: "扫描版 PDF 建议先配置 OCR" });

		expect(
			getAiImportReadiness({
				type: "json-resume-json",
				isLoadingAiProviders: false,
				hasAIProvider: false,
				hasOcrProvider: false,
			}),
		).toBeNull();
	});
});
