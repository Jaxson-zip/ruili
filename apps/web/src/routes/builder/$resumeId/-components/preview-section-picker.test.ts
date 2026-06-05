import type { Layout } from "@reactive-resume/schema/resume/data";
import { describe, expect, it } from "vitest";
import { getPreviewSectionFromPoint } from "./preview-section-picker";

const layout: Layout = {
	sidebarWidth: 30,
	pages: [
		{
			fullWidth: false,
			main: ["summary", "experience", "projects"],
			sidebar: ["profiles", "skills", "education"],
		},
	],
};

describe("getPreviewSectionFromPoint", () => {
	it("selects basics from the top identity area", () => {
		expect(getPreviewSectionFromPoint({ x: 400, y: 40, width: 800, height: 1100, layout })).toBe("basics");
	});

	it("selects main-column sections by vertical position", () => {
		expect(getPreviewSectionFromPoint({ x: 500, y: 240, width: 800, height: 1100, layout })).toBe("summary");
		expect(getPreviewSectionFromPoint({ x: 500, y: 560, width: 800, height: 1100, layout })).toBe("experience");
		expect(getPreviewSectionFromPoint({ x: 500, y: 930, width: 800, height: 1100, layout })).toBe("projects");
	});

	it("selects sidebar sections when the click is near a page edge", () => {
		expect(getPreviewSectionFromPoint({ x: 60, y: 560, width: 800, height: 1100, layout })).toBe("skills");
	});

	it("returns null for clicks outside the preview bounds", () => {
		expect(getPreviewSectionFromPoint({ x: -1, y: 560, width: 800, height: 1100, layout })).toBeNull();
		expect(getPreviewSectionFromPoint({ x: 500, y: 1200, width: 800, height: 1100, layout })).toBeNull();
	});
});
