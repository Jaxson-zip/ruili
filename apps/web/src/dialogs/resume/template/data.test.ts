import { describe, expect, it } from "vitest";
import {
	additionalCollectionTemplateReferences,
	collectionTemplateReferences,
	deferredCollectionTemplateReferences,
	featuredTemplateIds,
	onlineStyleTemplateReferences,
	primaryTemplateIds,
	recommendedCollectionTemplateReferences,
	templates,
} from "./data";

describe("templates metadata", () => {
	const entries = Object.entries(templates);

	it("declares the expected template ids", () => {
		const ids = Object.keys(templates).sort();
		expect(ids).toEqual(
			[
				"azurill",
				"bronzor",
				"collection001",
				"collection002",
				"collection003",
				"collection005",
				"collection016",
				"collection020",
				"collection021",
				"collection024",
				"chikorita",
				"ditgar",
				"ditto",
				"gengar",
				"glalie",
				"kakuna",
				"lapras",
				"leafish",
				"meowth",
				"onyx",
				"pikachu",
				"rhyhorn",
				"scizor",
			].sort(),
		);
	});

	it("provides a name, description, image, and tags for every template", () => {
		for (const [id, meta] of entries) {
			expect(meta.name, id).toBeTruthy();
			expect(meta.description, id).toBeDefined();
			expect(meta.imageUrl, id).toBe(`/templates/jpg/${id}.jpg`);
			expect(Array.isArray(meta.tags), id).toBe(true);
			expect(meta.tags.length, id).toBeGreaterThan(0);
		}
	});

	it("uses a recognized sidebar position for every template", () => {
		const validPositions = new Set(["left", "right", "none"]);
		for (const [id, meta] of entries) {
			expect(validPositions.has(meta.sidebarPosition), `${id}: ${meta.sidebarPosition}`).toBe(true);
		}
	});

	it("uses unique image URLs per template", () => {
		const urls = entries.map(([, m]) => m.imageUrl);
		expect(new Set(urls).size).toBe(urls.length);
	});

	it("keeps featured templates unique and backed by system metadata", () => {
		expect(new Set(featuredTemplateIds).size).toBe(featuredTemplateIds.length);
		expect(featuredTemplateIds).toEqual([
			"collection001",
			"collection002",
			"collection003",
			"collection005",
			"collection016",
			"collection020",
			"collection021",
			"collection024",
		]);
		expect(featuredTemplateIds).not.toContain("azurill");
		expect(featuredTemplateIds).not.toContain("onyx");

		for (const id of featuredTemplateIds) {
			expect(templates[id], id).toBeDefined();
			expect(templates[id].accentColor, id).toMatch(/^rgba\(/);
		}
	});

	it("keeps primary templates as a small subset of featured templates", () => {
		expect(primaryTemplateIds).toEqual(featuredTemplateIds);
		expect(new Set(primaryTemplateIds).size).toBe(primaryTemplateIds.length);

		for (const id of primaryTemplateIds) {
			expect(featuredTemplateIds).toContain(id);
		}
	});

	it("keeps lowercase ids while exposing localized display names", () => {
		for (const [id, meta] of entries) {
			expect(id).toBe(id.toLowerCase());
			expect(meta.name.toLowerCase()).not.toBe(id);
		}
	});

	it("keeps downloaded collection references available for promotion or style reference", () => {
		expect(collectionTemplateReferences).toHaveLength(24);
		expect(new Set(collectionTemplateReferences.map((reference) => reference.id)).size).toBe(
			collectionTemplateReferences.length,
		);

		for (const reference of collectionTemplateReferences) {
			expect(reference.id).toMatch(/^collection-\d{3}$/);
			expect(reference.imageUrl).toMatch(/^\/templates\/collection\/\d{3}\.jpg$/);
			expect(templates[reference.baseTemplate], reference.id).toBeDefined();
			expect(reference.tags.length, reference.id).toBeGreaterThan(0);
			expect(["上线推荐", "可参考", "待重做"]).toContain(reference.review);
			expect(["left", "right", "none"]).toContain(reference.sidebarPosition);
		}
	});

	it("exposes clean online style references for homepage and template gallery", () => {
		expect(onlineStyleTemplateReferences).toHaveLength(8);
		expect(new Set(onlineStyleTemplateReferences.map((reference) => reference.id)).size).toBe(
			onlineStyleTemplateReferences.length,
		);

		for (const reference of onlineStyleTemplateReferences) {
			expect(reference.id).toMatch(/^online-/);
			expect(reference.imageUrl).toMatch(/^\/templates\/online\/.+\.svg$/);
			expect(templates[reference.baseTemplate], reference.id).toBeDefined();
			expect(reference.review).toBe("上线推荐");
			expect(reference.tags.length, reference.id).toBeGreaterThan(0);
		}
	});

	it("splits collection references by launch readiness", () => {
		expect(recommendedCollectionTemplateReferences).toHaveLength(0);
		expect(additionalCollectionTemplateReferences).toHaveLength(11);
		expect(deferredCollectionTemplateReferences).toHaveLength(5);
		expect([
			...recommendedCollectionTemplateReferences,
			...additionalCollectionTemplateReferences,
			...deferredCollectionTemplateReferences,
		]).toHaveLength(collectionTemplateReferences.length - 8);

		for (const promotedId of ["001", "002", "003", "005", "016", "020", "021", "024"]) {
			expect(templates[`collection${promotedId}` as keyof typeof templates]).toBeDefined();
			expect(
				recommendedCollectionTemplateReferences.some((reference) => reference.id === `collection-${promotedId}`),
			).toBe(false);
		}

		for (const reference of recommendedCollectionTemplateReferences) {
			expect(reference.review).toBe("上线推荐");
		}
		for (const reference of additionalCollectionTemplateReferences) {
			expect(reference.review).toBe("可参考");
		}
		for (const reference of deferredCollectionTemplateReferences) {
			expect(reference.review).toBe("待重做");
		}
	});
});
