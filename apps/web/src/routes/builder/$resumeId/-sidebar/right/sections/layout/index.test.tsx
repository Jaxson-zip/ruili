// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";

type SectionBaseProps = {
	children: React.ReactNode;
};

vi.mock("../../shared/section-base", () => ({
	SectionBase: ({ children }: SectionBaseProps) => <div>{children}</div>,
}));

const resumeDataMock = vi.hoisted(() => ({
	current: undefined as unknown as typeof sampleResumeData,
}));

const updateResumeData = vi.hoisted(() =>
	vi.fn((recipe: (draft: typeof sampleResumeData) => void) => {
		recipe(resumeDataMock.current);
	}),
);

function resetResumeDataMock() {
	resumeDataMock.current = structuredClone(sampleResumeData);
	resumeDataMock.current.metadata.layout.pages = [
		{
			fullWidth: true,
			main: ["education", "awards", "experience", "projects", "skills"],
			sidebar: [],
		},
	];
}

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		id: "resume-1",
		data: resumeDataMock.current,
	}),
	useUpdateResumeData: () => updateResumeData,
}));

resetResumeDataMock();

const { LayoutSectionBuilder } = await import("./index");
const { clearSelectedWordTemplateId, setSelectedWordTemplateId } = await import(
	"@/features/resume/word-template/library"
);

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
	it("shows only main-column modules in the sidebar Word template order", () => {
		setSelectedWordTemplateId("resume-1", "zh-sidebar-clean-001");
		resumeDataMock.current.metadata.layout.pages = [
			{
				fullWidth: true,
				main: ["education", "experience", "awards", "projects", "skills"],
				sidebar: [],
			},
		];
		resumeDataMock.current.sections.education.title = "Education Side";
		resumeDataMock.current.sections.experience.title = "Work Main";
		resumeDataMock.current.sections.projects.title = "Project Main";
		resumeDataMock.current.sections.awards.title = "Awards Main";
		resumeDataMock.current.sections.skills.title = "Skills Side";
		resumeDataMock.current.sections.skills.hidden = false;

		renderLayout();

		const experience = screen.getByText("Work Main");
		const projects = screen.getByText("Project Main");
		const awards = screen.getByText("Awards Main");

		expect(experience.compareDocumentPosition(projects) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(projects.compareDocumentPosition(awards) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(screen.queryByText("Education Side")).toBeNull();
		expect(screen.queryByText("Skills Side")).toBeNull();
	});
});

afterEach(() => {
	localStorage.clear();
	clearSelectedWordTemplateId("resume-1");
	updateResumeData.mockClear();
	resetResumeDataMock();
});

const renderLayout = () =>
	render(
		<I18nProvider i18n={i18n}>
			<LayoutSectionBuilder />
		</I18nProvider>,
	);

describe("LayoutSectionBuilder", () => {
	it("shows a focused Word layout panel when a Word template is selected", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		renderLayout();

		expect(screen.getByRole("heading", { name: "Word 模板模块顺序" })).toBeInTheDocument();
		expect(screen.getByText("当前模板")).toBeInTheDocument();
		expect(screen.queryByText("侧栏宽度")).toBeNull();
		expect(screen.queryByRole("button", { name: "添加页面" })).toBeNull();
	});

	it("shows only filled supported Word modules with drag handles", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		resumeDataMock.current.summary.content = "";
		resumeDataMock.current.sections.languages.items = [];
		resumeDataMock.current.sections.interests.items = [];
		resumeDataMock.current.sections.certifications.items = [];
		resumeDataMock.current.sections.publications.items = [];
		resumeDataMock.current.sections.volunteer.items = [];
		resumeDataMock.current.sections.references.items = [];
		resumeDataMock.current.sections.profiles.items = [];

		renderLayout();

		expect(screen.getByText("教育经历")).toBeInTheDocument();
		expect(screen.getByText("奖项荣誉")).toBeInTheDocument();
		expect(screen.getByText("工作经历")).toBeInTheDocument();
		expect(screen.getByText("项目经历")).toBeInTheDocument();
		expect(screen.queryByText("技能")).toBeNull();
		expect(screen.queryByText("个人总结")).toBeNull();
		expect(screen.queryByText("语言能力")).toBeNull();
		expect(screen.queryByText("兴趣爱好")).toBeNull();
		expect(screen.queryByText("证书认证")).toBeNull();
		expect(screen.queryByText("发表作品")).toBeNull();
		expect(screen.queryByText("志愿经历")).toBeNull();
		expect(screen.queryByText("推荐人")).toBeNull();
		expect(screen.queryByText("个人链接")).toBeNull();
		expect(screen.getByLabelText("拖拽排序 教育经历")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "下移 教育经历" })).toBeNull();
	});

	it("hides filled Word modules from layout when the whole section is hidden", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		resumeDataMock.current.sections.awards.title = "Hidden Awards Section";
		resumeDataMock.current.sections.awards.hidden = true;

		renderLayout();

		expect(screen.queryByText("Hidden Awards Section")).toBeNull();
		expect(screen.queryByLabelText("拖拽排序 Hidden Awards Section")).toBeNull();
	});

	it("hides filled sections that the selected Word template does not render", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		resumeDataMock.current.sections.languages.items = [
			{ id: "language-1", hidden: false, language: "英语", fluency: "CET-4", level: 3 },
		];

		renderLayout();

		expect(screen.queryByText("语言能力")).toBeNull();
		expect(screen.queryByLabelText("拖拽排序 语言能力")).toBeNull();
	});
});
