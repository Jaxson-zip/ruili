// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import {
	additionalCollectionTemplateReferences,
	onlineStyleTemplateReferences,
	recommendedCollectionTemplateReferences,
} from "@/dialogs/resume/template/data";
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
	it("shows exportable templates and curated reference styles on the homepage", () => {
		renderTemplates();

		expect(screen.getByText("中文简历模板与风格")).toBeInTheDocument();
		expect(screen.getByText(/第一排已经升级为真实可导出的中文模板/)).toBeInTheDocument();
		expect(screen.getByText(/不会再强行套成别的模板/)).toBeInTheDocument();

		for (const name of [
			"蓝色时间轴",
			"金色商务",
			"深蓝横栏",
			"深蓝侧栏",
			"浅蓝双栏",
			"青蓝侧栏",
			"蓝色标签",
			"蓝色边框",
		]) {
			expect(screen.getAllByAltText(name).length).toBeGreaterThan(0);
		}

		for (const reference of recommendedCollectionTemplateReferences.slice(0, 3)) {
			expect(screen.getAllByAltText(reference.name).length).toBeGreaterThan(0);
		}
		for (const reference of additionalCollectionTemplateReferences.slice(0, 3)) {
			expect(screen.getAllByAltText(reference.name).length).toBeGreaterThan(0);
		}

		const firstPreview = screen.getAllByRole("img")[0];
		expect(firstPreview).toHaveAttribute("alt", "蓝色时间轴");
		expect(screen.getAllByText("可导出 PDF").length).toBeGreaterThan(0);
		expect(screen.getAllByText("待制作真实模板").length).toBeGreaterThan(0);
		expect(screen.queryByText("可套用相近版式")).toBeNull();

		for (const reference of onlineStyleTemplateReferences) {
			expect(screen.queryByAltText(reference.name)).toBeNull();
		}
	});
});
