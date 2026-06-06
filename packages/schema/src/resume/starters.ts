import type { Template } from "../templates";
import type { ResumeData } from "./data";
import { sampleResumeData } from "./sample";

export type ResumeTemplateStarter = {
	id: string;
	name: string;
	resumeName: string;
	description: string;
	tags: string[];
	template: Template;
	data: ResumeData;
};

function cloneSampleResumeData(): ResumeData {
	return JSON.parse(JSON.stringify(sampleResumeData)) as ResumeData;
}

function first<T>(items: T[]): T {
	const item = items[0];
	if (!item) throw new Error("Expected sample resume data to include starter content.");

	return item;
}

type StarterProfile = {
	id: string;
	icon: string;
	network: string;
	username: string;
	url: string;
	label: string;
};

function clearInheritedExtras(data: ResumeData) {
	data.customSections = [];
	data.sections.languages.hidden = true;
	data.sections.languages.items = [];
	data.sections.interests.hidden = true;
	data.sections.interests.items = [];
	data.sections.awards.hidden = true;
	data.sections.awards.items = [];
	data.sections.certifications.hidden = true;
	data.sections.certifications.items = [];
	data.sections.publications.hidden = true;
	data.sections.publications.items = [];
	data.sections.volunteer.hidden = true;
	data.sections.volunteer.items = [];
	data.sections.references.hidden = true;
	data.sections.references.items = [];
}

function setProfiles(data: ResumeData, profiles: StarterProfile[]) {
	const baseProfile = first(data.sections.profiles.items);

	data.basics.customFields = [];
	data.sections.profiles.hidden = profiles.length === 0;
	data.sections.profiles.items = profiles.map((profile) => ({
		...baseProfile,
		id: profile.id,
		icon: profile.icon,
		iconColor: "",
		network: profile.network,
		username: profile.username,
		website: {
			url: profile.url,
			label: profile.label,
			inlineLink: false,
		},
	}));
}

function setOnePageLayout(data: ResumeData, main: string[], sidebar: string[], sidebarWidth = 30) {
	data.metadata.layout = {
		sidebarWidth,
		pages: [
			{
				fullWidth: sidebar.length === 0,
				main,
				sidebar,
			},
		],
	};
}

function createStarter(input: Omit<ResumeTemplateStarter, "data"> & { build: (data: ResumeData) => void }) {
	const data = cloneSampleResumeData();
	clearInheritedExtras(data);
	data.metadata.template = input.template;
	data.metadata.page.locale = "zh-CN";
	input.build(data);

	return {
		id: input.id,
		name: input.name,
		resumeName: input.resumeName,
		description: input.description,
		tags: input.tags,
		template: input.template,
		data,
	} satisfies ResumeTemplateStarter;
}

const baseResumeTemplateStarters = [
	createStarter({
		id: "frontend-engineer",
		name: "前端工程师成品样张",
		resumeName: "前端开发-中文投递版",
		description: "突出 React、TypeScript、工程化、项目成果和性能优化，适合前端/全栈/技术产品方向。",
		tags: ["技术岗", "前端", "React", "项目成果"],
		template: "collection005",
		build: (data) => {
			data.basics.name = "陈嘉铭";
			data.basics.headline = "前端开发工程师 | React 与工程化方向";
			data.basics.email = "jiaming.chen@example.com";
			data.basics.phone = "+86 138 0000 0000";
			data.basics.location = "上海";
			data.basics.website = {
				url: "https://jiaming.dev",
				label: "jiaming.dev",
			};
			setProfiles(data, [
				{
					id: "frontend-profile-github",
					icon: "github-logo",
					network: "GitHub",
					username: "chenjiaming",
					url: "https://github.com/chenjiaming",
					label: "github.com/chenjiaming",
				},
				{
					id: "frontend-profile-juejin",
					icon: "link",
					network: "掘金",
					username: "chenjiaming",
					url: "https://juejin.cn/user/chenjiaming",
					label: "juejin.cn/user/chenjiaming",
				},
			]);
			setOnePageLayout(data, ["summary", "experience", "projects"], ["profiles", "skills", "education"], 30);
			data.metadata.design.colors.primary = "rgba(31, 58, 95, 1)";
			data.metadata.typography.body.fontFamily = "Noto Sans SC";
			data.metadata.typography.heading.fontFamily = "Noto Sans SC";
		},
	}),
	createStarter({
		id: "product-manager",
		name: "产品经理成品样张",
		resumeName: "产品经理-增长方向版",
		description: "围绕需求拆解、数据分析、跨团队推进和业务指标表达，适合产品经理与商业产品岗位。",
		tags: ["产品", "增长", "数据分析", "业务推进"],
		template: "collection002",
		build: (data) => {
			const experience = first(data.sections.experience.items);
			const education = first(data.sections.education.items);
			const project = first(data.sections.projects.items);

			data.basics.name = "林若溪";
			data.basics.headline = "产品经理 | 增长策略与 B 端产品方向";
			data.basics.email = "ruoxi.lin@example.com";
			data.basics.phone = "+86 137 0000 0000";
			data.basics.location = "杭州";
			data.basics.website = {
				url: "https://ruoxi.pm",
				label: "ruoxi.pm",
			};
			setProfiles(data, [
				{
					id: "product-profile-portfolio",
					icon: "link",
					network: "作品集",
					username: "增长产品案例",
					url: "https://ruoxi.pm",
					label: "ruoxi.pm",
				},
				{
					id: "product-profile-linkedin",
					icon: "linkedin-logo",
					network: "LinkedIn",
					username: "ruoxi-lin",
					url: "https://www.linkedin.com/in/ruoxi-lin",
					label: "linkedin.com/in/ruoxi-lin",
				},
			]);
			data.summary.content =
				"<p><strong>4 年互联网产品经验，关注增长策略、复杂业务流程和数据驱动决策</strong>。能够从用户场景和业务目标出发拆解需求，推动设计、研发、运营和数据团队协作落地，并持续跟踪转化、留存和效率指标。</p>";
			data.sections.experience.items = [
				{
					...experience,
					company: "阿里巴巴",
					position: "高级产品经理",
					location: "杭州",
					period: "2022 年 5 月 - 至今",
					description:
						"<ul><li><p>负责商家经营分析平台，覆盖数据看板、诊断建议和运营动作闭环</p></li><li><p>通过用户分层和漏斗分析定位关键流失环节，推动核心功能转化率提升 18%</p></li><li><p>组织需求评审、埋点设计和灰度发布，建立版本复盘机制提升跨团队协作效率</p></li></ul>",
				},
			];
			data.sections.education.items = [
				{
					...education,
					school: "浙江大学",
					area: "信息管理与信息系统",
					grade: "GPA 3.8/4.0",
				},
			];
			data.sections.projects.items = [
				{
					...project,
					name: "会员增长策略平台",
					period: "2023 - 2024",
					description:
						"<p>设计人群圈选、权益配置、实验分析和活动复盘流程，支持运营同学按不同生命周期用户配置增长策略。上线后活动配置效率提升 40%，核心会员复购率提升 11%。</p>",
				},
			];
			data.sections.skills.items = data.sections.skills.items.slice(0, 5).map((skill, index) => ({
				...skill,
				name: ["需求分析", "数据分析", "增长实验", "项目推进", "原型设计"][index] ?? skill.name,
				keywords:
					[
						["用户访谈", "业务建模", "PRD"],
						["SQL", "漏斗分析", "指标体系"],
						["A/B Test", "留存", "转化"],
						["跨团队协作", "版本管理", "复盘"],
						["Figma", "流程图", "交互原型"],
					][index] ?? skill.keywords,
			}));
			setOnePageLayout(data, ["summary", "experience", "projects"], ["profiles", "skills", "education"], 32);
			data.metadata.design.colors.primary = "rgba(49, 96, 87, 1)";
		},
	}),
	createStarter({
		id: "campus-student",
		name: "应届生求职成品样张",
		resumeName: "应届生-校招投递版",
		description: "用教育经历、实习、项目和技能补足工作经历，适合校招、实习和初级岗位。",
		tags: ["校招", "实习", "应届生", "ATS"],
		template: "collection016",
		build: (data) => {
			const experience = first(data.sections.experience.items);
			const education = first(data.sections.education.items);
			const project = first(data.sections.projects.items);

			data.basics.name = "周嘉言";
			data.basics.headline = "计算机科学应届生 | 前端开发实习方向";
			data.basics.email = "jiayan.zhou@example.com";
			data.basics.phone = "+86 136 0000 0000";
			data.basics.location = "南京";
			data.basics.website = {
				url: "https://github.com/zhoujiayan",
				label: "github.com/zhoujiayan",
			};
			setProfiles(data, [
				{
					id: "campus-profile-github",
					icon: "github-logo",
					network: "GitHub",
					username: "zhoujiayan",
					url: "https://github.com/zhoujiayan",
					label: "github.com/zhoujiayan",
				},
			]);
			data.summary.content =
				"<p><strong>计算机科学与技术专业应届生，具备扎实的前端基础和项目实践经验</strong>。熟悉 JavaScript、React、TypeScript 和常见工程化工具，能够独立完成页面开发、接口联调和基础性能优化。</p>";
			data.sections.experience.title = "实习经历";
			data.sections.experience.items = [
				{
					...experience,
					company: "小米",
					position: "前端开发实习生",
					location: "北京",
					period: "2025 年 7 月 - 2025 年 10 月",
					description:
						"<ul><li><p>参与营销活动后台开发，完成活动配置表单、列表筛选和数据展示模块</p></li><li><p>根据设计稿实现响应式页面，并配合后端完成接口联调和异常状态处理</p></li><li><p>补充基础组件单元测试和页面自测清单，减少回归问题</p></li></ul>",
				},
			];
			data.sections.education.items = [
				{
					...education,
					school: "南京大学",
					degree: "本科",
					area: "计算机科学与技术",
					grade: "GPA 3.6/4.0",
					period: "2022 - 2026",
				},
			];
			data.sections.projects.items = [
				{
					...project,
					name: "校园二手交易小程序",
					period: "2025",
					description:
						"<p>负责商品发布、搜索筛选、收藏和消息提醒模块。使用 React、TypeScript 和 Node.js 完成前后端联调，支持图片上传、关键词搜索和状态流转。</p>",
				},
			];
			data.sections.languages.hidden = false;
			data.sections.languages.items = [
				{
					id: "campus-language-chinese",
					hidden: false,
					language: "中文",
					fluency: "母语",
					level: 5,
				},
				{
					id: "campus-language-english",
					hidden: false,
					language: "英语",
					fluency: "CET-6",
					level: 4,
				},
			];
			setOnePageLayout(
				data,
				["summary", "education", "experience", "projects"],
				["profiles", "skills", "languages"],
				28,
			);
			data.metadata.design.colors.primary = "rgba(37, 99, 235, 1)";
		},
	}),
	createStarter({
		id: "growth-operations",
		name: "运营增长成品样张",
		resumeName: "运营增长-业务投递版",
		description: "强调活动策划、用户增长、数据复盘和跨部门执行，适合运营、市场和客户成功岗位。",
		tags: ["运营", "增长", "活动策划", "数据复盘"],
		template: "collection020",
		build: (data) => {
			const experience = first(data.sections.experience.items);
			const education = first(data.sections.education.items);
			const project = first(data.sections.projects.items);

			data.basics.name = "王语桐";
			data.basics.headline = "运营增长专员 | 用户活动与内容运营方向";
			data.basics.email = "yutong.wang@example.com";
			data.basics.phone = "+86 135 0000 0000";
			data.basics.location = "广州";
			data.basics.website = {
				url: "https://yutong.work",
				label: "yutong.work",
			};
			setProfiles(data, [
				{
					id: "growth-profile-portfolio",
					icon: "link",
					network: "作品集",
					username: "运营案例集",
					url: "https://yutong.work",
					label: "yutong.work",
				},
				{
					id: "growth-profile-note",
					icon: "article",
					network: "内容主页",
					username: "用户增长笔记",
					url: "https://yutong.work/notes",
					label: "yutong.work/notes",
				},
			]);
			data.summary.content =
				"<p><strong>3 年互联网运营经验，擅长活动策划、用户分层和内容转化</strong>。能够结合业务目标制定运营节奏，推进活动上线、渠道协同、数据复盘和策略迭代，关注新增、活跃、转化和留存指标。</p>";
			data.sections.experience.items = [
				{
					...experience,
					company: "网易",
					position: "用户增长运营",
					location: "广州",
					period: "2023 年 4 月 - 至今",
					description:
						"<ul><li><p>负责 App 新用户激活活动，设计任务体系、权益触达和站内消息策略</p></li><li><p>通过用户分层运营提升新用户 7 日留存 9%，活动页点击转化提升 21%</p></li><li><p>建立活动复盘模板，沉淀渠道表现、用户反馈和后续优化动作</p></li></ul>",
				},
			];
			data.sections.education.items = [
				{
					...education,
					school: "中山大学",
					area: "市场营销",
					grade: "GPA 3.7/4.0",
				},
			];
			data.sections.projects.items = [
				{
					...project,
					name: "新用户 14 天激活计划",
					period: "2024",
					description:
						"<p>围绕注册、首单、复访和分享设计分层任务链路，联合产品补齐埋点和触达策略。项目上线后首单转化率提升 13%，活动期间新增用户分享率提升 18%。</p>",
				},
			];
			data.sections.skills.items = data.sections.skills.items.slice(0, 5).map((skill, index) => ({
				...skill,
				name: ["活动策划", "用户增长", "内容运营", "数据复盘", "跨部门协作"][index] ?? skill.name,
				keywords:
					[
						["活动机制", "权益设计", "上线排期"],
						["用户分层", "生命周期", "留存"],
						["选题规划", "渠道投放", "转化"],
						["Excel", "SQL", "指标看板"],
						["产品协作", "设计协作", "复盘沉淀"],
					][index] ?? skill.keywords,
			}));
			setOnePageLayout(data, ["summary", "experience", "projects"], ["profiles", "skills", "education"], 30);
			data.metadata.design.colors.primary = "rgba(185, 84, 52, 1)";
		},
	}),
] as const satisfies ResumeTemplateStarter[];

type StarterVariantInput = {
	baseId: (typeof baseResumeTemplateStarters)[number]["id"];
	id: string;
	name: string;
	resumeName: string;
	description: string;
	tags: string[];
	template: Template;
	primaryColor: string;
	main: string[];
	sidebar: string[];
	sidebarWidth?: number;
};

function cloneResumeData(data: ResumeData): ResumeData {
	return JSON.parse(JSON.stringify(data)) as ResumeData;
}

function createStarterVariant(input: StarterVariantInput): ResumeTemplateStarter {
	const base = baseResumeTemplateStarters.find((starter) => starter.id === input.baseId);
	if (!base) throw new Error(`Unknown starter base: ${input.baseId}`);

	const data = cloneResumeData(base.data);
	data.metadata.template = input.template;
	data.metadata.design.colors.primary = input.primaryColor;
	setOnePageLayout(data, input.main, input.sidebar, input.sidebarWidth ?? 30);

	return {
		id: input.id,
		name: input.name,
		resumeName: input.resumeName,
		description: input.description,
		tags: input.tags,
		template: input.template,
		data,
	};
}

const starterVariants = [
	createStarterVariant({
		baseId: "frontend-engineer",
		id: "frontend-engineer-one-page",
		name: "前端工程师一页模板",
		resumeName: "前端开发-一页投递版",
		description: "保留前端工程师完整内容，切换为更紧凑的一页横栏版式，适合网申和 PDF 投递。",
		tags: ["技术岗", "前端", "一页版", "网申"],
		template: "collection020",
		primaryColor: "rgba(31, 58, 95, 1)",
		main: ["summary", "experience", "projects", "education", "skills", "profiles"],
		sidebar: [],
	}),
	createStarterVariant({
		baseId: "frontend-engineer",
		id: "frontend-engineer-senior",
		name: "前端工程师资深模板",
		resumeName: "前端开发-资深技术版",
		description: "同一份前端内容切换为严肃单栏结构，更适合资深工程师、技术负责人和外企投递。",
		tags: ["技术岗", "前端", "资深", "单栏"],
		template: "collection024",
		primaryColor: "rgba(37, 99, 135, 1)",
		main: ["summary", "experience", "projects", "skills", "education", "profiles"],
		sidebar: [],
	}),
	createStarterVariant({
		baseId: "product-manager",
		id: "product-manager-clean",
		name: "产品经理简洁模板",
		resumeName: "产品经理-简洁业务版",
		description: "保留产品经理增长内容，切换为克制单栏样式，适合金融、B 端和咨询类产品岗位。",
		tags: ["产品", "增长", "简洁", "B 端"],
		template: "collection021",
		primaryColor: "rgba(49, 96, 87, 1)",
		main: ["summary", "experience", "projects", "skills", "education", "profiles"],
		sidebar: [],
	}),
	createStarterVariant({
		baseId: "product-manager",
		id: "product-manager-one-page",
		name: "产品经理一页模板",
		resumeName: "产品经理-一页成果版",
		description: "更强调成果表达和模块分隔，适合把业务指标、项目结果和跨团队推进压到一页。",
		tags: ["产品", "成果", "一页版", "指标"],
		template: "collection003",
		primaryColor: "rgba(55, 92, 132, 1)",
		main: ["summary", "experience", "projects", "skills", "education", "profiles"],
		sidebar: [],
	}),
	createStarterVariant({
		baseId: "campus-student",
		id: "campus-student-compact",
		name: "应届生紧凑模板",
		resumeName: "应届生-紧凑校招版",
		description: "保留校招内容，切换为更紧凑的单栏样式，适合经历较少但需要重点突出的候选人。",
		tags: ["校招", "实习", "紧凑", "ATS"],
		template: "collection016",
		primaryColor: "rgba(37, 99, 235, 1)",
		main: ["summary", "education", "experience", "projects", "skills", "languages", "profiles"],
		sidebar: [],
	}),
	createStarterVariant({
		baseId: "campus-student",
		id: "campus-student-asian",
		name: "应届生横栏模板",
		resumeName: "应届生-横栏校招版",
		description: "行内标题更贴近中文简历习惯，适合投递实习、校招和初级开发岗位。",
		tags: ["校招", "实习", "中文习惯", "单栏"],
		template: "collection024",
		primaryColor: "rgba(37, 99, 235, 1)",
		main: ["summary", "education", "experience", "projects", "skills", "languages", "profiles"],
		sidebar: [],
	}),
	createStarterVariant({
		baseId: "growth-operations",
		id: "growth-operations-two-column",
		name: "运营增长双栏模板",
		resumeName: "运营增长-双栏投递版",
		description: "保留运营增长内容，左侧放作品集、技能和教育，右侧突出活动成果和复盘。",
		tags: ["运营", "增长", "双栏", "活动"],
		template: "collection022",
		primaryColor: "rgba(48, 177, 89, 1)",
		main: ["summary", "experience", "projects"],
		sidebar: ["profiles", "skills", "education"],
		sidebarWidth: 30,
	}),
	createStarterVariant({
		baseId: "growth-operations",
		id: "growth-operations-consulting",
		name: "运营增长咨询模板",
		resumeName: "运营增长-成果咨询版",
		description: "更强调指标和成果表达，适合增长、市场、商业分析和咨询风格投递。",
		tags: ["运营", "增长", "成果", "咨询"],
		template: "collection021",
		primaryColor: "rgba(185, 84, 52, 1)",
		main: ["summary", "experience", "projects", "skills", "education", "profiles"],
		sidebar: [],
	}),
	createStarterVariant({
		baseId: "campus-student",
		id: "campus-student-blue-blocks",
		name: "校招蓝色块面样张",
		resumeName: "应届生-蓝色块面版",
		description: "使用更接近中文招聘网站常见模板的蓝色块面结构，适合校招、职能和传统行业投递。",
		tags: ["校招", "蓝色块面", "中文模板", "一页版"],
		template: "collection019",
		primaryColor: "rgba(75, 147, 190, 1)",
		main: ["summary", "education", "experience", "projects"],
		sidebar: ["profiles", "skills", "languages"],
		sidebarWidth: 28,
	}),
	createStarterVariant({
		baseId: "frontend-engineer",
		id: "frontend-engineer-dark-orange",
		name: "技术深灰橙色样张",
		resumeName: "前端开发-深灰橙色版",
		description: "深灰侧栏配橙色强调，适合项目经历和技能栈较多的技术、设计和工程岗位。",
		tags: ["技术岗", "深灰橙色", "项目经历", "侧栏"],
		template: "collection026",
		primaryColor: "rgba(232, 137, 43, 1)",
		main: ["summary", "experience", "projects"],
		sidebar: ["profiles", "skills", "education"],
		sidebarWidth: 30,
	}),
	createStarterVariant({
		baseId: "growth-operations",
		id: "growth-operations-blue-qr",
		name: "作品入口蓝色侧栏样张",
		resumeName: "运营增长-蓝色二维码栏版",
		description: "蓝色侧栏适合放头像、联系方式和作品入口，适合有项目链接、作品集或二维码入口的候选人。",
		tags: ["运营", "作品入口", "蓝色侧栏", "项目"],
		template: "collection028",
		primaryColor: "rgba(76, 139, 191, 1)",
		main: ["summary", "experience", "projects"],
		sidebar: ["profiles", "skills", "education"],
		sidebarWidth: 31,
	}),
] as const satisfies ResumeTemplateStarter[];

export const resumeTemplateStarters = [...baseResumeTemplateStarters, ...starterVariants] as const;
