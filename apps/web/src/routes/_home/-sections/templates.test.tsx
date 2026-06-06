// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { primaryTemplateIds, templates as systemTemplates } from "@/dialogs/resume/template/data";
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
	it("shows a two-row marquee backed by the full launch template catalog", () => {
		renderTemplates();

		expect(screen.getByText("中文简历模板与风格")).toBeInTheDocument();
		expect(screen.getByText(/首批可切换的中文模板/)).toBeInTheDocument();
		expect(screen.getByText(/最终以编辑器预览和导出结果为准/)).toBeInTheDocument();
		expect(screen.queryByText(/精选真实可导出/)).toBeNull();

		for (const template of primaryTemplateIds) {
			const name = systemTemplates[template].name;
			expect(screen.getAllByAltText(name)).toHaveLength(2);
		}

		expect(screen.getAllByRole("img")).toHaveLength(primaryTemplateIds.length * 2);
		expect(screen.getAllByText("可导出 PDF")).toHaveLength(primaryTemplateIds.length * 2);

		const exportableImageUrls = primaryTemplateIds.map((template) => systemTemplates[template].imageUrl);
		expect(new Set(exportableImageUrls).size).toBe(exportableImageUrls.length);

		expect(screen.getAllByAltText(systemTemplates.collection028.name)).toHaveLength(2);
		expect(screen.getAllByAltText(systemTemplates.collection019.name)).toHaveLength(2);
		expect(screen.getAllByAltText(systemTemplates.collection026.name)).toHaveLength(2);
		expect(screen.getAllByAltText(systemTemplates.collection029.name)).toHaveLength(2);
		expect(screen.queryByText("参考样式")).toBeNull();
		expect(screen.queryByText("仅参考")).toBeNull();
		expect(screen.queryByText(/先保留/)).toBeNull();
	});
});
