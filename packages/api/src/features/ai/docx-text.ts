import { inflateRawSync } from "node:zlib";

type ZipEntry = {
	compressedSize: number;
	localHeaderOffset: number;
	method: number;
	name: string;
};

const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const MAX_EOCD_SEARCH_BYTES = 66_000;

function findEndOfCentralDirectory(buffer: Buffer) {
	const start = Math.max(0, buffer.length - MAX_EOCD_SEARCH_BYTES);

	for (let index = buffer.length - 22; index >= start; index--) {
		if (buffer.readUInt32LE(index) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) return index;
	}

	throw new Error("DOCX_ZIP_DIRECTORY_NOT_FOUND");
}

function readZipEntries(buffer: Buffer): ZipEntry[] {
	const endOffset = findEndOfCentralDirectory(buffer);
	const entryCount = buffer.readUInt16LE(endOffset + 10);
	const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
	const entries: ZipEntry[] = [];
	let offset = centralDirectoryOffset;

	for (let index = 0; index < entryCount; index++) {
		if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) throw new Error("DOCX_ZIP_ENTRY_INVALID");

		const method = buffer.readUInt16LE(offset + 10);
		const compressedSize = buffer.readUInt32LE(offset + 20);
		const fileNameLength = buffer.readUInt16LE(offset + 28);
		const extraLength = buffer.readUInt16LE(offset + 30);
		const commentLength = buffer.readUInt16LE(offset + 32);
		const localHeaderOffset = buffer.readUInt32LE(offset + 42);
		const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");

		entries.push({ compressedSize, localHeaderOffset, method, name });
		offset += 46 + fileNameLength + extraLength + commentLength;
	}

	return entries;
}

function readZipEntryData(buffer: Buffer, entry: ZipEntry) {
	const offset = entry.localHeaderOffset;
	if (buffer.readUInt32LE(offset) !== LOCAL_FILE_HEADER_SIGNATURE) throw new Error("DOCX_LOCAL_HEADER_INVALID");

	const fileNameLength = buffer.readUInt16LE(offset + 26);
	const extraLength = buffer.readUInt16LE(offset + 28);
	const dataStart = offset + 30 + fileNameLength + extraLength;
	const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

	if (entry.method === 0) return compressed;
	if (entry.method === 8) return inflateRawSync(compressed);

	throw new Error("DOCX_UNSUPPORTED_COMPRESSION");
}

function decodeXmlEntities(value: string) {
	return value.replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, (match, entity: string) => {
		if (entity === "amp") return "&";
		if (entity === "lt") return "<";
		if (entity === "gt") return ">";
		if (entity === "quot") return '"';
		if (entity === "apos") return "'";

		if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
		if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));

		return match;
	});
}

function xmlToText(xml: string) {
	return decodeXmlEntities(
		xml
			.replace(/<w:tab\s*\/>/g, "\t")
			.replace(/<w:(br|cr)\s*\/>/g, "\n")
			.replace(/<\/w:tc>/g, "\t")
			.replace(/<\/w:(p|tr)>/g, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/[ \t]+\n/g, "\n")
			.replace(/\n{3,}/g, "\n\n")
			.replace(/[ \t]{2,}/g, " ")
			.trim(),
	);
}

function isWordTextXml(name: string) {
	return /^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/i.test(name);
}

export function extractDocxTextFromBuffer(buffer: Buffer) {
	const entries = readZipEntries(buffer).filter((entry) => isWordTextXml(entry.name));
	const orderedEntries = entries.sort((a, b) => {
		if (a.name === "word/document.xml") return -1;
		if (b.name === "word/document.xml") return 1;
		return a.name.localeCompare(b.name);
	});

	const text = orderedEntries
		.map((entry) => xmlToText(readZipEntryData(buffer, entry).toString("utf8")))
		.filter(Boolean)
		.join("\n\n")
		.trim();

	if (!text) throw new Error("DOCX_TEXT_EMPTY");
	return text;
}

export function extractDocxTextFromBase64(base64: string) {
	return extractDocxTextFromBuffer(Buffer.from(base64, "base64"));
}
