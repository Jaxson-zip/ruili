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

	it("uses curated Chinese collection templates for all starter previews", () => {
		const curatedTemplates = new Set([
			"collection001",
			"collection002",
			"collection003",
			"collection005",
			"collection007",
			"collection016",
			"collection017",
			"collection018",
			"collection019",
			"collection020",
			"collection021",
			"collection022",
			"collection024",
			"collection026",
			"collection027",
			"collection028",
			"collection029",
		]);

		for (const starter of resumeTemplateStarters) {
			expect(curatedTemplates.has(starter.template), starter.id).toBe(true);
			expect(starter.data.metadata.template).toBe(starter.template);
		}
	});

	it("includes filled starter samples for the preferred visual collection templates", () => {
		const startersByTemplate = new Map(resumeTemplateStarters.map((starter) => [starter.template, starter]));

		for (const template of ["collection019", "collection026", "collection028"] as const) {
			const starter = startersByTemplate.get(template);
			expect(starter, template).toBeDefined();
			expect(starter?.data.basics.name, template).not.toBe("");
			expect(starter?.data.summary.content, template).not.toBe("");
			expect(starter?.data.metadata.layout.pages[0]?.fullWidth, template).toBe(false);
		}
	});

	it("keeps two-column collection starters in a two-column layout", () => {
		const twoColumnTemplates = new Set([
			"collection005",
			"collection007",
			"collection016",
			"collection017",
			"collection018",
			"collection019",
			"collection020",
			"collection022",
			"collection024",
			"collection026",
			"collection028",
			"collection029",
		]);

		for (const starter of resumeTemplateStarters.filter((starter) => twoColumnTemplates.has(starter.template))) {
			const page = starter.data.metadata.layout.pages[0];
			expect(page?.fullWidth, starter.id).toBe(false);
			expect(page?.sidebar.length, starter.id).toBeGreaterThan(0);
			expect(starter.name, starter.id).not.toContain("单栏");
			expect(starter.description, starter.id).not.toContain("单栏");
			expect(starter.tags, starter.id).not.toContain("单栏");
		}
	});

	it("keeps the default frontend starter dense enough for a one-page launch sample", () => {
		const frontendStarter = resumeTemplateStarters.find((starter) => starter.id === "frontend-engineer");

		expect(frontendStarter).toBeDefined();
		expect(frontendStarter?.data.sections.experience.items).toHaveLength(2);
		expect(frontendStarter?.data.sections.projects.items.length).toBeGreaterThanOrEqual(3);
		for (const project of frontendStarter?.data.sections.projects.items ?? []) {
			expect(project.description).toContain("<ul>");
			expect(project.description).toContain("<li>");
		}
		expect(frontendStarter?.data.metadata.layout.pages[0]?.main).toEqual(["summary", "experience", "projects"]);
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
