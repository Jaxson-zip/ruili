// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

type SectionBaseProps = {
	children: React.ReactNode;
};

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: SectionBaseProps) => <div>{children}</div>,
}));

const { InformationSectionBuilder } = await import("./information");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderInfo = () =>
	render(
		<I18nProvider i18n={i18n}>
			<InformationSectionBuilder />
		</I18nProvider>,
	);

describe("InformationSectionBuilder", () => {
	it("renders the Ruili product information and source CTA", () => {
		renderInfo();
		expect(screen.getByText("关于锐历")).toBeInTheDocument();
		expect(screen.getByText("查看锐历源码")).toBeInTheDocument();
	});

	it("links the primary CTA to the Ruili repository", () => {
		renderInfo();
		const projectLink = screen.getByText("查看锐历源码").closest("a");
		expect(projectLink?.getAttribute("href")).toBe("https://github.com/Jaxson-zip/ruili");
	});

	it("keeps concise upstream attribution links", () => {
		renderInfo();
		expect(screen.getByText("上游项目").closest("a")?.getAttribute("href")).toBe(
			"https://github.com/amruthpillai/reactive-resume",
		);
		expect(screen.getByText("MIT 许可证").closest("a")?.getAttribute("href")).toBe(
			"https://github.com/AmruthPillai/Reactive-Resume/blob/main/LICENSE",
		);
	});

	it("opens external links in a new tab", () => {
		const { container } = renderInfo();
		const links = Array.from(container.querySelectorAll<HTMLAnchorElement>("a"));

		expect(links.length).toBeGreaterThan(0);
		for (const link of links) {
			expect(link.getAttribute("target")).toBe("_blank");
			expect(link.getAttribute("rel")).toBe("noopener noreferrer");
		}
	});
});
