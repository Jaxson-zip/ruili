// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { getWordTemplateById } from "./library";
import { WordTemplateDataPreview } from "./preview";

const createObjectURL = vi.fn(() => "blob:word-preview-pdf");
const revokeObjectURL = vi.fn();

describe("WordTemplateDataPreview", () => {
	beforeEach(() => {
		Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({
				blob: async () => new Blob(["%PDF-1.7"], { type: "application/pdf" }),
				ok: true,
			})),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		createObjectURL.mockClear();
		revokeObjectURL.mockClear();
	});

	it("renders the compact Word template from the server-generated PDF preview", async () => {
		const data = structuredClone(sampleResumeData);
		data.basics.name = "张锦麟";
		data.basics.headline = "数据标注与测试实习生";
		data.basics.location = "深圳";
		data.sections.education.items[0].school = "深圳职业技术大学";

		const template = getWordTemplateById("compact-blue-grid");

		render(<WordTemplateDataPreview data={data} template={template} />);

		expect(screen.getByTestId("word-template-data-preview")).toBeInTheDocument();
		expect(screen.getByText("正在生成 Word 高保真预览...")).toBeInTheDocument();

		await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

		expect(fetch).toHaveBeenCalledWith(
			"/api/word-template/preview",
			expect.objectContaining({
				method: "POST",
				credentials: "include",
				body: JSON.stringify({ templateId: "compact-blue-grid", data }),
			}),
		);
		expect(screen.getByTestId("word-template-pdf-preview")).toHaveAttribute("src", "blob:word-preview-pdf");
	});

	it("explains when high-fidelity Word preview is not available", async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			blob: async () => new Blob(),
			ok: false,
		} as Response);

		const data = structuredClone(sampleResumeData);
		data.basics.name = "李明";
		const template = getWordTemplateById("compact-blue-grid");

		render(<WordTemplateDataPreview data={data} template={template} />);

		await waitFor(() => expect(screen.getByText("当前环境还不能生成 Word 高保真预览")).toBeInTheDocument());
		expect(screen.getByText(/不代表最终 Word 版式/)).toBeInTheDocument();
		expect(screen.getAllByText("李明").length).toBeGreaterThan(0);
	});

	it("renders the selected Word template with current resume data", () => {
		const data = structuredClone(sampleResumeData);
		data.basics.name = "李明";
		data.basics.headline = "产品经理";
		data.basics.email = "liming@example.com";
		data.basics.phone = "13800000000";
		data.sections.experience.items[0].company = "锐历科技";
		data.sections.education.items[0].school = "复旦大学";

		const template = getWordTemplateById("dark-orange-sidebar");

		render(<WordTemplateDataPreview data={data} template={template} />);

		expect(screen.getByTestId("word-template-data-preview")).toBeInTheDocument();
		expect(screen.getAllByText("李明").length).toBeGreaterThan(0);
		expect(screen.getAllByText("产品经理").length).toBeGreaterThan(0);
		expect(screen.getAllByText("liming@example.com").length).toBeGreaterThan(0);
		expect(screen.getAllByText("13800000000").length).toBeGreaterThan(0);
		expect(screen.getByText("锐历科技")).toBeInTheDocument();
		expect(screen.getByText("复旦大学")).toBeInTheDocument();
	});

	it("commits inline edits from the document canvas", () => {
		const data = structuredClone(sampleResumeData);
		const template = getWordTemplateById("dark-orange-sidebar");
		const onEdit = vi.fn();

		render(<WordTemplateDataPreview data={data} template={template} onEdit={onEdit} />);

		const nameField = screen.getAllByRole("textbox")[0];
		Object.defineProperty(nameField, "innerText", { value: "王小明", configurable: true });
		fireEvent.blur(nameField);

		expect(onEdit).toHaveBeenCalledWith({ type: "basics", field: "name" }, "王小明");
	});
});
