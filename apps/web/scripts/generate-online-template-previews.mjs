import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../public/templates/online/", import.meta.url));

const candidates = {
	product: {
		name: "林知夏",
		role: "高级产品经理 / B 端 SaaS",
		location: "上海",
		email: "linzhixia@example.com",
		phone: "+86 138 0000 0000",
		summary: "7 年企业服务产品经验，主导 CRM、权限体系与经营看板，擅长把复杂业务流程拆成可交付的产品闭环。",
		experience: [
			[
				"2021 - 至今",
				"云桥科技",
				"高级产品经理",
				[
					"重构线索到回款链路，销售跟进效率提升 31%",
					"搭建经营仪表盘，周报制作时间下降 70%",
					"推进权限中心重构，覆盖 12 条业务线",
				],
			],
			[
				"2018 - 2021",
				"明远软件",
				"产品经理",
				["负责客户成功后台和工单系统，续费流失率下降 18%", "沉淀需求分级机制，跨部门评审周期缩短 35%"],
			],
		],
		skills: ["需求分析", "SaaS", "SQL", "Axure", "数据看板", "权限体系"],
		education: "上海交通大学 / 信息管理 / 本科",
	},
	tech: {
		name: "周亦辰",
		role: "前端工程师 / React / TypeScript",
		location: "杭州",
		email: "zhouyichen@example.com",
		phone: "+86 139 0000 0000",
		summary: "5 年前端工程经验，关注性能、组件工程化与复杂交互落地，熟悉简历、表单、PDF 和可视化场景。",
		experience: [
			[
				"2022 - 至今",
				"字节跳动",
				"前端开发工程师",
				[
					"重构低代码表单引擎，首屏耗时降低 42%",
					"建设组件规范与测试基线，缺陷回归率下降 35%",
					"落地大表格虚拟滚动与权限隔离",
				],
			],
			[
				"2020 - 2022",
				"有赞",
				"前端工程师",
				["负责商家工作台体验优化，核心路径转化提升 16%", "建设 CI 质量门禁，减少线上回滚"],
			],
		],
		skills: ["React", "TypeScript", "Vite", "Vitest", "Playwright", "PDF 渲染"],
		education: "浙江大学 / 软件工程 / 本科",
	},
	ops: {
		name: "陈若宁",
		role: "用户运营 / 增长策略",
		location: "北京",
		email: "chenruoning@example.com",
		phone: "+86 137 0000 0000",
		summary: "6 年互联网运营经验，擅长用户分层、活动策略和转化漏斗优化，能独立完成从策略到复盘。",
		experience: [
			[
				"2020 - 至今",
				"小满科技",
				"增长运营负责人",
				["会员转化率从 8.4% 提升至 13.2%", "搭建用户分层策略，沉默召回率提升 24%", "年度大促 GMV 同比增长 46%"],
			],
			[
				"2017 - 2020",
				"每日优鲜",
				"用户运营",
				["负责拉新活动和留存策略，月活提升 28%", "建立 A/B 测试流程，沉淀 18 个策略模板"],
			],
		],
		skills: ["用户分层", "活动策划", "SQL", "A/B 测试", "增长模型", "复盘"],
		education: "南京大学 / 市场营销 / 本科",
	},
	finance: {
		name: "许嘉言",
		role: "财务分析 / 经营分析",
		location: "深圳",
		email: "xujiayan@example.com",
		phone: "+86 136 0000 0000",
		summary: "具备预算、成本、经营分析和管理报表经验，熟悉多业务线预算滚动预测与利润模型搭建。",
		experience: [
			[
				"2021 - 至今",
				"腾讯云",
				"经营分析师",
				[
					"搭建事业部经营分析模型，月度结账周期缩短 2 天",
					"优化费用归因口径，预算偏差率降低 18%",
					"完成 5 条产品线毛利复盘和价格策略测算",
				],
			],
			["2018 - 2021", "普华永道", "审计顾问", ["参与 TMT 客户年审与内控测试", "负责收入确认、应收账款和成本抽样"]],
		],
		skills: ["预算管理", "成本分析", "Power BI", "SQL", "Excel", "财务模型"],
		education: "中山大学 / 会计学 / 本科",
	},
	design: {
		name: "沈南栀",
		role: "UI/UX 设计师 / ToB 工具",
		location: "广州",
		email: "shennanzhi@example.com",
		phone: "+86 135 0000 0000",
		summary: "4 年工具型产品设计经验，擅长复杂流程梳理、设计系统建设与交互细节打磨。",
		experience: [
			[
				"2022 - 至今",
				"蓝湖协作",
				"高级体验设计师",
				[
					"重设数据分析后台，关键任务完成时间降低 38%",
					"建立 Figma 组件库，覆盖 9 条产品线 120+ 组件",
					"推动暗色模式与响应式规范落地",
				],
			],
			["2020 - 2022", "石墨文档", "UI 设计师", ["负责协作编辑和权限设置体验", "参与设计 token 与组件规范建设"]],
		],
		skills: ["Figma", "设计系统", "可用性测试", "B 端产品", "交互原型", "Design Token"],
		education: "广州美术学院 / 视觉传达 / 本科",
	},
	graduate: {
		name: "何清越",
		role: "数据分析实习生 / 2026 届",
		location: "上海",
		email: "heqingyue@example.com",
		phone: "+86 134 0000 0000",
		summary: "统计学背景，熟悉 SQL、Python 和可视化分析，有电商用户行为分析与课程项目经验。",
		experience: [
			[
				"2025",
				"某电商平台",
				"数据分析实习生",
				["完成用户留存 cohort 分析并提出召回策略", "搭建活动复盘看板，节省 40% 人工统计时间"],
			],
			[
				"2024",
				"课程项目",
				"销售预测模型",
				["使用 XGBoost 建模，MAPE 从 18% 优化至 11%", "完成特征工程、误差分析和可视化汇报"],
			],
		],
		skills: ["SQL", "Python", "Tableau", "Excel", "回归分析", "数据挖掘"],
		education: "上海财经大学 / 统计学 / 本科 / GPA 3.7",
	},
	consulting: {
		name: "顾承安",
		role: "战略咨询顾问 / 供应链方向",
		location: "上海",
		email: "guchengan@example.com",
		phone: "+86 133 0000 0000",
		summary: "参与制造、零售与新能源行业项目，擅长访谈、建模、报告撰写和高压交付。",
		experience: [
			[
				"2020 - 至今",
				"某咨询公司",
				"高级咨询顾问",
				[
					"新能源采购降本项目，识别 1.2 亿年度节省空间",
					"零售门店模型重构，单店坪效提升方案落地 40 城",
					"负责高管访谈、财务模型与最终汇报",
				],
			],
			["2018 - 2020", "德勤", "咨询顾问", ["参与供应链计划和库存优化项目", "输出行业研究、竞品分析和管理层材料"]],
		],
		skills: ["行业研究", "财务模型", "访谈纪要", "高管汇报", "供应链", "英文汇报"],
		education: "复旦大学 / 管理学硕士",
	},
	hr: {
		name: "唐予墨",
		role: "HRBP / 组织发展",
		location: "成都",
		email: "tangyumo@example.com",
		phone: "+86 132 0000 0000",
		summary: "支持 500 人研发组织，覆盖招聘、绩效、人才盘点与组织诊断，能把 HR 工作落到业务指标。",
		experience: [
			[
				"2021 - 至今",
				"快手",
				"HRBP",
				[
					"搭建关键岗位人才地图，招聘周期缩短 22%",
					"推进绩效校准机制，管理者满意度提升至 4.6/5",
					"组织研发梯队建设和校招生培养项目",
				],
			],
			["2018 - 2021", "滴滴", "招聘专家", ["负责技术岗位招聘，年交付 120+ offer", "建立面试官培训和候选人体验机制"]],
		],
		skills: ["人才盘点", "绩效管理", "招聘", "组织诊断", "面试官培训", "数据分析"],
		education: "四川大学 / 人力资源管理 / 本科",
	},
};

const templates = [
	{
		id: "apache-timeline",
		title: "开源时间轴",
		source: "mnjul/html-resume (Apache-2.0)",
		kind: "timeline",
		accent: "#4b5563",
		candidate: candidates.consulting,
	},
	{
		id: "resumify-modern-minimal",
		title: "现代极简",
		source: "Afif718/Resumify Modern Minimal (MIT)",
		kind: "minimal",
		accent: "#1f3a5f",
		candidate: candidates.product,
	},
	{
		id: "resumify-tech-sidebar",
		title: "技术侧栏",
		source: "Afif718/Resumify Tech Sidebar (MIT)",
		kind: "sidebar",
		accent: "#0f766e",
		candidate: candidates.tech,
	},
	{
		id: "resumify-business",
		title: "商务专业",
		source: "Afif718/Resumify Business Professional (MIT)",
		kind: "business",
		accent: "#27303f",
		candidate: candidates.finance,
	},
	{
		id: "resumify-creative",
		title: "创意现代",
		source: "Afif718/Resumify Creative Modern (MIT)",
		kind: "creative",
		accent: "#7c3aed",
		candidate: candidates.design,
	},
	{
		id: "resumify-elegant-timeline",
		title: "优雅时间轴",
		source: "Afif718/Resumify Elegant Timeline (MIT)",
		kind: "elegant",
		accent: "#9a3412",
		candidate: candidates.ops,
	},
	{
		id: "cn-ats-dense",
		title: "中文 ATS",
		source: "Adapted from permissive HTML/CSS resume layout patterns",
		kind: "ats",
		accent: "#155e75",
		candidate: candidates.graduate,
	},
	{
		id: "cn-hr-clean",
		title: "职能稳重",
		source: "Adapted from permissive HTML/CSS resume layout patterns",
		kind: "clean",
		accent: "#b45309",
		candidate: candidates.hr,
	},
];

const esc = (value) =>
	String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const text = (x, y, content, attrs = "") => `<text x="${x}" y="${y}" ${attrs}>${esc(content)}</text>`;
const rect = (x, y, width, height, attrs = "") =>
	`<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs}/>`;
const line = (x1, y1, x2, y2, attrs = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;

function bullets(items, x, y, accent, size = 11) {
	return items
		.slice(0, 4)
		.map((item, index) => {
			const top = y + index * 23;
			return `
				<circle cx="${x}" cy="${top - 4}" r="2.4" fill="${accent}"/>
				${text(x + 10, top, item, `class="body" font-size="${size}"`)}
			`;
		})
		.join("");
}

function section(title, x, y, width, accent, body, headingAttrs = "") {
	return `
		${text(x, y, title, `class="section-title" fill="${accent}" ${headingAttrs}`)}
		${line(x, y + 10, x + width, y + 10, `stroke="${accent}" stroke-width="1.3" opacity=".55"`)}
		${body}
	`;
}

function experienceRows(candidate, x, y, accent, mode = "standard") {
	return candidate.experience
		.map(([date, company, role, points], index) => {
			const top = y + index * 118;
			if (mode === "timeline") {
				return `
					${text(x, top, date, 'class="muted" font-size="10" text-anchor="end"')}
					<circle cx="${x + 26}" cy="${top - 4}" r="4.5" fill="#fff" stroke="${accent}" stroke-width="2"/>
					${line(x + 26, top + 4, x + 26, top + 94, `stroke="${accent}" stroke-width="1" opacity=".45"`)}
					${text(x + 48, top, role, 'class="strong" font-size="13"')}
					${text(x + 48, top + 18, company, `class="muted" font-size="11" fill="${accent}"`)}
					${bullets(points, x + 52, top + 42, accent, 10)}
				`;
			}
			return `
				<g>
					${text(x, top, role, 'class="strong" font-size="13"')}
					${text(x, top + 18, `${company}  ${date}`, `class="muted" font-size="10"`)}
				${bullets(points, x + 4, top + 42, accent, 10)}
				</g>
			`;
		})
		.join("");
}

function skillTags(skills, x, y, accent, compact = false) {
	let cx = x;
	let cy = y;
	return skills
		.map((skill) => {
			const width = compact ? 54 : Math.max(48, skill.length * 10 + 16);
			if (cx + width > x + 210) {
				cx = x;
				cy += 27;
			}
			const out = `
				${rect(cx, cy, width, 20, `rx="10" fill="${accent}" opacity=".10" stroke="${accent}" stroke-opacity=".25"`)}
				${text(cx + width / 2, cy + 14, skill, `class="body" font-size="9.5" text-anchor="middle" fill="${accent}"`)}
			`;
			cx += width + 7;
			return out;
		})
		.join("");
}

function renderTemplate(template) {
	const { candidate: c, accent, kind } = template;
	const dark = "#111827";
	const muted = "#64748b";
	const bg = "#fbfaf6";
	const page = [];

	if (kind === "sidebar") {
		page.push(rect(0, 0, 198, 842, `fill="${accent}"`));
		page.push(rect(198, 0, 397, 842, `fill="${bg}"`));
		page.push(text(36, 70, c.name, 'class="white strong" font-size="30"'));
		page.push(text(36, 100, c.role, 'class="white" font-size="12" opacity=".86"'));
		page.push(line(36, 132, 162, 132, 'stroke="#fff" stroke-width="1.5" opacity=".45"'));
		page.push(text(36, 178, "联系方式", 'class="white strong" font-size="13"'));
		for (const [i, item] of [c.location, c.email, c.phone].entries()) {
			page.push(text(36, 204 + i * 23, item, 'class="white" font-size="10.5" opacity=".82"'));
		}
		page.push(text(36, 310, "技能", 'class="white strong" font-size="13"'));
		for (const [i, item] of c.skills.entries()) {
			page.push(text(36, 338 + i * 22, item, 'class="white" font-size="10.5" opacity=".88"'));
		}
		page.push(text(232, 76, c.name, `class="strong" font-size="26" fill="${dark}"`));
		page.push(text(232, 105, c.role, `class="body" font-size="12" fill="${muted}"`));
		page.push(section("个人总结", 232, 156, 306, accent, text(232, 184, c.summary, 'class="body" font-size="11"')));
		page.push(section("工作经历", 232, 246, 306, accent, experienceRows(c, 232, 282, accent)));
		page.push(section("教育经历", 232, 542, 306, accent, text(232, 574, c.education, 'class="body" font-size="11"')));
	} else if (kind === "timeline" || kind === "elegant") {
		page.push(rect(0, 0, 595, 842, `fill="${bg}"`));
		page.push(text(297.5, 74, c.name, `class="strong" font-size="30" text-anchor="middle" fill="${dark}"`));
		page.push(text(297.5, 104, c.role, `class="body" font-size="12" text-anchor="middle" fill="${muted}"`));
		page.push(line(210, 130, 385, 130, `stroke="${accent}" stroke-width="1.5"`));
		page.push(section("简介", 96, 182, 404, accent, text(96, 210, c.summary, 'class="body" font-size="11"')));
		page.push(section("经历时间轴", 96, 280, 404, accent, experienceRows(c, 170, 322, accent, "timeline")));
		page.push(section("技能", 96, 626, 404, accent, skillTags(c.skills, 96, 654, accent)));
		page.push(text(96, 742, c.education, 'class="body" font-size="11"'));
	} else if (kind === "creative") {
		page.push(rect(0, 0, 595, 842, `fill="${bg}"`));
		page.push(`<path d="M0 0 H595 V178 C468 145 360 205 228 166 C126 136 64 166 0 142 Z" fill="${accent}"/>`);
		page.push(`<path d="M0 0 H595 V126 C460 105 366 158 245 128 C126 96 66 118 0 98 Z" fill="#1f3a5f" opacity=".72"/>`);
		page.push(text(52, 72, c.name, 'class="white strong" font-size="31"'));
		page.push(text(52, 103, c.role, 'class="white" font-size="13" opacity=".9"'));
		page.push(text(52, 130, `${c.location} / ${c.email}`, 'class="white" font-size="10.5" opacity=".85"'));
		page.push(section("关于我", 52, 230, 490, accent, text(52, 258, c.summary, 'class="body" font-size="11"')));
		page.push(section("工作经历", 52, 322, 490, accent, experienceRows(c, 52, 358, accent)));
		page.push(section("专业技能", 52, 636, 490, accent, skillTags(c.skills, 52, 664, accent)));
	} else if (kind === "business" || kind === "ats" || kind === "clean") {
		page.push(rect(0, 0, 595, 842, `fill="${bg}"`));
		page.push(text(297.5, 68, c.name, `class="strong" font-size="29" text-anchor="middle" fill="${dark}"`));
		page.push(text(297.5, 98, c.role, `class="body" font-size="12" text-anchor="middle" fill="${muted}"`));
		page.push(
			text(
				297.5,
				122,
				`${c.location} · ${c.email} · ${c.phone}`,
				`class="body" font-size="9.5" text-anchor="middle" fill="${muted}"`,
			),
		);
		page.push(line(70, 150, 525, 150, `stroke="${accent}" stroke-width="2"`));
		page.push(section("个人总结", 70, 196, 455, accent, text(70, 224, c.summary, 'class="body" font-size="11"')));
		page.push(section("工作经历", 70, 286, 455, accent, experienceRows(c, 70, 322, accent)));
		page.push(section("教育经历", 70, 594, 455, accent, text(70, 626, c.education, 'class="body" font-size="11"')));
		page.push(section("技能", 70, 684, 455, accent, skillTags(c.skills, 70, 712, accent)));
	} else {
		page.push(rect(0, 0, 595, 842, `fill="${bg}"`));
		page.push(text(58, 76, c.name, `class="strong" font-size="32" fill="${accent}"`));
		page.push(text(58, 108, c.role, `class="body" font-size="13" fill="${muted}"`));
		page.push(line(58, 136, 537, 136, `stroke="${accent}" stroke-width="1.8"`));
		page.push(text(58, 178, c.summary, 'class="body" font-size="11"'));
		page.push(section("左侧能力", 58, 248, 170, accent, skillTags(c.skills, 58, 276, accent, true)));
		page.push(section("主经历", 258, 248, 280, accent, experienceRows(c, 258, 284, accent)));
		page.push(section("教育", 58, 586, 480, accent, text(58, 616, c.education, 'class="body" font-size="11"')));
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" width="595" height="842" role="img" aria-label="${esc(template.title)}">
		<defs>
			<style>
				.text { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", Arial, sans-serif; }
				.body { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", Arial, sans-serif; fill: #334155; font-weight: 400; }
				.strong { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", Arial, sans-serif; font-weight: 700; }
				.section-title { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", Arial, sans-serif; font-size: 14px; font-weight: 700; }
				.muted { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", Arial, sans-serif; fill: #64748b; }
				.white { font-family: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", Arial, sans-serif; fill: #fff; }
			</style>
			<filter id="paper" x="-10%" y="-10%" width="120%" height="120%">
				<feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0f172a" flood-opacity=".12"/>
			</filter>
		</defs>
		<rect x="0" y="0" width="595" height="842" rx="0" fill="#fbfaf6" filter="url(#paper)"/>
		<g class="text">${page.join("\n")}</g>
	</svg>`;
}

await mkdir(outDir, { recursive: true });

for (const template of templates) {
	await writeFile(join(outDir, `${template.id}.svg`), renderTemplate(template), "utf8");
}

await writeFile(
	join(outDir, "NOTICE.txt"),
	[
		"Template preview source notes",
		"",
		"- mnjul/html-resume: Apache License 2.0, used as layout inspiration for the timeline preview.",
		"- Afif718/Resumify: MIT License, used as layout inspiration for modern, sidebar, business, creative, and elegant previews.",
		"- The preview SVGs in this folder contain localized Chinese sample data and were generated for Ruili.",
		"",
		"Keep upstream license notices when reusing or further adapting these sources.",
	].join("\n"),
	"utf8",
);
