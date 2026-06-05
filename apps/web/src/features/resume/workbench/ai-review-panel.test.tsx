// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIReviewPanel } from "./ai-review-panel";

const queryMocks = vi.hoisted(() => ({
	analysis: null as null | {
		modelMeta: { model: string; provider: string };
		overallScore: number;
		scorecard: Array<{ dimension: string; rationale: string; score: number }>;
		strengths: string[];
		suggestions: Array<{
			copyPrompt: string;
			exampleRewrite: string | null;
			impact: "high" | "medium" | "low";
			title: string;
			why: string;
		}>;
		updatedAt: Date;
	},
	isLoading: false,
	mutate: vi.fn(),
	mutationOptions: vi.fn(),
	providers: [] as Array<{ enabled: boolean; testStatus: string }>,
	queryOptions: vi.fn(),
	setQueryData: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate: queryMocks.mutate, isPending: false }),
	useQuery: (options: { queryKey?: string[] }) => {
		if (options.queryKey?.[0] === "analysis") {
			return { data: queryMocks.analysis, isLoading: false };
		}

		return { data: queryMocks.providers, isLoading: queryMocks.isLoading };
	},
	useQueryClient: () => ({ setQueryData: queryMocks.setQueryData }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		ai: { analyzeResume: { mutationOptions: queryMocks.mutationOptions } },
		aiProviders: {
			list: { queryOptions: () => ({ queryKey: ["providers"] }) },
		},
		resume: {
			analysis: {
				getById: {
					queryKey: () => ["analysis"],
					queryOptions: () => ({ queryKey: ["analysis"] }),
				},
			},
		},
	},
}));

describe("AIReviewPanel", () => {
	beforeEach(() => {
		queryMocks.analysis = null;
		queryMocks.isLoading = false;
		queryMocks.mutate.mockReset();
		queryMocks.providers = [];
		queryMocks.setQueryData.mockReset();
	});

	it("explains that LLM provider is required when none is configured", () => {
		render(<AIReviewPanel resumeId="resume-1" />);
		expect(screen.getByText("需要先配置可用的 AI 模型")).toBeInTheDocument();
	});

	it("shows analyze action when provider is configured", () => {
		queryMocks.providers = [{ enabled: true, testStatus: "success" }];
		render(<AIReviewPanel resumeId="resume-1" />);
		expect(screen.getByText("开始分析")).toBeInTheDocument();
	});

	it("renders stored analysis results", () => {
		queryMocks.providers = [{ enabled: true, testStatus: "success" }];
		queryMocks.analysis = {
			modelMeta: { model: "deepseek-chat", provider: "openai-compatible" },
			overallScore: 86,
			scorecard: [{ dimension: "岗位匹配", rationale: "项目描述和目标岗位较一致。", score: 88 }],
			strengths: ["项目结果表达清晰"],
			suggestions: [
				{
					copyPrompt: "改写项目经历",
					exampleRewrite: "将项目结果量化为转化率提升。",
					impact: "high",
					title: "补充量化结果",
					why: "招聘方需要快速判断影响力。",
				},
			],
			updatedAt: new Date("2026-06-03T10:00:00Z"),
		};

		render(<AIReviewPanel resumeId="resume-1" />);
		expect(screen.getByText("86")).toBeInTheDocument();
		expect(screen.getByText("岗位匹配")).toBeInTheDocument();
		expect(screen.getByText("补充量化结果")).toBeInTheDocument();
	});
});
