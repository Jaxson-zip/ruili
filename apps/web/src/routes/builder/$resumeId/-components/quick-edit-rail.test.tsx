// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useSectionStore } from "../-store/section";
import { BuilderQuickEditRail } from "./quick-edit-rail";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

afterEach(() => {
	useSectionStore.setState({ sections: {}, selectedSection: null, selectionRequestId: 0 });
});

const renderRail = () =>
	render(
		<I18nProvider i18n={i18n}>
			<BuilderQuickEditRail />
		</I18nProvider>,
	);

describe("BuilderQuickEditRail", () => {
	it("renders Chinese quick edit entries", () => {
		renderRail();

		expect(screen.getByRole("navigation", { name: "快速编辑" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "工作经历" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "模板" })).toBeInTheDocument();
	});

	it("selects and expands a resume content section", () => {
		useSectionStore.getState().setCollapsed("experience", true);
		renderRail();

		fireEvent.click(screen.getByRole("button", { name: "工作经历" }));

		const state = useSectionStore.getState();
		expect(state.selectedSection).toBe("experience");
		expect(state.sections.experience?.collapsed).toBe(false);
		expect(state.selectionRequestId).toBe(1);
	});

	it("selects right-sidebar sections such as templates", () => {
		renderRail();

		fireEvent.click(screen.getByRole("button", { name: "模板" }));

		const state = useSectionStore.getState();
		expect(state.selectedSection).toBe("template");
		expect(state.sections.template?.collapsed).toBe(false);
		expect(state.selectionRequestId).toBe(1);
	});
});
