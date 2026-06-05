import { describe, expect, it } from "vitest";
import { resumeDataSchema } from "./data";
import { defaultResumeData } from "./default";

describe("defaultResumeData", () => {
	it("conforms to resumeDataSchema", () => {
		const result = resumeDataSchema.safeParse(defaultResumeData);
		expect(result.success).toBe(true);
	});

	it("uses the 'onyx' template", () => {
		expect(defaultResumeData.metadata.template).toBe("onyx");
	});

	it("uses zh-CN locale", () => {
		expect(defaultResumeData.metadata.page.locale).toBe("zh-CN");
	});

	it("uses A4 format by default", () => {
		expect(defaultResumeData.metadata.page.format).toBe("a4");
	});

	it("starts with no resume content", () => {
		expect(defaultResumeData.basics.name).toBe("");
		expect(defaultResumeData.summary.content).toBe("");
		for (const section of Object.values(defaultResumeData.sections)) {
			expect(section.items).toEqual([]);
		}
	});

	it("has exactly one default page layout", () => {
		expect(defaultResumeData.metadata.layout.pages).toHaveLength(1);
	});

	it("default page is a Chinese-first one-page layout", () => {
		const page = defaultResumeData.metadata.layout.pages[0];
		expect(page).toBeDefined();
		expect(page?.fullWidth).toBe(true);
		expect(page?.main[0]).toBe("summary");
		expect(page?.main).toContain("experience");
		expect(page?.main).toContain("education");
		expect(page?.main).toContain("skills");
		expect(page?.sidebar).toEqual([]);
	});

	it("uses a Chinese sans-serif font family by default", () => {
		expect(defaultResumeData.metadata.typography.body.fontFamily).toBe("Noto Sans SC");
		expect(defaultResumeData.metadata.typography.heading.fontFamily).toBe("Noto Sans SC");
	});

	it("default sidebar width is 35%", () => {
		expect(defaultResumeData.metadata.layout.sidebarWidth).toBe(35);
	});

	it("custom sections are empty", () => {
		expect(defaultResumeData.customSections).toEqual([]);
	});
});
