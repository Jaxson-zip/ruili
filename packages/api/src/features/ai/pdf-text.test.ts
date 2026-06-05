import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractPdfTextFromBase64 } from "./pdf-text";

const pdfjsMock = vi.hoisted(() => ({
	destroyDocument: vi.fn(),
	destroyTask: vi.fn(),
	getDocument: vi.fn(),
	pageCleanup: vi.fn(),
}));

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
	getDocument: pdfjsMock.getDocument,
}));

describe("extractPdfTextFromBase64", () => {
	beforeEach(() => {
		pdfjsMock.destroyDocument.mockReset();
		pdfjsMock.destroyTask.mockReset();
		pdfjsMock.getDocument.mockReset();
		pdfjsMock.pageCleanup.mockReset();
	});

	it("extracts text from all PDF pages", async () => {
		pdfjsMock.getDocument.mockReturnValue({
			destroy: pdfjsMock.destroyTask,
			promise: Promise.resolve({
				destroy: pdfjsMock.destroyDocument,
				getPage: async (pageNumber: number) => ({
					cleanup: pdfjsMock.pageCleanup,
					getTextContent: async () => ({
						items:
							pageNumber === 1
								? [
										{ hasEOL: false, str: "张三" },
										{ hasEOL: true, str: "前端工程师" },
									]
								: [{ hasEOL: false, str: "React 项目经历" }],
					}),
				}),
				numPages: 2,
			}),
		});

		const text = await extractPdfTextFromBase64(Buffer.from("%PDF").toString("base64"));

		expect(text).toContain("张三");
		expect(text).toContain("前端工程师");
		expect(text).toContain("React 项目经历");
		expect(pdfjsMock.pageCleanup).toHaveBeenCalledTimes(2);
		expect(pdfjsMock.destroyDocument).toHaveBeenCalledTimes(1);
		expect(pdfjsMock.destroyTask).toHaveBeenCalledTimes(1);
	});
});
