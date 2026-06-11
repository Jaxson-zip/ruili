import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

type TransMockProps = { children: ReactNode };
type FieldMockProps = {
	children: (field: {
		handleBlur: () => void;
		handleChange: () => void;
		name: string;
		state: { meta: { errors: unknown[]; isTouched: boolean }; value: unknown };
	}) => ReactNode;
	name: string;
};

const mocks = vi.hoisted(() => ({
	currentResume: vi.fn(),
	formValues: {} as Record<string, unknown>,
	updateResumeData: vi.fn(),
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => mocks.currentResume(),
	useUpdateResumeData: () => mocks.updateResumeData,
}));

vi.mock("@/hooks/use-sync-form-values", () => ({
	useSyncFormValues: () => undefined,
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({ mutate: vi.fn() }),
	useQuery: () => ({ data: undefined }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		storage: {
			deleteFile: { mutationOptions: () => ({}) },
			uploadFile: { mutationOptions: () => ({}) },
		},
	},
}));

vi.mock("@lingui/react/macro", () => ({
	Trans: ({ children }: TransMockProps) => <>{children}</>,
}));

vi.mock("@lingui/react", () => ({
	Trans: ({ children }: TransMockProps) => <>{children}</>,
}));

vi.mock("@/libs/tanstack-form", () => ({
	useAppForm: () => ({
		Field: ({ children, name }: FieldMockProps) =>
			children({
				handleBlur: vi.fn(),
				handleChange: vi.fn(),
				name,
				state: { meta: { errors: [], isTouched: false }, value: mocks.formValues[name] },
			}),
		handleSubmit: vi.fn(),
		setFieldValue: vi.fn(),
		state: { values: mocks.formValues },
	}),
}));

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const { PictureSectionBuilder } = await import("./picture");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

beforeEach(() => {
	mocks.currentResume.mockReset();
	mocks.updateResumeData.mockReset();
	mocks.formValues = structuredClone(defaultResumeData.picture);
});

describe("PictureSectionBuilder", () => {
	it("hides fixed-template-irrelevant geometry controls for Word template resumes", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: "zh-internship-001" };
		mocks.currentResume.mockReturnValue({ id: "resume-1", data });

		const html = renderToStaticMarkup(<PictureSectionBuilder />);

		expect(html).toContain("当前 Word 模板使用固定证件照位置");
		expect(html).not.toContain("大小");
		expect(html).not.toContain("旋转");
		expect(html).not.toContain("宽高比");
		expect(html).not.toContain("边框宽度");
	});
});
