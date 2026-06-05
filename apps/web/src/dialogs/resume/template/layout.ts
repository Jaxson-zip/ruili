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
	"summary",
	"experience",
	"education",
	"projects",
	"skills",
	"profiles",
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
