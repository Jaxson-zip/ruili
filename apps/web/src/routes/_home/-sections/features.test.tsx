// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { primaryTemplateIds } from "@/dialogs/resume/template/data";
import { Features } from "./features";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

const renderFeatures = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Features />
		</I18nProvider>,
	);

describe("Features section", () => {
	it("keeps the homepage capabilities focused on the resume workflow", () => {
		renderFeatures();

		expect(screen.getByText("核心能力")).toBeInTheDocument();
		expect(screen.getByText(/选样张、改内容、看预览、导出 PDF/)).toBeInTheDocument();
		expect(
			screen.getByText(`${primaryTemplateIds.length} 套可切换模板使用中文样张预览，方便判断是否适合投递。`),
		).toBeInTheDocument();
		expect(screen.queryByText(/8 套精选模板/)).toBeNull();
		expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
		expect(screen.queryByText("API 自动化")).toBeNull();
		expect(screen.queryByText("账户体系")).toBeNull();
		expect(screen.queryByText(/首批/)).toBeNull();
	});
});
