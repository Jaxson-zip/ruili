import type { ResumeTemplateStarter } from "@reactive-resume/schema/resume/starters";
import type { RouterInput } from "@/libs/orpc/client";
import type { CollectionTemplateReference } from "./template/data";
import { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import { templates } from "./template/data";
import { createRecommendedTemplateLayout } from "./template/layout";

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

export function getStarterForCollectionReference(reference: CollectionTemplateReference): ResumeTemplateStarter {
	const tags = new Set<string>(reference.tags);
	const targetStarterId = tags.has("校招")
		? "campus-student"
		: tags.has("运营") || tags.has("市场") || tags.has("内容") || tags.has("职能")
			? "growth-operations"
			: tags.has("商务") || tags.has("咨询") || tags.has("管理层")
				? "product-manager"
				: "frontend-engineer";

	const starter = resumeTemplateStarters.find((starter) => starter.id === targetStarterId) ?? resumeTemplateStarters[0];
	if (!starter) throw new Error("Expected at least one resume starter.");

	return starter;
}

export function buildCollectionReferenceStarterImportInput(
	reference: CollectionTemplateReference,
	requestedName?: string,
): RouterInput["resume"]["import"] {
	const starter = getStarterForCollectionReference(reference);
	const data = cloneStarterData(starter);

	data.metadata.template = reference.baseTemplate;
	data.metadata.design.colors.primary = reference.accentColor;
	data.metadata.layout = createRecommendedTemplateLayout(data, {
		...templates[reference.baseTemplate],
		sidebarPosition: reference.sidebarPosition,
	});

	const name = requestedName?.trim() || `${starter.resumeName}-${reference.name}`;

	return {
		name,
		preferRequestedName: true,
		data,
	};
}
