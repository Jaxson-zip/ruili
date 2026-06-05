// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useSectionStore } from "../-store/section";

const updateResumeData = vi.hoisted(() => vi.fn());
const resume = vi.hoisted(() => ({
	data: {
		basics: {
			name: "张三",
			headline: "前端工程师",
			email: "zhangsan@example.com",
			phone: "13800000000",
			location: "上海",
			website: { url: "https://example.com", label: "" },
			customFields: [],
		},
		summary: {
			title: "个人总结",
			columns: 1,
			hidden: false,
			content: "<p>熟悉 React 与 TypeScript。</p>",
		},
		sections: {
			experience: {
				title: "工作经历",
				columns: 1,
				hidden: false,
				items: [
					{
						id: "exp-1",
						hidden: false,
						company: "旧公司",
						position: "前端工程师",
						location: "上海",
						period: "2023 - 至今",
						website: { url: "", label: "", inlineLink: false },
						roles: [],
						description: "<p>负责前端开发。</p>",
					},
				],
			},
			education: { title: "教育经历", columns: 1, hidden: false, items: [] },
			projects: { title: "项目经历", columns: 1, hidden: false, items: [] },
			skills: { title: "技能清单", columns: 1, hidden: false, items: [] },
		},
	},
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => resume,
	useUpdateResumeData: () => updateResumeData,
}));

vi.mock("@/components/input/rich-input", () => ({
	RichInput: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
		<textarea aria-label="个人总结内容" value={value} onChange={(event) => onChange(event.target.value)} />
	),
}));

const { BuilderQuickEditPanel } = await import("./quick-edit-panel");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

afterEach(() => {
	updateResumeData.mockReset();
	useSectionStore.setState({ sections: {}, selectedSection: null, selectionRequestId: 0 });
});

const renderPanel = () =>
	render(
		<I18nProvider i18n={i18n}>
			<BuilderQuickEditPanel />
		</I18nProvider>,
	);

describe("BuilderQuickEditPanel", () => {
	it("does not render before a supported section is selected", () => {
		renderPanel();
		expect(screen.queryByTestId("builder-quick-edit-panel")).toBeNull();

		useSectionStore.getState().selectSection("template");
		renderPanel();
		expect(screen.queryByTestId("builder-quick-edit-panel")).toBeNull();
	});

	it("edits basics fields through updateResumeData", () => {
		useSectionStore.getState().selectSection("basics");
		renderPanel();

		expect(screen.getByRole("region", { name: "快速编辑：基本信息" })).toBeInTheDocument();
		expect(screen.getByLabelText("姓名")).toHaveValue("张三");

		fireEvent.change(screen.getByLabelText("姓名"), { target: { value: "李四" } });

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resume.data) => void;
		const draft = structuredClone(resume.data);
		recipe(draft);
		expect(draft.basics.name).toBe("李四");
	});

	it("edits summary content through the rich editor", () => {
		useSectionStore.getState().selectSection("summary");
		renderPanel();

		expect(screen.getByRole("region", { name: "快速编辑：个人总结" })).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("个人总结内容"), { target: { value: "<p>新的总结。</p>" } });

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resume.data) => void;
		const draft = structuredClone(resume.data);
		recipe(draft);
		expect(draft.summary.content).toBe("<p>新的总结。</p>");
	});

	it("edits experience fields through updateResumeData", () => {
		useSectionStore.getState().selectSection("experience");
		renderPanel();

		expect(screen.getByRole("region", { name: "快速编辑：工作经历" })).toBeInTheDocument();
		expect(screen.getByLabelText("公司")).toHaveValue("旧公司");

		fireEvent.change(screen.getByLabelText("公司"), { target: { value: "新公司" } });

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof resume.data) => void;
		const draft = structuredClone(resume.data);
		recipe(draft);
		expect(draft.sections.experience.items[0]?.company).toBe("新公司");
	});

	it("closes the panel by clearing the selected section", () => {
		useSectionStore.getState().selectSection("basics");
		renderPanel();

		fireEvent.click(screen.getByLabelText("关闭快速编辑"));

		expect(useSectionStore.getState().selectedSection).toBeNull();
		expect(screen.queryByTestId("builder-quick-edit-panel")).toBeNull();
	});
});
