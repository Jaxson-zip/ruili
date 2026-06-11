// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { clearSelectedWordTemplateId } from "@/features/resume/word-template/library";

type SectionStoreState = { selectSection: (...args: unknown[]) => unknown };
type ThumbnailMockProps = { template: { id: string; name: string } };

const mocks = vi.hoisted(() => ({
	selectSection: vi.fn(),
	currentResume: vi.fn(),
	patchResume: vi.fn(),
	updateResume: vi.fn(),
	updateResumeData: vi.fn(),
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => mocks.currentResume(),
	usePatchResume: () => mocks.patchResume,
	useUpdateResumeData: () => mocks.updateResumeData,
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate: mocks.updateResume }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		resume: {
			update: {
				mutationOptions: () => ({}),
			},
		},
	},
}));

vi.mock("../../../-store/section", () => ({
	useSectionStore: (selector: (state: SectionStoreState) => unknown) =>
		selector({ selectSection: mocks.selectSection }),
}));

vi.mock("@/features/resume/word-template/thumbnail", () => ({
	WordTemplateLiveThumbnail: ({ template }: ThumbnailMockProps) => (
		<div data-template-id={template.id}>{template.name}</div>
	),
}));

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const { TemplateSectionBuilder } = await import("./template");

beforeEach(() => {
	mocks.selectSection.mockReset();
	mocks.currentResume.mockReset();
	mocks.patchResume.mockReset();
	mocks.updateResume.mockReset();
	mocks.updateResumeData.mockReset();
	clearSelectedWordTemplateId("resume-1");
});

describe("TemplateSectionBuilder", () => {
	it("shows the configured word template library", () => {
		const data = structuredClone(defaultResumeData);
		mocks.currentResume.mockReturnValue({ id: "resume-1", name: "Resume", data });

		const html = renderToStaticMarkup(<TemplateSectionBuilder />);

		expect(html).toContain("校招实习标准模板");
		expect(html).toContain("ATS 单栏精简模板");
		expect(html).toContain("蓝灰侧栏双栏模板");
	});

	it("shows the selected template details when metadata is set", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: "zh-internship-001" };
		mocks.currentResume.mockReturnValue({ id: "resume-1", name: "Resume", data });

		const html = renderToStaticMarkup(<TemplateSectionBuilder />);

		expect(html).toContain("校招实习标准模板");
		expect(html).toContain("Word 导出");
		expect(html).not.toContain("适用场景");
		expect(html).not.toContain("模板能力");
	});

	it("renames default template-generated resumes when switching templates", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: "zh-ats-compact-001" };
		mocks.currentResume.mockReturnValue({ id: "resume-1", name: "ATS 单栏精简模板 简历", data });

		render(<TemplateSectionBuilder />);

		fireEvent.click(screen.getAllByRole("button", { name: "使用此模板" })[1]);

		expect(mocks.updateResumeData).toHaveBeenCalledTimes(1);
		const recipe = mocks.updateResumeData.mock.calls[0]?.[0] as (draft: typeof data) => void;
		const nextData = structuredClone(data);
		recipe(nextData);
		expect(nextData.metadata.wordTemplate).toEqual({ id: "zh-sidebar-clean-001" });
		expect(mocks.updateResume).toHaveBeenCalledWith(
			{ id: "resume-1", name: "蓝灰侧栏双栏模板 简历" },
			expect.any(Object),
		);
	});

	it("keeps custom resume names when switching templates", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: "zh-ats-compact-001" };
		mocks.currentResume.mockReturnValue({ id: "resume-1", name: "前端暑期实习-v3", data });

		render(<TemplateSectionBuilder />);

		fireEvent.click(screen.getAllByRole("button", { name: "使用此模板" })[1]);

		expect(mocks.updateResumeData).toHaveBeenCalledTimes(1);
		expect(mocks.updateResume).not.toHaveBeenCalled();
	});
});
