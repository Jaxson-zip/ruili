// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

vi.mock("./export-actions", () => ({
	exportResumeDocx: toolbarMocks.exportResumeDocx,
	exportResumePdf: toolbarMocks.exportResumePdf,
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
	data: { basics: { name: "陈嘉行", headline: "前端开发实习生" }, metadata: { template: "azurill" } },
	updatedAt: new Date(),
};

describe("WorkbenchShell", () => {
	it("renders the Chinese workbench structure", () => {
		render(<WorkbenchShell resume={resume as never} />);

		expect(screen.getByText("锐历")).toBeInTheDocument();
		expect(screen.getByText("AI 检查")).toBeInTheDocument();
		expect(screen.getByText("陈嘉行")).toBeInTheDocument();
		expect(screen.getByText("AI 审稿")).toBeInTheDocument();
		expect(screen.getByText("导出 PDF")).toBeInTheDocument();
		expect(screen.getByText("导出 Word")).toBeInTheDocument();
	});
});
