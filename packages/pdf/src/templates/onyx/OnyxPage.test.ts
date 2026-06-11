import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { hasOnyxHeaderContent } from "./header";

const readOnyxSource = () => readFileSync(fileURLToPath(new URL("./OnyxPage.tsx", import.meta.url)), "utf8");

describe("OnyxPage design treatment", () => {
	it("does not render the dark identity header for an empty blank resume", () => {
		expect(hasOnyxHeaderContent(defaultResumeData)).toBe(false);
	});

	it("trims contact fields when deciding whether the identity header has content", () => {
		const data = structuredClone(defaultResumeData);
		data.basics.phone = "  ";

		expect(hasOnyxHeaderContent(data)).toBe(false);
	});

	it("keeps contact information as compact chips instead of pipe-separated text", () => {
		const source = readOnyxSource();

		expect(source).toContain("contactItem: {");
		expect(source).toContain('backgroundColor: "#1D2939"');
		expect(source).not.toContain("<Text style={styles.contactDivider}>|</Text>");
	});

	it("uses elevated project blocks to differ from plain divider-based single-column templates", () => {
		const source = readOnyxSource();

		expect(source).toContain("compactProjectItem: {");
		expect(source).toContain("backgroundColor: projectSurface");
		expect(source).toContain("borderLeftWidth: 2.2");
		expect(source).toContain("paddingHorizontal: metrics.gapX(0.42)");
	});
});
