// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useSectionStore } from "../-store/section";

const resumeData = vi.hoisted(() => ({
	basics: {
		customFields: [] as Array<{ id: string; icon: string; link: string; text: string }>,
		email: "demo@example.com",
		headline: "产品运营实习生",
		location: "深圳",
		name: "林知夏",
		phone: "13800000000",
		website: { label: "", url: "" },
	},
	metadata: {
		layout: {
			sidebarWidth: 30,
			pages: [
				{
					fullWidth: false,
					main: ["summary", "experience", "projects"],
					sidebar: ["profiles", "skills", "education"],
				},
			],
		},
		design: {
			colors: {
				primary: "rgba(74, 111, 125, 1)",
				text: "rgba(17, 24, 39, 1)",
			},
		},
		typography: {
			body: { fontFamily: "Noto Sans SC" },
			heading: { fontFamily: "Noto Sans SC" },
		},
		wordTemplate: { id: null },
	},
	picture: { hidden: true, url: "" },
	sections: {
		awards: {
			items: [{ date: "2024", id: "award-1", title: "校级一等奖" }],
		},
		education: { items: [] },
		experience: { items: [] },
		projects: { items: [] },
		skills: { items: [{ id: "skill-1", keywords: ["Vue 3", "TypeScript"], name: "前端开发" }] },
	},
}));

const resumeMock = vi.hoisted(() => ({
	id: "resume-1",
	data: resumeData,
}));

const updateResumeData = vi.hoisted(() => vi.fn());

vi.mock("@/features/resume/builder/draft", () => ({
	useResume: () => resumeMock,
	useResumeData: () => resumeData,
	useUpdateResumeData: () => updateResumeData,
}));

vi.mock("@/features/resume/preview/preview", () => ({
	ResumePreview: () => <div data-testid="resume-preview-canvas">PDF preview</div>,
}));

vi.mock("@/features/resume/word-template/preview", () => ({
	WordTemplateDataPreview: ({
		onEdit,
		template,
	}: {
		onEdit?: (
			target:
				| { field: "name"; type: "basics" }
				| { field: "date" | "title"; id: string; type: "award" }
				| { icon: string; id: string; type: "customField" }
				| { field: "keywords"; id: string; type: "skill" },
			value: string,
		) => void;
		template?: { id: string };
	}) => (
		<div data-template-id={template?.id} data-testid="word-template-data-preview">
			<button type="button" onClick={() => onEdit?.({ field: "name", type: "basics" }, "王小明")}>
				实时网页模板预览
			</button>
			<button
				type="button"
				data-testid="award-edit"
				onClick={() => onEdit?.({ field: "title", id: "award-1", type: "award" }, "2024 校级特等奖")}
			>
				编辑获奖
			</button>
			<button
				type="button"
				data-testid="award-date-edit"
				onClick={() => onEdit?.({ field: "date", id: "award-1", type: "award" }, "2025")}
			>
				编辑获奖日期
			</button>
			<button
				type="button"
				data-testid="skill-edit"
				onClick={() => onEdit?.({ field: "keywords", id: "skill-1", type: "skill" }, "后端与数据：Flask、MySQL、JWT")}
			>
				编辑技能
			</button>
			<button
				type="button"
				data-testid="custom-field-edit"
				onClick={() => onEdit?.({ icon: "user", id: "zh-internship-gender", type: "customField" }, "女")}
			>
				编辑性别
			</button>
		</div>
	),
}));

const { BuilderClickableResumePreview } = await import("./clickable-preview");
const { setSelectedWordTemplateId } = await import("@/features/resume/word-template/library");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

beforeEach(() => {
	localStorage.clear();
	updateResumeData.mockReset();
	resumeData.basics.name = "林知夏";
	resumeData.basics.customFields = [];

	const award = resumeData.sections.awards.items[0];
	if (award) {
		award.date = "2024";
		award.title = "校级一等奖";
	}

	const skill = resumeData.sections.skills.items[0];
	if (skill) {
		skill.name = "前端开发";
		skill.keywords = ["Vue 3", "TypeScript"];
	}

	useSectionStore.setState({ sections: {}, selectedSection: null, selectionRequestId: 0 });
});

afterEach(() => {
	localStorage.clear();
});

function setPreviewBounds(element: HTMLElement) {
	vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
		x: 0,
		y: 0,
		left: 0,
		top: 0,
		right: 800,
		bottom: 1100,
		width: 800,
		height: 1100,
		toJSON: () => ({}),
	});
}

const renderClickablePreview = () =>
	render(
		<I18nProvider i18n={i18n}>
			<BuilderClickableResumePreview showPageNumbers pageLayout="vertical" />
		</I18nProvider>,
	);

describe("BuilderClickableResumePreview", () => {
	it("does not select a resume section when the user single-clicks the preview", () => {
		renderClickablePreview();
		const previewButton = screen.getByRole("button", { name: "双击简历预览快速编辑" });
		setPreviewBounds(previewButton);

		fireEvent.click(previewButton, { clientX: 500, clientY: 560 });

		expect(useSectionStore.getState().selectedSection).toBeNull();
	});

	it("selects a resume section when the user double-clicks the preview", () => {
		renderClickablePreview();
		const previewButton = screen.getByRole("button", { name: "双击简历预览快速编辑" });
		setPreviewBounds(previewButton);

		fireEvent.doubleClick(previewButton, { clientX: 500, clientY: 560 });

		expect(useSectionStore.getState().selectedSection).toBe("experience");
		expect(useSectionStore.getState().sections.experience?.collapsed).toBe(false);
	});

	it("selects basics from the keyboard shortcut on the preview surface", () => {
		renderClickablePreview();
		const previewButton = screen.getByRole("button", { name: "双击简历预览快速编辑" });

		fireEvent.keyDown(previewButton, { key: "Enter" });

		expect(useSectionStore.getState().selectedSection).toBe("basics");
	});

	it("shows the realtime HTML Word template preview when a Word template is selected", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		renderClickablePreview();

		expect(screen.getByTestId("word-template-data-preview")).toBeInTheDocument();
		expect(screen.getByTestId("word-template-data-preview")).toHaveAttribute("data-template-id", "zh-internship-001");
		expect(screen.getByText("实时网页模板预览")).toBeInTheDocument();
		expect(screen.queryByTestId("resume-preview-canvas")).toBeNull();
	});

	it("commits inline edits from the realtime Word template preview", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		renderClickablePreview();
		fireEvent.click(screen.getByRole("button", { name: "实时网页模板预览" }));

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resumeData) => void;
		recipe(resumeData);
		expect(resumeData.basics.name).toBe("王小明");
	});

	it("commits award edits from the realtime Word template preview", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		renderClickablePreview();
		fireEvent.click(screen.getByTestId("award-edit"));

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resumeData) => void;
		recipe(resumeData);
		expect(resumeData.sections.awards.items[0]?.title).toBe("2024 校级特等奖");
	});

	it("commits award date edits from the realtime Word template preview", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		renderClickablePreview();
		fireEvent.click(screen.getByTestId("award-date-edit"));

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resumeData) => void;
		recipe(resumeData);
		expect(resumeData.sections.awards.items[0]?.date).toBe("2025");
	});

	it("commits skill line edits without duplicating the skill name", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		renderClickablePreview();
		fireEvent.click(screen.getByTestId("skill-edit"));

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resumeData) => void;
		recipe(resumeData);
		expect(resumeData.sections.skills.items[0]?.name).toBe("后端与数据");
		expect(resumeData.sections.skills.items[0]?.keywords).toEqual(["Flask", "MySQL", "JWT"]);
	});

	it("commits Word template custom field edits from the realtime preview", () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");

		renderClickablePreview();
		fireEvent.click(screen.getByTestId("custom-field-edit"));

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resumeData) => void;
		recipe(resumeData);
		expect(resumeData.basics.customFields.find((field) => field.id === "zh-internship-gender")?.text).toBe("女");
		expect(resumeData.basics.customFields.find((field) => field.id === "zh-internship-gender")?.icon).toBe("user");
	});
});
