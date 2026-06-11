import type { ResumeData } from "./data";

export const wordTemplateIds = ["zh-internship-001", "zh-ats-compact-001", "zh-sidebar-clean-001"] as const;
export type WordTemplateId = (typeof wordTemplateIds)[number];

export type WordTemplateManifest = {
	id: WordTemplateId;
	docxFileName: string;
	previewFileName: string;
	renderView: "zhInternship" | "chinese";
	slots: WordTemplateSlots;
};

export type WordTemplateSlots = {
	awards?: number;
	education?: number;
	experience?: number;
	projects?: number;
	skills?: number;
};

export const wordTemplateManifests = [
	{
		id: "zh-internship-001",
		docxFileName: "zh-internship-001.docx",
		previewFileName: "zh-internship-001.png",
		renderView: "zhInternship",
		slots: { awards: 15, education: 2, experience: 2, projects: 3 },
	},
	{
		id: "zh-ats-compact-001",
		docxFileName: "zh-ats-compact-001.docx",
		previewFileName: "zh-ats-compact-001.png",
		renderView: "chinese",
		slots: { awards: 6, education: 1, experience: 1, projects: 3, skills: 3 },
	},
	{
		id: "zh-sidebar-clean-001",
		docxFileName: "zh-sidebar-clean-001.docx",
		previewFileName: "zh-sidebar-clean-001.png",
		renderView: "chinese",
		slots: { awards: 8, education: 1, experience: 1, projects: 2, skills: 3 },
	},
] as const satisfies readonly WordTemplateManifest[];

export function getWordTemplateManifest(id: string | null | undefined) {
	if (!id) return undefined;
	return wordTemplateManifests.find((template) => template.id === id);
}

export type TemplateLine = {
	text: string;
};

export type ChineseResumeBasics = {
	name: string;
	headline: string;
	email: string;
	phone: string;
	location: string;
	gender: string;
	birthday: string;
};

export type ChineseResumeEducation = {
	school: string;
	degree: string;
	area: string;
	grade: string;
	location: string;
	period: string;
	description: string;
};

export type ChineseResumeAward = {
	title: string;
	awarder: string;
	date: string;
	description: string;
};

export type ChineseResumeCertification = {
	title: string;
	issuer: string;
	date: string;
	description: string;
};

export type ChineseResumeExperience = {
	company: string;
	position: string;
	location: string;
	period: string;
	description: string;
	descriptionLines: TemplateLine[];
	roles: Array<{
		position: string;
		period: string;
		description: string;
		descriptionLines: TemplateLine[];
	}>;
};

export type ChineseResumeProject = {
	name: string;
	period: string;
	description: string;
	descriptionLines: TemplateLine[];
};

export type ChineseResumeSkill = {
	name: string;
	proficiency: string;
	keywords: string[];
};

export type ChineseResumeLanguage = {
	language: string;
	fluency: string;
	level: number;
};

export type ChineseResumeInterest = {
	name: string;
	keywords: string[];
};

export type ChineseResumeProfile = {
	network: string;
	username: string;
	url: string;
};

export type ChineseResumePublication = {
	title: string;
	publisher: string;
	date: string;
	description: string;
};

export type ChineseResumeVolunteer = {
	organization: string;
	location: string;
	period: string;
	description: string;
	descriptionLines: TemplateLine[];
};

export type ChineseResumeReference = {
	name: string;
	position: string;
	phone: string;
	description: string;
};

export type ChineseResumeModel = {
	basics: ChineseResumeBasics;
	summary: {
		content: string;
	};
	education: ChineseResumeEducation[];
	awards: ChineseResumeAward[];
	certifications: ChineseResumeCertification[];
	experience: ChineseResumeExperience[];
	projects: ChineseResumeProject[];
	skills: ChineseResumeSkill[];
	languages: ChineseResumeLanguage[];
	interests: ChineseResumeInterest[];
	profiles: ChineseResumeProfile[];
	publications: ChineseResumePublication[];
	volunteer: ChineseResumeVolunteer[];
	references: ChineseResumeReference[];
};

export type ZhInternshipTemplateViewModel = {
	basics: ChineseResumeBasics;
	education: ChineseResumeEducation;
	awards: Array<Pick<ChineseResumeAward, "title">>;
	experience: ChineseResumeExperience;
	projects: ChineseResumeProject[];
};

export type WordTemplateRenderData = ResumeData & {
	chinese: ChineseResumeModel;
	zhInternship: ZhInternshipTemplateViewModel;
};

export function buildWordTemplateRenderData(data: ResumeData): WordTemplateRenderData {
	const chinese = buildChineseResumeModel(data);

	return {
		...data,
		chinese,
		zhInternship: buildZhInternshipTemplateViewModelFromChinese(chinese),
	};
}

export function buildChineseResumeModel(data: ResumeData): ChineseResumeModel {
	return {
		basics: {
			name: data.basics.name,
			headline: data.basics.headline,
			email: data.basics.email,
			phone: data.basics.phone,
			location: data.basics.location,
			gender: getCustomFieldText(data, ["zh-internship-gender", "gender"], 0),
			birthday: getCustomFieldText(data, ["zh-internship-birthday", "birthday"], 1),
		},
		summary: {
			content: htmlToPlainText(data.summary.content),
		},
		education: getVisibleItems(data.sections.education).map((item) => ({
			school: item.school,
			degree: item.degree,
			area: item.area,
			grade: item.grade,
			location: item.location,
			period: item.period,
			description: htmlToPlainText(item.description),
		})),
		awards: getVisibleItems(data.sections.awards).map((item) => ({
			title: item.title,
			awarder: item.awarder,
			date: item.date,
			description: htmlToPlainText(item.description),
		})),
		certifications: getVisibleItems(data.sections.certifications).map((item) => ({
			title: item.title,
			issuer: item.issuer,
			date: item.date,
			description: htmlToPlainText(item.description),
		})),
		experience: getVisibleItems(data.sections.experience).map((item) => {
			const description = htmlToPlainText(item.description);
			return {
				company: item.company,
				position: item.position,
				location: item.location,
				period: item.period,
				description,
				descriptionLines: splitPlainTextLines(description).map((text) => ({ text })),
				roles: item.roles.map((role) => {
					const roleDescription = htmlToPlainText(role.description);
					return {
						position: role.position,
						period: role.period,
						description: roleDescription,
						descriptionLines: splitPlainTextLines(roleDescription).map((text) => ({ text })),
					};
				}),
			};
		}),
		projects: getVisibleItems(data.sections.projects).map((item) => {
			const description = htmlToPlainText(item.description);
			return {
				name: item.name,
				period: item.period,
				description,
				descriptionLines: splitPlainTextLines(description).map((text) => ({ text })),
			};
		}),
		skills: getVisibleItems(data.sections.skills).map((item) => ({
			name: item.name,
			proficiency: item.proficiency,
			keywords: [...item.keywords],
		})),
		languages: getVisibleItems(data.sections.languages).map((item) => ({
			language: item.language,
			fluency: item.fluency,
			level: item.level,
		})),
		interests: getVisibleItems(data.sections.interests).map((item) => ({
			name: item.name,
			keywords: [...item.keywords],
		})),
		profiles: getVisibleItems(data.sections.profiles).map((item) => ({
			network: item.network,
			username: item.username,
			url: item.website.url,
		})),
		publications: getVisibleItems(data.sections.publications).map((item) => ({
			title: item.title,
			publisher: item.publisher,
			date: item.date,
			description: htmlToPlainText(item.description),
		})),
		volunteer: getVisibleItems(data.sections.volunteer).map((item) => {
			const description = htmlToPlainText(item.description);
			return {
				organization: item.organization,
				location: item.location,
				period: item.period,
				description,
				descriptionLines: splitPlainTextLines(description).map((text) => ({ text })),
			};
		}),
		references: getVisibleItems(data.sections.references).map((item) => ({
			name: item.name,
			position: item.position,
			phone: item.phone,
			description: htmlToPlainText(item.description),
		})),
	};
}

export function buildZhInternshipTemplateViewModel(data: ResumeData): ZhInternshipTemplateViewModel {
	return buildZhInternshipTemplateViewModelFromChinese(buildChineseResumeModel(data));
}

function buildZhInternshipTemplateViewModelFromChinese(chinese: ChineseResumeModel): ZhInternshipTemplateViewModel {
	const education = buildZhInternshipEducation(chinese.education);
	const experience = buildZhInternshipExperience(chinese.experience);

	return {
		basics: chinese.basics,
		education,
		awards: chinese.awards.slice(0, 15).map((item) => ({ title: joinClean([item.date, item.title], "  ") })),
		experience,
		projects: chinese.projects.slice(0, 3),
	};
}

function buildZhInternshipEducation(education: ChineseResumeEducation[]) {
	const [primary, ...additional] = education;
	if (!primary) return emptyEducation();
	if (additional.length === 0) return primary;

	const additionalDescription = additional.map(formatAdditionalEducation).filter(Boolean).join("\n");
	if (!additionalDescription) return primary;

	return {
		...primary,
		description: joinClean([primary.description, additionalDescription], "\n"),
	};
}

function formatAdditionalEducation(education: ChineseResumeEducation) {
	return joinClean(
		[
			joinClean([education.period, education.school], "  "),
			joinClean([education.area, education.degree], " | "),
			education.grade ? `GPA ${education.grade}` : "",
			education.description,
		],
		"\n",
	);
}

function buildZhInternshipExperience(experience: ChineseResumeExperience[]) {
	const [primary, ...additional] = experience;
	if (!primary) return emptyExperience();
	if (additional.length === 0) return primary;

	const additionalDescription = additional.map(formatAdditionalExperience).filter(Boolean).join("\n");
	if (!additionalDescription) return primary;

	const description = joinClean([primary.description, additionalDescription], "\n");

	return {
		...primary,
		description,
		descriptionLines: splitPlainTextLines(description).map((text) => ({ text })),
	};
}

function formatAdditionalExperience(experience: ChineseResumeExperience) {
	return joinClean(
		[
			joinClean([experience.period, experience.company, experience.position], "  "),
			experience.description,
			experience.roles
				.map((role) => joinClean([joinClean([role.period, role.position], "  "), role.description], "\n"))
				.filter(Boolean)
				.join("\n"),
		],
		"\n",
	);
}

export function splitPlainTextLines(value: string | undefined) {
	if (!value) return [];

	return value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

export function htmlToPlainText(value: string | undefined) {
	if (!value) return "";

	return decodeHtmlEntities(
		value
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<li\b[^>]*>/gi, "")
			.replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/\r/g, "")
			.split("\n")
			.map((line) => line.replace(/[ \t]+/g, " ").trim())
			.filter(Boolean)
			.join("\n"),
	);
}

function emptyEducation(): ChineseResumeEducation {
	return {
		school: "",
		degree: "",
		area: "",
		grade: "",
		location: "",
		period: "",
		description: "",
	};
}

function emptyExperience(): ChineseResumeExperience {
	return {
		company: "",
		position: "",
		location: "",
		period: "",
		description: "",
		descriptionLines: [],
		roles: [],
	};
}

function getCustomFieldText(data: ResumeData, ids: string[], fallbackIndex: number) {
	for (const id of ids) {
		const value = data.basics.customFields.find((field) => field.id === id)?.text;
		if (value?.trim()) return value;
	}

	return data.basics.customFields[fallbackIndex]?.text ?? "";
}

function getVisibleItems<TSection extends { hidden?: boolean; items: Array<{ hidden?: boolean }> }>(
	section: TSection,
): TSection["items"] {
	if (section.hidden) return [];
	return section.items.filter((item) => !item.hidden) as TSection["items"];
}

function joinClean(values: Array<string | undefined>, separator: string) {
	return values
		.map((value) => value?.trim())
		.filter(Boolean)
		.join(separator);
}

function decodeHtmlEntities(value: string) {
	return value
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}
