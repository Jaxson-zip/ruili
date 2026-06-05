import { describe, expect, it, vi } from "vitest";

const buildDocx = vi.hoisted(() => vi.fn().mockResolvedValue(new Blob(["docx"])));
const createResumePdfBlob = vi.hoisted(() => vi.fn().mockResolvedValue(new Blob(["pdf"])));
const downloadWithAnchor = vi.hoisted(() => vi.fn());

vi.mock("@reactive-resume/docx", () => ({ buildDocx }));
vi.mock("@/features/resume/export/pdf-document", () => ({ createResumePdfBlob }));
vi.mock("@reactive-resume/utils/file", () => ({
	downloadWithAnchor,
	generateFilename: (name: string, ext: string) => `${name}.${ext}`,
}));

describe("workbench export actions", () => {
	it("exports PDF and DOCX using existing packages", async () => {
		const { exportResumeDocx, exportResumePdf } = await import("./export-actions");
		const resume = { name: "demo", data: { basics: { name: "Demo" } } };

		await exportResumePdf(resume as never);
		await exportResumeDocx(resume as never);

		expect(createResumePdfBlob).toHaveBeenCalledTimes(1);
		expect(buildDocx).toHaveBeenCalledTimes(1);
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "demo.pdf");
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "demo.docx");
	});
});
