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
	it("shows a two-row marquee backed by real launch templates", () => {
		renderTemplates();

		expect(screen.getByText("中文简历模板与风格")).toBeInTheDocument();
		expect(screen.getByText(/精选真实可导出的中文模板/)).toBeInTheDocument();

		for (const template of featuredTemplateIds) {
			const name = systemTemplates[template].name;
			expect(screen.getAllByAltText(name)).toHaveLength(2);
		}

		expect(screen.getAllByRole("img")).toHaveLength(featuredTemplateIds.length * 2);
		expect(screen.getAllByText("可导出 PDF")).toHaveLength(featuredTemplateIds.length * 2);

		const exportableImageUrls = featuredTemplateIds.map((template) => systemTemplates[template].imageUrl);
		expect(new Set(exportableImageUrls).size).toBe(exportableImageUrls.length);

		expect(screen.getAllByAltText(systemTemplates.collection028.name)).toHaveLength(2);
		expect(screen.queryByAltText(systemTemplates.collection019.name)).toBeNull();
		expect(screen.queryByAltText(systemTemplates.collection026.name)).toBeNull();
		expect(screen.queryByText("参考样式")).toBeNull();
		expect(screen.queryByText("仅参考")).toBeNull();
		expect(screen.queryByText(/先保留/)).toBeNull();
	});
});
