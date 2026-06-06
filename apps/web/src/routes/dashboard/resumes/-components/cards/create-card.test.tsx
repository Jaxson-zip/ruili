// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { useDialogStore } from "@/dialogs/store";
import { CreateResumeCard } from "./create-card";
import { ImportResumeCard } from "./import-card";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

afterEach(() => {
	useDialogStore.setState({ open: false, activeDialog: null, onBeforeClose: null });
});

describe("CreateResumeCard", () => {
	it("renders the create-resume copy", () => {
		render(<CreateResumeCard />);
		expect(screen.getByText("选择模板创建")).toBeInTheDocument();
		expect(screen.getByText("先选真实模板，再填写内容")).toBeInTheDocument();
	});

	it("opens the resume.create dialog when clicked", () => {
		render(<CreateResumeCard />);

		fireEvent.click(screen.getByRole("button", { name: /选择模板创建/ }));

		const state = useDialogStore.getState();
		expect(state.open).toBe(true);
		expect(state.activeDialog?.type).toBe("resume.create");
	});
});

describe("ImportResumeCard", () => {
	it("renders the import-resume copy", () => {
		render(<ImportResumeCard />);
		expect(screen.getByText("导入已有简历")).toBeInTheDocument();
		expect(screen.getByText("继续编辑已有版本")).toBeInTheDocument();
	});

	it("opens the resume.import dialog when clicked", () => {
		render(<ImportResumeCard />);

		fireEvent.click(screen.getByRole("button", { name: /导入已有简历/ }));

		const state = useDialogStore.getState();
		expect(state.open).toBe(true);
		expect(state.activeDialog?.type).toBe("resume.import");
	});
});
