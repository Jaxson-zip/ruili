import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { resolveUserFromRequestHeaders } from "@reactive-resume/api/context";
import { resumeDataSchema } from "@reactive-resume/schema/resume/data";
import { renderWordTemplateDocx } from "./docx";

const execFileAsync = promisify(execFile);

const previewRequestSchema = z.object({
	templateId: z.enum(["compact-blue-grid", "dark-orange-sidebar"]),
	data: resumeDataSchema,
});

const wordTemplateFileNames = {
	"compact-blue-grid": "compact-blue-grid.docx",
	"dark-orange-sidebar": "dark-orange-sidebar.docx",
} as const;

export type WordTemplatePreviewDeps = {
	convertDocxToPdf?: (docxPath: string, outDir: string) => Promise<string>;
	makeTempDir?: () => Promise<string>;
	readTemplateDocx?: (templateId: keyof typeof wordTemplateFileNames) => Promise<Buffer>;
	renderTemplateDocx?: (template: Buffer, data: ResumeData) => Promise<Buffer>;
	resolveUser?: (headers: Headers) => Promise<unknown>;
};

export async function handleWordTemplatePreview(request: Request, deps: WordTemplatePreviewDeps = {}) {
	const resolveUser = deps.resolveUser ?? resolveUserFromRequestHeaders;
	const user = await resolveUser(request.headers);

	if (!user) return json({ code: "UNAUTHORIZED", message: "Authentication is required." }, 401);

	let payload: z.infer<typeof previewRequestSchema>;
	try {
		payload = previewRequestSchema.parse(await request.json());
	} catch {
		return json({ code: "BAD_REQUEST", message: "Invalid Word template preview request." }, 400);
	}

	const makeTempDir = deps.makeTempDir ?? (() => mkdtemp(join(tmpdir(), "ruili-word-preview-")));
	const readTemplateDocx = deps.readTemplateDocx ?? readWordTemplateDocx;
	const renderTemplateDocx = deps.renderTemplateDocx ?? renderWordTemplateDocx;
	const convertDocxToPdf = deps.convertDocxToPdf ?? convertWordDocxToPdf;

	const tempDir = await makeTempDir();
	const shouldCleanup = !deps.makeTempDir;

	try {
		const template = await readTemplateDocx(payload.templateId);
		const renderedDocx = await renderTemplateDocx(template, payload.data);
		const docxPath = join(tempDir, "preview.docx");

		await writeFile(docxPath, renderedDocx);

		const pdfPath = await convertDocxToPdf(docxPath, tempDir);
		const pdf = await readFile(pdfPath);

		return new Response(pdf, {
			headers: {
				"cache-control": "no-store",
				"content-disposition": 'inline; filename="ruili-word-preview.pdf"',
				"content-type": "application/pdf",
			},
		});
	} catch (error) {
		console.warn("[WordTemplatePreview]", error);

		return json(
			{
				code: "DOCX_TO_PDF_UNAVAILABLE",
				message:
					"The server cannot convert DOCX templates to PDF. Install LibreOffice/soffice to enable high-fidelity Word preview.",
			},
			503,
		);
	} finally {
		if (shouldCleanup) await rm(tempDir, { recursive: true, force: true });
	}
}

async function readWordTemplateDocx(templateId: keyof typeof wordTemplateFileNames) {
	const fileName = wordTemplateFileNames[templateId];
	const candidates = [
		resolve(process.cwd(), "apps/web/public/templates/word", fileName),
		resolve(process.cwd(), "apps/web/dist/templates/word", fileName),
		resolve(process.cwd(), "../web/public/templates/word", fileName),
		resolve(process.cwd(), "../web/dist/templates/word", fileName),
	];

	const templatePath = candidates.find((candidate) => existsSync(candidate));
	if (!templatePath) throw new Error(`Word template not found: ${fileName}`);

	return await readFile(templatePath);
}

export async function convertWordDocxToPdf(docxPath: string, outDir: string) {
	const soffice = findSofficeExecutable();
	if (!soffice) throw new Error("LibreOffice soffice executable was not found.");

	await execFileAsync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", outDir, docxPath], {
		timeout: 60_000,
		windowsHide: true,
	});

	const pdfPath = join(outDir, `${basename(docxPath, ".docx")}.pdf`);
	if (!existsSync(pdfPath)) throw new Error(`LibreOffice did not create ${pdfPath}`);

	return pdfPath;
}

function findSofficeExecutable() {
	const envPath = process.env.SOFFICE_PATH ?? process.env.LIBREOFFICE_PATH;
	const candidates = [
		envPath,
		"soffice",
		"libreoffice",
		"C:\\Program Files\\LibreOffice\\program\\soffice.exe",
		"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
	].filter(Boolean) as string[];

	return candidates.find(
		(candidate) => candidate === "soffice" || candidate === "libreoffice" || existsSync(candidate),
	);
}

function json(body: unknown, status: number) {
	return Response.json(body, { status });
}
