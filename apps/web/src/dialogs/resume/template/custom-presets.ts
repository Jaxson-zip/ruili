import type { Metadata } from "@reactive-resume/schema/resume/data";
import { metadataSchema, resumeDataSchema } from "@reactive-resume/schema/resume/data";

export type CustomTemplatePreset = {
	id: string;
	name: string;
	createdAt: string;
	metadata: Metadata;
};

type ImportedTemplatePreset = {
	name: string;
	metadata: Metadata;
};

const storageKey = "ruili.custom-template-presets";

function getStorage() {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

function cloneMetadata(metadata: Metadata): Metadata {
	return JSON.parse(JSON.stringify(metadata)) as Metadata;
}

function createId() {
	return globalThis.crypto?.randomUUID?.() ?? `template-${Date.now()}`;
}

function getFileBaseName(filename: string) {
	return filename.replace(/\.[^/.]+$/, "") || "导入模板";
}

function extractMetadata(input: unknown): Metadata | null {
	const directMetadata = metadataSchema.safeParse(input);
	if (directMetadata.success) return directMetadata.data;

	if (input && typeof input === "object" && "metadata" in input) {
		const metadata = metadataSchema.safeParse((input as { metadata: unknown }).metadata);
		if (metadata.success) return metadata.data;
	}

	if (input && typeof input === "object" && "data" in input) {
		const data = (input as { data: unknown }).data;
		const resumeData = resumeDataSchema.safeParse(data);
		if (resumeData.success) return resumeData.data.metadata;

		if (data && typeof data === "object" && "metadata" in data) {
			const metadata = metadataSchema.safeParse((data as { metadata: unknown }).metadata);
			if (metadata.success) return metadata.data;
		}
	}

	const resumeData = resumeDataSchema.safeParse(input);
	if (resumeData.success) return resumeData.data.metadata;

	return null;
}

export function parseTemplatePresetJson(text: string, filename = "导入模板.json"): ImportedTemplatePreset {
	let parsed: unknown;

	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error("请选择有效的 JSON 模板文件。");
	}

	const metadata = extractMetadata(parsed);
	if (!metadata) throw new Error("没有在文件中找到可用的模板配置。");

	const name =
		parsed && typeof parsed === "object" && "name" in parsed && typeof (parsed as { name: unknown }).name === "string"
			? (parsed as { name: string }).name.trim()
			: "";

	return {
		name: name || getFileBaseName(filename),
		metadata: cloneMetadata(metadata),
	};
}

export function loadCustomTemplatePresets(storage = getStorage()): CustomTemplatePreset[] {
	if (!storage) return [];

	try {
		const raw = storage.getItem(storageKey);
		if (!raw) return [];

		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.flatMap((item) => {
			if (!item || typeof item !== "object") return [];
			const metadata = metadataSchema.safeParse((item as { metadata: unknown }).metadata);
			if (!metadata.success) return [];

			const id = typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : createId();
			const name = typeof (item as { name?: unknown }).name === "string" ? (item as { name: string }).name : "导入模板";
			const createdAt =
				typeof (item as { createdAt?: unknown }).createdAt === "string"
					? (item as { createdAt: string }).createdAt
					: new Date().toISOString();

			return [{ id, name, createdAt, metadata: metadata.data }];
		});
	} catch {
		return [];
	}
}

export function saveCustomTemplatePresets(presets: CustomTemplatePreset[], storage = getStorage()) {
	if (!storage) return;
	storage.setItem(storageKey, JSON.stringify(presets));
}

export function createCustomTemplatePreset(input: ImportedTemplatePreset): CustomTemplatePreset {
	return {
		id: createId(),
		name: input.name,
		createdAt: new Date().toISOString(),
		metadata: cloneMetadata(input.metadata),
	};
}
