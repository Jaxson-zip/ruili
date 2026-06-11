// @vitest-environment happy-dom

import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { buildWordTemplateImportInput } from "../../../dialogs/resume/template-starter-import";
import {
	buildDocxFromTemplate,
	DOCX_TEMPLATE_MIME_TYPE,
	extractDocxTemplatePlaceholdersFromXml,
	inspectDocxTemplate,
	renderDocxTemplateXml,
} from "./docx-template";

const onePixelJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

function makeResumeData(): ResumeData {
	const data = structuredClone(defaultResumeData);

	data.basics.name = "张三";
	data.basics.headline = "前端工程师";
	data.basics.email = "zhangsan@example.com";
	data.basics.phone = "13800000000";
	data.basics.location = "杭州";
	data.basics.website = { label: "作品集", url: "https://example.com" };
	data.summary.content = "<p>负责复杂后台与 C 端增长页面。</p>";
	data.sections.education.items = [
		{
			id: "edu-1",
			hidden: false,
			school: "测试大学",
			degree: "本科",
			area: "软件工程",
			grade: "",
			location: "杭州",
			period: "2020.09 - 2024.06",
			website: { label: "", url: "", inlineLink: false },
			description: "",
		},
	];
	data.sections.experience.items = [
		{
			id: "exp-1",
			hidden: false,
			company: "云启科技",
			position: "高级前端工程师",
			location: "上海",
			period: "2022.03 - 至今",
			website: { label: "", url: "", inlineLink: false },
			description: "<ul><li>将首屏加载时间降低 32%。</li></ul>",
			roles: [],
		},
		{
			id: "exp-2",
			hidden: true,
			company: "隐藏公司",
			position: "不应出现",
			location: "",
			period: "",
			website: { label: "", url: "", inlineLink: false },
			description: "",
			roles: [],
		},
	];
	data.sections.projects.items = [
		{
			id: "project-1",
			hidden: false,
			name: "测试项目",
			period: "2024.01 - 2024.06",
			website: { label: "", url: "", inlineLink: false },
			description: "<p>负责项目核心模块开发。</p>",
		},
	];
	data.sections.skills.items = [
		{
			id: "skill-1",
			hidden: false,
			icon: "",
			iconColor: "",
			name: "React",
			proficiency: "熟练",
			level: 4,
			keywords: ["TypeScript", "性能优化"],
		},
	];
	data.sections.awards.items = [
		{
			id: "award-1",
			hidden: false,
			title: "年度优秀新人",
			awarder: "云启科技",
			date: "2023.12",
			description: "<p>跨团队协作表现突出。</p>",
			website: { label: "", url: "", inlineLink: false },
		},
	];

	return data;
}

function readTemplateAsset(path: string) {
	return readFileSync(fileURLToPath(new URL(path, import.meta.url)));
}

async function readWordXml(zip: JSZip) {
	const xmlParts = await Promise.all(
		Object.values(zip.files)
			.filter((file) => !file.dir && /^word\/(?:document|header\d+|footer\d+)\.xml$/.test(file.name))
			.map((file) => file.async("string")),
	);

	return xmlParts.join("\n");
}

async function createTemplateDocxXml(xmlByPath: Record<string, string>) {
	const zip = new JSZip();
	zip.file("[Content_Types].xml", "<Types></Types>");
	for (const [path, xml] of Object.entries(xmlByPath)) {
		zip.file(path, xml);
	}

	const blob = await zip.generateAsync({
		type: "blob",
		mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	});

	return new File([blob], "template.docx", {
		type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	});
}

describe("docx template export", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(onePixelJpeg, { headers: { "content-type": "image/jpeg" } })),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("extracts unique placeholders from Word XML", () => {
		const xml = "<w:t>{{basics.name}}</w:t><w:t>{{ basics.name }}</w:t><w:t>{{#experience}}</w:t>";

		expect(extractDocxTemplatePlaceholdersFromXml(xml)).toEqual(["basics.name", "experience"]);
	});

	it("replaces scalar placeholders and repeat blocks with XML-safe resume values", () => {
		const xml = [
			"<w:t>{{basics.name}}</w:t>",
			"<w:t>{{summary.content}}</w:t>",
			"<w:t>{{#experience}}{{position}} / {{company}} / {{description}}{{/experience}}</w:t>",
			"<w:t>{{skills}}</w:t>",
			"<w:t>{{awards}}</w:t>",
			"<w:t>{{basics.unknown}}</w:t>",
		].join("");

		const rendered = renderDocxTemplateXml(xml, makeResumeData());

		expect(rendered).toContain("张三");
		expect(rendered).toContain("负责复杂后台与 C 端增长页面。");
		expect(rendered).toContain("高级前端工程师 / 云启科技 / 将首屏加载时间降低 32%。");
		expect(rendered).not.toContain("隐藏公司");
		expect(rendered).toContain("React：TypeScript、性能优化");
		expect(rendered).toContain("2023.12 | 云启科技 | 年度优秀新人 | 跨团队协作表现突出。");
		expect(rendered).toContain("{{basics.unknown}}");
	});

	it("escapes XML characters in inserted values", () => {
		const data = makeResumeData();
		data.basics.name = "A&B <CEO>";

		const rendered = renderDocxTemplateXml("<w:t>{{basics.name}}</w:t>", data);

		expect(rendered).toContain("A&amp;B &lt;CEO&gt;");
	});

	it("renders multiline values as Word line breaks", () => {
		const data = makeResumeData();
		data.summary.content = "<p>Line one</p><p>Line two</p>";

		const rendered = renderDocxTemplateXml("<w:t>{{summary.content}}</w:t>", data);

		expect(rendered).toContain("Line one</w:t><w:br/><w:t>Line two");
	});

	it("clears supported missing indexed fields instead of leaking placeholders", () => {
		const data = makeResumeData();
		data.sections.projects.items = [];

		const rendered = renderDocxTemplateXml(
			"<w:t>{{sections.projects.items.0.name}}</w:t><w:t>{{basics.unknown}}</w:t>",
			data,
		);

		expect(rendered).toContain("<w:t></w:t>");
		expect(rendered).toContain("{{basics.unknown}}");
	});

	it("resolves indexed section placeholders from visible items only", () => {
		const data = makeResumeData();
		data.sections.projects.items = [
			{
				id: "hidden-project",
				hidden: true,
				name: "隐藏项目不应导出",
				period: "2024",
				website: { label: "", url: "", inlineLink: false },
				description: "",
			},
			{
				id: "visible-project",
				hidden: false,
				name: "可见项目应导出",
				period: "2025",
				website: { label: "", url: "", inlineLink: false },
				description: "",
			},
		];

		const rendered = renderDocxTemplateXml(
			"<w:t>{{sections.projects.items.0.name}}</w:t><w:t>{{sections.projects.items.1.name}}</w:t>",
			data,
		);

		expect(rendered).toContain("可见项目应导出");
		expect(rendered).not.toContain("隐藏项目不应导出");
		expect(rendered).toContain("<w:t></w:t>");
	});

	it("removes paragraphs that only contain empty supported placeholders", () => {
		const data = makeResumeData();
		data.sections.awards.items = [];

		const rendered = renderDocxTemplateXml(
			"<w:document><w:p><w:r><w:t>{{sections.awards.items.0.title}}</w:t></w:r></w:p><w:p><w:r><w:t>Keep me</w:t></w:r></w:p></w:document>",
			data,
		);

		expect(rendered).not.toContain("{{sections.awards.items.0.title}}");
		expect(rendered).not.toContain("<w:p><w:r><w:t></w:t></w:r></w:p>");
		expect(rendered).toContain("Keep me");
	});

	it("maps structured resume data into template-specific Word view fields", () => {
		const data = makeResumeData();
		data.basics.customFields = [
			{ id: "gender", icon: "user", text: "男", link: "" },
			{ id: "birthday", icon: "calendar", text: "2000.1.1", link: "" },
		];
		data.sections.projects.items = [
			{
				id: "project-1",
				hidden: false,
				name: "结构化模板项目",
				period: "2026.1-2026.3",
				website: { label: "", url: "", inlineLink: false },
				description: "<p>前端开发</p><p>协同开发</p><p>工作职责：把结构化字段填进 Word 槽位。</p>",
			},
		];

		const rendered = renderDocxTemplateXml(
			[
				"<w:t>{{zhInternship.basics.gender}}</w:t>",
				"<w:t>{{zhInternship.projects.0.name}}</w:t>",
				"<w:t>{{zhInternship.projects.0.descriptionLines.2.text}}</w:t>",
			].join(""),
			data,
		);

		expect(rendered).toContain("男");
		expect(rendered).toContain("结构化模板项目");
		expect(rendered).toContain("工作职责：把结构化字段填进 Word 槽位。");
	});

	it("removes empty template-specific Word view paragraphs", () => {
		const data = makeResumeData();
		data.sections.projects.items = [];

		const rendered = renderDocxTemplateXml(
			"<w:document><w:p><w:r><w:t>{{zhInternship.projects.0.descriptionLines.0.text}}</w:t></w:r></w:p><w:p><w:r><w:t>Keep me</w:t></w:r></w:p></w:document>",
			data,
		);

		expect(rendered).not.toContain("{{zhInternship.projects.0.descriptionLines.0.text}}");
		expect(rendered).toContain("Keep me");
	});

	it("inspects placeholders across document, header, and footer XML files", async () => {
		const file = await createTemplateDocxXml({
			"word/document.xml": "<w:t>{{basics.name}}</w:t>",
			"word/header1.xml": "<w:t>{{summary.content}}</w:t>",
			"word/footer1.xml": "<w:t>{{experience}}</w:t>",
		});

		const result = await inspectDocxTemplate(file);

		expect(result.placeholders).toEqual(["basics.name", "summary.content", "experience"]);
	});

	it("treats indexed section item placeholders as supported", async () => {
		const file = await createTemplateDocxXml({
			"word/document.xml": [
				"<w:t>{{sections.education.items.0.school}}</w:t>",
				"<w:t>{{sections.projects.items.0.name}}</w:t>",
			].join(""),
		});

		const result = await inspectDocxTemplate(file);

		expect(result.supportedPlaceholders).toEqual([
			"sections.education.items.0.school",
			"sections.projects.items.0.name",
		]);
		expect(result.unsupportedPlaceholders).toEqual([]);
	});

	it("builds a DOCX blob by replacing placeholders in Word XML files", async () => {
		const file = await createTemplateDocxXml({
			"word/document.xml": "<w:document><w:t>{{basics.name}}</w:t></w:document>",
			"word/header1.xml": "<w:hdr><w:t>{{basics.headline}}</w:t></w:hdr>",
		});

		const blob = await buildDocxFromTemplate(file, makeResumeData());
		const zip = await JSZip.loadAsync(blob);

		await expect(zip.file("word/document.xml")?.async("string")).resolves.toContain("张三");
		await expect(zip.file("word/header1.xml")?.async("string")).resolves.toContain("前端工程师");
		expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
	});

	it("replaces the primary DOCX picture from structured resume data", async () => {
		const data = makeResumeData();
		data.picture.url = "/templates/word/zh-internship-001-photo.jpeg";
		data.picture.hidden = false;

		const zip = new JSZip();
		zip.file("[Content_Types].xml", "<Types></Types>");
		zip.file("word/document.xml", "<w:document><w:t>{{basics.name}}</w:t></w:document>");
		zip.file("word/media/image1.jpeg", new Uint8Array([1, 2, 3]));
		zip.file("word/media/image2.png", new Uint8Array([4, 5, 6]));

		const templateBlob = await zip.generateAsync({ type: "blob", mimeType: DOCX_TEMPLATE_MIME_TYPE });
		const blob = await buildDocxFromTemplate(templateBlob, data);
		const renderedZip = await JSZip.loadAsync(blob);
		const picture = await renderedZip.file("word/media/image1.jpeg")?.async("uint8array");
		const decorative = await renderedZip.file("word/media/image2.png")?.async("uint8array");

		expect(fetch).toHaveBeenCalledWith("http://localhost:3000/templates/word/zh-internship-001-photo.jpeg");
		expect(Array.from(picture ?? [])).toEqual(Array.from(onePixelJpeg));
		expect(Array.from(decorative ?? [])).toEqual([4, 5, 6]);
	});

	it("fills the bundled internship Word template without leaving key placeholders", async () => {
		const data = makeResumeData();
		const firstEducation = data.sections.education.items[0];
		const firstProject = data.sections.projects.items[0];
		const firstExperience = data.sections.experience.items[0];
		if (!firstEducation || !firstProject || !firstExperience) {
			throw new Error("Expected makeResumeData to include education, project, and experience items.");
		}

		data.basics.customFields = [
			{ id: "gender", icon: "user", text: "男", link: "" },
			{ id: "birthday", icon: "calendar", text: "2000.1.1", link: "" },
		];
		data.sections.education.items[0] = {
			...firstEducation,
			school: "测试大学",
			degree: "本科",
			area: "软件工程",
			grade: "3.8/4.0",
			period: "2020.9-2024.6",
			description: "班级学习委员",
		};
		data.sections.projects.items[0] = {
			...firstProject,
			name: "测试项目",
			period: "2024.1-2024.6",
		};
		data.sections.experience.items.push({
			...firstExperience,
			id: "exp-3",
			company: "补充公司",
			position: "补充岗位",
			period: "2024.7-2024.8",
			description: "<p>补充工作内容</p>",
			hidden: false,
		});

		const template = readTemplateAsset("../../../../public/templates/word/zh-internship-001.docx");
		const file = new File([template], "zh-internship-001.docx", { type: DOCX_TEMPLATE_MIME_TYPE });
		const blob = await buildDocxFromTemplate(file, data);
		const zip = await JSZip.loadAsync(blob);
		const documentXml = await zip.file("word/document.xml")?.async("string");

		expect(documentXml).toContain("张三");
		expect(documentXml).toContain("13800000000");
		expect(documentXml).toContain("zhangsan@example.com");
		expect(documentXml).toContain("测试大学");
		expect(documentXml).toContain("测试项目");
		expect(documentXml).toContain("补充公司");
		expect(documentXml).toContain("补充工作内容");
		expect(documentXml).not.toContain("{{");
	});

	it("fills the bundled ATS compact Word template from structured Chinese data", async () => {
		const data = buildWordTemplateImportInput(undefined, "zh-ats-compact-001").data;

		const template = readTemplateAsset("../../../../public/templates/word/zh-ats-compact-001.docx");
		const file = new File([template], "zh-ats-compact-001.docx", { type: DOCX_TEMPLATE_MIME_TYPE });
		const blob = await buildDocxFromTemplate(file, data);
		const zip = await JSZip.loadAsync(blob);
		const documentXml = await zip.file("word/document.xml")?.async("string");
		const wordXml = await readWordXml(zip);

		expect(documentXml).toContain("林知夏");
		expect(documentXml).toContain("教育经历");
		expect(documentXml).toContain("示例信息职业技术学院");
		expect(documentXml).toContain("校园数据治理平台");
		expect(documentXml).toContain("前端开发");
		expect(wordXml).toContain("锐历 | 中文结构化简历模板");
		expect(wordXml).not.toContain("中文结构化简历模板?");
		expect(wordXml).not.toContain("Structured Resume Template");
		expect(documentXml).not.toContain("{{");
		expect(documentXml).not.toContain("????");
	});

	it("fills the bundled sidebar Word template from structured Chinese data", async () => {
		const data = buildWordTemplateImportInput(undefined, "zh-sidebar-clean-001").data;

		const template = readTemplateAsset("../../../../public/templates/word/zh-sidebar-clean-001.docx");
		const file = new File([template], "zh-sidebar-clean-001.docx", { type: DOCX_TEMPLATE_MIME_TYPE });
		const blob = await buildDocxFromTemplate(file, data);
		const zip = await JSZip.loadAsync(blob);
		const documentXml = await zip.file("word/document.xml")?.async("string");
		const wordXml = await readWordXml(zip);

		expect(documentXml).toContain("林知夏");
		expect(documentXml).toContain("核心技能");
		expect(documentXml).toContain("云澜数据科技有限公司");
		expect(documentXml).toContain("招聘岗位匹配分析工具");
		expect(documentXml).toContain("更多荣誉");
		expect(documentXml).not.toContain("补充亮点");
		expect(wordXml).toContain("锐历 | 侧栏中文简历模板");
		expect(wordXml).not.toContain("Sidebar Resume Template");
		expect(documentXml).not.toContain("{{");
		expect(documentXml).not.toContain("????");
	});
});
