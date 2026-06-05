// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { featuredTemplateIds, onlineStyleTemplateReferences, templates } from "@/dialogs/resume/template/data";
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
	it("shows only real exportable featured templates on the homepage", () => {
		renderTemplates();

		expect(screen.getByText("中文简历模板与风格")).toBeInTheDocument();
		expect(screen.getByText(/首页只展示真实可导出的首批精品模板/)).toBeInTheDocument();

		for (const id of featuredTemplateIds) {
			expect(screen.getAllByAltText(templates[id].name).length).toBeGreaterThan(0);
		}

		for (const reference of onlineStyleTemplateReferences) {
			expect(screen.queryByAltText(reference.name)).toBeNull();
		}

		expect(screen.queryByAltText("014 彩色技能栏")).toBeNull();
	});
});
