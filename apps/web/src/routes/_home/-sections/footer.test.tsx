// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.stubGlobal("__APP_VERSION__", "9.9.9");

i18n.loadAndActivate({ locale: "en", messages: {} });

const { Footer } = await import("./footer");

const renderFooter = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Footer />
		</I18nProvider>,
	);

describe("Footer", () => {
	it("renders product and open-source attribution link group headings", () => {
		renderFooter();
		expect(screen.getByText("产品")).toBeInTheDocument();
		expect(screen.getByText("开源说明")).toBeInTheDocument();
	});

	it("renders the Ruili product links", () => {
		renderFooter();
		for (const label of ["项目源码", "开始使用", "模板预览", "常见问题"]) {
			expect(screen.getByText(label)).toBeInTheDocument();
		}
	});

	it("points the primary GitHub links to the Ruili repository", () => {
		const { container } = renderFooter();
		const hrefs = Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).map((a) => a.href);
		expect(hrefs.some((h) => h.includes("github.com/Jaxson-zip/ruili"))).toBe(true);
	});

	it("keeps concise upstream attribution links", () => {
		renderFooter();
		expect(screen.getByText("隐私与数据处理")).toBeInTheDocument();
		expect(screen.getByText("上游开源项目")).toBeInTheDocument();
		expect(screen.getByText("MIT 许可证")).toBeInTheDocument();
	});

	it("links to the privacy and data processing page", () => {
		renderFooter();
		expect(screen.getByRole("link", { name: "隐私与数据处理" })).toHaveAttribute("href", "/privacy");
	});

	it("includes app version copy via Copyright", () => {
		renderFooter();
		expect(screen.getByText("锐历 v9.9.9")).toBeInTheDocument();
	});
});
