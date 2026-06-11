import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

type ChildrenProps = { children?: ReactNode };

const mocks = vi.hoisted(() => ({
	closeDialog: vi.fn(),
	form: {
		handleSubmit: vi.fn(),
		setFieldValue: vi.fn(),
		state: {
			values: {
				name: "",
			},
		},
		store: {},
	},
	navigate: vi.fn(),
	mutate: vi.fn(),
	name: "",
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mocks.navigate,
	useParams: () => ({}),
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ isPending: false, mutate: mocks.mutate }),
}));

vi.mock("@tanstack/react-form", () => ({
	useStore: (_store: unknown, selector: (state: { values: { name: string } }) => unknown) =>
		selector({ values: { name: mocks.name } }),
}));

vi.mock("@/libs/tanstack-form", () => ({
	useAppForm: () => mocks.form,
	withForm: () => () => null,
}));

vi.mock("../store", () => ({
	useDialogStore: (selector: (state: { closeDialog: typeof mocks.closeDialog }) => unknown) =>
		selector({ closeDialog: mocks.closeDialog }),
}));

vi.mock("@/hooks/use-form-blocker", () => ({
	useFormBlocker: () => undefined,
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		resume: {
			create: { mutationOptions: () => ({}) },
			import: { mutationOptions: () => ({}) },
		},
	},
}));

vi.mock("@/features/resume/word-template/thumbnail", () => ({
	WordTemplateLiveThumbnail: ({ template }: { template: { id: string; name: string } }) => (
		<div data-template-id={template.id}>{template.name}</div>
	),
}));

vi.mock("@/features/resume/builder/draft", () => ({
	usePatchResume: () => vi.fn(),
}));

vi.mock("@reactive-resume/ui/components/dialog", () => ({
	DialogContent: ({ children }: ChildrenProps) => <div>{children}</div>,
	DialogDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
	DialogFooter: ({ children }: ChildrenProps) => <div>{children}</div>,
	DialogHeader: ({ children }: ChildrenProps) => <div>{children}</div>,
	DialogTitle: ({ children }: ChildrenProps) => <div>{children}</div>,
}));

vi.mock("@lingui/react/macro", () => ({
	Trans: ({ children }: ChildrenProps) => <>{children}</>,
}));

vi.mock("@lingui/react", () => ({
	Trans: ({ children }: ChildrenProps) => <>{children}</>,
}));

const { CreateResumeDialog } = await import("./index");

beforeEach(() => {
	mocks.closeDialog.mockReset();
	mocks.form.handleSubmit.mockReset();
	mocks.form.setFieldValue.mockReset();
	mocks.navigate.mockReset();
	mocks.mutate.mockReset();
	mocks.name = "";
});

describe("CreateResumeDialog", () => {
	it("shows the usable starter modes and the built-in word templates", () => {
		const html = renderToStaticMarkup(<CreateResumeDialog />);

		expect(html).toContain("Word 模板库");
		expect(html).toContain("空白简历");
		expect(html).not.toContain("上传 Word 模板");
		expect(html).toContain("校招实习标准模板");
		expect(html).toContain("ATS 单栏精简模板");
		expect(html).toContain("蓝灰侧栏双栏模板");
	});
});
