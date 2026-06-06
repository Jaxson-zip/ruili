import type { LayoutPage, ResumeData } from "@reactive-resume/schema/resume/data";
import { filterSections } from "../shared/filtering";

type CollectionLayoutVariant = {
	forceSingleColumn?: boolean;
};

const singleColumnSectionOrder = [
	"profiles",
	"summary",
	"experience",
	"education",
	"projects",
	"skills",
	"languages",
	"certifications",
	"awards",
	"publications",
	"volunteer",
	"interests",
	"references",
];

function mergeLayoutSectionIds(main: string[], sidebar: string[]): string[] {
	const sectionIds = [...main];
	const seen = new Set(sectionIds);

	for (const sectionId of sidebar) {
		if (seen.has(sectionId)) continue;
		seen.add(sectionId);
		sectionIds.push(sectionId);
	}

	return sectionIds;
}

function sortSingleColumnSections(sectionIds: string[]) {
	const order = new Map(singleColumnSectionOrder.map((sectionId, index) => [sectionId, index]));

	return [...sectionIds].sort((a, b) => {
		const aOrder = order.get(a) ?? Number.MAX_SAFE_INTEGER;
		const bOrder = order.get(b) ?? Number.MAX_SAFE_INTEGER;

		if (aOrder !== bOrder) return aOrder - bOrder;
		return sectionIds.indexOf(a) - sectionIds.indexOf(b);
	});
}

export function resolveCollectionPageSections({
	data,
	page,
	variant,
}: {
	data: ResumeData;
	page: LayoutPage;
	variant: CollectionLayoutVariant;
}) {
	const sidebarIds = page.fullWidth || variant.forceSingleColumn ? [] : page.sidebar;
	const mainIds = variant.forceSingleColumn
		? sortSingleColumnSections(mergeLayoutSectionIds(page.main, page.sidebar))
		: page.main;
	const sidebarSections = filterSections(sidebarIds, data);

	return {
		hasSidebar: sidebarSections.length > 0,
		mainSections: filterSections(mainIds, data),
		sidebarSections,
	};
}
