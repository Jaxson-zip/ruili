import { describe, expect, it } from "vitest";
import { featuredTemplateIds, homepageTemplateIds, primaryTemplateIds, templates } from "./data";

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
				"collection007",
				"collection016",
				"collection017",
				"collection018",
				"collection019",
				"collection020",
				"collection021",
				"collection022",
				"collection024",
				"collection026",
				"collection027",
				"collection028",
				"collection029",
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

	it("provides a name, audience, recommendation, image, and tags for every template", () => {
		for (const [id, meta] of entries) {
			expect(meta.name, id).toBeTruthy();
			expect(meta.audience, id).toBeTruthy();
			expect(meta.audience, id).not.toMatch(/中文模板|可导出/);
			expect(meta.description, id).toBeDefined();
			expect(meta.imageUrl, id).toMatch(/^\/templates\/(jpg|collection|online)\/.+\.(jpg|svg)$/);
			expect(Array.isArray(meta.tags), id).toBe(true);
			expect(meta.tags.length, id).toBeGreaterThanOrEqual(3);
			expect(meta.tags, id).not.toContain("中文模板");
			expect(meta.tags, id).not.toContain("可导出");
		}
	});

	it("keeps featured template positioning specific enough to compare options", () => {
		for (const id of featuredTemplateIds) {
			expect(templates[id].audience, id).toMatch(/适合/);
			expect(templates[id].tags.slice(0, 3).join(" "), id).not.toMatch(/中文模板|可导出/);
		}

		expect(templates.collection001.audience).toBe("适合技术、产品、运营的稳重一页投递");
		expect(templates.collection018.audience).toBe("适合财务、法务、行政等正式场景");
		expect(templates.collection028.audience).toBe("适合带项目链接或作品集入口的候选人");
	});

	it("does not advertise QR codes before PDF export renders real scannable QR codes", () => {
		for (const id of ["collection028", "collection029"] as const) {
			const metadata = templates[id];
			const visibleCopy = [metadata.name, metadata.audience, metadata.description.message, ...metadata.tags].join(" ");

			expect(visibleCopy, id).not.toMatch(/二维码|扫码|QR/i);
			expect(visibleCopy, id).toMatch(/作品|链接|入口/);
		}
	});

	it("uses a recognized sidebar position for every template", () => {
		const validPositions = new Set(["left", "right", "none"]);
		for (const [id, meta] of entries) {
			expect(validPositions.has(meta.sidebarPosition), `${id}: ${meta.sidebarPosition}`).toBe(true);
		}

		expect(templates.collection003.sidebarPosition).toBe("none");
		expect(templates.collection003.tags).toContain("横栏");
	});

	it("uses unique image URLs per template", () => {
		const urls = entries.map(([, m]) => m.imageUrl);
		expect(new Set(urls).size).toBe(urls.length);
	});

	it("keeps featured templates unique and backed by system metadata", () => {
		expect(new Set(featuredTemplateIds).size).toBe(featuredTemplateIds.length);
		expect(featuredTemplateIds).toEqual([
			"collection002",
			"collection003",
			"collection005",
			"collection016",
			"collection017",
			"collection018",
			"collection019",
			"collection021",
			"collection024",
			"collection026",
		]);
		expect(featuredTemplateIds).not.toContain("azurill");
		expect(featuredTemplateIds).not.toContain("onyx");
		expect(featuredTemplateIds).not.toContain("collection020");
		expect(featuredTemplateIds).not.toContain("collection022");
		expect(featuredTemplateIds).not.toContain("collection027");
		expect(featuredTemplateIds).not.toContain("collection029");

		for (const id of featuredTemplateIds) {
			expect(templates[id], id).toBeDefined();
			expect(templates[id].accentColor, id).toMatch(/^rgba\(/);
		}
	});

	it("keeps homepage templates as a curated subset while preserving the full gallery catalog", () => {
		expect(homepageTemplateIds).toEqual(featuredTemplateIds);
		expect(homepageTemplateIds.length).toBeLessThan(primaryTemplateIds.length);

		for (const id of homepageTemplateIds) {
			expect(primaryTemplateIds).toContain(id);
		}

		const downgradedTemplateIds = [
			"collection020",
			"collection022",
			"collection027",
			"collection028",
			"collection029",
		] as const;
		expect(primaryTemplateIds).toEqual(expect.arrayContaining([...downgradedTemplateIds]));
		for (const id of downgradedTemplateIds) {
			expect(homepageTemplateIds).not.toContain(id);
		}
	});

	it("keeps primary templates as the full launch-ready collection catalog", () => {
		expect(primaryTemplateIds).toEqual([
			"collection001",
			"collection002",
			"collection003",
			"collection005",
			"collection007",
			"collection016",
			"collection017",
			"collection018",
			"collection019",
			"collection020",
			"collection021",
			"collection022",
			"collection024",
			"collection026",
			"collection027",
			"collection028",
			"collection029",
		]);
		expect(new Set(primaryTemplateIds).size).toBe(primaryTemplateIds.length);

		for (const id of primaryTemplateIds) {
			expect(id).toMatch(/^collection/);
		}
		for (const id of featuredTemplateIds) {
			expect(primaryTemplateIds).toContain(id);
		}
	});

	it("keeps lowercase ids while exposing localized display names", () => {
		for (const [id, meta] of entries) {
			expect(id).toBe(id.toLowerCase());
			expect(meta.name.toLowerCase()).not.toBe(id);
		}
	});

	it("uses the shared collection preview assets for launch templates", () => {
		for (const id of primaryTemplateIds) {
			const numericId = id.replace("collection", "");
			expect(templates[id].imageUrl).toBe(`/templates/collection/${numericId}.jpg`);
		}

		expect(templates.collection019.imageUrl).toBe("/templates/collection/019.jpg");
		expect(templates.collection026.imageUrl).toBe("/templates/collection/026.jpg");
		expect(templates.collection028.imageUrl).toBe("/templates/collection/028.jpg");
		expect(primaryTemplateIds).toContain("collection028");
		expect(homepageTemplateIds).not.toContain("collection028");
		expect(homepageTemplateIds).toContain("collection019");
		expect(homepageTemplateIds).toContain("collection026");
		expect(primaryTemplateIds).toEqual(expect.arrayContaining(["collection019", "collection026", "collection028"]));
	});
});
