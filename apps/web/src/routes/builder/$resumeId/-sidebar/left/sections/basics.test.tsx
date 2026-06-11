// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

type TransMockProps = { children?: ReactNode; message?: string };
type FieldMockProps = {
	children: (field: {
		handleBlur: () => void;
		handleChange: (value: unknown) => void;
		name: string;
		state: { meta: { errors: unknown[]; isTouched: boolean }; value: unknown };
	}) => ReactNode;
	name: string;
};

const mocks = vi.hoisted(() => ({
	currentResume: vi.fn(),
	formValues: {} as Record<string, unknown>,
	handleSubmit: vi.fn(),
	setFieldValue: vi.fn(),
	updateResumeData: vi.fn(),
}));

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => mocks.currentResume(),
	useUpdateResumeData: () => mocks.updateResumeData,
}));

vi.mock("@/hooks/use-sync-form-values", () => ({
	useSyncFormValues: () => undefined,
}));

vi.mock("@lingui/react/macro", () => ({
	Trans: ({ children, message }: TransMockProps) => <>{children ?? message}</>,
}));

vi.mock("@lingui/react", () => ({
	Trans: ({ children, message }: TransMockProps) => <>{children ?? message}</>,
}));

vi.mock("@/libs/tanstack-form", () => ({
	useAppForm: () => ({
		Field: ({ children, name }: FieldMockProps) =>
			children({
				handleBlur: vi.fn(),
				handleChange: (value: unknown) => {
					mocks.formValues[name] = value;
				},
				name,
				state: { meta: { errors: [], isTouched: false }, value: mocks.formValues[name] },
			}),
		handleSubmit: mocks.handleSubmit,
		setFieldValue: mocks.setFieldValue,
		state: { values: mocks.formValues },
	}),
}));

vi.mock("../shared/section-base", () => ({
	SectionBase: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./custom-fields", () => ({
	CustomFieldsSection: () => <div data-testid="custom-fields" />,
}));

const { BasicsSectionBuilder } = await import("./basics");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

beforeEach(() => {
	mocks.currentResume.mockReset();
	mocks.handleSubmit.mockReset();
	mocks.setFieldValue.mockReset();
	mocks.updateResumeData.mockReset();
	mocks.formValues = structuredClone(defaultResumeData.basics);
	mocks.formValues.website = { label: "", url: "https://github.com/ruili" };
});

function renderBasicsForTemplate(templateId?: "zh-ats-compact-001" | "zh-internship-001" | "zh-sidebar-clean-001") {
	const data = structuredClone(defaultResumeData);
	data.metadata.wordTemplate = { id: templateId ?? null };
	data.basics = mocks.formValues as typeof data.basics;
	mocks.currentResume.mockReturnValue({ id: "resume-1", data });

	render(<BasicsSectionBuilder />);
}

describe("BasicsSectionBuilder", () => {
	it("shows a personal link input for ATS Word template resumes", () => {
		renderBasicsForTemplate("zh-ats-compact-001");

		expect(screen.getByLabelText("GitHub / 个人链接")).toBeInTheDocument();
		expect(screen.getByDisplayValue("github.com/ruili")).toBeInTheDocument();
	});

	it("keeps the frozen internship Word template from showing an unrelated website field", () => {
		renderBasicsForTemplate("zh-internship-001");

		expect(screen.queryByLabelText("GitHub / 个人链接")).not.toBeInTheDocument();
		expect(screen.queryByDisplayValue("github.com/ruili")).not.toBeInTheDocument();
	});

	it("persists edits from the personal link input", () => {
		renderBasicsForTemplate("zh-ats-compact-001");

		fireEvent.change(screen.getByDisplayValue("github.com/ruili"), { target: { value: "github.com/new-ruili" } });

		expect(mocks.formValues.website).toMatchObject({ url: "https://github.com/new-ruili" });
		expect(mocks.handleSubmit).toHaveBeenCalled();
	});
});
