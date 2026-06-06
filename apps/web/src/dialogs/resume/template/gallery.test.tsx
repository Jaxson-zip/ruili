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
		data: { metadata: { template: "collection001" } },
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
		expect(screen.getByText(/选择一套适合岗位的中文模板/)).toBeInTheDocument();
		expect(screen.queryByText("Word 模板保留原样式")).toBeNull();
		expect(screen.queryByRole("button", { name: "导入排版预设（仅 JSON）" })).toBeNull();
		expect(screen.getByLabelText("搜索模板")).toBeInTheDocument();
	});

	it("renders only exportable templates by default", () => {
		renderGallery();
		const previews = screen.getAllByRole("img");
		expect(previews).toHaveLength(primaryTemplateIds.length);
		expect(screen.getByText("中文简历模板")).toBeInTheDocument();
		expect(screen.queryByText("外部模板参考（待制作）")).toBeNull();
		expect(screen.queryByText("线上风格灵感（仅参考）")).toBeNull();
		expect(screen.getByRole("img", { name: "蓝色作品入口" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "蓝色块面" })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "深灰橙色" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "套用相近版式：001 蓝色时间轴" })).toBeNull();
		expect(screen.queryByText("仅参考")).toBeNull();
		expect(screen.queryByText(/待重做参考/)).toBeNull();
		expect(screen.queryByText(/内部筛选/)).toBeNull();
		expect(screen.queryByText("隐藏")).toBeNull();
	});

	it("renders audience, style tags, and recommendation copy on template cards", () => {
		renderGallery();

		const card = screen.getByRole("img", { name: "蓝色时间轴" }).closest("article") as HTMLElement;

		expect(card).toHaveTextContent("适合技术、产品、运营的稳重一页投递");
		expect(card).toHaveTextContent("时间轴");
		expect(card).toHaveTextContent("稳重");
		expect(card).toHaveTextContent("参考传统中文招聘模板");
	});

	it("keeps the launch gallery focused on real exportable templates", () => {
		renderGallery();

		expect(screen.getByText("中文简历模板")).toBeInTheDocument();
		expect(screen.queryByText(/预览图对应实际 PDF 导出效果/)).toBeNull();
		expect(screen.getByText(/以编辑器预览和导出结果为准/)).toBeInTheDocument();
		expect(screen.getAllByText(`${primaryTemplateIds.length} 个`).length).toBeGreaterThan(0);
		expect(screen.queryByText("更多可导出模板")).toBeNull();
		expect(screen.getByRole("img", { name: "深灰蓝栏" })).toBeInTheDocument();
	});

	it("filters templates and styles with search", () => {
		renderGallery();
		fireEvent.change(screen.getByLabelText("搜索模板"), { target: { value: "正式" } });

		expect(screen.getByRole("img", { name: "灰色信息栏" })).toBeInTheDocument();
		expect(screen.queryByRole("img", { name: "深蓝侧栏" })).toBeNull();
	});

	it("ring-highlights the currently-selected template tile", () => {
		renderGallery();
		const preview = screen.getByRole("img", { name: "蓝色时间轴" });
		const card = preview.closest("article") as HTMLElement;
		expect(card.className).toContain("ring-primary");
		expect(screen.getByText("当前")).toBeInTheDocument();
	});

	it("selecting a different template calls updateResumeData with the new template id", () => {
		renderGallery();
		const preview = screen.getByRole("img", { name: "深蓝侧栏" });
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
		expect(draft.metadata.template).toBe("collection005");
		expect(draft.metadata.design.colors.primary).toBe(templates.collection005.accentColor);
		expect(draft.metadata.layout.pages[0]?.fullWidth).toBe(false);
		expect(draft.metadata.layout.pages[0]?.sidebar.length).toBeGreaterThan(0);
		expect(draft.metadata.layout.pages[0]?.sidebar).toContain("skills");
	});

	it("switches horizontal collection templates back to a full-width layout", () => {
		renderGallery();
		const preview = screen.getByRole("img", { name: "深蓝横栏" });
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
					main: ["summary", "experience", "projects"],
					sidebar: ["profiles", "skills", "education"],
				},
			],
		};

		recipe(draft);
		expect(draft.metadata.template).toBe("collection003");
		expect(draft.metadata.layout.pages[0]?.fullWidth).toBe(true);
		expect(draft.metadata.layout.pages[0]?.sidebar).toEqual([]);
	});

	it("lets promoted collection references change the active template", () => {
		renderGallery();
		const preview = screen.getByRole("img", { name: "蓝色作品入口" });
		const button = preview.closest("button") as HTMLButtonElement;
		fireEvent.click(button);

		expect(updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = updateResumeData.mock.calls[0]?.[0] as (draft: typeof sampleResumeData) => void;
		const draft = structuredClone(sampleResumeData);
		recipe(draft);
		expect(draft.metadata.template).toBe("collection028");
		expect(draft.metadata.design.colors.primary).toBe(templates.collection028.accentColor);
	});

	it("does not expose system template management controls to end users", () => {
		renderGallery();

		expect(screen.getByRole("img", { name: "金色商务" })).toBeInTheDocument();
		expect(screen.queryByLabelText("隐藏精选模板：金色商务")).toBeNull();
		expect(screen.queryByText("恢复全部")).toBeNull();
	});
});
