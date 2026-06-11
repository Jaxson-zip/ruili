import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import {
	clearSelectedWordTemplateId,
	getSelectedWordTemplate,
	getSelectedWordTemplateId,
	getWordTemplateById,
	getWordTemplateDefaultResumeName,
	getWordTemplateLeftSidebarSectionIds,
	getWordTemplateLibrary,
	getWordTemplateSupportedSectionIds,
	isDefaultWordTemplateResumeName,
	setSelectedWordTemplateId,
} from "./library";

describe("word template library", () => {
	it("registers the current beta DOCX templates", () => {
		const templates = getWordTemplateLibrary();

		expect(templates.map((template) => template.id)).toEqual([
			"zh-internship-001",
			"zh-ats-compact-001",
			"zh-sidebar-clean-001",
		]);
		expect(templates[0]).toMatchObject({
			id: "zh-internship-001",
			name: "校招实习标准模板",
			docxUrl: "/templates/word/zh-internship-001.docx",
			previewUrl: "/templates/word/zh-internship-001.png",
		});
	});

	it("resolves configured templates by id", () => {
		expect(getWordTemplateById("zh-internship-001")?.id).toBe("zh-internship-001");
		expect(getWordTemplateById("zh-ats-compact-001")?.docxUrl).toBe("/templates/word/zh-ats-compact-001.docx");
		expect(getWordTemplateById("zh-sidebar-clean-001")?.previewUrl).toBe("/templates/word/zh-sidebar-clean-001.png");
		expect(getWordTemplateById("missing-template")).toBeUndefined();
	});

	it("recognizes template-generated resume names", () => {
		expect(getWordTemplateDefaultResumeName("zh-sidebar-clean-001")).toBe("蓝灰侧栏双栏模板 简历");
		expect(getWordTemplateDefaultResumeName(undefined)).toBe("中文 Word 模板简历");
		expect(isDefaultWordTemplateResumeName("ATS 单栏精简模板 简历")).toBe(true);
		expect(isDefaultWordTemplateResumeName("蓝灰侧栏双栏模板")).toBe(true);
		expect(isDefaultWordTemplateResumeName("前端暑期实习-v3")).toBe(false);
	});

	it("stores and clears the selected template per resume", () => {
		clearSelectedWordTemplateId("resume-1");
		setSelectedWordTemplateId("resume-1", "zh-ats-compact-001");

		expect(getSelectedWordTemplateId("resume-1")).toBe("zh-ats-compact-001");
		expect(getSelectedWordTemplate("resume-1")?.id).toBe("zh-ats-compact-001");

		clearSelectedWordTemplateId("resume-1");

		expect(getSelectedWordTemplateId("resume-1")).toBeNull();
		expect(getSelectedWordTemplate("resume-1")).toBeUndefined();
	});

	it("prefers persisted resume metadata over local selection", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate.id = "zh-sidebar-clean-001";

		clearSelectedWordTemplateId("resume-1");
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		expect(getSelectedWordTemplateId("resume-1", data)).toBe("zh-sidebar-clean-001");
		expect(getSelectedWordTemplate("resume-1", data)?.id).toBe("zh-sidebar-clean-001");
	});

	it("infers the internship template from imported internship fields", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.customFields = [{ id: "zh-internship-gender", icon: "user", text: "male", link: "" }];

		expect(getSelectedWordTemplateId("resume-1", data)).toBe("zh-internship-001");
		expect(getSelectedWordTemplate("resume-1", data)?.id).toBe("zh-internship-001");
	});

	it("exposes only sections rendered by the selected Word template", () => {
		expect(getWordTemplateSupportedSectionIds("zh-internship-001")).toEqual([
			"education",
			"awards",
			"experience",
			"projects",
		]);
		expect(getWordTemplateLeftSidebarSectionIds("zh-internship-001")).toEqual([
			"picture",
			"basics",
			"education",
			"awards",
			"experience",
			"projects",
		]);
		expect(getWordTemplateLeftSidebarSectionIds("zh-internship-001")).not.toContain("summary");
		expect(getWordTemplateLeftSidebarSectionIds("zh-internship-001")).not.toContain("skills");

		expect(getWordTemplateLeftSidebarSectionIds("zh-ats-compact-001")).toEqual([
			"picture",
			"basics",
			"education",
			"experience",
			"projects",
			"awards",
			"skills",
		]);
		expect(getWordTemplateLeftSidebarSectionIds("zh-ats-compact-001")).not.toContain("summary");

		expect(getWordTemplateSupportedSectionIds("zh-sidebar-clean-001")).toEqual([
			"education",
			"awards",
			"experience",
			"projects",
			"skills",
		]);
		expect(getWordTemplateLeftSidebarSectionIds("zh-sidebar-clean-001")).toEqual([
			"picture",
			"basics",
			"summary",
			"education",
			"skills",
			"experience",
			"projects",
			"awards",
		]);
		expect(getWordTemplateLeftSidebarSectionIds("zh-sidebar-clean-001")).not.toContain("languages");
	});
});
