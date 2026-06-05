// @vitest-environment happy-dom

import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import {
	buildDocxFromTemplate,
	extractDocxTemplatePlaceholdersFromXml,
	inspectDocxTemplate,
	renderDocxTemplateXml,
} from "./docx-template";

function makeResumeData(): ResumeData {
	const data = structuredClone(defaultResumeData);

	data.basics.name = "张三";
	data.basics.headline = "前端工程师";
	data.basics.email = "zhangsan@example.com";
	data.basics.phone = "13800000000";
	data.basics.location = "杭州";
	data.basics.website = { label: "作品集", url: "https://example.com" };
	data.summary.content = "<p>负责复杂后台与 C 端增长页面。</p>";
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

	return data;
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
			"<w:t>{{basics.unknown}}</w:t>",
		].join("");

		const rendered = renderDocxTemplateXml(xml, makeResumeData());

		expect(rendered).toContain("张三");
		expect(rendered).toContain("负责复杂后台与 C 端增长页面。");
		expect(rendered).toContain("高级前端工程师 / 云启科技 / 将首屏加载时间降低 32%。");
		expect(rendered).not.toContain("隐藏公司");
		expect(rendered).toContain("React：TypeScript、性能优化");
		expect(rendered).toContain("{{basics.unknown}}");
	});

	it("escapes XML characters in inserted values", () => {
		const data = makeResumeData();
		data.basics.name = "A&B <CEO>";

		const rendered = renderDocxTemplateXml("<w:t>{{basics.name}}</w:t>", data);

		expect(rendered).toContain("A&amp;B &lt;CEO&gt;");
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
});
