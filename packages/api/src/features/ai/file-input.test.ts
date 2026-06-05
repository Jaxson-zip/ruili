import { describe, expect, it } from "vitest";
import { createFileInputSchema, fileInputSchema, MAX_AI_FILE_BYTES } from "./file-input";

const tinyPdf = Buffer.from("%PDF-1.7\n").toString("base64");

describe("fileInputSchema", () => {
	it("accepts a small base64 encoded resume file", () => {
		const result = fileInputSchema.safeParse({ name: "resume.pdf", data: tinyPdf });

		expect(result.success).toBe(true);
	});

	it("rejects invalid base64 before it reaches AI or OCR providers", () => {
		const result = fileInputSchema.safeParse({ name: "resume.pdf", data: "not-base64!" });

		expect(result.success).toBe(false);
	});

	it("rejects decoded files over the byte limit even when base64 length is valid", () => {
		const oversized = Buffer.alloc(MAX_AI_FILE_BYTES + 1, 1).toString("base64");
		const result = fileInputSchema.safeParse({ name: "resume.pdf", data: oversized });

		expect(result.success).toBe(false);
	});

	it("rejects path-like or oversized filenames", () => {
		expect(fileInputSchema.safeParse({ name: "../resume.pdf", data: tinyPdf }).success).toBe(false);
		expect(fileInputSchema.safeParse({ name: `${"a".repeat(181)}.pdf`, data: tinyPdf }).success).toBe(false);
	});
});

describe("createFileInputSchema", () => {
	it("restricts endpoint-specific file extensions", () => {
		const pdfOnlySchema = createFileInputSchema(["pdf"]);
		const wordOnlySchema = createFileInputSchema(["doc", "docx"]);

		expect(pdfOnlySchema.safeParse({ name: "resume.pdf", data: tinyPdf }).success).toBe(true);
		expect(pdfOnlySchema.safeParse({ name: "resume.docx", data: tinyPdf }).success).toBe(false);
		expect(wordOnlySchema.safeParse({ name: "resume.docx", data: tinyPdf }).success).toBe(true);
		expect(wordOnlySchema.safeParse({ name: "resume.pdf", data: tinyPdf }).success).toBe(false);
	});
});
