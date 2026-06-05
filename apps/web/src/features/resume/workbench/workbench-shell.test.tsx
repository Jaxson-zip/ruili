// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { WorkbenchShell } from "./workbench-shell";

const toolbarMocks = vi.hoisted(() => ({
	exportResumeDocx: vi.fn(),
	exportResumePdf: vi.fn(),
	mutationOptions: vi.fn(),
	mutateAsync: vi.fn(),
	setQueryData: vi.fn(),
	toastError: vi.fn(),
	toastLoading: vi.fn(),
	toastSuccess: vi.fn(),
	useMutation: vi.fn(() => ({ mutateAsync: toolbarMocks.mutateAsync, isPending: false })),
	useQuery: vi.fn((options?: { queryKey?: string[] }) => {
		if (options?.queryKey?.[0] === "analysis") {
			return { data: null, isLoading: false };
		}

		return {
			data: [{ enabled: true, testStatus: "success" }],
			isLoading: false,
		};
	}),
}));
const previewMocks = vi.hoisted(() => ({
	resumePreview: vi.fn(),
}));

vi.mock("./export-actions", () => ({
	exportResumeDocx: toolbarMocks.exportResumeDocx,
	exportResumePdf: toolbarMocks.exportResumePdf,
}));

vi.mock("@/features/resume/preview/preview", () => ({
	ResumePreview: ({ data }: { data: unknown }) => {
		previewMocks.resumePreview(data);

		return <div data-testid="workbench-resume-preview">真实简历预览</div>;
	},
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		agent: { actions: { revert: { mutationOptions: toolbarMocks.mutationOptions } } },
		ai: { analyzeResume: { mutationOptions: toolbarMocks.mutationOptions } },
		aiProviders: { list: { queryOptions: () => ({ queryKey: ["providers"] }) } },
		resume: {
			analysis: {
				getById: {
					queryKey: () => ["analysis"],
					queryOptions: () => ({ queryKey: ["analysis"] }),
				},
			},
			versions: { create: { mutationOptions: toolbarMocks.mutationOptions } },
		},
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: toolbarMocks.useMutation,
	useQuery: toolbarMocks.useQuery,
	useQueryClient: () => ({ setQueryData: toolbarMocks.setQueryData }),
}));

vi.mock("sonner", () => ({
	toast: {
		error: toolbarMocks.toastError,
		loading: toolbarMocks.toastLoading,
		success: toolbarMocks.toastSuccess,
	},
}));

const resume = {
	id: "resume-1",
	name: "前端简历",
	data: {
		...defaultResumeData,
		basics: { ...defaultResumeData.basics, name: "陈嘉行", headline: "前端开发实习生" },
	},
	updatedAt: new Date(),
};

describe("WorkbenchShell", () => {
	it("renders the Chinese workbench structure", () => {
		previewMocks.resumePreview.mockClear();
		render(<WorkbenchShell resume={resume as never} />);

		expect(screen.getByText("锐历")).toBeInTheDocument();
		expect(screen.getByText("AI 检查")).toBeInTheDocument();
		expect(screen.getByTestId("workbench-resume-preview")).toBeInTheDocument();
		expect(previewMocks.resumePreview).toHaveBeenCalledWith(resume.data);
		expect(
			screen.queryByText("这里展示简历正文。后续任务会接入真实预览、段落聚焦和 AI Patch 审阅。"),
		).not.toBeInTheDocument();
		expect(screen.getByText("AI 审稿")).toBeInTheDocument();
		expect(screen.getByText("导出 PDF")).toBeInTheDocument();
		expect(screen.getByText("导出 Word")).toBeInTheDocument();
	});
});
