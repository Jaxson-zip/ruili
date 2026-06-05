import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { buildDeriveResumeForJobMessages, buildJobDerivedResumeName } from "./derive-resume";

describe("JD-derived resume helpers", () => {
	it("builds a concise Chinese copy name from company and role", () => {
		expect(buildJobDerivedResumeName("基础简历", { company: "字节跳动", roleTitle: "前端工程师" })).toBe(
			"基础简历 - 字节跳动 前端工程师",
		);
		expect(buildJobDerivedResumeName("基础简历", {})).toBe("基础简历 - JD定制");
	});

	it("builds messages that preserve facts while aligning to the JD", () => {
		const messages = buildDeriveResumeForJobMessages({
			resumeData: defaultResumeData,
			jdText: "负责 B 端 SaaS、权限系统、React 性能优化。",
			roleTitle: "高级前端工程师",
			company: "星河科技",
		});

		const serialized = JSON.stringify(messages);
		expect(serialized).toContain("简体中文");
		expect(serialized).toContain("不要编造");
		expect(serialized).toContain("权限系统");
		expect(serialized).toContain("高级前端工程师");
		expect(serialized).toContain(defaultResumeData.basics.name);
	});
});
