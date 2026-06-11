import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

const mocks = vi.hoisted(() => ({
	resume: vi.fn(),
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useResume: () => mocks.resume(),
}));

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const { ExportSectionBuilder } = await import("./export");

beforeEach(() => {
	mocks.resume.mockReset();
});

describe("ExportSectionBuilder", () => {
	it("shows the selected word template export card when a template is active", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: "zh-internship-001" };
		mocks.resume.mockReturnValue({ id: "resume-1", name: "Resume", data });

		const html = renderToStaticMarkup(<ExportSectionBuilder />);

		expect(html).toContain("校招实习标准模板");
		expect(html).toContain("Word 导出");
		expect(html).not.toContain("通用 DOCX");
		expect(html).not.toContain("JSON");
		expect(html).toContain("PDF");
	});

	it("falls back to the plain DOCX export when no word template is selected", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: null };
		mocks.resume.mockReturnValue({ id: "resume-1", name: "Resume", data });

		const html = renderToStaticMarkup(<ExportSectionBuilder />);

		expect(html).toContain("Word 导出");
		expect(html).not.toContain("JSON");
	});
});
