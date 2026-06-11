import type { Resume } from "@/features/resume/builder/draft";
import { getSelectedWordTemplate } from "@/features/resume/word-template/library";

type AgentPreviewResume = Pick<Resume, "data" | "id"> | null | undefined;

export function getAgentResumeWordTemplate(resume: AgentPreviewResume) {
	if (!resume) return undefined;
	return getSelectedWordTemplate(resume.id, resume.data);
}
