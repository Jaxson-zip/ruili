// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { featuredTemplateIds } from "@/dialogs/resume/template/data";
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
	it("describes the launch template count honestly", () => {
		renderFeatures();

		expect(
			screen.getByText(`首批 ${featuredTemplateIds.length} 套稳定模板已经换成中文样张，更容易判断版式是否适合投递。`),
		).toBeInTheDocument();
		expect(screen.queryByText(/12\+/)).toBeNull();
	});
});
