import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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
});
