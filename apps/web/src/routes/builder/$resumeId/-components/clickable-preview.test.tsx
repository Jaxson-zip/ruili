// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useSectionStore } from "../-store/section";

const resumeData = vi.hoisted(() => ({
	metadata: {
		layout: {
			sidebarWidth: 30,
			pages: [
				{
					fullWidth: false,
					main: ["summary", "experience", "projects"],
					sidebar: ["profiles", "skills", "education"],
				},
			],
		},
	},
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useResumeData: () => resumeData,
}));

vi.mock("@/features/resume/preview/preview", () => ({
	ResumePreview: () => <div data-testid="resume-preview-canvas">PDF preview</div>,
}));

const { BuilderClickableResumePreview } = await import("./clickable-preview");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

afterEach(() => {
	useSectionStore.setState({ sections: {}, selectedSection: null, selectionRequestId: 0 });
});

function setPreviewBounds(element: HTMLElement) {
	vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
		x: 0,
		y: 0,
		left: 0,
		top: 0,
		right: 800,
		bottom: 1100,
		width: 800,
		height: 1100,
		toJSON: () => ({}),
	});
}

const renderClickablePreview = () =>
	render(
		<I18nProvider i18n={i18n}>
			<BuilderClickableResumePreview showPageNumbers pageLayout="vertical" />
		</I18nProvider>,
	);

describe("BuilderClickableResumePreview", () => {
	it("does not select a resume section when the user single-clicks the preview", () => {
		renderClickablePreview();
		const previewButton = screen.getByRole("button", { name: "双击简历预览快速编辑" });
		setPreviewBounds(previewButton);

		fireEvent.click(previewButton, { clientX: 500, clientY: 560 });

		expect(useSectionStore.getState().selectedSection).toBeNull();
	});

	it("selects a resume section when the user double-clicks the preview", () => {
		renderClickablePreview();
		const previewButton = screen.getByRole("button", { name: "双击简历预览快速编辑" });
		setPreviewBounds(previewButton);

		fireEvent.doubleClick(previewButton, { clientX: 500, clientY: 560 });

		expect(useSectionStore.getState().selectedSection).toBe("experience");
		expect(useSectionStore.getState().sections.experience?.collapsed).toBe(false);
	});

	it("selects basics from the keyboard shortcut on the preview surface", () => {
		renderClickablePreview();
		const previewButton = screen.getByRole("button", { name: "双击简历预览快速编辑" });

		fireEvent.keyDown(previewButton, { key: "Enter" });

		expect(useSectionStore.getState().selectedSection).toBe("basics");
	});
});
