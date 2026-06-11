import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { buildAgentReadableResumeData, buildAgentResumeVisibilityNotes } from "./readable-resume";

describe("agent readable resume data", () => {
	it("omits skill proficiency fields that Word templates do not render", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: "zh-ats-compact-001" };
		data.sections.skills.items = [
			{
				id: "skill-1",
				hidden: false,
				icon: "",
				iconColor: "",
				name: "前端开发",
				proficiency: "熟练",
				level: 5,
				keywords: ["Vue 3", "TypeScript"],
			},
		];

		const readableData = buildAgentReadableResumeData(data);
		const skill = readableData.sections.skills.items[0] as Record<string, unknown>;

		expect(skill.name).toBe("前端开发");
		expect(skill.keywords).toEqual(["Vue 3", "TypeScript"]);
		expect(skill.proficiency).toBeUndefined();
		expect(skill.level).toBeUndefined();
		expect(buildAgentResumeVisibilityNotes(data).join(" ")).toContain("Skill level/proficiency");
	});

	it("keeps skill proficiency fields for non-Word-template resumes", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.wordTemplate = { id: null };
		data.sections.skills.items = [
			{
				id: "skill-1",
				hidden: false,
				icon: "",
				iconColor: "",
				name: "前端开发",
				proficiency: "熟练",
				level: 5,
				keywords: ["Vue 3", "TypeScript"],
			},
		];

		const readableData = buildAgentReadableResumeData(data);
		const skill = readableData.sections.skills.items[0];

		expect(skill?.proficiency).toBe("熟练");
		expect(skill?.level).toBe(5);
		expect(buildAgentResumeVisibilityNotes(data)).toEqual([]);
	});
});
