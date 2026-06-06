import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { templateSchema } from "@reactive-resume/schema/templates";

describe("templatePages", () => {
	const registry = readFileSync(fileURLToPath(new URL("./index.ts", import.meta.url)), "utf8");

	it("registers Scizor as a renderable template page", () => {
		expect(registry).toContain('import { ScizorPage } from "./scizor/ScizorPage";');
		expect(registry).toContain("scizor: ScizorPage");
	});

	it("registers every schema template as a renderable page", () => {
		for (const template of templateSchema.options) {
			expect(registry, template).toContain(`${template}: `);
		}
		expect(registry).toContain("satisfies Record<Template, TemplatePage>");
	});

	it("registers promoted Chinese reference templates as real renderable pages", () => {
		expect(registry).toContain('from "./collection/CollectionPage";');
		expect(registry).toContain("Collection001Page");
		expect(registry).toContain("Collection002Page");
		expect(registry).toContain("Collection003Page");
		expect(registry).toContain("Collection005Page");
		expect(registry).toContain("Collection007Page");
		expect(registry).toContain("Collection016Page");
		expect(registry).toContain("Collection017Page");
		expect(registry).toContain("Collection018Page");
		expect(registry).toContain("Collection020Page");
		expect(registry).toContain("Collection021Page");
		expect(registry).toContain("Collection022Page");
		expect(registry).toContain("Collection024Page");
		expect(registry).toContain("Collection027Page");
		expect(registry).toContain("Collection029Page");
		expect(registry).toContain("collection001: Collection001Page");
		expect(registry).toContain("collection002: Collection002Page");
		expect(registry).toContain("collection003: Collection003Page");
		expect(registry).toContain("collection005: Collection005Page");
		expect(registry).toContain("collection007: Collection007Page");
		expect(registry).toContain("collection016: Collection016Page");
		expect(registry).toContain("collection017: Collection017Page");
		expect(registry).toContain("collection018: Collection018Page");
		expect(registry).toContain("collection020: Collection020Page");
		expect(registry).toContain("collection021: Collection021Page");
		expect(registry).toContain("collection022: Collection022Page");
		expect(registry).toContain("collection024: Collection024Page");
		expect(registry).toContain("collection027: Collection027Page");
		expect(registry).toContain("collection029: Collection029Page");
	});

	it("registers newly promoted Chinese collection styles as real renderable pages", () => {
		expect(registry).toContain("Collection019Page");
		expect(registry).toContain("Collection026Page");
		expect(registry).toContain("Collection028Page");
		expect(registry).toContain("collection019: Collection019Page");
		expect(registry).toContain("collection026: Collection026Page");
		expect(registry).toContain("collection028: Collection028Page");
	});

	it("uses the same fallback as invalid persisted template metadata", () => {
		expect(registry).toContain("export const defaultTemplatePage = OnyxPage;");
	});
});
