// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { homepageTemplateIds, primaryTemplateIds, templates as systemTemplates } from "@/dialogs/resume/template/data";
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
	it("shows a two-row marquee backed by curated homepage templates", () => {
		renderTemplates();

		expect(screen.getByText("中文简历模板与风格")).toBeInTheDocument();
		expect(screen.getByText(/首批可切换的中文模板/)).toBeInTheDocument();
		expect(screen.getByText(/最终以编辑器预览和导出结果为准/)).toBeInTheDocument();
		expect(screen.queryByText(/精选真实可导出/)).toBeNull();

		for (const template of homepageTemplateIds) {
			const name = systemTemplates[template].name;
			expect(screen.getAllByAltText(name)).toHaveLength(2);
		}

		expect(screen.getAllByRole("img")).toHaveLength(homepageTemplateIds.length * 2);
		expect(screen.getAllByText("可切换模板")).toHaveLength(homepageTemplateIds.length * 2);

		const exportableImageUrls = homepageTemplateIds.map((template) => systemTemplates[template].imageUrl);
		expect(new Set(exportableImageUrls).size).toBe(exportableImageUrls.length);

		expect(screen.getAllByAltText(systemTemplates.collection019.name)).toHaveLength(2);
		expect(screen.getAllByAltText(systemTemplates.collection026.name)).toHaveLength(2);
		expect(screen.queryByAltText(systemTemplates.collection020.name)).toBeNull();
		expect(screen.queryByAltText(systemTemplates.collection022.name)).toBeNull();
		expect(screen.queryByAltText(systemTemplates.collection027.name)).toBeNull();
		expect(screen.queryByAltText(systemTemplates.collection028.name)).toBeNull();
		expect(screen.queryByAltText(systemTemplates.collection029.name)).toBeNull();
		expect(screen.queryByText("参考样式")).toBeNull();
		expect(screen.queryByText("仅参考")).toBeNull();
		expect(screen.queryByText(/先保留/)).toBeNull();
		expect(primaryTemplateIds.length).toBeGreaterThan(homepageTemplateIds.length);
	});
});
