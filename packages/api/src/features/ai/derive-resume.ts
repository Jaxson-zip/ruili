import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { ModelMessage } from "ai";

type BuildDeriveResumeForJobMessagesInput = {
	resumeData: ResumeData;
	jdText: string;
	roleTitle?: string;
	company?: string;
};

export function buildJobDerivedResumeName(
	originalName: string,
	target: { company?: string | null; roleTitle?: string | null },
) {
	const suffix = [target.company?.trim(), target.roleTitle?.trim()].filter(Boolean).join(" ") || "JD定制";
	const name = `${originalName.trim()} - ${suffix}`;
	return name.length <= 80 ? name : `${name.slice(0, 77)}...`;
}

export function buildDeriveResumeForJobMessages(input: BuildDeriveResumeForJobMessagesInput): ModelMessage[] {
	return [
		{
			role: "system",
			content: [
				"你是面向中国求职者的中文简历定制助手。",
				"请基于用户已有简历和目标 JD，生成一份新的 ResumeData JSON。",
				"必须使用简体中文，适配中文招聘场景和 ATS 关键词扫描。",
				"不要编造公司、学校、时间、地点、项目、证书、奖项、指标、技术栈或任何用户没有提供的事实。",
				"可以在不改变事实的前提下调整摘要、工作经历/项目经历描述、技能排序、关键词侧重和岗位标题表达。",
				"如 JD 要求与原简历事实不匹配，只能弱化无关内容，不能添加不存在经历。",
				"必须保留原简历 schema 结构、id、metadata、layout、template 和自定义字段。",
				"只返回 JSON 对象，不要返回 markdown、解释或代码块。",
			].join("\n"),
		},
		{
			role: "user",
			content: JSON.stringify(
				{
					task: "derive_resume_for_target_job",
					target: {
						company: input.company ?? "",
						roleTitle: input.roleTitle ?? "",
						jdText: input.jdText,
					},
					resumeData: input.resumeData,
				},
				null,
				2,
			),
		},
	];
}
