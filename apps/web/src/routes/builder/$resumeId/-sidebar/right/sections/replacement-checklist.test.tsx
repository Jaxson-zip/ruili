// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useSectionStore } from "../../../-store/section";

const resume = vi.hoisted(() => ({
	id: "resume-1",
	data: {
		metadata: {
			layout: {
				pages: [
					{
						fullWidth: true,
						main: ["education", "awards", "experience", "projects", "skills"],
						sidebar: [],
					},
				],
			},
		},
		basics: {
			name: "陈嘉铭",
			headline: "前端开发工程师",
			customFields: [],
		},
		picture: { url: "" },
		summary: {
			content: "<p>熟悉 React。</p>",
			hidden: false,
		},
		sections: {
			experience: {
				items: [
					{ id: "exp-1", hidden: false, company: "云澜数据", position: "数据运营实习生" },
					{ id: "exp-2", hidden: false, company: "星河科技", position: "测试实习生" },
				],
			},
			education: { items: [{ id: "edu-1", hidden: false, school: "示例大学", area: "软件工程" }] },
			awards: { hidden: false, items: [{ id: "award-1", hidden: false, title: "校级优秀项目" }] },
			projects: { items: [{ id: "project-1", hidden: false, name: "校园数据治理平台" }] },
			skills: {
				items: [
					{ id: "skill-1", hidden: false, name: "前端开发" },
					{ id: "skill-2", hidden: false, name: "后端与数据" },
					{ id: "skill-3", hidden: false, name: "AI 与工程" },
				],
			},
			languages: { items: [] },
			interests: { items: [] },
			certifications: { items: [] },
			publications: { items: [] },
			volunteer: { items: [] },
			references: { items: [] },
			profiles: { items: [] },
		},
	},
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => resume,
}));

const { ReplacementChecklistSection } = await import("./replacement-checklist");
const { clearSelectedWordTemplateId, setSelectedWordTemplateId } = await import(
	"@/features/resume/word-template/library"
);

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

afterEach(() => {
	useSectionStore.setState({ sections: {}, selectedSection: null, selectionRequestId: 0 });
	clearSelectedWordTemplateId("resume-1");
	resume.data.metadata.layout.pages = [
		{
			fullWidth: true,
			main: ["education", "awards", "experience", "projects", "skills"],
			sidebar: [],
		},
	];
	resume.data.summary.content = "<p>熟悉 React。</p>";
	resume.data.summary.hidden = false;
	resume.data.sections.awards.hidden = false;
	resume.data.sections.languages.items = [];
});

const renderChecklist = () =>
	render(
		<I18nProvider i18n={i18n}>
			<ReplacementChecklistSection />
		</I18nProvider>,
	);

describe("ReplacementChecklistSection", () => {
	it("renders content check items with completion status", () => {
		renderChecklist();

		expect(screen.getByRole("region", { name: "内容检查" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /基本信息/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /工作经历/ })).toHaveTextContent("2 项");
		expect(screen.getByRole("button", { name: /技能清单/ })).toHaveTextContent("3 项");
	});

	it("selects the quick edit section when clicked", () => {
		renderChecklist();

		fireEvent.click(screen.getByRole("button", { name: /项目经历/ }));

		expect(useSectionStore.getState().selectedSection).toBe("projects");
	});

	it("switches to template module checks for Word template resumes", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		resume.data.summary.content = "";

		renderChecklist();

		expect(screen.getByRole("region", { name: "模板模块检查" })).toBeInTheDocument();
		expect(
			screen.getByText("只显示当前 Word 模板支持、会进入预览和导出的模块。未填写的模块不会强行占位。"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /基本信息/ })).toHaveTextContent("模板头部");
		expect(screen.getByRole("button", { name: /奖项荣誉/ })).toHaveTextContent("1 项内容");
		expect(screen.queryByRole("button", { name: /个人总结/ })).toBeNull();
	});

	it("does not advertise filled modules that the selected Word template does not render", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		resume.data.sections.languages.items = [
			{ id: "language-1", hidden: false, language: "英语", fluency: "CET-4", level: 3 },
		] as never;

		renderChecklist();

		expect(
			screen.getByText("只显示当前 Word 模板支持、会进入预览和导出的模块。未填写的模块不会强行占位。"),
		).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /语言能力/ })).toBeNull();
	});

	it("does not advertise hidden Word template modules that still contain items", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		resume.data.sections.awards.hidden = true;

		renderChecklist();

		expect(screen.queryByRole("button", { name: /获奖荣誉/ })).toBeNull();
	});

	it("lists sidebar template summary and modules in the actual template order", () => {
		setSelectedWordTemplateId("resume-1", "zh-sidebar-clean-001");
		resume.data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["awards", "projects", "experience", "skills", "education"],
				sidebar: [],
			},
		];

		renderChecklist();

		const buttonTexts = screen.getAllByRole("button").map((button) => button.textContent ?? "");
		const orderedLabels = ["基本信息", "个人优势", "教育经历", "技能", "工作经历", "项目经历", "奖项荣誉"];

		for (const label of orderedLabels) {
			expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
		}

		const indices = orderedLabels.map((label) => buttonTexts.findIndex((text) => text.includes(label)));
		expect(indices).toEqual([...indices].sort((a, b) => a - b));
	});

	it("keeps ATS checklist in its fixed single-column template order", () => {
		setSelectedWordTemplateId("resume-1", "zh-ats-compact-001");
		resume.data.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["awards", "skills", "projects", "experience", "education"],
				sidebar: [],
			},
		];

		renderChecklist();

		const buttonTexts = screen.getAllByRole("button").map((button) => button.textContent ?? "");
		const orderedLabels = ["基本信息", "教育经历", "工作经历", "项目经历", "奖项荣誉", "技能"];
		const indices = orderedLabels.map((label) => buttonTexts.findIndex((text) => text.includes(label)));

		expect(indices).toEqual([...indices].sort((a, b) => a - b));
	});
});
