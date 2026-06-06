import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";
import { resolveCollectionPageSections } from "./layout";

const readCollectionSource = () =>
	readFileSync(fileURLToPath(new URL("./CollectionPage.tsx", import.meta.url)), "utf8");

describe("CollectionPage variants", () => {
	it("keeps collection019 on the right side to match its template metadata", () => {
		const source = readCollectionSource();

		expect(source).toContain('sidebarSide?: "left" | "right"');
		expect(source).toContain('sidebarSide: "right"');
		expect(source).toContain('variant.sidebarSide === "right" ? mainColumn : sidebarColumn');
		expect(source).toContain('variant.sidebarSide === "right" ? sidebarColumn : mainColumn');
	});

	it("assigns distinct visual treatments to polished collection variants", () => {
		const source = readCollectionSource();

		expect(source).toContain('visualTreatment?: "timelineStrip" | "leftBlock" | "contactBand"');
		expect(source).toContain('visualTreatment: "timelineStrip"');
		expect(source).toContain('visualTreatment: "leftBlock"');
		expect(source).toContain('visualTreatment: "contactBand"');
		expect(source).toContain('const isTimelineStrip = variant.visualTreatment === "timelineStrip"');
		expect(source).toContain('const isLeftBlock = variant.visualTreatment === "leftBlock"');
		expect(source).toContain('const isContactBand = variant.visualTreatment === "contactBand"');
	});

	it("stretches sidebars to the page height so rendered PDFs match their previews", () => {
		const source = readCollectionSource();

		expect(source).toContain('alignItems: "stretch"');
		expect(source).toContain('minHeight: "100%"');
		expect(source).toContain('alignSelf: "stretch"');
	});

	it("merges stale sidebar content into the main flow for single-column collection templates", () => {
		const page = {
			fullWidth: false,
			main: ["summary", "experience"],
			sidebar: ["profiles", "skills"],
		};

		const sections = resolveCollectionPageSections({
			data: sampleResumeData,
			page,
			variant: { forceSingleColumn: true },
		});

		expect(sections.hasSidebar).toBe(false);
		expect(sections.sidebarSections).toEqual([]);
		expect(sections.mainSections.at(0)).toBe("profiles");
		expect(sections.mainSections).toContain("profiles");
		expect(sections.mainSections).toContain("skills");
	});

	it("keeps sidebar content for two-column collection templates", () => {
		const page = {
			fullWidth: false,
			main: ["summary", "experience"],
			sidebar: ["profiles", "skills"],
		};

		const sections = resolveCollectionPageSections({
			data: sampleResumeData,
			page,
			variant: {},
		});

		expect(sections.hasSidebar).toBe(true);
		expect(sections.sidebarSections).toContain("profiles");
		expect(sections.sidebarSections).toContain("skills");
		expect(sections.mainSections).not.toContain("skills");
	});
});
