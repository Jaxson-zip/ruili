import { describe, expect, it } from "vitest";
import { paginateAtsMeasuredLayout } from "./ats-pagination";

describe("paginateAtsMeasuredLayout", () => {
	it("flows measured sections onto continuation pages instead of clipping the first page", () => {
		const pages = paginateAtsMeasuredLayout({
			continuationPageCapacity: 180,
			firstPageCapacity: 120,
			sectionMeasurements: {
				education: {
					items: [{ bottom: 48, top: 24 }],
				},
				projects: {
					footerGap: 8,
					items: [
						{ bottom: 58, top: 24 },
						{ bottom: 116, top: 58 },
						{ bottom: 174, top: 116 },
					],
				},
			},
			sectionOrder: ["education", "projects"],
		});

		expect(pages).toEqual([
			[
				{ end: 1, sectionId: "education", start: 0 },
				{ end: 1, sectionId: "projects", start: 0 },
			],
			[{ end: 3, sectionId: "projects", start: 1 }],
		]);
	});

	it("uses the larger continuation capacity after the first page", () => {
		const pages = paginateAtsMeasuredLayout({
			continuationPageCapacity: 140,
			firstPageCapacity: 70,
			sectionMeasurements: {
				awards: {
					items: [
						{ bottom: 32, top: 16 },
						{ bottom: 64, top: 32 },
						{ bottom: 96, top: 64 },
						{ bottom: 128, top: 96 },
					],
				},
			},
			sectionOrder: ["awards"],
		});

		expect(pages).toEqual([[{ end: 2, sectionId: "awards", start: 0 }], [{ end: 4, sectionId: "awards", start: 2 }]]);
	});

	it("moves a new section to the next page when too few opening items fit", () => {
		const pages = paginateAtsMeasuredLayout({
			continuationPageCapacity: 120,
			firstPageCapacity: 100,
			minSectionStartItems: { awards: 3 },
			sectionMeasurements: {
				education: {
					items: [{ bottom: 72, top: 0 }],
				},
				awards: {
					items: [
						{ bottom: 20, top: 0 },
						{ bottom: 40, top: 20 },
						{ bottom: 60, top: 40 },
						{ bottom: 80, top: 60 },
					],
				},
			},
			sectionOrder: ["education", "awards"],
		});

		expect(pages).toEqual([
			[{ end: 1, sectionId: "education", start: 0 }],
			[{ end: 4, sectionId: "awards", start: 0 }],
		]);
	});
});
