import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Locale } from "@reactive-resume/utils/locale";
import { isLocale } from "@reactive-resume/utils/locale";

type ResolveImportedResumeNameInput = {
	data: ResumeData;
	requestedName?: string | null;
	fallbackName: string;
	preferRequestedName?: boolean;
};

const extensionPattern = /\.(docx?|pdf|json)$/i;

function normalizeImportedResumeName(value: string | null | undefined) {
	const normalized = value?.trim().replace(extensionPattern, "").trim();
	return normalized || undefined;
}

export function resolveImportedResumeName({
	data,
	requestedName,
	fallbackName,
	preferRequestedName = false,
}: ResolveImportedResumeNameInput) {
	const normalizedRequestedName = normalizeImportedResumeName(requestedName);

	if (preferRequestedName && normalizedRequestedName) return normalizedRequestedName;

	return (
		normalizeImportedResumeName(data.basics.name) ??
		normalizedRequestedName ??
		normalizeImportedResumeName(fallbackName) ??
		"Imported Resume"
	);
}

export function buildImportedResumeSlug(name: string, seed: string) {
	const suffix = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
	const base =
		name
			.trim()
			.normalize("NFKD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.replace(/-{2,}/g, "-") || "resume";

	return suffix ? `${base}-${suffix}` : base;
}

export function resolveImportedResumeLocale(data: ResumeData, fallbackLocale: Locale): Locale {
	return isLocale(data.metadata.page.locale) ? data.metadata.page.locale : fallbackLocale;
}
