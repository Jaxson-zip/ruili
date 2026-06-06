// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { Dialog } from "@reactive-resume/ui/components/dialog";
import { useDialogStore } from "@/dialogs/store";
import { onlineStyleTemplateReferences, primaryTemplateIds, templates } from "./data";

const updateResumeData = vi.hoisted(() => vi.fn());

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: { metadata: { template: "ditto" } },
	}),
	useUpdateResumeData: () => updateResumeData,
}));

const { TemplateGalleryDialog } = await import("./gallery");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

afterEach(() => {
	updateResumeData.mockReset();
	window.localStorage.clear();
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null });
});

const renderGallery = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Dialog open>
				<TemplateGalleryDialog />
			</Dialog>
		</I18nProvider>,
	);

describe("TemplateGalleryDialog", () => {
	it("renders the localized title and intro copy", () => {
		renderGallery();
		expect(screen.getByText("模板库")).toBeInTheDocument();
		expect(screen.getByText(/只推荐真实可导出的中文模板/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "导入我的模板（JSON）" })).toBeInTheDocument();
		expect(screen.getByLabelText("搜索模板")).toBeInTheDocument();
	});

	it("renders exportable templates and online styles by default", () => {
		renderGallery();
		const previews = screen.getAllByRole("img");
		expect(previews).toHaveLength(Object.keys(templates).length + onlineStyleTemplateReferences.length);
		expect(screen.getByText("精品可导出模板")).toBeInTheDocument();
		expect(screen.getByText("风格参考（不可直接套用）")).toBeInTheDocument();
		expect(screen.getByText(`${onlineStyleTemplateReferences.length} 个`)).toBeInTheDocument();
		expect(screen.getByRole("img", { name: onlineStyleTemplateReferences[0]?.name })).toBeInTheDocument();
		expect(screen.getAllByText("仅参考")).toHaveLength(onlineStyleTemplateReferences.length);
		expect(screen.queryByText("套用风格")).toBeNull();
		expect(screen.queryByText(/待重做参考/)).toBeNull();
		expect(screen.queryByText(/内部筛选/)).toBeNull();
	});

	it("separates primary templates from the remaining exportable templates", () => {
		renderGallery();

		expect(screen.getByText("精品可导出模板")).toBeInTheDocument();
		expect(screen.getByText("更多可导出模板")).toBeInTheDocument();
		expect(screen.getByText(`${primaryTemplateIds.length} 个`)).toBeInTheDocument();
		expect(screen.getByText(`${Object.keys(templates).length - primaryTemplateIds.length} 个`)).toBeInTheDocument();
	});

	it("filters templates and styles with search", () => {
		renderGallery();
		fireEvent.change(screen.getByLabelText("搜索模板"), { target: { value: "HR" } });

		expect(screen.getByRole("img", { name: "HR 清爽" })).toBeInTheDocument();
		expect(screen.queryByRole("img", { name: "技术侧栏" })).toBeNull();
	});

	it("ring-highlights the currently-selected template tile", () => {
		renderGallery();
		const preview = screen.getByRole("img", { name: "ATS 极简" });
		const card = preview.closest("article") as HTMLElement;
		expect(card.className).toContain("ring-primary");
		expect(screen.getByText("当前")).toBeInTheDocument();
	});

	it("selecting a different template calls updateResumeData with the new template id", () => {
		renderGallery();
		const preview = screen.getByRole("img", { name: "通用一页" });
		const button = preview.closest("button") as HTMLButtonElement;
		fireEvent.click(button);

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof sampleResumeData) => void;
		const draft = structuredClone(sampleResumeData);
		draft.metadata.layout = {
			sidebarWidth: 35,
			pages: [
				{
					fullWidth: false,
					main: ["profiles", "summary", "education", "experience", "projects"],
					sidebar: ["skills", "languages"],
				},
			],
		};

		recipe(draft);
		expect(draft.metadata.template).toBe("onyx");
		expect(draft.metadata.design.colors.primary).toBe(templates.onyx.accentColor);
		expect(draft.metadata.layout.pages[0]?.fullWidth).toBe(true);
		expect(draft.metadata.layout.pages[0]?.sidebar).toEqual([]);
		expect(draft.metadata.layout.pages[0]?.main).toContain("skills");
	});

	it("keeps online style references read-only so static images cannot change the active template", () => {
		renderGallery();
		const reference = onlineStyleTemplateReferences[0];
		if (!reference) throw new Error("Expected at least one online style reference.");

		expect(screen.getByRole("img", { name: reference.name })).toBeInTheDocument();
		expect(screen.queryByLabelText(`套用参考样式：${reference.name}`)).toBeNull();
		expect(updateResumeData).not.toHaveBeenCalled();
	});

	it("hides and restores system templates", () => {
		renderGallery();
		const hideButton = screen.getByLabelText("隐藏精选模板：高管咨询");

		fireEvent.click(hideButton as HTMLButtonElement);

		expect(screen.queryByRole("img", { name: "高管咨询" })).toBeNull();
		expect(screen.getByText("恢复全部")).toBeInTheDocument();

		fireEvent.click(screen.getByText("恢复全部"));

		expect(screen.getByRole("img", { name: "高管咨询" })).toBeInTheDocument();
	});
});
