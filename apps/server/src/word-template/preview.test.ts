import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { handleWordTemplatePreview } from "./preview";

const user = { id: "user-1" };

vi.mock("@reactive-resume/api/context", () => ({
	resolveUserFromRequestHeaders: vi.fn(async () => null),
}));

describe("handleWordTemplatePreview", () => {
	let tempDir: string | undefined;

	afterEach(async () => {
		if (tempDir) await rm(tempDir, { recursive: true, force: true });
		tempDir = undefined;
	});

	it("requires an authenticated user", async () => {
		const response = await handleWordTemplatePreview(
			new Request("http://localhost:3000/api/word-template/preview", {
				method: "POST",
				body: JSON.stringify({ templateId: "zh-internship-001", data: sampleResumeData }),
			}),
			{ resolveUser: vi.fn(async () => null) },
		);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("returns a PDF generated from the selected DOCX template", async () => {
		tempDir = await mkdtemp(join(tmpdir(), "ruili-word-preview-test-"));
		const pdfPath = join(tempDir, "preview.pdf");
		await writeFile(pdfPath, "%PDF-1.7\npreview\n");

		const convertDocxToPdf = vi.fn(async () => pdfPath);

		const response = await handleWordTemplatePreview(
			new Request("http://localhost:3000/api/word-template/preview", {
				method: "POST",
				body: JSON.stringify({ templateId: "zh-internship-001", data: sampleResumeData }),
				headers: { "content-type": "application/json" },
			}),
			{
				resolveUser: vi.fn(async () => user),
				readTemplateDocx: vi.fn(async () => Buffer.from("not-a-real-docx")),
				renderTemplateDocx: vi.fn(async () => Buffer.from("filled-docx")),
				convertDocxToPdf,
				makeTempDir: vi.fn(async () => tempDir as string),
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("application/pdf");
		await expect(response.text()).resolves.toContain("%PDF-1.7");
		expect(convertDocxToPdf).toHaveBeenCalledWith(join(tempDir, "preview.docx"), tempDir);
	});

	it("explains when the server cannot convert DOCX to PDF", async () => {
		const response = await handleWordTemplatePreview(
			new Request("http://localhost:3000/api/word-template/preview", {
				method: "POST",
				body: JSON.stringify({ templateId: "zh-internship-001", data: sampleResumeData }),
				headers: { "content-type": "application/json" },
			}),
			{
				resolveUser: vi.fn(async () => user),
				readTemplateDocx: vi.fn(async () => Buffer.from("not-a-real-docx")),
				renderTemplateDocx: vi.fn(async () => Buffer.from("filled-docx")),
				convertDocxToPdf: vi.fn(async () => {
					throw new Error("soffice not found");
				}),
			},
		);

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({ code: "DOCX_TO_PDF_UNAVAILABLE" });
	});

	it("rejects old experimental template ids that are no longer in the library", async () => {
		const response = await handleWordTemplatePreview(
			new Request("http://localhost:3000/api/word-template/preview", {
				method: "POST",
				body: JSON.stringify({ templateId: "compact-blue-grid", data: sampleResumeData }),
				headers: { "content-type": "application/json" },
			}),
			{ resolveUser: vi.fn(async () => user) },
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({ code: "BAD_REQUEST" });
	});
});
