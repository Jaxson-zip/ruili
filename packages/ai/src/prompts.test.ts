import { describe, expect, it } from "vitest";
import {
	analyzeResumeSystemPrompt,
	chatSystemPromptTemplate,
	docxParserSystemPrompt,
	docxParserUserPrompt,
	pdfParserSystemPrompt,
	pdfParserUserPrompt,
} from "./prompts";

describe("prompts", () => {
	it("loads markdown prompts as strings in Node runtimes", () => {
		expect(analyzeResumeSystemPrompt).toContain("简历");
		expect(chatSystemPromptTemplate).toContain("resume");
		expect(docxParserSystemPrompt).toContain("DOCX");
		expect(docxParserUserPrompt).toContain("Microsoft Word");
		expect(pdfParserSystemPrompt).toContain("PDF");
		expect(pdfParserUserPrompt).toContain("PDF");
	});

	it("requires resume analysis output to be written in Chinese", () => {
		expect(analyzeResumeSystemPrompt).toContain("必须使用中文");
		expect(analyzeResumeSystemPrompt).toContain("中文求职者");
		expect(analyzeResumeSystemPrompt).toContain("copyPrompt");
	});

	it("guides document import requests to the dedicated import flow", () => {
		expect(chatSystemPromptTemplate).toContain("导入已有简历");
		expect(chatSystemPromptTemplate).toContain("Microsoft Word");
		expect(chatSystemPromptTemplate).toContain("不要声称你可以直接读取");
	});
});
