// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import {
	clearSelectedWordTemplateId,
	getSelectedWordTemplate,
	getSelectedWordTemplateId,
	getWordTemplateById,
	getWordTemplateLibrary,
	setSelectedWordTemplateId,
} from "./library";

describe("word template library", () => {
	afterEach(() => {
		localStorage.clear();
	});

	it("exposes curated DOCX templates with preview metadata", () => {
		const templates = getWordTemplateLibrary();

		expect(templates).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: "compact-blue-grid",
					name: "1.docx 中文模板",
					docxUrl: "/templates/word/compact-blue-grid.docx",
					previewUrl: "/templates/word/compact-blue-grid.svg",
				}),
				expect.objectContaining({
					id: "dark-orange-sidebar",
					name: "深灰橙色侧栏",
					docxUrl: "/templates/word/dark-orange-sidebar.docx",
					previewUrl: "/templates/word/dark-orange-sidebar.jpg",
				}),
			]),
		);
		expect(templates[0]?.badges).toContain("DOCX");
	});

	it("looks up a template by id", () => {
		expect(getWordTemplateById("compact-blue-grid")?.name).toBe("1.docx 中文模板");
		expect(getWordTemplateById("dark-orange-sidebar")?.name).toBe("深灰橙色侧栏");
		expect(getWordTemplateById("missing-template")).toBeUndefined();
	});

	it("stores the selected template per resume id", () => {
		setSelectedWordTemplateId("resume-1", "compact-blue-grid");

		expect(getSelectedWordTemplateId("resume-1")).toBe("compact-blue-grid");
		expect(getSelectedWordTemplate("resume-1")?.id).toBe("compact-blue-grid");

		clearSelectedWordTemplateId("resume-1");
		expect(getSelectedWordTemplateId("resume-1")).toBeNull();
	});
});
