// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Dialog } from "@reactive-resume/ui/components/dialog";
import { getLaunchResumeTemplateStarters } from "./starter-preview";
import { primaryTemplateIds } from "./template/data";

vi.mock("@tanstack/react-form", () => ({
	useStore: () => "",
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
	useParams: () => ({}),
}));

vi.mock("@/features/resume/builder/draft", () => ({
	usePatchResume: () => vi.fn(),
}));

vi.mock("@/hooks/use-form-blocker", () => ({
	useFormBlocker: vi.fn(),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		resume: {
			create: { mutationOptions: vi.fn() },
			duplicate: { mutationOptions: vi.fn() },
			import: { mutationOptions: vi.fn() },
			update: { mutationOptions: vi.fn() },
		},
	},
}));

vi.mock("@/libs/tanstack-form", () => ({
	useAppForm: () => ({
		handleSubmit: vi.fn(),
		setFieldValue: vi.fn(),
		state: { values: { name: "" } },
		store: {},
	}),
	withForm: () =>
		function MockResumeForm() {
			return (
				<div>
					<label htmlFor="resume-name">简历名称</label>
					<input id="resume-name" />
				</div>
			);
		},
}));

const { CreateResumeDialog } = await import("./index");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

const renderCreateDialog = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Dialog open>
				<CreateResumeDialog />
			</Dialog>
		</I18nProvider>,
	);

const modeButton = (label: string) => screen.getByText(label).closest("button") as HTMLButtonElement;

describe("CreateResumeDialog", () => {
	it("shows complete Chinese starter resumes by default", () => {
		renderCreateDialog();

		expect(modeButton("成品样张")).toBeInTheDocument();
		expect(modeButton("空白模板")).toBeInTheDocument();
		expect(modeButton("空白简历")).toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(getLaunchResumeTemplateStarters().length);
		expect(screen.queryByText(/高级入口/)).toBeNull();
	});

	it("lets users switch to all exportable blank templates", () => {
		renderCreateDialog();

		fireEvent.click(modeButton("空白模板"));

		expect(screen.getByText(/从空白模板开始/)).toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(primaryTemplateIds.length);
	});

	it("keeps blank resume creation separate from template selection", () => {
		renderCreateDialog();

		fireEvent.click(modeButton("空白简历"));

		expect(screen.getByLabelText("简历名称")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "创建空白简历" })).toBeInTheDocument();
		expect(screen.queryByText(/从成品样张开始/)).toBeNull();
	});
});
