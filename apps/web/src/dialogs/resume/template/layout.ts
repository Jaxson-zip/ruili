import type { Layout, ResumeData } from "@reactive-resume/schema/resume/data";
import type { TemplateMetadata } from "./data";

type SectionKey = keyof ResumeData["sections"];

const standardSectionKeys = new Set<string>([
	"profiles",
	"experience",
	"education",
	"projects",
	"skills",
	"languages",
	"interests",
	"awards",
	"certifications",
	"publications",
	"volunteer",
	"references",
]);

const mainSectionOrder = ["summary", "experience", "education", "projects", "publications", "volunteer"] as const;
const sidebarSectionOrder = [
	"profiles",
	"skills",
	"languages",
	"certifications",
	"awards",
	"interests",
	"references",
] as const;
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
] as const;

function hasText(value: string) {
	return value.replace(/<[^>]*>/g, "").trim().length > 0;
}

function getStandardSection(data: ResumeData, sectionId: string) {
	if (!standardSectionKeys.has(sectionId)) return null;
	return data.sections[sectionId as SectionKey];
}

function hasVisibleSection(data: ResumeData, sectionId: string) {
	if (sectionId === "summary") return !data.summary.hidden && hasText(data.summary.content);

	const standardSection = getStandardSection(data, sectionId);
	if (standardSection) return !standardSection.hidden && standardSection.items.some((item) => !item.hidden);

	const customSection = data.customSections.find((section) => section.id === sectionId);
	return Boolean(customSection && !customSection.hidden && customSection.items.some((item) => !item.hidden));
}

function visibleSections(data: ResumeData, sectionIds: readonly string[]) {
	return sectionIds.filter((sectionId) => hasVisibleSection(data, sectionId));
}

function visibleCustomSections(data: ResumeData) {
	return data.customSections
		.filter((section) => section.type !== "cover-letter")
		.filter((section) => hasVisibleSection(data, section.id))
		.map((section) => section.id);
}

function uniqueVisibleLayoutSections(data: ResumeData, layout: Layout) {
	const sections: string[] = [];
	const seen = new Set<string>();

	for (const page of layout.pages) {
		for (const sectionId of [...page.main, ...page.sidebar]) {
			if (seen.has(sectionId) || !hasVisibleSection(data, sectionId)) continue;
			seen.add(sectionId);
			sections.push(sectionId);
		}
	}

	return sections;
}

function visibleLayoutSections(data: ResumeData, sectionIds: readonly string[]) {
	return sectionIds.filter((sectionId) => hasVisibleSection(data, sectionId));
}

function arraysEqual(first: string[], second: string[]) {
	return first.length === second.length && first.every((value, index) => value === second[index]);
}

export function createRecommendedTemplateLayout(data: ResumeData, metadata: TemplateMetadata): Layout {
	if (metadata.sidebarPosition === "none") {
		return {
			sidebarWidth: data.metadata.layout.sidebarWidth,
			pages: [
				{
					fullWidth: true,
					main: [...visibleSections(data, singleColumnSectionOrder), ...visibleCustomSections(data)],
					sidebar: [],
				},
			],
		};
	}

	return {
		sidebarWidth: data.metadata.layout.sidebarWidth,
		pages: [
			{
				fullWidth: false,
				main: [...visibleSections(data, mainSectionOrder), ...visibleCustomSections(data)],
				sidebar: visibleSections(data, sidebarSectionOrder),
			},
		],
	};
}

export function needsTemplateLayoutSync(data: ResumeData, metadata: TemplateMetadata): boolean {
	if (metadata.sidebarPosition === "none") {
		if (data.metadata.layout.pages.some((page) => !page.fullWidth || page.sidebar.length > 0)) return true;

		const recommended = createRecommendedTemplateLayout(data, metadata);

		return !arraysEqual(uniqueVisibleLayoutSections(data, data.metadata.layout), recommended.pages[0]?.main ?? []);
	}

	if (data.metadata.layout.pages.length !== 1) return true;

	const current = data.metadata.layout.pages[0];
	const recommended = createRecommendedTemplateLayout(data, metadata).pages[0];
	if (!current || !recommended) return true;
	if (current.fullWidth !== recommended.fullWidth) return true;

	return (
		!arraysEqual(visibleLayoutSections(data, current.main), recommended.main) ||
		!arraysEqual(visibleLayoutSections(data, current.sidebar), recommended.sidebar)
	);
}
