// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useSectionStore } from "../../../-store/section";

const resume = vi.hoisted(() => ({
	data: {
		basics: {
			name: "陈嘉铭",
			headline: "前端开发工程师",
		},
		summary: {
			content: "<p>熟悉 React。</p>",
		},
		sections: {
			experience: { items: [{ id: "exp-1" }, { id: "exp-2" }] },
			education: { items: [{ id: "edu-1" }] },
			projects: { items: [{ id: "project-1" }] },
			skills: { items: [{ id: "skill-1" }, { id: "skill-2" }, { id: "skill-3" }] },
		},
	},
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => resume,
}));

const { ReplacementChecklistSection } = await import("./replacement-checklist");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

afterEach(() => {
	useSectionStore.setState({ sections: {}, selectedSection: null, selectionRequestId: 0 });
});

const renderChecklist = () =>
	render(
		<I18nProvider i18n={i18n}>
			<ReplacementChecklistSection />
		</I18nProvider>,
	);

describe("ReplacementChecklistSection", () => {
	it("renders content check items with completion status", () => {
		renderChecklist();

		expect(screen.getByRole("region", { name: "内容检查" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /基本信息/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /工作经历/ })).toHaveTextContent("2 项");
		expect(screen.getByRole("button", { name: /技能清单/ })).toHaveTextContent("3 项");
	});

	it("selects the quick edit section when clicked", () => {
		renderChecklist();

		fireEvent.click(screen.getByRole("button", { name: /项目经历/ }));

		expect(useSectionStore.getState().selectedSection).toBe("projects");
	});
});
