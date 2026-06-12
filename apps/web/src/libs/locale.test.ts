import { describe, expect, it } from "vitest";
import { msg } from "@lingui/core/macro";
import { getLocale, getLocaleMessages, resolveLocale } from "./locale";

const flattenMessage = (value: unknown): string => {
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.map(flattenMessage).join("");
	return "";
};

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

describe("getLocaleMessages", () => {
	it("includes Chinese translations for home page production message ids", async () => {
		const { messages } = await getLocaleMessages("zh-CN");

		const homeMessages = [
			msg`中文简历生成与优化工作台`,
			msg`开始使用`,
			msg`核心能力`,
			msg`中文优先`,
			msg`中文简历模板与风格`,
		];

		for (const descriptor of homeMessages) {
			expect(flattenMessage(messages[descriptor.id])).toBe(descriptor.message);
		}
	});

	it("includes Chinese translations for auth page production message ids", async () => {
		const { messages } = await getLocaleMessages("zh-CN");

		const authMessages = [
			msg`登录账号`,
			msg`邮箱地址`,
			msg`密码`,
			msg`登录`,
			msg`立即创建`,
			msg`也可以使用用户名登录。`,
			msg`通行密钥`,
		];

		for (const descriptor of authMessages) {
			expect(flattenMessage(messages[descriptor.id])).toBe(descriptor.message);
		}
	});

	it("does not include empty Chinese translations for production message ids", async () => {
		const { messages } = await getLocaleMessages("zh-CN");

		const emptyMessageIds = Object.entries(messages)
			.filter(([id, value]) => id.length > 0 && flattenMessage(value).length === 0)
			.map(([id]) => id);

		expect(emptyMessageIds).toEqual([]);
	});
});
