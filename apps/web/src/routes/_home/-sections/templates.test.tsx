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
		expect(screen.getByText(/按中文投递场景挑选稳重、侧栏和项目型版式/)).toBeInTheDocument();
		expect(screen.getByText(/滚动预览真实可导出的模板/)).toBeInTheDocument();
		expect(screen.getByText("稳重一页")).toBeInTheDocument();
		expect(screen.getByText("时间轴、单栏与正式投递")).toBeInTheDocument();
		expect(screen.getByText("侧栏信息")).toBeInTheDocument();
		expect(screen.getByText("技能、作品入口与项目经历")).toBeInTheDocument();

		for (const template of featuredTemplateIds) {
			const name = systemTemplates[template].name;
			expect(screen.getAllByAltText(name).length).toBeGreaterThan(0);
		}

		const firstPreview = screen.getAllByRole("img")[0];
		expect(firstPreview).toHaveAttribute("alt", "蓝色时间轴");
		expect(screen.queryByText("可导出 PDF")).toBeNull();
		expect(screen.getAllByText("适合技术、产品、运营的稳重一页投递").length).toBeGreaterThan(0);
		expect(screen.getAllByText("适合财务、法务、行政等正式场景").length).toBeGreaterThan(0);
		expect(screen.getAllByText("适合带项目链接或作品集入口的候选人").length).toBeGreaterThan(0);
		expect(screen.getAllByText(/时间轴 · 稳重/).length).toBeGreaterThan(0);
		expect(screen.getAllByText("单栏").length).toBeGreaterThan(0);
		expect(screen.getAllByText("左侧栏").length).toBeGreaterThan(0);
		expect(screen.getAllByText("右侧栏").length).toBeGreaterThan(0);
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
