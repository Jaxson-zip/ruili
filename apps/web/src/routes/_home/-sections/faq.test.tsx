// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Faq } from "./faq";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

const renderFaq = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Faq />
		</I18nProvider>,
	);

describe("Faq section", () => {
	it("uses product-facing FAQ copy instead of launch notes", () => {
		renderFaq();

		expect(screen.getByText("支持 Word 和版本管理吗？")).toBeInTheDocument();
		expect(screen.getByText("开源许可怎么说明？")).toBeInTheDocument();
		expect(screen.getByText("为什么说它是中文优先？")).toBeInTheDocument();
		expect(screen.queryByText(/二开/)).toBeNull();
		expect(screen.queryByText(/继续.*完善/)).toBeNull();
		expect(screen.queryByText(/原项目捐赠入口/)).toBeNull();
	});
});
