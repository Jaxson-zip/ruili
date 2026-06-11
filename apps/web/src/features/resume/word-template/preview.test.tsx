// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { getWordTemplateById } from "./library";
import { WordTemplateDataPreview } from "./preview";

function getTemplate(id: "zh-ats-compact-001" | "zh-internship-001" | "zh-sidebar-clean-001" = "zh-internship-001") {
	const template = getWordTemplateById(id);
	if (!template) throw new Error(`Expected ${id} template to be registered.`);
	return template;
}

function commitEditable(element: HTMLElement, value: string) {
	Object.defineProperty(element, "innerText", { value, configurable: true });
	fireEvent.blur(element);
}

describe("WordTemplateDataPreview", () => {
	it("renders the selected Word template as a realtime HTML preview", () => {
		const data = structuredClone(sampleResumeData);
		data.basics.name = "林知夏";
		data.basics.headline = "产品运营实习生";

		render(<WordTemplateDataPreview data={data} template={getTemplate()} />);

		expect(screen.getByTestId("word-template-data-preview")).toBeInTheDocument();
		expect(screen.getAllByText("林知夏").length).toBeGreaterThan(0);
		expect(screen.getByText("产品运营实习生")).toBeInTheDocument();
		expect(screen.getByText("教育经历")).toBeInTheDocument();
		expect(screen.queryByText(/正在生成/)).not.toBeInTheDocument();
		expect(screen.queryByTestId("word-template-pdf-preview")).not.toBeInTheDocument();
	});

	it("keeps the internship template paginated when secondary content exists", () => {
		const data = structuredClone(sampleResumeData);
		data.basics.name = "王小明";

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		expect(document.querySelectorAll("[data-word-template-preview-page]")).toHaveLength(2);
		expect(screen.getAllByText("项目经历").length).toBeGreaterThanOrEqual(1);
	});

	it("uses the saved Word module order in the internship preview", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["projects", "education", "awards", "experience"],
				sidebar: [],
			},
		];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		const projectsTitle = screen.getByText("项目经历");
		const educationTitle = screen.getByText("教育经历");
		expect(projectsTitle.compareDocumentPosition(educationTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("preserves dragged internship module order across page breaks", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["education", "awards", "projects", "experience"],
				sidebar: [],
			},
		];

		const firstEducation = data.sections.education.items[0];
		if (!firstEducation) throw new Error("Expected sample resume data to include education.");
		data.sections.education.items = [
			{ ...firstEducation, id: "order-education-1", hidden: false, school: "第一学校" },
			{ ...firstEducation, id: "order-education-2", hidden: false, school: "第二学校" },
		];

		const firstAward = data.sections.awards.items[0];
		if (!firstAward) throw new Error("Expected sample resume data to include awards.");
		data.sections.awards.hidden = false;
		data.sections.awards.items = Array.from({ length: 14 }, (_, index) => ({
			...firstAward,
			id: `order-award-${index}`,
			hidden: false,
			title: `顺序奖项 ${index + 1}`,
		}));

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		const pages = document.querySelectorAll("[data-word-template-preview-page]");
		expect(pages.length).toBeGreaterThanOrEqual(2);
		expect(pages[0]?.textContent).toContain("获奖荣誉");
		expect(pages[0]?.textContent).toContain("顺序奖项 1");
		expect([...pages].some((page) => page.textContent?.includes("顺序奖项 14"))).toBe(true);
		expect([...pages].some((page) => page.textContent?.includes("项目经历"))).toBe(true);

		const awardsTitle = screen.getByText("获奖荣誉");
		const projectsTitle = screen.getByText("项目经历");
		const experienceTitle = screen.getByText("工作经历");
		expect(awardsTitle.compareDocumentPosition(projectsTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(projectsTitle.compareDocumentPosition(experienceTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("uses the taller continuation page capacity for internship overflow", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["education", "awards", "projects", "experience"],
				sidebar: [],
			},
		];

		const firstEducation = data.sections.education.items[0];
		const firstAward = data.sections.awards.items[0];
		const firstProject = data.sections.projects.items[0];
		const firstExperience = data.sections.experience.items[0];
		if (!firstEducation || !firstAward || !firstProject || !firstExperience) {
			throw new Error("Expected sample resume data to include internship template sections.");
		}

		data.sections.education.items = Array.from({ length: 2 }, (_, index) => ({
			...firstEducation,
			id: `capacity-education-${index}`,
			hidden: false,
		}));
		data.sections.awards.hidden = false;
		data.sections.awards.items = Array.from({ length: 14 }, (_, index) => ({
			...firstAward,
			id: `capacity-award-${index}`,
			hidden: false,
			title: `capacity award ${index + 1}`,
		}));
		data.sections.projects.items = Array.from({ length: 3 }, (_, index) => ({
			...firstProject,
			id: `capacity-project-${index}`,
			hidden: false,
			name: `capacity project ${index + 1}`,
		}));
		data.sections.experience.items = Array.from({ length: 2 }, (_, index) => ({
			...firstExperience,
			id: `capacity-experience-${index}`,
			hidden: false,
			company: `capacity company ${index + 1}`,
		}));

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		const pages = document.querySelectorAll("[data-word-template-preview-page]");
		expect(pages).toHaveLength(2);
		expect(pages[1]?.textContent).toContain("capacity award 14");
		expect(pages[1]?.textContent).toContain("capacity project 3");
		expect(pages[1]?.textContent).toContain("capacity company 2");
	});

	it("keeps a short internship award list together before the next page", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["education", "awards", "projects"],
				sidebar: [],
			},
		];

		const firstAward = data.sections.awards.items[0];
		const firstProject = data.sections.projects.items[0];
		if (!firstAward || !firstProject) throw new Error("Expected sample resume data to include awards and projects.");

		data.sections.awards.hidden = false;
		data.sections.awards.items = Array.from({ length: 5 }, (_, index) => ({
			...firstAward,
			id: `short-award-${index}`,
			hidden: false,
			title: `短奖项 ${index + 1}`,
		}));
		data.sections.projects.items = [{ ...firstProject, id: "short-project", hidden: false, name: "短奖项后的项目" }];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		const pages = document.querySelectorAll("[data-word-template-preview-page]");
		expect(pages[0]?.textContent).toContain("短奖项 1");
		expect(pages[0]?.textContent).toContain("短奖项 5");
		expect(pages[1]?.textContent).not.toContain("短奖项 5");
		expect([...pages].some((page) => page.textContent?.includes("短奖项后的项目"))).toBe(true);
	});

	it("does not render hidden internship sections even when they still contain visible items", () => {
		const data = structuredClone(sampleResumeData);
		data.sections.awards.hidden = true;

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		expect(screen.queryByText("获奖荣誉")).not.toBeInTheDocument();
	});

	it("renders a second visible education item in the internship template preview", () => {
		const data = structuredClone(sampleResumeData);
		const firstEducation = data.sections.education.items[0];
		if (!firstEducation) throw new Error("Expected sample resume data to include education.");

		firstEducation.school = "First Test University";
		firstEducation.hidden = false;
		data.sections.education.items.push({
			...firstEducation,
			id: "education-second-visible",
			school: "Second Test University",
			period: "2022.9-2026.6",
		});

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		expect(screen.getByText("First Test University")).toBeInTheDocument();
		expect(screen.getByText("Second Test University")).toBeInTheDocument();
	});

	it("uses proportional A4 coordinates for the internship header", () => {
		const data = structuredClone(sampleResumeData);
		data.picture.hidden = true;

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		const photo = screen.getByText("照片");
		const name = screen.getByRole("textbox", { name: "姓名" });
		const phone = screen.getByRole("textbox", { name: "电话" });

		expect(photo).toHaveClass("left-[1.14em]", "h-[10.9em]", "w-[8.43em]");
		expect(name.parentElement).toHaveClass("top-[1.45em]", "left-[12.85em]");
		expect(name).toHaveClass("text-[2.35em]", "whitespace-nowrap");
		expect(phone.parentElement?.parentElement).toHaveClass(
			"left-[13.1em]",
			"grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]",
		);
		expect(phone.parentElement).toHaveClass("gap-[0.28em]");
	});

	it("does not force portfolio links into the internship template layout", () => {
		const data = structuredClone(sampleResumeData);
		data.basics.website = { label: "GitHub", url: "https://github.com/ruili" };

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		expect(screen.queryByText("作品链接：")).not.toBeInTheDocument();
		expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
	});

	it("commits inline edits from the HTML preview", () => {
		const data = structuredClone(sampleResumeData);
		const onEdit = vi.fn();

		render(<WordTemplateDataPreview data={data} template={getTemplate()} onEdit={onEdit} />);

		const nameField = screen.getByRole("textbox", { name: "姓名" });
		commitEditable(nameField, "王小明");

		expect(onEdit).toHaveBeenCalledWith({ type: "basics", field: "name" }, "王小明");
	});

	it("commits internship header custom field edits from the HTML preview", () => {
		const data = structuredClone(sampleResumeData);
		const onEdit = vi.fn();
		data.basics.customFields = [
			{ id: "zh-internship-gender", icon: "user", link: "", text: "男" },
			{ id: "zh-internship-birthday", icon: "calendar", link: "", text: "2006.7.8" },
		];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} onEdit={onEdit} />);

		const genderField = screen.getByRole("textbox", { name: "性别" });
		const birthdayField = screen.getByRole("textbox", { name: "出生日期" });
		commitEditable(genderField, "女");
		commitEditable(birthdayField, "2004.6.17");

		expect(onEdit).toHaveBeenCalledWith({ icon: "user", id: "zh-internship-gender", type: "customField" }, "女");
		expect(onEdit).toHaveBeenCalledWith(
			{ icon: "calendar", id: "zh-internship-birthday", type: "customField" },
			"2004.6.17",
		);
	});

	it("commits award edits from the internship template", () => {
		const data = structuredClone(sampleResumeData);
		const onEdit = vi.fn();
		const award = data.sections.awards.items[0];
		if (!award) throw new Error("Expected sample resume data to include an award.");
		award.date = "2024";
		award.title = "校级一等奖";
		award.hidden = false;

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} onEdit={onEdit} />);

		const awardField = screen.getAllByRole("textbox", { name: "获奖荣誉" })[0];
		if (!awardField) throw new Error("Expected award field to be editable.");
		commitEditable(awardField, "2025 校级特等奖");

		expect(onEdit).toHaveBeenCalledWith({ type: "award", id: award.id, field: "date" }, "2025");
		expect(onEdit).toHaveBeenCalledWith({ type: "award", id: award.id, field: "title" }, "校级特等奖");
	});

	it("commits editable fields from the ATS compact template", () => {
		const data = structuredClone(sampleResumeData);
		const onEdit = vi.fn();
		const education = data.sections.education.items[0];
		const experience = data.sections.experience.items[0];
		const project = data.sections.projects.items[0];
		const award = data.sections.awards.items[0];
		const skill = data.sections.skills.items[0];
		if (!education || !experience || !project || !award || !skill) {
			throw new Error("Expected sample resume data to include template items.");
		}

		education.id = "ats-education-edit";
		education.school = "ATS 原学校";
		education.area = "计算机";
		education.degree = "本科";
		experience.id = "ats-experience-edit";
		experience.company = "ATS 原公司";
		experience.position = "原职位";
		experience.period = "2024.01-2024.06";
		experience.description = "<p>原工作描述</p>";
		project.id = "ats-project-edit";
		project.name = "ATS 原项目";
		project.period = "2024.07-2024.09";
		project.description = "<p>原项目描述</p>";
		award.id = "ats-award-edit";
		award.date = "2024";
		award.title = "原奖项";
		skill.id = "ats-skill-edit";
		skill.name = "原技能";
		skill.keywords = ["React", "TypeScript"];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} onEdit={onEdit} />);

		commitEditable(screen.getByRole("textbox", { name: "电话" }), "13900000000");
		commitEditable(screen.getByText("ATS 原公司"), "ATS 新公司");
		commitEditable(screen.getByText("原职位"), "增长运营");
		commitEditable(screen.getByText("2024.01-2024.06"), "2025.01-2025.06");
		commitEditable(screen.getByText("原工作描述"), "负责数据看板和转化分析");
		commitEditable(screen.getByText("ATS 原项目"), "ATS 新项目");
		commitEditable(screen.getByText("原项目描述"), "完成核心模块上线");
		commitEditable(screen.getByText("2024 原奖项"), "2025 校级一等奖");
		commitEditable(screen.getByText("原技能：React、TypeScript"), "前端工程：Vue、Vite");

		expect(onEdit).toHaveBeenCalledWith({ type: "basics", field: "phone" }, "13900000000");
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "experience", id: "ats-experience-edit", field: "company" },
			"ATS 新公司",
		);
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "experience", id: "ats-experience-edit", field: "position" },
			"增长运营",
		);
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "experience", id: "ats-experience-edit", field: "period" },
			"2025.01-2025.06",
		);
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "experience", id: "ats-experience-edit", field: "description" },
			"负责数据看板和转化分析",
		);
		expect(onEdit).toHaveBeenCalledWith({ type: "project", id: "ats-project-edit", field: "name" }, "ATS 新项目");
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "project", id: "ats-project-edit", field: "description" },
			"完成核心模块上线",
		);
		expect(onEdit).toHaveBeenCalledWith({ type: "award", id: "ats-award-edit", field: "date" }, "2025");
		expect(onEdit).toHaveBeenCalledWith({ type: "award", id: "ats-award-edit", field: "title" }, "校级一等奖");
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "skill", id: "ats-skill-edit", field: "keywords" },
			"前端工程：Vue、Vite",
		);
	});

	it("keeps a photo slot in the ATS compact template for Chinese resumes", () => {
		const data = structuredClone(sampleResumeData);
		data.picture.hidden = true;
		data.picture.url = "";

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);

		expect(screen.getByText("照片")).toBeInTheDocument();
	});

	it("keeps ATS compact awards and skills on the current page when there is room", () => {
		const data = structuredClone(sampleResumeData);
		const award = data.sections.awards.items[0];
		const skill = data.sections.skills.items[0];
		if (!award || !skill) throw new Error("Expected sample resume data to include awards and skills.");

		data.sections.awards.hidden = false;
		data.sections.skills.hidden = false;
		award.hidden = false;
		award.date = "2025";
		award.title = "校级一等奖";
		skill.hidden = false;
		skill.name = "前端开发";
		skill.keywords = ["Vue 3", "TypeScript"];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);

		expect(document.querySelectorAll("[data-word-template-preview-page]")).toHaveLength(1);
		expect(screen.getByText("获奖荣誉")).toBeInTheDocument();
		expect(screen.getByText("技能特长")).toBeInTheDocument();
		expect(screen.getByText("2025 校级一等奖")).toBeInTheDocument();
		expect(screen.getByText("前端开发：Vue 3、TypeScript")).toBeInTheDocument();
	});

	it("uses the saved Word module order in the ATS compact preview", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["projects", "education", "experience", "awards", "skills"],
				sidebar: [],
			},
		];

		const education = data.sections.education.items[0];
		const project = data.sections.projects.items[0];
		if (!education || !project) throw new Error("Expected sample resume data to include education and projects.");
		education.school = "ATS Order University";
		project.name = "ATS Order Project";

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);

		const projectTitle = screen.getByText("ATS Order Project");
		const educationTitle = screen.getByText("ATS Order University");
		expect(projectTitle.compareDocumentPosition(educationTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("flows ATS compact sections by one global order instead of fixed page groups", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["awards", "education", "experience", "projects", "skills"],
				sidebar: [],
			},
		];

		const award = data.sections.awards.items[0];
		const education = data.sections.education.items[0];
		if (!award || !education) throw new Error("Expected sample resume data to include awards and education.");
		data.sections.awards.hidden = false;
		award.hidden = false;
		award.date = "2026";
		award.title = "ATS Global Order Award";
		education.school = "ATS Global Order University";

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);

		const awardTitle = screen.getByText("2026 ATS Global Order Award");
		const educationTitle = screen.getByText("ATS Global Order University");
		expect(awardTitle.compareDocumentPosition(educationTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("does not push ATS compact sections to a new page while the current page has room", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["awards", "projects"],
				sidebar: [],
			},
		];

		const award = data.sections.awards.items[0];
		const project = data.sections.projects.items[0];
		if (!award || !project) throw new Error("Expected sample resume data to include awards and projects.");
		data.sections.education.hidden = true;
		data.sections.experience.hidden = true;
		data.sections.skills.hidden = true;
		data.sections.awards.hidden = false;
		data.sections.awards.items = Array.from({ length: 6 }, (_, index) => ({
			...award,
			id: `ats-split-award-${index + 1}`,
			hidden: false,
			date: "2026",
			title: `ATS Split Award ${index + 1}`,
		}));
		data.sections.projects.hidden = false;
		data.sections.projects.items = Array.from({ length: 3 }, (_, index) => ({
			...project,
			id: `ats-split-project-${index + 1}`,
			hidden: false,
			name: `ATS Split Project ${index + 1}`,
		}));

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);

		const pages = document.querySelectorAll("[data-word-template-preview-page]");
		expect(pages).toHaveLength(1);
		expect(pages[0]?.textContent).toContain("ATS Split Award 1");
		expect(pages[0]?.textContent).toContain("ATS Split Award 6");
		expect(pages[0]?.textContent).toContain("ATS Split Project 1");
		expect(pages[0]?.textContent).toContain("ATS Split Project 2");
		expect(pages[0]?.textContent).toContain("ATS Split Project 3");
	});

	it("continues a long ATS project from the current page instead of moving the whole section", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["awards", "projects"],
				sidebar: [],
			},
		];

		const award = data.sections.awards.items[0];
		const project = data.sections.projects.items[0];
		if (!award || !project) throw new Error("Expected sample resume data to include awards and projects.");

		data.sections.education.hidden = true;
		data.sections.experience.hidden = true;
		data.sections.skills.hidden = true;
		data.sections.awards.hidden = false;
		data.sections.awards.items = Array.from({ length: 12 }, (_, index) => ({
			...award,
			id: `ats-flow-award-${index + 1}`,
			hidden: false,
			date: "2026",
			title: `ATS Flow Award ${index + 1}`,
		}));
		data.sections.projects.hidden = false;
		data.sections.projects.items = [
			{
				...project,
				id: "ats-flow-project",
				hidden: false,
				name: "ATS Flow Project",
				description: Array.from({ length: 30 }, (_, index) => `<p>ATS flow line ${index + 1}</p>`).join(""),
			},
		];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);

		const pages = document.querySelectorAll("[data-word-template-preview-page]");
		expect(pages.length).toBeGreaterThan(1);
		expect(pages[0]?.textContent).toContain("ATS Flow Award 12");
		expect(pages[0]?.textContent).toContain("项目经历");
		expect(pages[0]?.textContent).toContain("ATS Flow Project");
		expect(pages[0]?.textContent).toContain("ATS flow line 1");
		expect([...pages].some((page) => page.textContent?.includes("ATS flow line 30"))).toBe(true);
	});

	it("commits editable fields from the sidebar template", () => {
		const data = structuredClone(sampleResumeData);
		const onEdit = vi.fn();
		const education = data.sections.education.items[0];
		const experience = data.sections.experience.items[0];
		const project = data.sections.projects.items[0];
		const skill = data.sections.skills.items[0];
		if (!education || !experience || !project || !skill) {
			throw new Error("Expected sample resume data to include template items.");
		}

		education.id = "sidebar-education-edit";
		education.school = "侧栏原学校";
		education.area = "软件工程";
		education.degree = "本科";
		education.period = "2020-2024";
		experience.id = "sidebar-experience-edit";
		experience.company = "侧栏原公司";
		experience.position = "原岗位";
		project.id = "sidebar-project-edit";
		project.name = "侧栏原项目";
		project.description = "<p>侧栏原项目描述</p>";
		skill.id = "sidebar-skill-edit";
		skill.name = "侧栏技能";
		skill.keywords = ["沟通", "执行"];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} onEdit={onEdit} />);

		commitEditable(screen.getByText("侧栏原学校"), "侧栏新学校");
		commitEditable(screen.getByText("软件工程 / 本科"), "人工智能 / 硕士");
		commitEditable(screen.getByText("侧栏技能：沟通、执行"), "产品分析：SQL、埋点");
		commitEditable(screen.getByText("侧栏原公司"), "侧栏新公司");
		commitEditable(screen.getByText("原岗位"), "项目经理");
		commitEditable(screen.getByText("侧栏原项目"), "侧栏新项目");
		commitEditable(screen.getByText("侧栏原项目描述"), "补充项目结果和指标");

		expect(onEdit).toHaveBeenCalledWith(
			{ type: "education", id: "sidebar-education-edit", field: "school" },
			"侧栏新学校",
		);
		expect(onEdit).toHaveBeenCalledWith({ type: "education", id: "sidebar-education-edit", field: "area" }, "人工智能");
		expect(onEdit).toHaveBeenCalledWith({ type: "education", id: "sidebar-education-edit", field: "degree" }, "硕士");
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "skill", id: "sidebar-skill-edit", field: "keywords" },
			"产品分析：SQL、埋点",
		);
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "experience", id: "sidebar-experience-edit", field: "company" },
			"侧栏新公司",
		);
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "experience", id: "sidebar-experience-edit", field: "position" },
			"项目经理",
		);
		expect(onEdit).toHaveBeenCalledWith({ type: "project", id: "sidebar-project-edit", field: "name" }, "侧栏新项目");
		expect(onEdit).toHaveBeenCalledWith(
			{ type: "project", id: "sidebar-project-edit", field: "description" },
			"补充项目结果和指标",
		);
	});

	it("uses the saved Word module order in the sidebar template main column", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["projects", "experience", "awards", "education", "skills"],
				sidebar: [],
			},
		];

		const experience = data.sections.experience.items[0];
		const project = data.sections.projects.items[0];
		if (!experience || !project) throw new Error("Expected sample resume data to include experience and projects.");
		experience.company = "Sidebar Order Company";
		project.name = "Sidebar Order Project";

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);

		const projectTitle = screen.getByText("Sidebar Order Project");
		const experienceTitle = screen.getByText("Sidebar Order Company");
		expect(projectTitle.compareDocumentPosition(experienceTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("keeps sidebar template awards after project content even when older data saved awards earlier", () => {
		const data = structuredClone(sampleResumeData);
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["experience", "awards", "projects", "education", "skills"],
				sidebar: [],
			},
		];

		const project = data.sections.projects.items[0];
		const award = data.sections.awards.items[0];
		if (!project || !award) throw new Error("Expected sample resume data to include projects and awards.");
		project.name = "侧栏优先项目";
		award.title = "侧栏补充奖项";
		data.sections.awards.hidden = false;
		data.sections.awards.items = [{ ...award, hidden: false }];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);

		const projectTitle = screen.getByText("侧栏优先项目");
		const awardsTitle = screen.getByText("奖项荣誉");
		expect(projectTitle.compareDocumentPosition(awardsTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it("does not expose unsupported summary or skills in the internship template", () => {
		const data = structuredClone(sampleResumeData);
		const skill = data.sections.skills.items[0];
		if (!skill) throw new Error("Expected sample resume data to include a skill.");
		data.summary.content = "<p>可快速学习业务流程。</p>";
		skill.hidden = false;
		skill.name = "前端开发";
		skill.keywords = ["Vue 3", "TypeScript"];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-internship-001")} />);

		expect(screen.queryByText("技能特长")).not.toBeInTheDocument();
		expect(screen.queryByText("前端开发")).not.toBeInTheDocument();
		expect(screen.queryByText("自我评价")).not.toBeInTheDocument();
		expect(screen.queryByText("可快速学习业务流程。")).not.toBeInTheDocument();
	});

	it("renders the ATS compact and sidebar templates without server rendering", () => {
		const data = structuredClone(sampleResumeData);
		data.summary.content = "<p>这段自我评价不应进入侧栏 Word 模板。</p>";
		data.summary.hidden = false;
		data.summary.title = "个人优势";

		const { rerender } = render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);
		expect(screen.getByText("教育经历")).toBeInTheDocument();

		rerender(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);
		expect(screen.getByText("联系方式")).toBeInTheDocument();
		expect(screen.getByText("核心技能")).toBeInTheDocument();
		expect(screen.getByText("奖项荣誉")).toBeInTheDocument();
		expect(screen.getByText("个人优势")).toBeInTheDocument();
		expect(screen.getByText("这段自我评价不应进入侧栏 Word 模板。")).toBeInTheDocument();
	});

	it("renders every visible ATS compact item instead of applying DOCX slot limits", () => {
		const data = structuredClone(sampleResumeData);
		const firstEducation = data.sections.education.items[0];
		const firstExperience = data.sections.experience.items[0];
		const firstProject = data.sections.projects.items[0];
		const firstSkill = data.sections.skills.items[0];
		if (!firstEducation || !firstExperience || !firstProject || !firstSkill) {
			throw new Error("Expected sample resume data to include template items.");
		}

		data.sections.education.items = [
			{ ...firstEducation, id: "ats-education-1", school: "ATS 第一所学校", hidden: false },
			{ ...firstEducation, id: "ats-education-2", school: "ATS 第二所学校", hidden: false },
		];
		data.sections.experience.items = [
			{ ...firstExperience, id: "ats-experience-1", company: "ATS 第一家公司", hidden: false },
			{ ...firstExperience, id: "ats-experience-2", company: "ATS 第二家公司", hidden: false },
		];
		data.sections.projects.items = [0, 1, 2, 3].map((index) => ({
			...firstProject,
			id: `ats-project-${index + 1}`,
			name: `ATS 项目 ${index + 1}`,
			hidden: false,
		}));
		data.sections.skills.items = [0, 1, 2, 3].map((index) => ({
			...firstSkill,
			id: `ats-skill-${index + 1}`,
			name: `ATS 技能 ${index + 1}`,
			hidden: false,
		}));

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-ats-compact-001")} />);

		expect(screen.getByText("ATS 第一所学校")).toBeInTheDocument();
		expect(screen.getByText("ATS 第二所学校")).toBeInTheDocument();
		expect(screen.getByText("ATS 第一家公司")).toBeInTheDocument();
		expect(screen.getByText("ATS 第二家公司")).toBeInTheDocument();
		expect(screen.getByText("ATS 项目 3")).toBeInTheDocument();
		expect(screen.getByText("ATS 项目 4")).toBeInTheDocument();
		expect(screen.getByText(/ATS 技能 3/)).toBeInTheDocument();
		expect(screen.getByText(/ATS 技能 4/)).toBeInTheDocument();
	});

	it("renders every visible sidebar item instead of applying DOCX slot limits", () => {
		const data = structuredClone(sampleResumeData);
		const firstEducation = data.sections.education.items[0];
		const firstExperience = data.sections.experience.items[0];
		const firstProject = data.sections.projects.items[0];
		const firstSkill = data.sections.skills.items[0];
		if (!firstEducation || !firstExperience || !firstProject || !firstSkill) {
			throw new Error("Expected sample resume data to include template items.");
		}

		data.sections.education.items = [
			{ ...firstEducation, id: "sidebar-education-1", school: "侧栏第一所学校", hidden: false },
			{ ...firstEducation, id: "sidebar-education-2", school: "侧栏第二所学校", hidden: false },
		];
		data.sections.experience.items = [
			{ ...firstExperience, id: "sidebar-experience-1", company: "侧栏第一家公司", hidden: false },
			{ ...firstExperience, id: "sidebar-experience-2", company: "侧栏第二家公司", hidden: false },
		];
		data.sections.projects.items = [0, 1, 2].map((index) => ({
			...firstProject,
			id: `sidebar-project-${index + 1}`,
			name: `Sidebar Project ${index + 1}`,
			hidden: false,
		}));
		data.sections.skills.items = [0, 1, 2, 3].map((index) => ({
			...firstSkill,
			id: `sidebar-skill-${index + 1}`,
			name: `侧栏技能 ${index + 1}`,
			hidden: false,
		}));

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);

		expect(screen.getByText("侧栏第一所学校")).toBeInTheDocument();
		expect(screen.getByText("侧栏第二所学校")).toBeInTheDocument();
		expect(screen.getByText("侧栏第一家公司")).toBeInTheDocument();
		expect(screen.getByText("侧栏第二家公司")).toBeInTheDocument();
		expect(screen.getByText("Sidebar Project 1")).toBeInTheDocument();
		expect(screen.getByText("Sidebar Project 2")).toBeInTheDocument();
		expect(screen.getByText("Sidebar Project 3")).toBeInTheDocument();
		expect(screen.getByText(/侧栏技能 3/)).toBeInTheDocument();
		expect(screen.getByText(/侧栏技能 4/)).toBeInTheDocument();
	});

	it("continues long sidebar template content onto later pages", () => {
		const data = structuredClone(sampleResumeData);
		const firstExperience = data.sections.experience.items[0];
		const firstProject = data.sections.projects.items[0];
		if (!firstExperience || !firstProject) {
			throw new Error("Expected sample resume data to include experience and projects.");
		}

		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["experience", "projects", "awards"],
				sidebar: [],
			},
		];
		data.sections.experience.items = [
			{
				...firstExperience,
				company: "侧栏长经历公司",
				description: Array.from({ length: 36 }, (_, index) => `<p>侧栏经历亮点 ${index + 1}</p>`).join(""),
				hidden: false,
				id: "sidebar-long-experience",
			},
		];
		data.sections.projects.items = [
			{
				...firstProject,
				description: Array.from({ length: 54 }, (_, index) => `<p>侧栏项目亮点 ${index + 1}</p>`).join(""),
				hidden: false,
				id: "sidebar-long-project",
				name: "侧栏长项目",
			},
		];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);

		const pages = document.querySelectorAll("[data-word-template-preview-page]");
		expect(pages.length).toBeGreaterThan(1);
		expect(pages[0]?.textContent).toContain("侧栏长经历公司");
		expect(pages[0]?.textContent).toContain("侧栏经历亮点 1");
		expect([...pages].some((page) => page.textContent?.includes("侧栏项目亮点 54"))).toBe(true);
	});

	it("splits long sidebar awards into usable chunks instead of leaving a title-only page", () => {
		const data = structuredClone(sampleResumeData);
		const firstExperience = data.sections.experience.items[0];
		const firstProject = data.sections.projects.items[0];
		const firstAward = data.sections.awards.items[0];
		if (!firstExperience || !firstProject || !firstAward) {
			throw new Error("Expected sample resume data to include template items.");
		}

		data.summary.hidden = true;
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["experience", "projects", "awards"],
				sidebar: [],
			},
		];
		data.sections.experience.items = [
			{
				...firstExperience,
				description: Array.from({ length: 8 }, (_, index) => `<p>侧栏经历亮点 ${index + 1}</p>`).join(""),
				hidden: false,
				id: "sidebar-awards-experience",
			},
		];
		data.sections.projects.items = [
			{
				...firstProject,
				description: Array.from({ length: 24 }, (_, index) => `<p>侧栏项目亮点 ${index + 1}</p>`).join(""),
				hidden: false,
				id: "sidebar-awards-project",
			},
		];
		data.sections.awards.hidden = false;
		data.sections.awards.items = Array.from({ length: 12 }, (_, index) => ({
			...firstAward,
			date: "2024-2025",
			hidden: false,
			id: `sidebar-award-${index + 1}`,
			title: `区块奖项 ${index + 1}`,
		}));

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);

		const awardPages = [...document.querySelectorAll("[data-word-template-preview-page]")].filter((page) =>
			page.textContent?.includes("奖项荣誉"),
		);
		expect(awardPages.length).toBeGreaterThan(1);
		expect(awardPages[0]?.textContent).toContain("区块奖项 1");
		expect(awardPages.at(-1)?.textContent).toContain("区块奖项 12");

		for (const page of awardPages) {
			expect(page.textContent?.match(/区块奖项/g)?.length ?? 0).toBeGreaterThan(0);
		}
	});

	it("moves sidebar awards to the next page when the current page would only show a tiny opening", () => {
		const data = structuredClone(sampleResumeData);
		const firstExperience = data.sections.experience.items[0];
		const firstProject = data.sections.projects.items[0];
		const firstAward = data.sections.awards.items[0];
		if (!firstExperience || !firstProject || !firstAward) {
			throw new Error("Expected sample resume data to include template items.");
		}

		data.summary.hidden = true;
		data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["experience", "projects", "awards"],
				sidebar: [],
			},
		];
		data.sections.experience.items = [
			{
				...firstExperience,
				description: Array.from({ length: 8 }, (_, index) => `<p>侧栏经历亮点 ${index + 1}</p>`).join(""),
				hidden: false,
				id: "sidebar-awards-orphan-experience",
			},
		];
		data.sections.projects.items = [
			{
				...firstProject,
				description: Array.from({ length: 29 }, (_, index) => `<p>侧栏项目亮点 ${index + 1}</p>`).join(""),
				hidden: false,
				id: "sidebar-awards-orphan-project",
			},
		];
		data.sections.awards.hidden = false;
		data.sections.awards.items = Array.from({ length: 12 }, (_, index) => ({
			...firstAward,
			date: "2024-2025",
			hidden: false,
			id: `sidebar-orphan-award-${index + 1}`,
			title: `过渡奖项 ${index + 1}`,
		}));

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);

		const pages = document.querySelectorAll("[data-word-template-preview-page]");
		expect(pages.length).toBeGreaterThan(1);
		expect(pages[0]?.textContent).not.toContain("奖项荣誉");
		expect(pages[0]?.textContent).not.toContain("过渡奖项 1");
		expect(pages[1]?.textContent).toContain("奖项荣誉");
		expect(pages[1]?.textContent).toContain("过渡奖项 1");
	});

	it("keeps hidden sidebar template items out of the preview", () => {
		const data = structuredClone(sampleResumeData);
		const firstExperience = data.sections.experience.items[0];
		const firstProject = data.sections.projects.items[0];
		const firstAward = data.sections.awards.items[0];
		if (!firstExperience || !firstProject || !firstAward) {
			throw new Error("Expected sample resume data to include template items.");
		}

		data.sections.experience.items = [
			{ ...firstExperience, company: "侧栏可见经历", hidden: false, id: "sidebar-visible-experience" },
			{ ...firstExperience, company: "侧栏隐藏经历", hidden: true, id: "sidebar-hidden-experience" },
		];
		data.sections.projects.items = [
			{ ...firstProject, hidden: false, id: "sidebar-visible-project", name: "侧栏可见项目" },
			{ ...firstProject, hidden: true, id: "sidebar-hidden-project", name: "侧栏隐藏项目" },
		];
		data.sections.awards.hidden = false;
		data.sections.awards.items = [
			{ ...firstAward, hidden: false, id: "sidebar-visible-award", title: "侧栏可见奖项" },
			{ ...firstAward, hidden: true, id: "sidebar-hidden-award", title: "侧栏隐藏奖项" },
		];

		render(<WordTemplateDataPreview data={data} template={getTemplate("zh-sidebar-clean-001")} />);

		expect(screen.getByText("侧栏可见经历")).toBeInTheDocument();
		expect(screen.getByText("侧栏可见项目")).toBeInTheDocument();
		expect(screen.getByText(/侧栏可见奖项/)).toBeInTheDocument();
		expect(screen.queryByText("侧栏隐藏经历")).not.toBeInTheDocument();
		expect(screen.queryByText("侧栏隐藏项目")).not.toBeInTheDocument();
		expect(screen.queryByText(/侧栏隐藏奖项/)).not.toBeInTheDocument();
	});
});
