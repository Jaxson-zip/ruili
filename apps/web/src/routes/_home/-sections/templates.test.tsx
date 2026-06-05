// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { onlineStyleTemplateReferences } from "@/dialogs/resume/template/data";
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
	it("shows system templates and launch-ready style references on the homepage", () => {
		renderTemplates();
		const reference = onlineStyleTemplateReferences[0];
		if (!reference) throw new Error("Expected at least one clean online style reference.");

		expect(screen.getByText("中文简历模板与风格")).toBeInTheDocument();
		expect(screen.getByText(/风格样张可在模板库一键套用/)).toBeInTheDocument();
		expect(screen.getAllByAltText("通用一页").length).toBeGreaterThan(0);
		expect(screen.getAllByAltText(reference.name).length).toBeGreaterThan(0);
		expect(screen.queryByAltText("014 彩色技能栏")).toBeNull();
	});
});
