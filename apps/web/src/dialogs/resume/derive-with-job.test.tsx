// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const mutate = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());
const closeDialog = vi.hoisted(() => vi.fn());
const providerState = vi.hoisted(() => ({
	data: [{ enabled: true, testStatus: "success" }],
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate, isPending: false }),
	useQuery: () => providerState,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigate,
}));

vi.mock("@/dialogs/store", () => ({
	useDialogStore: (selector: (state: { closeDialog: typeof closeDialog }) => unknown) => selector({ closeDialog }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		aiProviders: { list: { queryOptions: () => ({}) } },
		resume: { deriveWithJob: { mutationOptions: () => ({}) } },
	},
}));

vi.mock("@reactive-resume/ui/components/dialog", () => ({
	DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
	DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
	DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
}));

const { DeriveResumeWithJobDialog } = await import("./derive-with-job");

describe("DeriveResumeWithJobDialog", () => {
	beforeEach(() => {
		i18n.loadAndActivate({ locale: "zh-CN", messages: {} });
		mutate.mockReset();
		navigate.mockReset();
		closeDialog.mockReset();
		providerState.data = [{ enabled: true, testStatus: "success" }];
	});

	it("submits JD context and navigates to the generated resume", async () => {
		mutate.mockImplementation((_input, options) => options.onSuccess("resume-new"));

		render(
			<I18nProvider i18n={i18n}>
				<DeriveResumeWithJobDialog data={{ id: "resume-1", name: "基础简历" }} />
			</I18nProvider>,
		);

		fireEvent.change(screen.getByLabelText("目标公司"), { target: { value: "星河科技" } });
		fireEvent.change(screen.getByLabelText("目标岗位"), { target: { value: "高级前端工程师" } });
		fireEvent.change(screen.getByLabelText("岗位 JD"), {
			target: { value: "负责 B 端 SaaS、权限系统、React 性能优化。" },
		});
		fireEvent.click(screen.getByRole("button", { name: "生成定制副本" }));

		await waitFor(() => {
			expect(mutate).toHaveBeenCalledWith(
				{
					id: "resume-1",
					company: "星河科技",
					roleTitle: "高级前端工程师",
					jdText: "负责 B 端 SaaS、权限系统、React 性能优化。",
				},
				expect.any(Object),
			);
		});
		expect(closeDialog).toHaveBeenCalled();
		expect(navigate).toHaveBeenCalledWith({ to: "/builder/$resumeId", params: { resumeId: "resume-new" } });
	});

	it("requires an available AI provider before deriving a copy", () => {
		providerState.data = [];

		render(
			<I18nProvider i18n={i18n}>
				<DeriveResumeWithJobDialog data={{ id: "resume-1", name: "基础简历" }} />
			</I18nProvider>,
		);

		expect(screen.getByText("需要先配置可用的 AI 模型")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "生成定制副本" })).toBeDisabled();
	});
});
