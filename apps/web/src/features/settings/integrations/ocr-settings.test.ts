import { describe, expect, it } from "vitest";
import { clearBrowserOcrProvider, loadBrowserOcrProvider, saveBrowserOcrProvider } from "./ocr-settings";

function makeStorage() {
	const values = new Map<string, string>();

	return {
		getItem: (key: string) => values.get(key) ?? null,
		removeItem: (key: string) => values.delete(key),
		setItem: (key: string, value: string) => values.set(key, value),
	};
}

describe("browser OCR provider settings", () => {
	it("saves and loads user-owned Azure OCR credentials from browser storage", () => {
		const storage = makeStorage();

		saveBrowserOcrProvider(
			{
				apiKey: "user-ocr-key",
				endpoint: "https://user.cognitiveservices.azure.com/",
				provider: "azure-document-intelligence",
			},
			storage,
		);

		expect(loadBrowserOcrProvider(storage)).toEqual({
			apiKey: "user-ocr-key",
			endpoint: "https://user.cognitiveservices.azure.com",
			provider: "azure-document-intelligence",
		});
	});

	it("ignores incomplete OCR settings", () => {
		const storage = makeStorage();

		saveBrowserOcrProvider(
			{
				apiKey: "",
				endpoint: "https://user.cognitiveservices.azure.com",
				provider: "azure-document-intelligence",
			},
			storage,
		);

		expect(loadBrowserOcrProvider(storage)).toBeNull();
	});

	it("clears saved OCR credentials", () => {
		const storage = makeStorage();

		saveBrowserOcrProvider(
			{
				apiKey: "user-ocr-key",
				endpoint: "https://user.cognitiveservices.azure.com",
				provider: "azure-document-intelligence",
			},
			storage,
		);
		clearBrowserOcrProvider(storage);

		expect(loadBrowserOcrProvider(storage)).toBeNull();
	});
});
