// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

const toJpeg = vi.hoisted(() => vi.fn(async () => "data:image/jpeg;base64,/9j/2Q=="));

vi.mock("html-to-image", () => ({ toJpeg }));

const { createWordTemplateHtmlPreviewPdfBlob, wordTemplatePreviewPageSelector } = await import("./html-preview-pdf");

describe("createWordTemplateHtmlPreviewPdfBlob", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		toJpeg.mockClear();
	});

	it("exports each HTML preview page into one PDF", async () => {
		document.body.innerHTML = `
			<section data-word-template-preview-page></section>
			<section data-word-template-preview-page></section>
		`;

		for (const page of document.querySelectorAll<HTMLElement>(wordTemplatePreviewPageSelector)) {
			vi.spyOn(page, "getBoundingClientRect").mockReturnValue({
				bottom: 1122,
				height: 1122,
				left: 0,
				right: 794,
				toJSON: () => ({}),
				top: 0,
				width: 794,
				x: 0,
				y: 0,
			});
		}

		const blob = await createWordTemplateHtmlPreviewPdfBlob({ pixelRatio: 1 });

		expect(toJpeg).toHaveBeenCalledTimes(2);
		expect(toJpeg).toHaveBeenCalledWith(
			expect.any(HTMLElement),
			expect.objectContaining({
				backgroundColor: "#ffffff",
				cacheBust: true,
				pixelRatio: 1,
				quality: 0.95,
			}),
		);
		expect(blob.type).toBe("application/pdf");
		expect(await blob.slice(0, 8).text()).toBe("%PDF-1.4");
	});

	it("exports only pages inside the active preview root when thumbnails are also mounted", async () => {
		document.body.innerHTML = `
			<div data-word-template-export-root>
				<section data-word-template-preview-page data-page="active-1"></section>
				<section data-word-template-preview-page data-page="active-2"></section>
			</div>
			<aside>
				<section data-word-template-preview-page data-page="thumbnail"></section>
			</aside>
		`;

		for (const page of document.querySelectorAll<HTMLElement>(wordTemplatePreviewPageSelector)) {
			vi.spyOn(page, "getBoundingClientRect").mockReturnValue({
				bottom: 1122,
				height: 1122,
				left: 0,
				right: 794,
				toJSON: () => ({}),
				top: 0,
				width: 794,
				x: 0,
				y: 0,
			});
		}

		await createWordTemplateHtmlPreviewPdfBlob({ pixelRatio: 1 });

		const exportedPages = (toJpeg.mock.calls as unknown as Array<[HTMLElement]>).map((call) => {
			const page = call[0];
			return page.dataset.page;
		});
		expect(exportedPages).toEqual(["active-1", "active-2"]);
	});

	it("exports from a fixed A4 clone instead of the narrow live preview", async () => {
		document.body.innerHTML = `
			<section data-word-template-preview-page style="width: 420px; height: 594px; font-size: 8px;">
				<div style="width: 794px">content that would be clipped in a narrow preview</div>
			</section>
		`;

		const sourcePage = document.querySelector<HTMLElement>(wordTemplatePreviewPageSelector);
		if (!sourcePage) throw new Error("Expected a source preview page.");
		vi.spyOn(sourcePage, "getBoundingClientRect").mockReturnValue({
			bottom: 594,
			height: 594,
			left: 0,
			right: 420,
			toJSON: () => ({}),
			top: 0,
			width: 420,
			x: 0,
			y: 0,
		});

		await createWordTemplateHtmlPreviewPdfBlob({ pixelRatio: 1 });

		const firstCall = toJpeg.mock.calls[0] as unknown as [HTMLElement, unknown] | undefined;
		const exportedPage = firstCall?.[0];
		expect(exportedPage).toBeInstanceOf(HTMLElement);
		expect(exportedPage).not.toBe(sourcePage);
		expect(exportedPage?.style.width).toBe("794px");
		expect(exportedPage?.style.height).toBe("1123px");
		expect(exportedPage?.style.minWidth).toBe("794px");
		expect(exportedPage?.style.color).toBe("#2d2d2d");
		expect(exportedPage?.style.fontFamily).toContain("Microsoft YaHei");
		expect(document.querySelector("[data-word-template-export-host]")).toBeNull();
	});

	it("fails clearly when the live preview is not on the page", async () => {
		await expect(createWordTemplateHtmlPreviewPdfBlob()).rejects.toThrow("No Word template HTML preview pages found.");
		expect(toJpeg).not.toHaveBeenCalled();
	});
});
