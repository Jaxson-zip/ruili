import { describe, expect, it } from "vitest";
import { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import { templates } from "./template/data";
import {
	buildBlankTemplateImportInput,
	buildResumeStarterImportInput,
	buildWordTemplateImportInput,
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

		const input = buildResumeStarterImportInput(starter, " 前端开发 腾讯版 ");

		expect(input.name).toBe("前端开发 腾讯版");
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

	it("keeps horizontal collection templates full width so previews match the editor", () => {
		const input = buildBlankTemplateImportInput("collection003", templates.collection003);

		expect(input.name).toBe("深蓝横栏 空白简历");
		expect(input.data.metadata.template).toBe("collection003");
		expect(input.data.metadata.layout.pages[0]?.fullWidth).toBe(true);
		expect(input.data.metadata.layout.pages[0]?.sidebar).toEqual([]);
	});

	it("builds the internship Word template resume with matching sample content", () => {
		const input = buildWordTemplateImportInput(" 公开样张简历 ", "zh-internship-001");

		expect(input.name).toBe("公开样张简历");
		expect(input.preferRequestedName).toBe(true);
		expect(input.data.metadata.template).toBe("onyx");
		expect(input.data.metadata.wordTemplate.id).toBe("zh-internship-001");
		expect(input.data.metadata.layout.pages[0]?.main).toEqual(["education", "awards", "experience", "projects"]);
		expect(input.data.metadata.layout.pages[0]?.sidebar).toEqual([]);
		expect(input.data.basics.name).toBe("林知夏");
		expect(input.data.basics.headline).toBe("数据标注与测试实习生");
		expect(input.data.basics.email).toBe("demo@example.com");
		expect(input.data.basics.phone).toBe("13800000000");
		expect(input.data.picture.url).toBe("");
		expect(input.data.picture.hidden).toBe(true);
		expect(input.data.sections.education.items[0]?.school).toBe("示例信息职业技术学院");
		expect(input.data.sections.awards.items).toHaveLength(15);
		expect(input.data.sections.projects.items).toHaveLength(3);
		expect(input.data.sections.skills.hidden).toBe(true);
		expect(input.data.sections.skills.items).toHaveLength(0);
		expect(input.data.sections.experience.items[0]?.company).toBe("云澜数据科技有限公司");
		expect(input.data.sections.experience.items[0]?.description).toContain("数据标注规范维护");
		expect(input.data.sections.experience.items[0]?.description).toContain("抽检 3,000+ 条样本");
		expect(input.data.sections.projects.items[0]?.name).toBe("校园数据治理平台");
		expect(input.data.sections.projects.items[1]?.name).toBe("智能客服质检系统");
		expect(input.data.sections.projects.items[2]?.name).toBe("招聘岗位匹配分析工具");
	});

	it("builds the ATS Word template resume from the same structured Chinese sample", () => {
		const input = buildWordTemplateImportInput(undefined, "zh-ats-compact-001");

		expect(input.name).toBe("ATS 单栏精简模板");
		expect(input.data.metadata.wordTemplate.id).toBe("zh-ats-compact-001");
		expect(input.data.basics.name).toBe("林知夏");
		expect(input.data.sections.education.items[0]?.school).toBe("示例信息职业技术学院");
		expect(input.data.sections.experience.items[0]?.company).toBe("云澜数据科技有限公司");
		expect(input.data.sections.projects.items).toHaveLength(3);
		expect(input.data.sections.skills.items).toHaveLength(3);
	});

	it("builds the sidebar Word template resume from the same structured Chinese sample", () => {
		const input = buildWordTemplateImportInput(undefined, "zh-sidebar-clean-001");

		expect(input.name).toBe("蓝灰侧栏双栏模板");
		expect(input.data.metadata.wordTemplate.id).toBe("zh-sidebar-clean-001");
		expect(input.data.basics.name).toBe("林知夏");
		expect(input.data.summary.hidden).toBe(false);
		expect(input.data.summary.title).toBe("个人优势");
		expect(input.data.summary.content).toContain("数据标注");
		expect(input.data.metadata.layout.pages[0]?.main).toEqual(["experience", "projects", "awards"]);
		expect(input.data.sections.education.items[0]?.school).toBe("示例信息职业技术学院");
		expect(input.data.sections.experience.items[0]?.company).toBe("云澜数据科技有限公司");
		expect(input.data.sections.awards.items).toHaveLength(5);
		expect(input.data.sections.projects.items).toHaveLength(3);
		expect(input.data.sections.projects.items[0]?.description).toContain("字段标准化说明");
		expect(input.data.sections.projects.items[0]?.description).not.toContain("工作职责");
		expect(input.data.sections.skills.items).toHaveLength(3);
	});
});
