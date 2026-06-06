import type { ResumeTemplateStarter } from "@reactive-resume/schema/resume/starters";
import type { Template } from "@reactive-resume/schema/templates";
import type { RouterInput } from "@/libs/orpc/client";
import type { TemplateMetadata } from "./template/data";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

function cloneStarterData(starter: ResumeTemplateStarter) {
	return JSON.parse(JSON.stringify(starter.data)) as ResumeTemplateStarter["data"];
}

function cloneDefaultResumeData() {
	return JSON.parse(JSON.stringify(defaultResumeData)) as typeof defaultResumeData;
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
