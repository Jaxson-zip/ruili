import { describe, expect, it } from "vitest";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { templates } from "./data";
import { createRecommendedTemplateLayout } from "./layout";

const createImportedLikeData = () => {
	const data = structuredClone(sampleResumeData);

	data.metadata.layout = {
		sidebarWidth: 35,
		pages: [
			{
				fullWidth: false,
				main: ["profiles", "summary", "education", "experience", "projects", "volunteer", "references"],
				sidebar: ["skills", "certifications", "awards", "languages", "interests", "publications"],
			},
		],
	};

	return data;
};

describe("createRecommendedTemplateLayout", () => {
	it("moves profile and skills content into the sidebar for two-column templates", () => {
		const layout = createRecommendedTemplateLayout(createImportedLikeData(), templates.azurill);
		const page = layout.pages[0];

		expect(page?.fullWidth).toBe(false);
		expect(page?.main).toEqual([
			"summary",
			"experience",
			"education",
			"projects",
			"publications",
			"volunteer",
			"019becaf-0b87-769d-98a6-46ccf558c0e8",
		]);
		expect(page?.sidebar).toEqual([
			"profiles",
			"skills",
			"languages",
			"certifications",
			"awards",
			"interests",
			"references",
		]);
	});

	it("uses a single full-width column for no-sidebar templates", () => {
		const layout = createRecommendedTemplateLayout(createImportedLikeData(), templates.onyx);
		const page = layout.pages[0];

		expect(page?.fullWidth).toBe(true);
		expect(page?.sidebar).toEqual([]);
		expect(page?.main).toContain("summary");
		expect(page?.main).toContain("experience");
		expect(page?.main).toContain("skills");
	});

	it("keeps the ATS template as a single-column resume", () => {
		const layout = createRecommendedTemplateLayout(createImportedLikeData(), templates.ditto);
		const page = layout.pages[0];

		expect(page?.fullWidth).toBe(true);
		expect(page?.sidebar).toEqual([]);
		expect(page?.main).toContain("profiles");
		expect(page?.main).toContain("skills");
	});
});
