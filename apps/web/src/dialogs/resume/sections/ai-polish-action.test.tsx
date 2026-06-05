// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const mutateAsync = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ isPending: false, mutateAsync }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		ai: {
			polishResumeItem: {
				mutationOptions: () => ({}),
			},
		},
	},
}));

const { AiPolishDescriptionAction } = await import("./ai-polish-action");

describe("AiPolishDescriptionAction", () => {
	beforeEach(() => {
		i18n.loadAndActivate({ locale: "zh-CN", messages: {} });
		mutateAsync.mockReset();
		mutateAsync.mockResolvedValue({
			headline: "高级前端工程师",
			descriptionHtml: "<ul><li>重构 CRM 权限体系，提升配置效率。</li></ul>",
		});
	});

	it("passes optional JD context and applies the polished description", async () => {
		const onDescriptionChange = vi.fn();

		render(
			<I18nProvider i18n={i18n}>
				<AiPolishDescriptionAction
					itemKind="experience"
					item={{
						title: "高级前端工程师",
						organization: "星河科技",
						period: "2021 - 2024",
						location: "杭州",
					}}
					descriptionHtml="<p>负责后台系统建设。</p>"
					onDescriptionChange={onDescriptionChange}
				/>
			</I18nProvider>,
		);

		fireEvent.change(screen.getByLabelText("目标 JD（可选）"), {
			target: { value: "需要 React、权限系统和 B 端 SaaS 经验" },
		});
		fireEvent.click(screen.getByRole("button", { name: "AI 润色" }));

		await waitFor(() => {
			expect(mutateAsync).toHaveBeenCalledWith({
				itemKind: "experience",
				item: {
					title: "高级前端工程师",
					organization: "星河科技",
					period: "2021 - 2024",
					location: "杭州",
					descriptionHtml: "<p>负责后台系统建设。</p>",
				},
				targetJobDescription: "需要 React、权限系统和 B 端 SaaS 经验",
			});
		});
		expect(onDescriptionChange).toHaveBeenCalledWith("<ul><li>重构 CRM 权限体系，提升配置效率。</li></ul>");
	});
});
