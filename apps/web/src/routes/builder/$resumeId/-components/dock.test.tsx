// @vitest-environment happy-dom

import type React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

const buildDocx = vi.hoisted(() => vi.fn().mockResolvedValue(new Blob(["docx"])));
const copyToClipboard = vi.hoisted(() => vi.fn());
const createResumePdfBlob = vi.hoisted(() => vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })));
const buildDocxFromTemplate = vi.hoisted(() => vi.fn().mockResolvedValue(new Blob(["template-docx"])));
const createWordTemplateHtmlPreviewPdfBlob = vi.hoisted(() =>
	vi.fn().mockResolvedValue(new Blob(["html-preview-pdf"], { type: "application/pdf" })),
);
const downloadWithAnchor = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@reactive-resume/docx", () => ({ buildDocx }));
vi.mock("@reactive-resume/ui/components/tooltip", () => ({
	Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	TooltipTrigger: ({ render }: { render: React.ReactNode }) => render,
}));
vi.mock("@reactive-resume/utils/file", () => ({
	downloadWithAnchor,
	generateFilename: (name: string, ext: string) => `${name}.${ext}`,
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("motion/react", () => ({ m: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> } }));
vi.mock("react-zoom-pan-pinch", () => ({
	useControls: () => ({
		centerView: vi.fn(),
		zoomIn: vi.fn(),
		zoomOut: vi.fn(),
	}),
}));
vi.mock("sonner", () => ({
	toast: {
		dismiss: vi.fn(),
		error: vi.fn(),
		loading: vi.fn(() => "toast-id"),
		success: vi.fn(),
	},
}));
vi.mock("usehooks-ts", () => ({ useCopyToClipboard: () => [undefined, copyToClipboard] }));
vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({ id: "resume-1", name: "My Resume", slug: "my-resume", data: defaultResumeData }),
}));
vi.mock("@/features/resume/export/docx-template", () => ({ buildDocxFromTemplate }));
vi.mock("@/features/resume/export/html-preview-pdf", () => ({ createWordTemplateHtmlPreviewPdfBlob }));
vi.mock("@/features/resume/export/pdf-document", () => ({ createResumePdfBlob }));
vi.mock("@/libs/auth/client", () => ({
	authClient: { useSession: () => ({ data: { user: { username: "demo" } } }) },
}));

const { BuilderDock } = await import("./dock");
const { setSelectedWordTemplateId } = await import("@/features/resume/word-template/library");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "zh", messages: {} });
});

afterEach(() => {
	buildDocx.mockClear();
	buildDocxFromTemplate.mockClear();
	createResumePdfBlob.mockClear();
	createWordTemplateHtmlPreviewPdfBlob.mockClear();
	downloadWithAnchor.mockClear();
	vi.unstubAllGlobals();
	localStorage.clear();
});

function renderDock() {
	return render(
		<I18nProvider i18n={i18n}>
			<BuilderDock pageLayout="vertical" onTogglePageLayout={vi.fn()} />
		</I18nProvider>,
	);
}

function getPdfButton(container: HTMLElement) {
	const buttons = Array.from(container.querySelectorAll("button"));
	const button = buttons.find((button) => button.getAttribute("aria-label")?.includes("PDF"));
	if (!button) throw new Error("PDF button not found.");
	return button;
}

function getDocxButton(container: HTMLElement) {
	const buttons = Array.from(container.querySelectorAll("button"));
	const button = buttons.find((button) => button.getAttribute("aria-label")?.includes("DOCX"));
	if (!button) throw new Error("DOCX button not found.");
	return button;
}

describe("BuilderDock", () => {
	it("does not expose the developer JSON download action in the floating dock", () => {
		const { queryByRole } = renderDock();

		expect(queryByRole("button", { name: /JSON/ })).not.toBeInTheDocument();
	});

	it("exports the selected Word template DOCX from the fixed template", async () => {
		const templateBlob = new Blob(["template"]);
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(templateBlob)),
		);
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		const { container } = renderDock();

		fireEvent.click(getDocxButton(container));

		await waitFor(() => expect(buildDocxFromTemplate).toHaveBeenCalledWith(templateBlob, defaultResumeData));
		expect(buildDocx).not.toHaveBeenCalled();
		expect(fetch).toHaveBeenCalledWith("/templates/word/zh-internship-001.docx");
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "My Resume.docx");
	});

	it("keeps the generic DOCX export when no Word template is active", async () => {
		const { container } = renderDock();

		fireEvent.click(getDocxButton(container));

		await waitFor(() => expect(buildDocx).toHaveBeenCalledWith(defaultResumeData));
		expect(buildDocxFromTemplate).not.toHaveBeenCalled();
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "My Resume.docx");
	});

	it("exports the selected Word template PDF from the realtime HTML preview", async () => {
		setSelectedWordTemplateId("resume-1", "zh-internship-001");
		const { container } = renderDock();

		fireEvent.click(getPdfButton(container));

		await waitFor(() => expect(createWordTemplateHtmlPreviewPdfBlob).toHaveBeenCalledTimes(1));
		expect(createResumePdfBlob).not.toHaveBeenCalled();
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "My Resume.pdf");
	});

	it("keeps the generic PDF export when no Word template is active", async () => {
		const { container } = renderDock();

		fireEvent.click(getPdfButton(container));

		await waitFor(() => expect(createResumePdfBlob).toHaveBeenCalledWith(defaultResumeData));
		expect(createWordTemplateHtmlPreviewPdfBlob).not.toHaveBeenCalled();
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "My Resume.pdf");
	});
});
