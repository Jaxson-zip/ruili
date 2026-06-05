import { describe, expect, it } from "vitest";
import {
	buildPolishResumeItemMessages,
	normalizePolishedResumeItemOutput,
	polishedResumeItemOutputSchema,
} from "./polish";

describe("resume item polish", () => {
	it("sanitizes polished rich text before returning it to the editor", () => {
		const output = normalizePolishedResumeItemOutput({
			headline: " 高级前端工程师 ",
			descriptionHtml: '<p>负责 CRM 权限体系重构。</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>',
		});

		expect(output.headline).toBe("高级前端工程师");
		expect(output.descriptionHtml).toContain("CRM 权限体系重构");
		expect(output.descriptionHtml).not.toContain("<script");
		expect(output.descriptionHtml).not.toContain("javascript:");
		expect(polishedResumeItemOutputSchema.parse(output)).toEqual(output);
	});

	it("builds Chinese JD-aware messages without allowing invented facts", () => {
		const messages = buildPolishResumeItemMessages({
			itemKind: "experience",
			targetJobDescription: "岗位要求：React、权限系统、低代码平台经验。",
			item: {
				title: "高级前端工程师",
				organization: "星河科技",
				period: "2021 - 2024",
				location: "杭州",
				descriptionHtml: "<p>负责后台系统建设。</p>",
			},
		});

		const serialized = JSON.stringify(messages);
		expect(serialized).toContain("简体中文");
		expect(serialized).toContain("不要编造");
		expect(serialized).toContain("React、权限系统、低代码平台经验");
		expect(serialized).toContain("星河科技");
	});
});
