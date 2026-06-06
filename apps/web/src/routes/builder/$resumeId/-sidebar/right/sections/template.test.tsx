// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { primaryTemplateIds } from "@/dialogs/resume/template/data";
import { useDialogStore } from "@/dialogs/store";

type SectionBaseProps = {
	children: React.ReactNode;
};

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: SectionBaseProps) => <div>{children}</div>,
}));
vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({
		data: { metadata: { template: "ditto" } },
	}),
}));

const { TemplateSectionBuilder } = await import("./template");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

afterEach(() => {
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null });
});

const renderTemplate = () =>
	render(
		<I18nProvider i18n={i18n}>
			<TemplateSectionBuilder />
		</I18nProvider>,
	);

describe("TemplateSectionBuilder", () => {
	it("renders the current template's display name", () => {
		renderTemplate();
		expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("ATS 极简");
	});

	it("renders the template tags as badges", () => {
		renderTemplate();
		expect(screen.getByText("ATS 友好")).toBeInTheDocument();
	});

	it("explains that template switching keeps the current resume content", () => {
		renderTemplate();

		expect(screen.getByText("当前模板")).toBeInTheDocument();
		expect(screen.getByText(`${primaryTemplateIds.length} 套可选`)).toBeInTheDocument();
		expect(screen.getByText("切换模板只调整版式、颜色和布局，正文内容会保留。")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "浏览全部中文模板" })).toBeInTheDocument();
	});

	it("opens the template gallery dialog when the preview is clicked", () => {
		renderTemplate();

		const preview = screen.getByRole("img", { name: "ATS 极简" }).closest("button") as HTMLButtonElement;
		fireEvent.click(preview);

		const state = useDialogStore.getState();
		expect(state.open).toBe(true);
		expect(state.activeDialog?.type).toBe("resume.template.gallery");
	});

	it("renders the Chinese thumbnail preview", () => {
		renderTemplate();
		expect(screen.getByRole("img", { name: "ATS 极简" })).toBeInTheDocument();
	});
});
