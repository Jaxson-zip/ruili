// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { AISettingsSection } from "./ai-section";
import { OCRSettingsSection } from "./ocr-section";

const queryState = vi.hoisted(() => ({
	data: [] as Array<{
		apiKeyPreview: string;
		baseURL: string | null;
		enabled: boolean;
		id: string;
		label: string;
		model: string;
		provider: "openai" | "openai-compatible";
		testError: string | null;
		testStatus: "failure" | "success" | "untested";
	}>,
	error: null as unknown,
	isLoading: false,
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ isPending: false, mutate: vi.fn() }),
	useQuery: () => queryState,
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		aiProviders: {
			create: { mutationOptions: () => ({}) },
			delete: { mutationOptions: () => ({}) },
			list: {
				queryKey: () => ["aiProviders"],
				queryOptions: () => ({ queryKey: ["aiProviders"] }),
			},
			test: { mutationOptions: () => ({}) },
			update: { mutationOptions: () => ({}) },
		},
	},
}));

function wrap(ui: React.ReactNode) {
	return render(<I18nProvider i18n={i18n}>{ui}</I18nProvider>);
}

describe("integration settings copy", () => {
	beforeEach(() => {
		i18n.loadAndActivate({ locale: "zh-CN", messages: {} });
		localStorage.clear();
		queryState.data = [];
		queryState.error = null;
		queryState.isLoading = false;
	});

	it("renders AI provider setup copy for Chinese users", () => {
		wrap(<AISettingsSection />);

		expect(screen.getByRole("heading", { name: "AI 模型服务商" })).toBeInTheDocument();
		expect(screen.getByText("未配置已测试的服务商")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "添加 AI 服务商" })).toBeInTheDocument();
		expect(screen.getByLabelText("名称")).toHaveAttribute("placeholder", "工作用 OpenAI");
		expect(screen.getByText("服务商")).toBeInTheDocument();
		expect(screen.getByLabelText("模型")).toBeInTheDocument();
		expect(screen.getByLabelText("接口地址 (Base URL)")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "保存 AI 服务商" })).toBeInTheDocument();
		expect(screen.queryByText("AI Agent ready")).not.toBeInTheDocument();
		expect(screen.queryByText("No tested Provider")).not.toBeInTheDocument();
	});

	it("renders AI ready and loading states in Chinese", () => {
		queryState.data = [
			{
				apiKeyPreview: "sk-...1234",
				baseURL: null,
				enabled: true,
				id: "provider-1",
				label: "工作用 OpenAI",
				model: "gpt-4.1",
				provider: "openai",
				testError: null,
				testStatus: "success",
			},
		];
		queryState.isLoading = true;

		wrap(<AISettingsSection />);

		expect(screen.getByText("AI 助手已就绪")).toBeInTheDocument();
		expect(screen.getByText("正在加载服务商...")).toBeInTheDocument();
		expect(screen.getByText("已测试")).toBeInTheDocument();
	});

	it("renders OCR provider copy for Chinese users", () => {
		wrap(<OCRSettingsSection />);

		expect(screen.getByRole("heading", { name: "OCR 服务商" })).toBeInTheDocument();
		expect(screen.getByText("未配置 OCR 服务商")).toBeInTheDocument();
		expect(screen.getByLabelText("服务端点 (Endpoint)")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "清除" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "保存 OCR 服务商" })).toBeDisabled();
		expect(screen.queryByText("OCR ready")).not.toBeInTheDocument();
		expect(screen.queryByText("No OCR Provider")).not.toBeInTheDocument();
	});
});
