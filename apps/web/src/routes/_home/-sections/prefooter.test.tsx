// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Prefooter } from "./prefooter";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

const renderPrefooter = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Prefooter />
		</I18nProvider>,
	);

describe("Prefooter", () => {
	it("renders a user-facing create-resume call to action", () => {
		renderPrefooter();

		expect(screen.getByText("从一份能投递的中文简历开始")).toBeInTheDocument();
		expect(screen.getByText(/选择一份完整样张/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /开始创建简历/ })).toHaveAttribute("href", "/auth/login");
	});

	it("renders the decorative TextMaskEffect (svg)", () => {
		const { container } = renderPrefooter();
		expect(container.querySelector("svg")).not.toBeNull();
	});
});
