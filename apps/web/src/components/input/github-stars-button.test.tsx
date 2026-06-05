// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const { GithubStarsButton } = await import("./github-stars-button");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderButton = () =>
	render(
		<I18nProvider i18n={i18n}>
			<GithubStarsButton />
		</I18nProvider>,
	);

describe("GithubStarsButton", () => {
	it("renders an anchor pointing at the Ruili repository with rel=noopener noreferrer and target=_blank", () => {
		renderButton();
		const link = screen.getByRole("button") as HTMLAnchorElement;
		expect(link.href).toBe("https://github.com/Jaxson-zip/ruili");
		expect(link.target).toBe("_blank");
		expect(link.rel).toBe("noopener noreferrer");
	});

	it("uses the source-code aria-label", () => {
		renderButton();
		const link = screen.getByRole("button") as HTMLAnchorElement;
		expect(link.getAttribute("aria-label")).toBe("查看锐历源码（在新标签页打开）");
	});
});
