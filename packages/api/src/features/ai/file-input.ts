import { z } from "zod";

export const MAX_AI_FILE_BYTES = 10 * 1024 * 1024;

const MAX_AI_FILE_BASE64_CHARS = Math.ceil((MAX_AI_FILE_BYTES * 4) / 3) + 4;
const MAX_AI_FILE_NAME_CHARS = 180;

function getExtension(name: string) {
	return name.split(".").pop()?.toLowerCase() ?? "";
}

function getDecodedByteLength(base64: string) {
	return Buffer.from(base64, "base64").byteLength;
}

function hasControlCharacter(value: string) {
	for (const char of value) {
		const code = char.charCodeAt(0);
		if (code <= 31 || code === 127) return true;
	}

	return false;
}

function isBase64(value: string) {
	if (value.length % 4 !== 0) return false;

	let paddingStarted = false;
	for (const char of value) {
		if (char === "=") {
			paddingStarted = true;
			continue;
		}

		if (paddingStarted) return false;
		if (!/[A-Za-z0-9+/]/.test(char)) return false;
	}

	return true;
}

export const fileInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "File name is required.")
		.max(MAX_AI_FILE_NAME_CHARS, `File name is too long. Maximum length is ${MAX_AI_FILE_NAME_CHARS} characters.`)
		.refine((name) => !/[\\/]/.test(name), "File name must not include a path.")
		.refine((name) => !hasControlCharacter(name), "File name contains unsupported characters."),
	data: z
		.string()
		.trim()
		.min(1, "File data is required.")
		.max(MAX_AI_FILE_BASE64_CHARS, "File is too large. Maximum size is 10MB.")
		.superRefine((data, ctx) => {
			if (!isBase64(data)) {
				ctx.addIssue({ code: "custom", message: "File data must be base64 encoded." });
				return;
			}

			if (getDecodedByteLength(data) > MAX_AI_FILE_BYTES) {
				ctx.addIssue({ code: "custom", message: "File is too large. Maximum size is 10MB." });
			}
		}),
});

export function createFileInputSchema(allowedExtensions: string[]) {
	const normalizedExtensions = new Set(allowedExtensions.map((extension) => extension.toLowerCase()));

	return fileInputSchema.refine((file) => normalizedExtensions.has(getExtension(file.name)), {
		message: `File extension must be one of: ${allowedExtensions.join(", ")}.`,
		path: ["name"],
	});
}
