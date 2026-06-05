import { describe, expect, it } from "vitest";
import { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import { collectionTemplateReferences } from "./template/data";
import {
	buildCollectionReferenceStarterImportInput,
	buildResumeStarterImportInput,
	getStarterForCollectionReference,
} from "./template-starter-import";

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

	it("builds a complete Chinese starter resume from a collection reference style", () => {
		const reference = collectionTemplateReferences[0];
		if (!reference) throw new Error("Expected at least one collection reference.");

		const input = buildCollectionReferenceStarterImportInput(reference, " 参考模板-投递版 ");

		expect(input.name).toBe("参考模板-投递版");
		expect(input.preferRequestedName).toBe(true);
		expect(input.data.metadata.template).toBe(reference.baseTemplate);
		expect(input.data.metadata.design.colors.primary).toBe(reference.accentColor);
		expect(input.data.metadata.page.locale).toBe("zh-CN");
		expect(input.data.summary.content).not.toBe("");
		expect(input.data.basics.name).not.toBe("");
		expect(input.data.metadata.layout.pages[0]?.fullWidth).toBe(reference.sidebarPosition === "none");
	});

	it("maps collection references to an appropriate built-in content starter", () => {
		const campusReference = collectionTemplateReferences.find((reference) =>
			reference.tags.some((tag) => tag === "校招"),
		);
		if (!campusReference) throw new Error("Expected at least one campus reference.");

		const starter = getStarterForCollectionReference(campusReference);

		expect(starter.id).toBe("campus-student");
	});
});
