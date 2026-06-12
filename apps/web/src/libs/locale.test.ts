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

	it("includes Chinese translations for global command palette production message ids", async () => {
		const { messages } = await getLocaleMessages("zh-CN");

		const commandPaletteMessages = [msg`简历编辑命令面板`, msg`输入命令或搜索...`, msg`命令面板`];

		for (const descriptor of commandPaletteMessages) {
			expect(flattenMessage(messages[descriptor.id])).toBe(descriptor.message);
		}
	});

	it("includes Chinese translations for dashboard and settings production message ids", async () => {
		const { messages } = await getLocaleMessages("zh-CN");

		const dashboardMessages = [
			msg`我的简历`,
			msg`AI 助手`,
			msg`设置`,
			msg`个人资料`,
			msg`创建简历`,
			msg`填写内容`,
			msg`选择模板`,
			msg`导出 PDF`,
			msg`最近更新`,
			msg`创建时间`,
			msg`名称`,
			msg`网格`,
			msg`列表`,
			msg`基础`,
			msg`专业`,
			msg`教育经历`,
			msg`奖项`,
			msg`工作经历`,
			msg`项目`,
			msg`技能`,
		];

		for (const descriptor of dashboardMessages) {
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
