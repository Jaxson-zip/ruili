import { describe, expect, it } from "vitest";
import { getBuilderPreviewInitialScale } from "./preview-scale";

describe("getBuilderPreviewInitialScale", () => {
	it("keeps the desktop builder preview at the familiar scale", () => {
		expect(getBuilderPreviewInitialScale(1280)).toBe(0.75);
	});

	it("fits the A4 preview into narrow mobile browsers", () => {
		expect(getBuilderPreviewInitialScale(358)).toBeCloseTo(0.52, 2);
	});

	it("does not shrink below the readable minimum", () => {
		expect(getBuilderPreviewInitialScale(280)).toBe(0.5);
	});
});
