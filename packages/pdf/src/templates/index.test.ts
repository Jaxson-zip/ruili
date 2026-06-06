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
		expect(registry).toContain("collection001: Collection001Page");
		expect(registry).toContain("collection002: Collection002Page");
		expect(registry).toContain("collection003: Collection003Page");
		expect(registry).toContain("collection005: Collection005Page");
	});

	it("uses the same fallback as invalid persisted template metadata", () => {
		expect(registry).toContain("export const defaultTemplatePage = OnyxPage;");
	});
});
