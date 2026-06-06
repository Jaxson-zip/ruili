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
});
