import { describe, expect, it } from "vitest";
import { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import { buildResumeStarterImportInput } from "./template-starter-import";

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
});
