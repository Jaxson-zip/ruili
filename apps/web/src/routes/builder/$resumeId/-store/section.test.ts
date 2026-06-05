// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { useSectionStore } from "./section";

afterEach(() => {
	useSectionStore.setState({ sections: {}, selectedSection: null, selectionRequestId: 0 });
});

describe("useSectionStore", () => {
	it("starts with no collapsed sections", () => {
		expect(useSectionStore.getState().sections).toEqual({});
	});

	it("setCollapsed stores collapse state for a single id", () => {
		useSectionStore.getState().setCollapsed("experience", true);

		expect(useSectionStore.getState().sections.experience).toEqual({ collapsed: true });
	});

	it("setCollapsed(false) overrides previous collapsed=true", () => {
		const { setCollapsed } = useSectionStore.getState();
		setCollapsed("skills", true);
		setCollapsed("skills", false);

		expect(useSectionStore.getState().sections.skills).toEqual({ collapsed: false });
	});

	it("toggleCollapsed flips from undefined → true → false", () => {
		const { toggleCollapsed } = useSectionStore.getState();

		toggleCollapsed("education");
		expect(useSectionStore.getState().sections.education?.collapsed).toBe(true);

		toggleCollapsed("education");
		expect(useSectionStore.getState().sections.education?.collapsed).toBe(false);
	});

	it("toggleAll collapses all built-in sidebar sections from a clean state", () => {
		useSectionStore.getState().toggleAll();

		const sections = useSectionStore.getState().sections;
		// Spot-check a few known sidebar section ids.
		expect(sections.experience?.collapsed).toBe(true);
		expect(sections.template?.collapsed).toBe(true);
		expect(sections.layout?.collapsed).toBe(true);
		expect(Object.keys(sections).length).toBeGreaterThan(10);
	});

	it("toggleAll flips each individual section independently of the others", () => {
		const { setCollapsed, toggleAll } = useSectionStore.getState();

		setCollapsed("skills", true); // skills starts collapsed=true
		// Other ids remain undefined → treated as collapsed=false by toggleCollapsed semantics.

		toggleAll();

		const sections = useSectionStore.getState().sections;
		expect(sections.skills?.collapsed).toBe(false);
		expect(sections.experience?.collapsed).toBe(true);
	});

	it("selectSection expands the target section and records a navigation request", () => {
		const { selectSection, setCollapsed } = useSectionStore.getState();

		setCollapsed("experience", true);
		selectSection("experience");

		const state = useSectionStore.getState();
		expect(state.sections.experience?.collapsed).toBe(false);
		expect(state.selectedSection).toBe("experience");
		expect(state.selectionRequestId).toBe(1);
	});

	it("selectSection increments the navigation request even when selecting the same section again", () => {
		const { selectSection } = useSectionStore.getState();

		selectSection("template");
		selectSection("template");

		const state = useSectionStore.getState();
		expect(state.selectedSection).toBe("template");
		expect(state.selectionRequestId).toBe(2);
	});

	it("clearSelectedSection clears the active editor target without changing collapse state", () => {
		const { clearSelectedSection, selectSection } = useSectionStore.getState();

		selectSection("summary");
		clearSelectedSection();

		const state = useSectionStore.getState();
		expect(state.selectedSection).toBeNull();
		expect(state.selectionRequestId).toBe(1);
		expect(state.sections.summary?.collapsed).toBe(false);
	});
});
