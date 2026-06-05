import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { buildImportedResumeSlug, resolveImportedResumeLocale, resolveImportedResumeName } from "./import";

describe("resume import helpers", () => {
	it("names imported resumes from the parsed resume data before using the uploaded file name", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.name = "陈嘉行";

		expect(
			resolveImportedResumeName({
				data,
				requestedName: "frontend-resume.docx",
				fallbackName: "Random System Name",
			}),
		).toBe("陈嘉行");
	});

	it("uses the uploaded file name without extension when the parsed resume has no candidate name", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.name = "   ";

		expect(
			resolveImportedResumeName({
				data,
				requestedName: "前端工程师简历.docx",
				fallbackName: "Random System Name",
			}),
		).toBe("前端工程师简历");
	});

	it("can prefer the requested name for system template starters", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.name = "陈嘉铭";

		expect(
			resolveImportedResumeName({
				data,
				requestedName: "前端开发-中文投递版",
				fallbackName: "Random System Name",
				preferRequestedName: true,
			}),
		).toBe("前端开发-中文投递版");
	});

	it("falls back to a generated name only when neither resume data nor file name can name the import", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.name = "";

		expect(
			resolveImportedResumeName({
				data,
				requestedName: "   ",
				fallbackName: "Random System Name",
			}),
		).toBe("Random System Name");
	});

	it("creates stable-looking but collision-resistant slugs for repeated imports", () => {
		expect(buildImportedResumeSlug("Senior Product Designer", "019e9168-5d2e-7579-88fe-62a84c6fe485")).toBe(
			"senior-product-designer-019e9168",
		);
		expect(buildImportedResumeSlug("陈嘉行", "119e9168-5d2e-7579-88fe-62a84c6fe485")).toBe("resume-119e9168");
	});

	it("preserves the locale from imported resume data when it is valid", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.page.locale = "zh-CN";

		expect(resolveImportedResumeLocale(data, "en-US")).toBe("zh-CN");
	});

	it("falls back to the request locale when imported resume data has an invalid locale", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.page.locale = "invalid-locale" as typeof data.metadata.page.locale;

		expect(resolveImportedResumeLocale(data, "zh-CN")).toBe("zh-CN");
	});
});
