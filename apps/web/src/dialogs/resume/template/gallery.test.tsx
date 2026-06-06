// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { Dialog } from "@reactive-resume/ui/components/dialog";
import { useDialogStore } from "@/dialogs/store";
import { primaryTemplateIds, templates } from "./data";

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
		expect(screen.getByText(/这里展示的模板都可以直接切换并导出 PDF/)).toBeInTheDocument();
		expect(screen.getByText("Word 模板保留原样式")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "导入排版预设（仅 JSON）" })).toBeInTheDocument();
		expect(screen.getByLabelText("搜索模板")).toBeInTheDocument();
	});

	it("renders only exportable templates by default", () => {
		renderGallery();
		const previews = screen.getAllByRole("img");
		expect(previews).toHaveLength(Object.keys(templates).length);
		expect(screen.getByText("精品可导出模板")).toBeInTheDocument();
		expect(screen.queryByText("外部模板参考（待制作）")).toBeNull();
		expect(screen.queryByText("线上风格灵感（仅参考）")).toBeNull();
		expect(screen.getByRole("img", { name: "蓝色块面" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "深灰橙色" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "蓝色二维码栏" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "套用相近版式：001 蓝色时间轴" })).toBeNull();
		expect(screen.queryByText("仅参考")).toBeNull();
		expect(screen.queryByText(/待重做参考/)).toBeNull();
		expect(screen.queryByText(/内部筛选/)).toBeNull();
	});

	it("separates primary templates from the remaining exportable templates", () => {
		renderGallery();

		expect(screen.getByText("精品可导出模板")).toBeInTheDocument();
		expect(screen.getByText("更多可导出模板")).toBeInTheDocument();
		expect(screen.getAllByText(`${primaryTemplateIds.length} 个`).length).toBeGreaterThan(0);
		expect(screen.getByText(`${Object.keys(templates).length - primaryTemplateIds.length} 个`)).toBeInTheDocument();
	});

	it("filters templates and styles with search", () => {
		renderGallery();
		fireEvent.change(screen.getByLabelText("搜索模板"), { target: { value: "ATS" } });

		expect(screen.getByRole("img", { name: "ATS 极简" })).toBeInTheDocument();
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

	it("lets promoted collection references change the active template", () => {
		renderGallery();
		const preview = screen.getByRole("img", { name: "蓝色二维码栏" });
		const button = preview.closest("button") as HTMLButtonElement;
		fireEvent.click(button);

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof sampleResumeData) => void;
		const draft = structuredClone(sampleResumeData);
		recipe(draft);
		expect(draft.metadata.template).toBe("collection028");
		expect(draft.metadata.design.colors.primary).toBe(templates.collection028.accentColor);
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
