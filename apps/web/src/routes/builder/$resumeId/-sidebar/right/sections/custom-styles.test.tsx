// @vitest-environment happy-dom

import type { StyleRule } from "@reactive-resume/schema/resume/data";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { isValidElement } from "react";

const updateResumeData = vi.hoisted(() => vi.fn());
const styleRules = vi.hoisted<StyleRule[]>(() => [
	{
		id: "style-global-heading",
		label: "所有章节: 章节标题",
		enabled: true,
		target: { scope: "global" },
		slots: { heading: { color: "rgba(220, 38, 38, 1)" } },
	},
]);

type SectionBaseProps = {
	children: React.ReactNode;
};

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: SectionBaseProps) => <div>{children}</div>,
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: {
			metadata: { styleRules },
			sections: {
				experience: { title: "Experience" },
				skills: { title: "Skills" },
			},
			customSections: [{ id: "custom-1", title: "Open Source", type: "projects" }],
		},
	}),
	useUpdateResumeData: () => updateResumeData,
}));

const { CustomStylesSectionBuilder } = await import("./custom-styles");
const { getSectionIcon, getSectionTitle } = await import("@/libs/resume/section");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	updateResumeData.mockClear();
});

const renderCustomStyles = () =>
	render(
		<I18nProvider i18n={i18n}>
			<CustomStylesSectionBuilder />
		</I18nProvider>,
	);

const chooseComboboxOption = async (label: string, option: string) => {
	fireEvent.click(screen.getByLabelText(label));
	fireEvent.click(await screen.findByRole("option", { name: option }));
};

describe("CustomStylesSectionBuilder", () => {
	beforeEach(() => {
		styleRules.splice(0, styleRules.length);
		styleRules.push({
			id: "style-global-heading",
			label: "所有章节: 章节标题",
			enabled: true,
			target: { scope: "global" },
			slots: { heading: { color: "rgba(220, 38, 38, 1)" } },
		});
	});

	it("renders structured style rule controls", async () => {
		renderCustomStyles();

		expect(screen.getByLabelText("目标范围")).toBeInTheDocument();
		expect(screen.getByLabelText("样式槽")).toBeInTheDocument();
		expect(screen.getByLabelText("文本颜色")).toBeInTheDocument();
		expect(screen.getByLabelText("文本颜色").parentElement).toHaveClass("gap-3");
		expect(screen.getByLabelText("文本颜色").parentElement?.parentElement?.parentElement).toHaveClass(
			"grid-cols-1",
			"@min-[20rem]:grid-cols-2",
			"@min-[35rem]:grid-cols-4",
		);
		expect(screen.getByLabelText("文本颜色").parentElement?.parentElement?.parentElement).not.toHaveClass(
			"grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]",
		);
		expect(screen.getByLabelText("装饰线颜色")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "颜色" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "文本" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "间距" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "边框" })).toBeInTheDocument();
		expect(screen.getByLabelText("字体样式")).toBeInTheDocument();
		expect(screen.getByLabelText("行高")).toBeInTheDocument();
		expect(screen.getByLabelText("字距")).toBeInTheDocument();
		expect(screen.getByLabelText("文本装饰")).toBeInTheDocument();
		expect(screen.getByLabelText("装饰线样式")).toBeInTheDocument();
		expect(screen.getByLabelText("对齐方式")).toBeInTheDocument();
		expect(screen.getByLabelText("大小写转换")).toBeInTheDocument();
		expect(screen.getByLabelText("透明度")).toBeInTheDocument();
		expect(screen.getByText("内边距")).toBeInTheDocument();
		expect(screen.getByLabelText("外边距上")).toBeInTheDocument();
		expect(screen.getByLabelText("外边距右")).toBeInTheDocument();
		expect(screen.getByLabelText("外边距下")).toBeInTheDocument();
		expect(screen.getByLabelText("外边距左")).toBeInTheDocument();
		expect(screen.getByLabelText("行间距")).toBeInTheDocument();
		expect(screen.getByLabelText("列间距")).toBeInTheDocument();
		expect(screen.getByLabelText("边框样式")).toBeInTheDocument();
		expect(screen.getByLabelText("边框宽度").parentElement?.parentElement).toHaveClass(
			"grid-cols-1",
			"@min-[20rem]:grid-cols-2",
			"@min-[35rem]:grid-cols-4",
		);
		fireEvent.click(screen.getByLabelText("样式槽"));
		expect(await screen.findByText("章节")).toBeInTheDocument();
		expect(screen.getByText("富文本")).toBeInTheDocument();
		expect(await screen.findByRole("option", { name: "章节标题" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "列表" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "列表项内容" })).toBeInTheDocument();
		expect(screen.queryByRole("option", { name: "Bullet or number" })).not.toBeInTheDocument();
	});

	it("labels the empty font weight option as default", () => {
		renderCustomStyles();

		expect(screen.getByLabelText("字重")).toHaveTextContent("默认");
		expect(screen.queryByText("Template default")).not.toBeInTheDocument();
	});

	it("renames the sidebar entry and uses a distinct icon from design", () => {
		const designIcon = getSectionIcon("design");
		const stylesIcon = getSectionIcon("styles");

		expect(getSectionTitle("styles")).toBe("Custom Styles");
		expect(isValidElement(designIcon)).toBe(true);
		expect(isValidElement(stylesIcon)).toBe(true);
		expect(isValidElement(designIcon) && isValidElement(stylesIcon) && designIcon.type !== stylesIcon.type).toBe(true);
	});

	it("upserts one style rule for the selected target and slot", () => {
		styleRules.splice(0, styleRules.length);
		renderCustomStyles();

		fireEvent.change(screen.getByLabelText("文本颜色"), { target: { value: "rgba(220, 38, 38, 1)" } });

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: { metadata: { styleRules: unknown[] } }) => void;
		const draft = { metadata: { styleRules: [] } };
		recipe(draft);

		expect(draft.metadata.styleRules).toEqual([
			{
				id: "style-global-heading",
				label: "所有章节: 章节标题",
				enabled: true,
				target: { scope: "global" },
				slots: { heading: { color: "rgba(220, 38, 38, 1)" } },
			},
		]);
	});

	it("stores padding as per-side values", () => {
		styleRules.splice(0, styleRules.length);
		renderCustomStyles();

		expect(screen.getByText("内边距")).toBeInTheDocument();
		expect(screen.getByText("内边距")).toHaveClass("shrink-0");
		expect(screen.getByText("内边距").parentElement).toHaveClass("flex");
		expect(screen.queryByText("内边距上")).not.toBeInTheDocument();
		expect(screen.getByLabelText("内边距上")).toBeInTheDocument();
		expect(screen.getByLabelText("内边距右")).toBeInTheDocument();
		expect(screen.getByLabelText("内边距下")).toBeInTheDocument();
		expect(screen.getByLabelText("内边距左")).toBeInTheDocument();
		expect(screen.getByLabelText("内边距上")).toHaveAttribute("placeholder", "上");
		expect(screen.getByLabelText("内边距右")).toHaveClass("text-center", "tabular-nums");

		fireEvent.change(screen.getByLabelText("内边距上"), { target: { value: "12" } });

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: { metadata: { styleRules: unknown[] } }) => void;
		const draft = { metadata: { styleRules: [] } };
		recipe(draft);

		expect(draft.metadata.styleRules).toEqual([
			{
				id: "style-global-heading",
				label: "所有章节: 章节标题",
				enabled: true,
				target: { scope: "global" },
				slots: { heading: { paddingTop: 12 } },
			},
		]);
	});

	it("stores text decoration intent", async () => {
		styleRules.splice(0, styleRules.length);
		renderCustomStyles();

		await chooseComboboxOption("文本装饰", "下划线");

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: { metadata: { styleRules: unknown[] } }) => void;
		const draft = { metadata: { styleRules: [] } };
		recipe(draft);

		expect(draft.metadata.styleRules).toEqual([
			{
				id: "style-global-heading",
				label: "所有章节: 章节标题",
				enabled: true,
				target: { scope: "global" },
				slots: { heading: { textDecoration: "underline" } },
			},
		]);
	});

	it("stores margin and gap intent", () => {
		styleRules.splice(0, styleRules.length);
		renderCustomStyles();

		expect(screen.getByText("外边距")).toBeInTheDocument();
		expect(screen.getByText("外边距")).toHaveClass("shrink-0");
		expect(screen.queryByText("外边距下")).not.toBeInTheDocument();
		expect(screen.getByLabelText("外边距下")).toHaveAttribute("min", "-72");
		expect(screen.getByLabelText("外边距下")).toHaveAttribute("placeholder", "下");
		expect(screen.getByText("间隔")).toBeInTheDocument();
		expect(screen.queryByText("行间距")).not.toBeInTheDocument();
		expect(screen.getByLabelText("行间距")).toHaveAttribute("min", "-72");
		expect(screen.getByLabelText("行间距")).toHaveAttribute("placeholder", "行");

		fireEvent.change(screen.getByLabelText("外边距下"), { target: { value: "-10" } });
		fireEvent.change(screen.getByLabelText("行间距"), { target: { value: "-6" } });

		expect(updateResumeData).toHaveBeenCalledTimes(2);

		const marginRecipe = updateResumeData.mock.calls[0]?.[0] as (draft: {
			metadata: { styleRules: unknown[] };
		}) => void;
		const marginDraft = { metadata: { styleRules: [] } };
		marginRecipe(marginDraft);

		expect(marginDraft.metadata.styleRules).toEqual([
			{
				id: "style-global-heading",
				label: "所有章节: 章节标题",
				enabled: true,
				target: { scope: "global" },
				slots: { heading: { marginBottom: -10 } },
			},
		]);

		const gapRecipe = updateResumeData.mock.calls[1]?.[0] as (draft: { metadata: { styleRules: unknown[] } }) => void;
		const gapDraft = { metadata: { styleRules: [] } };
		gapRecipe(gapDraft);

		expect(gapDraft.metadata.styleRules).toEqual([
			{
				id: "style-global-heading",
				label: "所有章节: 章节标题",
				enabled: true,
				target: { scope: "global" },
				slots: { heading: { rowGap: -6 } },
			},
		]);
	});

	it("stores list slot rules for rich text lists", async () => {
		styleRules.splice(0, styleRules.length);
		renderCustomStyles();

		await chooseComboboxOption("样式槽", "列表");
		fireEvent.change(screen.getByLabelText("行间距"), { target: { value: "8" } });

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: { metadata: { styleRules: unknown[] } }) => void;
		const draft = { metadata: { styleRules: [] } };
		recipe(draft);

		expect(draft.metadata.styleRules).toEqual([
			{
				id: "style-global-richList",
				label: "所有章节: 列表",
				enabled: true,
				target: { scope: "global" },
				slots: { richList: { rowGap: 8 } },
			},
		]);
	});

	it("can reset the selected style rule", () => {
		renderCustomStyles();

		fireEvent.click(screen.getByRole("button", { name: "重置样式" }));

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: {
			metadata: { styleRules: { id: string }[] };
		}) => void;
		const draft = {
			metadata: {
				styleRules: [
					{
						id: "style-global-heading",
						label: "所有章节: 章节标题",
						enabled: true,
						target: { scope: "global" },
						slots: { heading: { color: "rgba(0, 0, 0, 1)" } },
					},
					{
						id: "style-global-section",
						label: "所有章节: 章节容器",
						enabled: true,
						target: { scope: "global" },
						slots: { section: { padding: 4 } },
					},
				],
			},
		};
		recipe(draft);

		expect(draft.metadata.styleRules.map((rule) => rule.id)).toEqual(["style-global-section"]);
	});

	it("lists applied style rules and toggles individual rules", () => {
		styleRules.push({
			id: "style-global-section",
			label: "所有章节: 章节容器",
			enabled: false,
			target: { scope: "global" },
			slots: { section: { paddingTop: 4 } },
		});
		renderCustomStyles();

		expect(screen.getByText("已应用规则")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "管理规则" })).not.toBeInTheDocument();
		expect(screen.queryByText("所有章节: 章节标题")).not.toBeInTheDocument();
		expect(screen.queryByText("Off")).not.toBeInTheDocument();
		expect(screen.getAllByText("所有章节").length).toBeGreaterThan(0);
		expect(screen.getAllByText("章节标题").length).toBeGreaterThan(0);
		expect(screen.queryByRole("switch")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "启用 所有章节: 章节容器" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "停用 所有章节: 章节标题" }));

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: {
			metadata: { styleRules: { id: string; enabled: boolean }[] };
		}) => void;
		const draft = { metadata: { styleRules: [{ id: "style-global-heading", enabled: true }] } };
		recipe(draft);

		expect(draft.metadata.styleRules[0]?.enabled).toBe(false);
	});

	it("loads a selected applied rule into the editor form", () => {
		styleRules.push({
			id: "style-section-type-experience-richListItemContent",
			label: "Experience: List item content",
			enabled: true,
			target: { scope: "sectionType", sectionType: "experience" },
			slots: { richListItemContent: { lineHeight: 1.4 } },
		});
		renderCustomStyles();

		fireEvent.click(screen.getByRole("button", { name: "编辑 Experience: 列表项内容" }));

		expect(screen.getByLabelText("目标范围")).toHaveTextContent("章节类型");
		expect(screen.getByLabelText("章节类型")).toHaveTextContent("Experience");
		expect(screen.getByLabelText("样式槽")).toHaveTextContent("列表项内容");
		expect(screen.getByLabelText("行高")).toHaveValue(1.4);
	});
});
