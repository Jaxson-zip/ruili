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
		expect(source).toMatch(/collection007:[\s\S]*density: "compact"[\s\S]*sectionFrame: "boxed"/);
		expect(source).toMatch(/collection018:[\s\S]*sidebarBackground: "#F3F4F6"/);
		expect(source).toMatch(/collection020:[\s\S]*visualTreatment: "timelineStrip"/);
		expect(source).toContain('visualTreatment: "timelineStrip"');
		expect(source).toContain('visualTreatment: "leftBlock"');
		expect(source).toContain('visualTreatment: "contactBand"');
		expect(source).toContain('const isTimelineStrip = variant.visualTreatment === "timelineStrip"');
		expect(source).toContain('const isLeftBlock = variant.visualTreatment === "leftBlock"');
		expect(source).toContain('const isContactBand = variant.visualTreatment === "contactBand"');
	});

	it("keeps traditional collection previews backed by visible PDF treatments", () => {
		const source = readCollectionSource();

		expect(source).toContain('pageFrame?: "blueBorder"');
		expect(source).toContain('headerMode?: "band" | "center" | "infoTable" | "pill" | "solidBand"');
		expect(source).toMatch(/collection001:[\s\S]*headerMode: "infoTable"/);
		expect(source).toMatch(/collection003:[\s\S]*headerMode: "solidBand"/);
		expect(source).toMatch(/collection027:[\s\S]*headerMode: "infoTable"/);
		expect(source).toMatch(/collection024:[\s\S]*pageFrame: "blueBorder"/);
		expect(source).toMatch(/collection022:[\s\S]*visualTreatment: "timelineStrip"/);
		expect(source).toMatch(/collection029:[\s\S]*referenceStyle: "portfolioSidebar"/);
		expect(source).toContain('const hasBluePageFrame = variant.pageFrame === "blueBorder"');
		expect(source).toContain('const isInfoTableHeader = variant.headerMode === "infoTable"');
		expect(source).toContain('const isSolidBandHeader = variant.headerMode === "solidBand"');
	});

	it("uses real portfolio links instead of decorative fake QR grids", () => {
		const source = readCollectionSource();

		expect(source).toMatch(/collection028:[\s\S]*referenceStyle: "portfolioSidebar"/);
		expect(source).toMatch(/collection029:[\s\S]*referenceStyle: "portfolioSidebar"/);
		expect(source).toContain("const SidebarPortfolioLink");
		expect(source).toContain("basics.website.url");
		expect(source).toContain("<Link src={basics.website.url}");
		expect(source).not.toContain("qrCells");
		expect(source).not.toContain("Array.from({ length: 25 })");
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
