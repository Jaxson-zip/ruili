import { describe, expect, it } from "vitest";
import { getLocale, resolveLocale } from "./locale";

describe("resolveLocale", () => {
	it("always resolves valid locales to zh-CN in the single-language app", () => {
		expect(resolveLocale("fr-FR")).toBe("zh-CN");
	});

	it("returns zh-CN default for invalid locale", () => {
		expect(resolveLocale("xx-YY")).toBe("zh-CN");
	});

	it("returns zh-CN default for empty string", () => {
		expect(resolveLocale("")).toBe("zh-CN");
	});
});

describe("getLocale", () => {
	it("ignores persisted browser locale and returns zh-CN", () => {
		expect(getLocale()).toBe("zh-CN");
	});
});
