// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { ResumeThumbnail } from "./resume-thumbnail";

const mocks = vi.hoisted(() => ({
	resumeDetail: undefined as unknown,
}));

function createResumeDetail(templateId: "zh-internship-001" | "zh-sidebar-clean-001") {
	const data = structuredClone(defaultResumeData);
	data.metadata.wordTemplate = { id: templateId };

	return {
		id: "resume-1",
		name: "Word 模板简历",
		data,
		updatedAt: new Date("2026-06-11T08:15:19.135Z"),
	};
}

function createResumeListItem() {
	return {
		id: "resume-1",
		name: "Word 模板简历",
		slug: "word-template",
		tags: [],
		isPublic: false,
		isLocked: false,
		createdAt: new Date("2026-06-11T08:15:19.135Z"),
		updatedAt: new Date("2026-06-11T08:15:19.135Z"),
	};
}

vi.mock("motion/react", () => ({
	useInView: () => true,
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: () => ({ data: mocks.resumeDetail, isError: false }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		resume: {
			getById: {
				queryOptions: () => ({}),
			},
		},
	},
}));

vi.mock("@/features/resume/word-template/thumbnail", () => ({
	WordTemplateBuilderViewportThumbnail: ({
		className,
		name,
		scale,
	}: {
		className?: string;
		name: string;
		scale: number;
	}) => (
		<div className={className} data-scale={scale} data-testid="word-template-builder-viewport-thumbnail">
			{name}
		</div>
	),
}));

beforeEach(() => {
	mocks.resumeDetail = createResumeDetail("zh-sidebar-clean-001");
});

describe("ResumeThumbnail", () => {
	it("renders word template thumbnails with the builder viewport preview", () => {
		render(<ResumeThumbnail isLocked={false} resume={createResumeListItem()} />);

		const stage = screen.getByTestId("word-template-card-preview-stage");
		expect(stage.className).toContain("inset-x-0");
		expect(stage.className).toContain("top-0");
		expect(stage.className).toContain("bottom-16");
		expect(stage.className).toContain("overflow-hidden");
		expect(stage.className).not.toContain("flex");
		expect(stage.className).not.toContain("bg-muted/30");
		expect(stage.className).not.toContain("p-1");
		expect(stage.className).not.toContain("shadow-inner");

		const preview = screen.getByTestId("word-template-builder-viewport-thumbnail");
		expect(preview).toHaveAttribute("data-scale", "0.25");
		expect(preview.className).not.toContain("w-[112%]");
	});

	it("uses the same dashboard viewport for non-sidebar word templates", () => {
		mocks.resumeDetail = createResumeDetail("zh-internship-001");

		render(<ResumeThumbnail isLocked={false} resume={createResumeListItem()} />);

		const preview = screen.getByTestId("word-template-builder-viewport-thumbnail");
		expect(preview).toHaveAttribute("data-scale", "0.25");
		expect(preview.className).not.toContain("w-[112%]");
	});
});
