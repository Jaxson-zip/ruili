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
		expect(screen.getByText("创建简历")).toBeInTheDocument();
		expect(screen.getByText("选样张或模板开始")).toBeInTheDocument();
		expect(screen.getByAltText("前端工程师样张预览")).toBeInTheDocument();
		expect(screen.getByAltText("中文模板预览")).toBeInTheDocument();
	});

	it("opens the resume.create dialog when clicked", () => {
		render(<CreateResumeCard />);

		fireEvent.click(screen.getByRole("button", { name: /创建简历/ }));

		const state = useDialogStore.getState();
		expect(state.open).toBe(true);
		expect(state.activeDialog?.type).toBe("resume.create");
	});
});

describe("ImportResumeCard", () => {
	it("renders the import-resume copy", () => {
		render(<ImportResumeCard />);
		expect(screen.getByText("导入已有简历")).toBeInTheDocument();
		expect(screen.getByText("支持 Word / PDF / 图片 / JSON")).toBeInTheDocument();
		expect(screen.getByText("PDF")).toBeInTheDocument();
		expect(screen.getByText("Word")).toBeInTheDocument();
		expect(screen.getByText("图片")).toBeInTheDocument();
		expect(screen.getByText("JSON")).toBeInTheDocument();
	});

	it("opens the resume.import dialog when clicked", () => {
		render(<ImportResumeCard />);

		fireEvent.click(screen.getByRole("button", { name: /导入已有简历/ }));

		const state = useDialogStore.getState();
		expect(state.open).toBe(true);
		expect(state.activeDialog?.type).toBe("resume.import");
	});
});
