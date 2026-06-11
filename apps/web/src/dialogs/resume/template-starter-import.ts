import type { ResumeTemplateStarter } from "@reactive-resume/schema/resume/starters";
import type { Template } from "@reactive-resume/schema/templates";
import type { WordTemplateId } from "@/features/resume/word-template/library";
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

function first<T>(items: T[]): T {
	const item = items[0];
	if (!item) throw new Error("Expected sample resume data to include starter content.");

	return item;
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

function buildZhInternshipTemplateData() {
	const data = cloneSampleResumeData();
	data.metadata.template = "onyx";
	data.metadata.page.locale = "zh-CN";
	data.metadata.layout = {
		sidebarWidth: 35,
		pages: [
			{
				fullWidth: true,
				main: ["education", "awards", "experience", "projects", "skills"],
				sidebar: [],
			},
		],
	};
	data.metadata.design.colors.primary = "rgba(18, 150, 219, 1)";
	data.metadata.typography.body.fontFamily = "Noto Sans SC";
	data.metadata.typography.heading.fontFamily = "Noto Sans SC";
	data.picture = {
		...defaultResumeData.picture,
		url: "",
		size: 80,
		hidden: true,
		aspectRatio: 0.78,
	};

	data.basics.name = "林知夏";
	data.basics.headline = "数据标注与测试实习生";
	data.basics.email = "demo@example.com";
	data.basics.phone = "13800000000";
	data.basics.location = "深圳";
	data.basics.website = { url: "", label: "" };
	data.basics.customFields = [
		{ id: "zh-internship-gender", icon: "user", text: "女", link: "" },
		{ id: "zh-internship-birthday", icon: "calendar", text: "2004.6.18", link: "" },
	];

	data.summary.hidden = true;
	data.summary.content = "";

	const education = first(data.sections.education.items);
	data.sections.education.hidden = false;
	data.sections.education.items = [
		{
			...education,
			id: "zh-internship-education",
			school: "示例信息职业技术学院",
			degree: "大专",
			area: "大数据技术",
			grade: "3.67/4.0（专业排名前 5%）",
			period: "2023.9-2026.6",
			location: "深圳",
			description: "数据社团负责人、班级学习委员、校级项目实践小组成员",
		},
	];

	const award = first(data.sections.awards.items);
	data.sections.awards.hidden = false;
	data.sections.awards.items = [
		"数据类竞赛获奖 4 次、校级荣誉 5 次、项目实践优秀结项 2 次",
		"2023-2024 校级数据分析实践赛一等奖",
		"2023-2024 校园数据治理主题挑战赛二等奖",
		"2023-2024 信息技术应用创新赛三等奖",
		"2024-2025 大数据应用开发综合实训优秀项目",
		"2024-2025 校级优秀学生干部",
		"2024-2025 学年度第一学期二等奖学金",
		"2024-2025 数据标注质量评估专项训练优秀学员",
		"2024-2025 智能应用原型设计竞赛二等奖",
		"2025-2026 企业真实项目实践优秀结项",
		"2025-2026 学年度第二学期三等奖学金",
		"2025-2026 数据处理与可视化课程项目优秀作品",
		"2025-2026 校企协同训练营优秀小组",
		"2025-2026 职业能力提升计划优秀学员",
		"2025-2026 毕业设计阶段性汇报优秀",
	].map((title, index) => ({
		...award,
		id: `zh-internship-award-${index + 1}`,
		title,
		awarder: "",
		date: "",
		description: "",
	}));

	const experience = first(data.sections.experience.items);
	data.sections.experience.hidden = false;
	data.sections.experience.items = [
		{
			...experience,
			id: "zh-internship-experience",
			company: "云澜数据科技有限公司",
			position: "数据运营实习生",
			location: "",
			period: "2023.9-2024.6",
			description: [
				"数据标注规范维护：整理 12 类业务标签说明，降低新成员理解成本",
				"样本质量抽检：按周抽检 3,000+ 条样本，汇总问题类型并推动返修",
				"流程协同支持：维护标注进度台账，协助项目负责人跟进交付节点",
				"反馈闭环整理：沉淀高频错误案例，帮助团队统一判断口径",
			]
				.map((line) => `<p>${line}</p>`)
				.join(""),
		},
	];

	const project = first(data.sections.projects.items);
	data.sections.projects.hidden = false;
	data.sections.projects.items = [
		{
			...project,
			id: "zh-internship-project-1",
			name: "校园数据治理平台",
			period: "2025.5-2025.7",
			description: [
				"数据处理",
				"协同开发",
				"工作职责：参与学生事务数据清洗、字段标准化和质量校验规则设计，支持多来源数据统一入库与可视化看板展示。",
				"1. 字段标准化：梳理 40+ 个常用字段命名、格式和枚举规则，减少重复字段与口径不一致问题。",
				"2. 数据质量校验：设计缺失值、重复值、异常区间等校验规则，输出问题清单并协同业务同学修正。",
			]
				.map((line) => `<p>${line}</p>`)
				.join(""),
		},
		{
			...project,
			id: "zh-internship-project-2",
			name: "智能客服质检系统",
			period: "2025.11-2025.12",
			description: [
				"前端开发",
				"协同开发",
				"工作职责：基于 Flask + MySQL + JWT 技术栈完成质检任务管理、样本分配和结果统计功能，支持质检员按规则复核对话文本。",
				"负责 MySQL 数据表设计与接口联调，围绕任务状态、质检结果和问题类型建立查询条件，提升复盘效率。",
				"配合前端完成筛选、详情、导出等流程，处理接口异常和权限校验，保证不同角色只访问对应任务数据。",
			]
				.map((line) => `<p>${line}</p>`)
				.join(""),
		},
		{
			...project,
			id: "zh-internship-project-3",
			name: "招聘岗位匹配分析工具",
			period: "2025.12-2026.1",
			description: [
				"前端开发",
				"协同开发",
				"工作职责：采用 Vue 3 + TypeScript + Pinia + Element Plus 构建岗位信息录入、关键词维护和匹配结果展示页面。",
				"负责前端路由配置、状态管理和组件封装，支持岗位版本切换、候选人标签筛选和匹配分数展示。",
				"配合后端完成接口联调，处理请求异常、空状态和加载状态，提升岗位筛选与结果复核的使用体验。",
			]
				.map((line) => `<p>${line}</p>`)
				.join(""),
		},
	];

	const skill = first(data.sections.skills.items);
	data.sections.skills.hidden = false;
	data.sections.skills.items = [
		{
			...skill,
			id: "zh-skill-1",
			name: "前端开发",
			keywords: ["Vue 3", "TypeScript", "Pinia", "Element Plus"],
			proficiency: "熟练",
			hidden: false,
		},
		{
			...skill,
			id: "zh-skill-2",
			name: "后端与数据",
			keywords: ["Flask", "MySQL", "JWT", "WebSocket"],
			proficiency: "熟悉",
			hidden: false,
		},
		{
			...skill,
			id: "zh-skill-3",
			name: "AI 与工程",
			keywords: ["TensorFlow", "Keras", "数据处理", "模型集成"],
			proficiency: "熟悉",
			hidden: false,
		},
	];

	for (const section of [
		data.sections.profiles,
		data.sections.languages,
		data.sections.interests,
		data.sections.certifications,
		data.sections.publications,
		data.sections.volunteer,
		data.sections.references,
	]) {
		section.hidden = true;
		section.items = [];
	}

	data.customSections = [];

	return data;
}

export function buildWordTemplateImportInput(
	requestedName?: string,
	templateId?: WordTemplateId,
): RouterInput["resume"]["import"] {
	const data = templateId ? buildZhInternshipTemplateData() : cloneSampleResumeData();
	data.metadata.wordTemplate = { id: templateId ?? null };
	if (templateId === "zh-internship-001") {
		const firstPage = data.metadata.layout.pages[0];
		if (firstPage) firstPage.main = ["education", "awards", "experience", "projects"];
		data.sections.skills.hidden = true;
		data.sections.skills.items = [];
	}
	if (templateId === "zh-sidebar-clean-001") {
		const firstPage = data.metadata.layout.pages[0];
		if (firstPage) firstPage.main = ["experience", "projects", "awards"];
		data.sections.awards.items = data.sections.awards.items.slice(0, 5);
		const [firstProject, secondProject, thirdProject] = data.sections.projects.items;
		if (firstProject) {
			firstProject.description = [
				"梳理学生事务常用字段和枚举规则，支持多来源数据统一入库与看板展示。",
				"设计缺失值、重复值和异常区间校验规则，输出问题清单并协同业务修正。",
				"沉淀字段标准化说明和数据口径文档，减少重复字段与口径不一致问题。",
			]
				.map((line) => `<p>${line}</p>`)
				.join("");
		}
		if (secondProject) {
			secondProject.description = [
				"基于 Flask、MySQL 和 JWT 完成质检任务管理、样本分配和结果统计功能。",
				"围绕任务状态、质检结论和问题类型建立查询条件，提升复盘效率。",
				"配合前端完成筛选、详情和导出流程，处理接口异常和权限校验。",
			]
				.map((line) => `<p>${line}</p>`)
				.join("");
		}
		if (thirdProject) {
			thirdProject.description = [
				"使用 Vue 3、TypeScript、Pinia 和 Element Plus 构建岗位信息录入与匹配结果页面。",
				"封装岗位版本切换、候选人标签筛选和匹配分数展示等可复用组件。",
				"联调岗位匹配接口，补充空状态、加载状态和异常提示，提升复核体验。",
			]
				.map((line) => `<p>${line}</p>`)
				.join("");
		}
		data.summary.hidden = false;
		data.summary.title = "个人优势";
		data.summary.content = [
			"熟悉数据标注、样本抽检和基础前后端协作流程，能把业务规则整理成可执行的字段、标签和质检标准。",
			"参与过校园数据治理、客服质检和岗位匹配类项目，关注数据口径一致性、异常处理和交付过程记录。",
			"具备较强的文档沉淀和跨角色沟通意识，能够配合产品、开发和业务同学推进问题闭环。",
		]
			.map((line) => `<p>${line}</p>`)
			.join("");
	}
	const fallbackName =
		templateId === "zh-internship-001"
			? "校招实习标准模板"
			: templateId === "zh-ats-compact-001"
				? "ATS 单栏精简模板"
				: templateId === "zh-sidebar-clean-001"
					? "蓝灰侧栏双栏模板"
					: "中文 Word 模板简历";

	return {
		name: requestedName?.trim() || fallbackName,
		preferRequestedName: true,
		data,
	};
}
