import type { ResumeTemplateStarter } from "@reactive-resume/schema/resume/starters";
import { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import { templates } from "./template/data";

const starterPreviewIds = [
	"frontend-engineer",
	"product-manager",
	"campus-student",
	"growth-operations",
	"frontend-engineer-one-page",
	"frontend-engineer-senior",
	"product-manager-clean",
	"product-manager-one-page",
	"campus-student-compact",
	"campus-student-asian",
	"growth-operations-two-column",
	"growth-operations-consulting",
	"campus-student-blue-blocks",
	"frontend-engineer-dark-orange",
	"growth-operations-blue-qr",
] as const;

export type StarterPreviewId = (typeof starterPreviewIds)[number];

export const starterPreviewImageUrls = Object.fromEntries(
	starterPreviewIds.map((id) => [id, `/templates/starters/${id}.jpg`]),
) as Record<StarterPreviewId, `/templates/starters/${StarterPreviewId}.jpg`>;

export const starterPreviewImageIds = starterPreviewIds;

export function getStarterPreviewImageUrl(starter: Pick<ResumeTemplateStarter, "id" | "template">) {
	if (starter.id in starterPreviewImageUrls) {
		return starterPreviewImageUrls[starter.id as StarterPreviewId];
	}

	return templates[starter.template].imageUrl;
}

export function getMissingStarterPreviewIds() {
	const previewIds = new Set(starterPreviewIds);

	return resumeTemplateStarters.map((starter) => starter.id).filter((id) => !previewIds.has(id as StarterPreviewId));
}
