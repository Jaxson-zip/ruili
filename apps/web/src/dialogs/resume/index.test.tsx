// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Dialog } from "@reactive-resume/ui/components/dialog";
import { getLaunchResumeTemplateStarters } from "./starter-preview";
import { primaryTemplateIds } from "./template/data";

const mutationMutate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-form", () => ({
	useStore: () => "",
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate: mutationMutate, isPending: false }),
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
const { getSelectedWordTemplateId, getWordTemplateLibrary } = await import("@/features/resume/word-template/library");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

afterEach(() => {
	mutationMutate.mockReset();
	localStorage.clear();
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
	it("shows the Word template library by default", () => {
		renderCreateDialog();

		expect(modeButton("Word 模板库")).toBeInTheDocument();
		expect(modeButton("上传 Word 模板")).toBeInTheDocument();
		expect(modeButton("空白简历")).toBeInTheDocument();
		expect(modeButton("旧版在线模板")).toBeInTheDocument();
		expect(screen.getByText(/从 Word 模板库开始/)).toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(getWordTemplateLibrary().length);
		expect(screen.queryByText(/从成品样张开始/)).toBeNull();
	});

	it("keeps old system templates in a secondary online mode", () => {
		renderCreateDialog();

		fireEvent.click(modeButton("旧版在线模板"));

		expect(screen.getByText(/旧版在线模板/)).toBeInTheDocument();
		expect(screen.getAllByRole("img")).toHaveLength(
			primaryTemplateIds.length + getLaunchResumeTemplateStarters().length,
		);
	});

	it("stores the selected Word template after creation succeeds", () => {
		renderCreateDialog();

		fireEvent.click(screen.getByText("1.docx 中文模板").closest("button") as HTMLButtonElement);

		const [, callbacks] = mutationMutate.mock.calls[0] ?? [];
		callbacks.onSuccess("created-resume-id");

		expect(getSelectedWordTemplateId("created-resume-id")).toBe("compact-blue-grid");
	});

	it("keeps blank resume creation separate from template selection", () => {
		renderCreateDialog();

		fireEvent.click(modeButton("空白简历"));

		expect(screen.getByLabelText("简历名称")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "创建空白简历" })).toBeInTheDocument();
		expect(screen.queryByText(/从成品样张开始/)).toBeNull();
	});
});
