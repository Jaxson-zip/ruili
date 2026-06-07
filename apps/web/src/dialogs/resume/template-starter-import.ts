import type { ResumeTemplateStarter } from "@reactive-resume/schema/resume/starters";
import type { Template } from "@reactive-resume/schema/templates";
import type { RouterInput } from "@/libs/orpc/client";
import type { TemplateMetadata } from "./template/data";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { sampleResumeData } from "@reactive-resume/schema/resume/sample";

function cloneStarterData(starter: ResumeTemplateStarter) {
	return JSON.parse(JSON.stringify(starter.data)) as ResumeTemplateStarter["data"];
}

function cloneDefaultResumeData() {
	return JSON.parse(JSON.stringify(defaultResumeData)) as typeof defaultResumeData;
}

function cloneSampleResumeData() {
	return JSON.parse(JSON.stringify(sampleResumeData)) as typeof sampleResumeData;
}

function createBlankLayout(metadata: TemplateMetadata) {
	if (metadata.sidebarPosition === "none") {
		return {
			sidebarWidth: defaultResumeData.metadata.layout.sidebarWidth,
			pages: [
				{
					fullWidth: true,
					main: [
						"summary",
						"experience",
						"education",
						"projects",
						"skills",
						"profiles",
						"languages",
						"certifications",
						"awards",
						"publications",
						"volunteer",
						"interests",
						"references",
					],
					sidebar: [],
				},
			],
		};
	}

	return {
		sidebarWidth: 30,
		pages: [
			{
				fullWidth: false,
				main: ["summary", "experience", "education", "projects", "publications", "volunteer"],
				sidebar: ["profiles", "skills", "languages", "certifications", "awards", "interests", "references"],
			},
		],
	};
}

export function buildResumeStarterImportInput(
	starter: ResumeTemplateStarter,
	requestedName?: string,
): RouterInput["resume"]["import"] {
	const name = requestedName?.trim() || starter.resumeName;

	return {
		name,
		preferRequestedName: true,
		data: cloneStarterData(starter),
	};
}

export function buildBlankTemplateImportInput(
	template: Template,
	metadata: TemplateMetadata,
	requestedName?: string,
): RouterInput["resume"]["import"] {
	const data = cloneDefaultResumeData();
	data.metadata.template = template;
	data.metadata.page.locale = "zh-CN";
	data.metadata.layout = createBlankLayout(metadata);
	if (metadata.accentColor) data.metadata.design.colors.primary = metadata.accentColor;
	data.metadata.typography.body.fontFamily = "Noto Sans SC";
	data.metadata.typography.heading.fontFamily = "Noto Sans SC";

	return {
		name: requestedName?.trim() || `${metadata.name} 空白简历`,
		preferRequestedName: true,
		data,
	};
}

export function buildWordTemplateImportInput(requestedName?: string): RouterInput["resume"]["import"] {
	const data = cloneSampleResumeData();
	data.metadata.template = "onyx";
	data.metadata.page.locale = "zh-CN";
	data.metadata.layout = {
		sidebarWidth: 30,
		pages: [
			{
				fullWidth: false,
				main: ["summary", "experience", "projects", "education"],
				sidebar: ["profiles", "skills", "languages", "certifications", "awards", "interests", "references"],
			},
		],
	};
	data.metadata.design.colors.primary = "rgba(255, 133, 0, 1)";
	data.metadata.typography.body.fontFamily = "Noto Sans SC";
	data.metadata.typography.heading.fontFamily = "Noto Sans SC";

	return {
		name: requestedName?.trim() || "中文 Word 模板简历",
		preferRequestedName: true,
		data,
	};
}
