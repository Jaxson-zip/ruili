import { describe, expect, it } from "vitest";
import { resumeTemplateStarters } from "@reactive-resume/schema/resume/starters";
import {
	getLaunchResumeTemplateStarters,
	getMissingStarterPreviewIds,
	getStarterPreviewImageUrl,
	launchStarterIds,
	starterPreviewImageUrls,
} from "./starter-preview";
import { templates } from "./template/data";

describe("starter preview images", () => {
	it("defines a starter-specific preview for every starter", () => {
		expect(getMissingStarterPreviewIds()).toEqual([]);
		expect(Object.keys(starterPreviewImageUrls).sort()).toEqual(
			resumeTemplateStarters.map((starter) => starter.id).sort(),
		);
	});

	it("uses stable public JPG paths for starter-specific previews", () => {
		for (const starter of resumeTemplateStarters) {
			const imageUrl = getStarterPreviewImageUrl(starter);

			expect(imageUrl).toBe(`/templates/starters/${starter.id}.jpg`);
			expect(imageUrl).not.toBe(templates[starter.template].imageUrl);
		}
	});

	it("keeps variants on the same base template visually distinct in the create flow", () => {
		const imageUrls = resumeTemplateStarters.map((starter) => getStarterPreviewImageUrl(starter));

		expect(new Set(imageUrls).size).toBe(imageUrls.length);
		expect(getStarterPreviewImageUrl(resumeTemplateStarters[3])).not.toBe(
			getStarterPreviewImageUrl(resumeTemplateStarters[4]),
		);
	});

	it("keeps the default create flow focused on a small launch set", () => {
		const launchStarters = getLaunchResumeTemplateStarters();

		expect(launchStarterIds).toEqual([
			"frontend-engineer",
			"product-manager",
			"campus-student",
			"growth-operations",
			"frontend-engineer-one-page",
			"product-manager-clean",
		]);
		expect(launchStarters).toHaveLength(6);
		expect(launchStarters.map((starter) => starter.id)).toEqual(launchStarterIds);
		expect(new Set(launchStarters.map((starter) => starter.template)).size).toBeGreaterThanOrEqual(5);
	});
});
