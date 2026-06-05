import { describe, expect, it } from "vitest";
import { resumeDataSchema } from "./data";
import { resumeTemplateStarters } from "./starters";

describe("resumeTemplateStarters", () => {
	it("provides multiple complete Chinese starter resumes", () => {
		expect(resumeTemplateStarters.length).toBeGreaterThanOrEqual(12);

		for (const starter of resumeTemplateStarters) {
			expect(starter.name).toMatch(/样张|模板/);
			expect(starter.resumeName).toMatch(/版|样张/);
			expect(starter.tags.length).toBeGreaterThan(0);
			expect(resumeDataSchema.safeParse(starter.data).success).toBe(true);
			expect(starter.data.metadata.page.locale).toBe("zh-CN");
			expect(starter.data.metadata.layout.pages).toHaveLength(1);
			expect(starter.data.basics.name).not.toBe("");
			expect(starter.data.summary.content).not.toBe("");
		}
	});

	it("uses unique starter ids and dashboard names", () => {
		const ids = resumeTemplateStarters.map((starter) => starter.id);
		const names = resumeTemplateStarters.map((starter) => starter.resumeName);

		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(names).size).toBe(names.length);
	});

	it("does not leak frontend sample identity into other starters", () => {
		const leakedFrontendTerms = ["陈嘉铭", "chenjiaming", "jiaming.dev", "字节跳动"];

		for (const starter of resumeTemplateStarters.filter((starter) => !starter.id.startsWith("frontend-engineer"))) {
			const searchableData = JSON.stringify({
				basics: starter.data.basics,
				profiles: starter.data.sections.profiles,
				experience: starter.data.sections.experience,
				customSections: starter.data.customSections,
			});

			for (const term of leakedFrontendTerms) {
				expect(searchableData, `${starter.id} should not contain ${term}`).not.toContain(term);
			}
		}
	});
});
