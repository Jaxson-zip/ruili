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

		expect(source).toContain(
			'visualTreatment?: "timelineStrip" | "leftBlock" | "contactBand" | "sidebarRail" | "softCards" | "topRule"',
		);
		expect(source).toContain('visualTreatment: "timelineStrip"');
		expect(source).toContain('visualTreatment: "leftBlock"');
		expect(source).toContain('visualTreatment: "contactBand"');
		expect(source).toMatch(/collection016:[\s\S]*?visualTreatment: "sidebarRail"/);
		expect(source).toMatch(/collection017:[\s\S]*?visualTreatment: "softCards"/);
		expect(source).toMatch(/collection021:[\s\S]*?visualTreatment: "topRule"/);
		expect(source).toContain('const isTimelineStrip = variant.visualTreatment === "timelineStrip"');
		expect(source).toContain('const isLeftBlock = variant.visualTreatment === "leftBlock"');
		expect(source).toContain('const isContactBand = variant.visualTreatment === "contactBand"');
		expect(source).toContain('const isSidebarRail = variant.visualTreatment === "sidebarRail"');
		expect(source).toContain('const isSoftCards = variant.visualTreatment === "softCards"');
		expect(source).toContain('const isTopRule = variant.visualTreatment === "topRule"');
	});
});
