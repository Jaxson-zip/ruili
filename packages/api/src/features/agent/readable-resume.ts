import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { wordTemplateIds } from "@reactive-resume/schema/resume/word-template";

const wordTemplateIdSet = new Set<string>(wordTemplateIds);

export function isWordTemplateResumeData(data: ResumeData) {
	const templateId = data.metadata.wordTemplate?.id;
	return Boolean(templateId && wordTemplateIdSet.has(templateId));
}

export function buildAgentReadableResumeData(data: ResumeData) {
	const readableData = structuredClone(data) as ResumeData & {
		sections: ResumeData["sections"] & {
			skills: ResumeData["sections"]["skills"] & {
				items: Array<Record<string, unknown>>;
			};
		};
	};

	if (!isWordTemplateResumeData(data)) return readableData;

	for (const skill of readableData.sections.skills.items) {
		const mutableSkill = skill as Partial<Record<"level" | "proficiency", unknown>>;
		delete mutableSkill.level;
		delete mutableSkill.proficiency;
	}

	return readableData;
}

export function buildAgentResumeVisibilityNotes(data: ResumeData) {
	if (!isWordTemplateResumeData(data)) return [];

	return [
		"Current Word templates render skills as skill name plus keywords only.",
		"Skill level/proficiency fields are intentionally hidden from this read_resume payload; do not evaluate or mention them unless the user explicitly asks about hidden structured data.",
	];
}
