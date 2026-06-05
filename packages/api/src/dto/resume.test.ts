import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { redactResumeForViewer } from "../features/resume/access-policy";
import { resumeDto } from "./resume";

describe("resume DTO output validation", () => {
	it("accepts an optional import name alongside parsed resume data", () => {
		const result = resumeDto.import.input.parse({
			data: defaultResumeData,
			name: "  frontend-resume.docx  ",
			preferRequestedName: true,
		});

		expect(result.name).toBe("frontend-resume.docx");
		expect(result.preferRequestedName).toBe(true);
	});

	it("accepts public resume responses after owner-only fields are redacted", () => {
		const dbResume = {
			id: "019e128d-0598-75d2-ae6a-771e2eb84614",
			userId: "019bef93-a165-72cb-9c0e-d96e00000000",
			name: "Armed Amaranth Catshark",
			slug: "armed-amaranth-catshark",
			tags: [],
			data: {
				...defaultResumeData,
				metadata: {
					...defaultResumeData.metadata,
					notes: "owner-only notes",
				},
			},
			isPublic: true,
			isLocked: false,
			hasPassword: false,
		};

		const publicResume = {
			...redactResumeForViewer(dbResume, false),
			hasPassword: dbResume.hasPassword,
		};

		expect(publicResume.name).toBe("");
		expect(publicResume.data.metadata.notes).toBe("");
		expect(resumeDto.getBySlug.output.safeParse(publicResume).success).toBe(true);
	});

	it("accepts JD context for deriving a tailored duplicate", () => {
		const result = resumeDto.deriveWithJob.input.parse({
			id: "resume-1",
			company: " 星河科技 ",
			roleTitle: " 高级前端工程师 ",
			jdText: "负责 B 端 SaaS、权限系统、React 性能优化，并参与跨团队协作。",
		});

		expect(result.company).toBe("星河科技");
		expect(result.roleTitle).toBe("高级前端工程师");
		expect(result.jdText).toContain("React");
	});
});
