import type { ResumeTemplateStarter } from "@reactive-resume/schema/resume/starters";
import type { RouterInput } from "@/libs/orpc/client";

function cloneStarterData(starter: ResumeTemplateStarter) {
	return JSON.parse(JSON.stringify(starter.data)) as ResumeTemplateStarter["data"];
}

export function buildResumeStarterImportInput(
	starter: ResumeTemplateStarter,
	requestedName?: string,
): RouterInput["resume"]["import"] {
	const name = requestedName?.trim() || starter.resumeName;

	return {
		name,
		preferRequestedName: true,
		data: cloneStarterData(starter),
	};
}
