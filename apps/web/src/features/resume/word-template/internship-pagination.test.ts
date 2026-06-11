import { describe, expect, it } from "vitest";
import { paginateInternshipMeasuredLayout } from "./internship-pagination";

describe("paginateInternshipMeasuredLayout", () => {
	it("packs items based on measured heights instead of a fixed item count", () => {
		const pages = paginateInternshipMeasuredLayout({
			continuationPageCapacity: 120,
			firstPageCapacity: 100,
			sectionMeasurements: {
				education: {
					items: [
						{ bottom: 42, top: 0 },
						{ bottom: 84, top: 42 },
					],
				},
				awards: {
					items: [
						{ bottom: 18, top: 0 },
						{ bottom: 36, top: 18 },
						{ bottom: 54, top: 36 },
						{ bottom: 72, top: 54 },
						{ bottom: 90, top: 72 },
						{ bottom: 108, top: 90 },
					],
				},
				projects: {
					items: [{ bottom: 60, top: 0 }],
				},
			},
			sectionOrder: ["education", "awards", "projects"],
		});

		expect(pages).toHaveLength(3);
		expect(pages[0]).toEqual([{ continuation: false, end: 2, sectionId: "education", start: 0 }]);
		expect(pages[1]).toEqual([{ continuation: false, end: 6, sectionId: "awards", start: 0 }]);
		expect(pages[2]).toEqual([{ continuation: false, end: 1, sectionId: "projects", start: 0 }]);
	});

	it("starts a fresh page when a section continues after the current one is full", () => {
		const pages = paginateInternshipMeasuredLayout({
			continuationPageCapacity: 80,
			firstPageCapacity: 55,
			sectionMeasurements: {
				awards: {
					items: [
						{ bottom: 22, top: 0 },
						{ bottom: 44, top: 22 },
						{ bottom: 66, top: 44 },
					],
				},
			},
			sectionOrder: ["awards"],
		});

		expect(pages).toHaveLength(2);
		expect(pages[0]).toEqual([{ continuation: false, end: 2, sectionId: "awards", start: 0 }]);
		expect(pages[1]).toEqual([{ continuation: true, end: 3, sectionId: "awards", start: 2 }]);
	});

	it("moves awards to the next page when the current page would only show a tiny opening", () => {
		const pages = paginateInternshipMeasuredLayout({
			continuationPageCapacity: 120,
			firstPageCapacity: 100,
			minSectionStartItems: { awards: 4 },
			sectionMeasurements: {
				education: {
					items: [{ bottom: 72, top: 0 }],
				},
				awards: {
					items: [
						{ bottom: 18, top: 0 },
						{ bottom: 36, top: 18 },
						{ bottom: 54, top: 36 },
						{ bottom: 72, top: 54 },
						{ bottom: 90, top: 72 },
					],
				},
			},
			sectionOrder: ["education", "awards"],
		});

		expect(pages).toEqual([
			[{ continuation: false, end: 1, sectionId: "education", start: 0 }],
			[{ continuation: false, end: 5, sectionId: "awards", start: 0 }],
		]);
	});
});
