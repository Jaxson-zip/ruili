import { describe, expect, it } from "vitest";
import { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import { templates } from "./template/data";
import { buildBlankTemplateImportInput, buildResumeStarterImportInput } from "./template-starter-import";

describe("buildResumeStarterImportInput", () => {
	it("builds an import payload from a template starter", () => {
		const starter = resumeTemplateStarters[0];
		if (!starter) throw new Error("Expected at least one resume starter.");

		const input = buildResumeStarterImportInput(starter);

		expect(input.name).toBe(starter.resumeName);
		expect(input.preferRequestedName).toBe(true);
		expect(input.data).toEqual(starter.data);
		expect(input.data).not.toBe(starter.data);
	});

	it("uses a typed resume name while keeping the starter data intact", () => {
		const starter = resumeTemplateStarters[0];
		if (!starter) throw new Error("Expected at least one resume starter.");

		const input = buildResumeStarterImportInput(starter, " 前端开发-腾讯版 ");

		expect(input.name).toBe("前端开发-腾讯版");
		expect(input.data.basics.name).toBe(starter.data.basics.name);
	});

	it("builds a blank resume from an exact template id", () => {
		const input = buildBlankTemplateImportInput("collection001", templates.collection001);

		expect(input.name).toBe("蓝色时间轴 空白简历");
		expect(input.preferRequestedName).toBe(true);
		expect(input.data.metadata.template).toBe("collection001");
		expect(input.data.metadata.design.colors.primary).toBe(templates.collection001.accentColor);
		expect(input.data.metadata.layout.pages[0]?.fullWidth).toBe(true);
		expect(input.data.metadata.layout.pages[0]?.main).toContain("experience");
		expect(input.data.basics.name).toBe("");
	});

	it("keeps sidebar slots when creating a blank sidebar template", () => {
		const input = buildBlankTemplateImportInput("collection005", templates.collection005, " 技术版 ");

		expect(input.name).toBe("技术版");
		expect(input.data.metadata.template).toBe("collection005");
		expect(input.data.metadata.layout.pages[0]?.fullWidth).toBe(false);
		expect(input.data.metadata.layout.pages[0]?.sidebar).toContain("skills");
		expect(input.data.metadata.layout.pages[0]?.main).toContain("projects");
	});
});
