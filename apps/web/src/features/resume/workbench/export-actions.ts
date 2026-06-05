import type { Resume } from "@/features/resume/builder/draft";
import { buildDocx } from "@reactive-resume/docx";
import { downloadWithAnchor, generateFilename } from "@reactive-resume/utils/file";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";

type ExportableResume = Pick<Resume, "data" | "name">;

export async function exportResumePdf(resume: ExportableResume) {
	const blob = await createResumePdfBlob(resume.data);
	downloadWithAnchor(blob, generateFilename(resume.name, "pdf"));
}

export async function exportResumeDocx(resume: ExportableResume) {
	const blob = await buildDocx(resume.data);
	downloadWithAnchor(blob, generateFilename(resume.name, "docx"));
}

export function exportResumeJson(resume: ExportableResume) {
	const blob = new Blob([JSON.stringify(resume.data, null, 2)], { type: "application/json" });
	downloadWithAnchor(blob, generateFilename(resume.name, "json"));
}
