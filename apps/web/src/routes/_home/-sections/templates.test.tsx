// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { featuredTemplateIds, templates as systemTemplates } from "@/dialogs/resume/template/data";
import { Templates } from "./templates";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

const renderTemplates = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Templates />
		</I18nProvider>,
	);

describe("Templates section", () => {
	it("shows only real exportable templates on the homepage", () => {
		renderTemplates();

		expect(screen.getByText("中文简历模板与风格")).toBeInTheDocument();
		expect(screen.getByText(/精选真实可导出的中文模板/)).toBeInTheDocument();
		expect(screen.getByText(/优先展示更接近中文招聘习惯的版式/)).toBeInTheDocument();

		for (const template of featuredTemplateIds) {
			const name = systemTemplates[template].name;
			expect(screen.getAllByAltText(name).length).toBeGreaterThan(0);
		}

		const firstPreview = screen.getAllByRole("img")[0];
		expect(firstPreview).toHaveAttribute("alt", "蓝色时间轴");
		expect(screen.getAllByText("可导出 PDF").length).toBeGreaterThan(0);
		expect(screen.queryByText("参考样式")).toBeNull();
		expect(screen.queryByText("仅参考")).toBeNull();
		expect(screen.queryByText("可套用相近版式")).toBeNull();

		const exportableImageUrls = featuredTemplateIds.map((template) => systemTemplates[template].imageUrl);
		expect(new Set(exportableImageUrls).size).toBe(exportableImageUrls.length);

		for (const template of ["collection019", "collection026", "collection028"] as const) {
			expect(screen.getAllByAltText(systemTemplates[template].name).length).toBeGreaterThan(0);
		}
	});
});
