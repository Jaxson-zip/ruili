// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

type SectionBaseProps = {
	children: React.ReactNode;
};

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
	isPending: false,
	mutate: vi.fn(),
	providers: [] as Array<{ enabled: boolean; testStatus: string }>,
	setQueryData: vi.fn(),
}));

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: SectionBaseProps) => <div>{children}</div>,
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useResume: () => ({ id: "resume-1" }),
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate: queryMocks.mutate, isPending: queryMocks.isPending }),
	useQuery: (options: { queryKey?: string[] }) => {
		if (options.queryKey?.[0] === "analysis") {
			return { data: queryMocks.analysis, isFetched: true, isLoading: false };
		}

		return { data: queryMocks.providers, isLoading: false };
	},
	useQueryClient: () => ({ setQueryData: queryMocks.setQueryData }),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		ai: { analyzeResume: { mutationOptions: () => ({}) } },
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

const { ResumeAnalysisSectionBuilder } = await import("./resume-analysis");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	queryMocks.analysis = null;
	queryMocks.isPending = false;
	queryMocks.mutate.mockReset();
	queryMocks.providers = [];
	queryMocks.setQueryData.mockReset();
});

const renderAnalysis = () =>
	render(
		<I18nProvider i18n={i18n}>
			<ResumeAnalysisSectionBuilder />
		</I18nProvider>,
	);

describe("ResumeAnalysisSectionBuilder", () => {
	it("renders Chinese guidance when AI provider is unavailable", () => {
		renderAnalysis();
		expect(screen.getByText(/配置 AI Provider 后/)).toBeInTheDocument();
		expect(screen.getByText("打开 AI Providers")).toBeInTheDocument();
	});

	it("renders Chinese action copy before the first analysis", () => {
		queryMocks.providers = [{ enabled: true, testStatus: "success" }];

		renderAnalysis();

		expect(screen.getByText("分析简历")).toBeInTheDocument();
		expect(screen.getByText("综合评分")).toBeInTheDocument();
		expect(screen.getByText(/第一次分析后/)).toBeInTheDocument();
	});

	it("renders Chinese section labels for stored analysis", () => {
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

		renderAnalysis();

		expect(screen.getByText("评分维度")).toBeInTheDocument();
		expect(screen.getByText("当前优势")).toBeInTheDocument();
		expect(screen.getByText("修改建议")).toBeInTheDocument();
		expect(screen.getByText("高优先级")).toBeInTheDocument();
	});
});
