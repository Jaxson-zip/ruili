import { describe, expect, it } from "vitest";
import { defaultResumeData } from "./default";
import {
	buildChineseResumeModel,
	buildWordTemplateRenderData,
	buildZhInternshipTemplateViewModel,
	getWordTemplateManifest,
	wordTemplateIds,
	wordTemplateManifests,
} from "./word-template";

function makeData() {
	const data = structuredClone(defaultResumeData);

	data.basics.name = "张锦铭";
	data.basics.headline = "数据标注与测试实习生";
	data.basics.email = "zhang@example.com";
	data.basics.phone = "13800000000";
	data.basics.location = "深圳";
	data.basics.customFields = [
		{ id: "zh-internship-birthday", icon: "calendar", text: "2006.7.8", link: "" },
		{ id: "zh-internship-gender", icon: "user", text: "男", link: "" },
	];

	data.sections.education.items = [
		{
			id: "education-1",
			hidden: false,
			school: "示例信息职业技术学院",
			degree: "大专",
			area: "大数据技术",
			grade: "3.67/4.0",
			location: "深圳",
			period: "2023.9-2026.6",
			website: { label: "", url: "", inlineLink: false },
			description: "院学生会人工智能学院副主席",
		},
	];

	data.sections.awards.items = [
		{
			id: "award-1",
			hidden: false,
			title: "数据类竞赛获奖 2 次",
			awarder: "",
			date: "2024",
			description: "",
			website: { label: "", url: "", inlineLink: false },
		},
	];

	data.sections.certifications.items = [
		{
			id: "certification-1",
			hidden: false,
			title: "数据分析证书",
			issuer: "行业协会",
			date: "2025.3",
			description: "<p>完成数据分析与可视化课程。</p>",
			website: { label: "", url: "", inlineLink: false },
		},
	];

	data.sections.experience.items = [
		{
			id: "experience-1",
			hidden: false,
			company: "云澜数据科技有限公司",
			position: "数据运营实习生",
			location: "",
			period: "2023.9-2024.6",
			website: { label: "", url: "", inlineLink: false },
			description: "<p>实训设备管理：维护教学设备正常运行</p><p>教学秩序维护：协助处理突发教学事件</p>",
			roles: [],
		},
	];

	data.sections.profiles.items = [
		{
			id: "profile-1",
			hidden: false,
			icon: "link",
			iconColor: "",
			network: "GitHub",
			username: "zhang",
			website: { label: "", url: "https://github.com/zhang", inlineLink: false },
		},
	];

	data.sections.projects.items = [
		{
			id: "project-1",
			hidden: false,
			name: "校园数据治理平台",
			period: "2025.5-2025.7",
			website: { label: "", url: "", inlineLink: false },
			description: "<p>后端开发</p><p>协同开发</p><p>工作职责：完成模型集成与数据处理</p>",
		},
	];

	data.sections.publications.items = [
		{
			id: "publication-1",
			hidden: false,
			title: "校园数据治理实践",
			publisher: "校刊",
			date: "2025.4",
			description: "<p>介绍数据治理项目经验。</p>",
			website: { label: "", url: "", inlineLink: false },
		},
	];

	data.sections.volunteer.items = [
		{
			id: "volunteer-1",
			hidden: false,
			organization: "社区服务中心",
			location: "深圳",
			period: "2024.7",
			description: "<p>协助活动报名和现场秩序维护。</p>",
			website: { label: "", url: "", inlineLink: false },
		},
	];

	data.sections.references.items = [
		{
			id: "reference-1",
			hidden: false,
			name: "李老师",
			position: "指导老师",
			phone: "13800000001",
			description: "<p>可提供实习表现证明。</p>",
			website: { label: "", url: "", inlineLink: false },
		},
	];

	data.sections.languages.items = [
		{
			id: "language-1",
			hidden: false,
			language: "英语",
			fluency: "CET-4",
			level: 4,
		},
	];

	data.sections.interests.items = [
		{
			id: "interest-1",
			hidden: false,
			icon: "sparkles",
			iconColor: "",
			name: "AI 工具",
			keywords: ["Prompt", "效率工具"],
		},
	];

	return data;
}

describe("buildChineseResumeModel", () => {
	it("normalizes structured resume data into reusable Chinese template fields", () => {
		const model = buildChineseResumeModel(makeData());

		expect(model.basics).toMatchObject({
			name: "张锦铭",
			headline: "数据标注与测试实习生",
			email: "zhang@example.com",
			phone: "13800000000",
			location: "深圳",
			gender: "男",
			birthday: "2006.7.8",
		});
		expect(model.education[0]).toMatchObject({
			school: "示例信息职业技术学院",
			degree: "大专",
			area: "大数据技术",
			grade: "3.67/4.0",
			description: "院学生会人工智能学院副主席",
		});
		expect(model.experience[0]?.descriptionLines).toEqual([
			{ text: "实训设备管理：维护教学设备正常运行" },
			{ text: "教学秩序维护：协助处理突发教学事件" },
		]);
		expect(model.projects[0]?.descriptionLines[2]).toEqual({ text: "工作职责：完成模型集成与数据处理" });
		expect(model.certifications[0]).toMatchObject({
			title: "数据分析证书",
			issuer: "行业协会",
			date: "2025.3",
			description: "完成数据分析与可视化课程。",
		});
		expect(model.profiles[0]).toMatchObject({ network: "GitHub", username: "zhang", url: "https://github.com/zhang" });
		expect(model.publications[0]).toMatchObject({
			title: "校园数据治理实践",
			publisher: "校刊",
			date: "2025.4",
			description: "介绍数据治理项目经验。",
		});
		expect(model.volunteer[0]?.descriptionLines).toEqual([{ text: "协助活动报名和现场秩序维护。" }]);
		expect(model.references[0]).toMatchObject({
			name: "李老师",
			position: "指导老师",
			phone: "13800000001",
			description: "可提供实习表现证明。",
		});
		expect(model.languages).toEqual([{ language: "英语", fluency: "CET-4", level: 4 }]);
		expect(model.interests).toEqual([{ name: "AI 工具", keywords: ["Prompt", "效率工具"] }]);
	});

	it("keeps the internship view as an adapter over the Chinese model", () => {
		const data = makeData();
		const renderData = buildWordTemplateRenderData(data);
		const viewModel = buildZhInternshipTemplateViewModel(data);

		expect(renderData.chinese.basics.name).toBe("张锦铭");
		expect(renderData.zhInternship).toEqual(viewModel);
		expect(viewModel.education.school).toBe("示例信息职业技术学院");
		expect(viewModel.awards).toEqual([{ title: "2024  数据类竞赛获奖 2 次" }]);
		expect(viewModel.experience.company).toBe("云澜数据科技有限公司");
		expect(viewModel.projects[0]?.name).toBe("校园数据治理平台");
	});

	it("preserves additional internship education entries in the single Word education slot", () => {
		const data = makeData();
		const firstEducation = data.sections.education.items[0];
		if (!firstEducation) throw new Error("Expected test data to include education.");

		data.sections.education.items.push({
			...firstEducation,
			id: "education-2",
			school: "Second Test University",
			degree: "Second Degree",
			area: "Second Major",
			period: "2020-2022",
			description: "Second detail",
		});

		const viewModel = buildZhInternshipTemplateViewModel(data);

		expect(viewModel.education.description).toContain("Second Test University");
		expect(viewModel.education.description).toContain("2020-2022");
		expect(viewModel.education.description).toContain("Second detail");
	});

	it("preserves additional internship experience entries in the single Word experience slot", () => {
		const data = makeData();
		const firstExperience = data.sections.experience.items[0];
		if (!firstExperience) throw new Error("Expected test data to include experience.");

		data.sections.experience.items.push({
			...firstExperience,
			id: "experience-2",
			company: "Second Test Company",
			position: "Second Role",
			period: "2024-2025",
			description: "<p>Second responsibility</p>",
			roles: [],
		});

		const viewModel = buildZhInternshipTemplateViewModel(data);

		expect(viewModel.experience.description).toContain("Second Test Company");
		expect(viewModel.experience.description).toContain("2024-2025");
		expect(viewModel.experience.description).toContain("Second responsibility");
		expect(viewModel.experience.descriptionLines).toEqual(
			expect.arrayContaining([{ text: "2024-2025  Second Test Company  Second Role" }]),
		);
	});

	it("excludes items from sections hidden at the module level", () => {
		const data = makeData();
		data.sections.awards.hidden = true;
		data.sections.projects.hidden = true;

		const renderData = buildWordTemplateRenderData(data);

		expect(renderData.chinese.awards).toEqual([]);
		expect(renderData.zhInternship.awards).toEqual([]);
		expect(renderData.chinese.projects).toEqual([]);
		expect(renderData.zhInternship.projects).toEqual([]);
	});
});

describe("word template manifests", () => {
	it("registers only verified real DOCX templates for the current beta", () => {
		expect(wordTemplateIds).toEqual(["zh-internship-001", "zh-ats-compact-001", "zh-sidebar-clean-001"]);
		expect(wordTemplateManifests).toEqual([
			expect.objectContaining({
				id: "zh-internship-001",
				docxFileName: "zh-internship-001.docx",
				previewFileName: "zh-internship-001.png",
				renderView: "zhInternship",
				slots: { awards: 15, education: 2, experience: 2, projects: 3 },
			}),
			expect.objectContaining({
				id: "zh-ats-compact-001",
				docxFileName: "zh-ats-compact-001.docx",
				previewFileName: "zh-ats-compact-001.png",
				renderView: "chinese",
				slots: { awards: 6, education: 1, experience: 1, projects: 3, skills: 3 },
			}),
			expect.objectContaining({
				id: "zh-sidebar-clean-001",
				docxFileName: "zh-sidebar-clean-001.docx",
				previewFileName: "zh-sidebar-clean-001.png",
				renderView: "chinese",
				slots: { awards: 8, education: 1, experience: 1, projects: 2, skills: 3 },
			}),
		]);
	});

	it("resolves a template manifest by id and rejects unfinished or old experimental templates", () => {
		expect(getWordTemplateManifest("zh-internship-001")?.docxFileName).toBe("zh-internship-001.docx");
		expect(getWordTemplateManifest("zh-ats-compact-001")?.renderView).toBe("chinese");
		expect(getWordTemplateManifest("zh-sidebar-clean-001")?.renderView).toBe("chinese");
		expect(getWordTemplateManifest("zh-ats-minimal-001")).toBeUndefined();
		expect(getWordTemplateManifest("compact-blue-grid")).toBeUndefined();
		expect(getWordTemplateManifest("dark-orange-sidebar")).toBeUndefined();
	});
});
