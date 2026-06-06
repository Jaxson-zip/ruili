import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readAzurillSource = () => readFileSync(fileURLToPath(new URL("./AzurillPage.tsx", import.meta.url)), "utf8");

describe("AzurillPage design treatment", () => {
	it("keeps the header as a soft information panel with compact contact chips", () => {
		const source = readAzurillSource();

		expect(source).toContain('const headerSurface = "#EEF5FC"');
		expect(source).toContain("headerContactItem: {");
		expect(source).toContain("backgroundColor: contactChipSurface");
		expect(source).toContain("borderRadius: 3");
	});

	it("uses grouped sidebar sections and main content cards to avoid a plain two-column skin", () => {
		const source = readAzurillSource();

		expect(source).toContain("section: (context) => ({");
		expect(source).toContain("backgroundColor: sidebarPanel");
		expect(source).toContain("item: (context) => ({");
		expect(source).toContain("backgroundColor: mainItemSurface");
	});
});
