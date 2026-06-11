import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { afterEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { renderWordTemplateDocx } from "./docx";

const onePixelPng = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
	"base64",
);

async function renderDocumentXml(xml: string, data: ResumeData) {
	const zip = new JSZip();
	zip.file("[Content_Types].xml", "<Types></Types>");
	zip.file("word/document.xml", xml);

	const template = await zip.generateAsync({ type: "nodebuffer" });
	const rendered = await renderWordTemplateDocx(template, data);
	const renderedZip = await JSZip.loadAsync(rendered);

	return await renderedZip.file("word/document.xml")?.async("string");
}

describe("renderWordTemplateDocx", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders multiline values as Word line breaks", async () => {
		const data = structuredClone(defaultResumeData);
		data.summary.content = "<p>Line one</p><p>Line two</p>";

		const xml = await renderDocumentXml("<w:document><w:t>{{summary.content}}</w:t></w:document>", data);

		expect(xml).toContain("Line one</w:t><w:br/><w:t>Line two");
	});

	it("clears supported missing indexed fields instead of leaking placeholders", async () => {
		const data = structuredClone(defaultResumeData);
		data.sections.projects.items = [];

		const xml = await renderDocumentXml(
			"<w:document><w:t>{{sections.projects.items.0.name}}</w:t><w:t>{{basics.unknown}}</w:t></w:document>",
			data,
		);

		expect(xml).toContain("<w:t></w:t>");
		expect(xml).toContain("{{basics.unknown}}");
	});

	it("removes paragraphs that only contain empty supported placeholders", async () => {
		const data = structuredClone(defaultResumeData);
		data.sections.awards.items = [];

		const xml = await renderDocumentXml(
			"<w:document><w:p><w:r><w:t>{{sections.awards.items.0.title}}</w:t></w:r></w:p><w:p><w:r><w:t>Keep me</w:t></w:r></w:p></w:document>",
			data,
		);

		expect(xml).not.toContain("{{sections.awards.items.0.title}}");
		expect(xml).not.toContain("<w:p><w:r><w:t></w:t></w:r></w:p>");
		expect(xml).toContain("Keep me");
	});

	it("maps structured resume data into template-specific Word view fields", async () => {
		const data = structuredClone(defaultResumeData);
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

		const xml = await renderDocumentXml(
			[
				"<w:document>",
				"<w:t>{{zhInternship.basics.gender}}</w:t>",
				"<w:t>{{zhInternship.projects.0.name}}</w:t>",
				"<w:t>{{zhInternship.projects.0.descriptionLines.2.text}}</w:t>",
				"</w:document>",
			].join(""),
			data,
		);

		expect(xml).toContain("男");
		expect(xml).toContain("结构化模板项目");
		expect(xml).toContain("工作职责：把结构化字段填进 Word 槽位。");
	});

	it("removes empty template-specific Word view paragraphs", async () => {
		const data = structuredClone(defaultResumeData);
		data.sections.projects.items = [];

		const xml = await renderDocumentXml(
			"<w:document><w:p><w:r><w:t>{{zhInternship.projects.0.descriptionLines.0.text}}</w:t></w:r></w:p><w:p><w:r><w:t>Keep me</w:t></w:r></w:p></w:document>",
			data,
		);

		expect(xml).not.toContain("{{zhInternship.projects.0.descriptionLines.0.text}}");
		expect(xml).toContain("Keep me");
	});

	it("replaces the primary Word template picture from structured resume data", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(onePixelPng, { headers: { "content-type": "image/png" } })),
		);

		const data = structuredClone(defaultResumeData);
		data.picture.url = "/uploads/user/pictures/photo.png";
		data.picture.hidden = false;

		const zip = new JSZip();
		zip.file("[Content_Types].xml", "<Types></Types>");
		zip.file("word/document.xml", "<w:document><w:t>{{basics.name}}</w:t></w:document>");
		zip.file("word/media/image1.jpeg", Buffer.from("old-picture"));
		zip.file("word/media/image2.png", Buffer.from("decorative"));

		const template = await zip.generateAsync({ type: "nodebuffer" });
		const rendered = await renderWordTemplateDocx(template, data);
		const renderedZip = await JSZip.loadAsync(rendered);
		const picture = await renderedZip.file("word/media/image1.jpeg")?.async("nodebuffer");
		const decorative = await renderedZip.file("word/media/image2.png")?.async("nodebuffer");

		expect(fetch).toHaveBeenCalledWith("http://localhost:3000/uploads/user/pictures/photo.png");
		expect(picture?.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
		expect(decorative?.toString()).toBe("decorative");
	});
});
