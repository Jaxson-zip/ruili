import { describe, expect, it } from "vitest";
import { extractDocxTextFromBuffer } from "./docx-text";

function createStoredZip(entries: Record<string, string>) {
	const localParts: Buffer[] = [];
	const centralParts: Buffer[] = [];
	let offset = 0;

	for (const [name, text] of Object.entries(entries)) {
		const nameBuffer = Buffer.from(name);
		const data = Buffer.from(text);

		const localHeader = Buffer.alloc(30);
		localHeader.writeUInt32LE(0x04034b50, 0);
		localHeader.writeUInt16LE(20, 4);
		localHeader.writeUInt16LE(0, 6);
		localHeader.writeUInt16LE(0, 8);
		localHeader.writeUInt32LE(0, 10);
		localHeader.writeUInt32LE(0, 14);
		localHeader.writeUInt32LE(data.length, 18);
		localHeader.writeUInt32LE(data.length, 22);
		localHeader.writeUInt16LE(nameBuffer.length, 26);
		localHeader.writeUInt16LE(0, 28);

		localParts.push(localHeader, nameBuffer, data);

		const centralHeader = Buffer.alloc(46);
		centralHeader.writeUInt32LE(0x02014b50, 0);
		centralHeader.writeUInt16LE(20, 4);
		centralHeader.writeUInt16LE(20, 6);
		centralHeader.writeUInt16LE(0, 8);
		centralHeader.writeUInt16LE(0, 10);
		centralHeader.writeUInt32LE(0, 12);
		centralHeader.writeUInt32LE(0, 16);
		centralHeader.writeUInt32LE(data.length, 20);
		centralHeader.writeUInt32LE(data.length, 24);
		centralHeader.writeUInt16LE(nameBuffer.length, 28);
		centralHeader.writeUInt16LE(0, 30);
		centralHeader.writeUInt16LE(0, 32);
		centralHeader.writeUInt32LE(0, 34);
		centralHeader.writeUInt32LE(0, 38);
		centralHeader.writeUInt32LE(offset, 42);

		centralParts.push(centralHeader, nameBuffer);
		offset += localHeader.length + nameBuffer.length + data.length;
	}

	const centralDirectory = Buffer.concat(centralParts);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(0, 4);
	end.writeUInt16LE(0, 6);
	end.writeUInt16LE(Object.keys(entries).length, 8);
	end.writeUInt16LE(Object.keys(entries).length, 10);
	end.writeUInt32LE(centralDirectory.length, 12);
	end.writeUInt32LE(offset, 16);
	end.writeUInt16LE(0, 20);

	return Buffer.concat([...localParts, centralDirectory, end]);
}

describe("extractDocxTextFromBuffer", () => {
	it("extracts readable Chinese resume text from document XML", () => {
		const docx = createStoredZip({
			"word/document.xml": `
				<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
					<w:body>
						<w:p><w:r><w:t>张三</w:t></w:r><w:r><w:tab/><w:t>前端工程师</w:t></w:r></w:p>
						<w:p><w:r><w:t>React 项目经历</w:t></w:r></w:p>
					</w:body>
				</w:document>
			`,
		});

		const text = extractDocxTextFromBuffer(docx);

		expect(text).toContain("张三");
		expect(text).toContain("前端工程师");
		expect(text).toContain("React 项目经历");
	});

	it("includes header and footer text when they contain resume data", () => {
		const docx = createStoredZip({
			"word/document.xml": "<w:document><w:body><w:p><w:r><w:t>项目经验</w:t></w:r></w:p></w:body></w:document>",
			"word/header1.xml": "<w:hdr><w:p><w:r><w:t>13800000000</w:t></w:r></w:p></w:hdr>",
			"word/footer1.xml": "<w:ftr><w:p><w:r><w:t>zhangsan@example.com</w:t></w:r></w:p></w:ftr>",
		});

		const text = extractDocxTextFromBuffer(docx);

		expect(text).toContain("13800000000");
		expect(text).toContain("项目经验");
		expect(text).toContain("zhangsan@example.com");
	});
});
