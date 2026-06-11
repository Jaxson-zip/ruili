// @vitest-environment happy-dom

import { beforeAll, describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { isValidElement } from "react";
import {
	getSectionIcon,
	getSectionTitle,
	leftSidebarSections,
	rightSidebarSections,
	wordTemplateRightSidebarSections,
} from "./section";

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const ALL_SECTIONS = [...leftSidebarSections, ...rightSidebarSections, "cover-letter"] as const;

describe("getSectionTitle", () => {
	it("returns a non-empty string for every known sidebar section", () => {
		for (const section of ALL_SECTIONS) {
			const title = getSectionTitle(section);
			expect(typeof title, section).toBe("string");
			expect(title.length, section).toBeGreaterThan(0);
		}
	});

	it("returns distinct titles for each section", () => {
		const titles = ALL_SECTIONS.map((section) => getSectionTitle(section));
		expect(new Set(titles).size).toBe(titles.length);
	});
});

describe("getSectionIcon", () => {
	it("returns a React element for every known sidebar section", () => {
		for (const section of ALL_SECTIONS) {
			const icon = getSectionIcon(section);
			expect(isValidElement(icon), section).toBe(true);
		}
	});

	it("forwards icon props such as className", () => {
		const icon = getSectionIcon("skills", { className: "custom-class" });
		const props = (icon as React.ReactElement).props as { className?: string };
		expect(props.className).toContain("custom-class");
		// Always merges the shrink-0 baseline class.
		expect(props.className).toContain("shrink-0");
	});
});

describe("sidebar section collections", () => {
	it("expose the documented left-sidebar set", () => {
		expect(leftSidebarSections).toContain("picture");
		expect(leftSidebarSections).toContain("basics");
		expect(leftSidebarSections).toContain("experience");
		expect(leftSidebarSections).toContain("custom");
	});

	it("expose the documented right-sidebar set", () => {
		expect(rightSidebarSections).toContain("template");
		expect(rightSidebarSections).toContain("design");
		expect(rightSidebarSections).toContain("export");
	});

	it("scopes Word template mode to controls that affect the Word workflow", () => {
		expect(wordTemplateRightSidebarSections).toEqual(["template", "layout", "sharing", "export", "information"]);
		expect(wordTemplateRightSidebarSections).not.toContain("typography");
		expect(wordTemplateRightSidebarSections).not.toContain("design");
		expect(wordTemplateRightSidebarSections).not.toContain("styles");
		expect(wordTemplateRightSidebarSections).not.toContain("page");
		expect(wordTemplateRightSidebarSections).not.toContain("notes");
		expect(wordTemplateRightSidebarSections).not.toContain("statistics");
		expect(wordTemplateRightSidebarSections).not.toContain("analysis");
	});

	it("do not overlap (every section belongs to exactly one sidebar)", () => {
		const overlap = leftSidebarSections.filter((s) => (rightSidebarSections as readonly string[]).includes(s));
		expect(overlap).toEqual([]);
	});
});
