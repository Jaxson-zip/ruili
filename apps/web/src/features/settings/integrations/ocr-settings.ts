export type BrowserOcrProvider = {
	apiKey: string;
	endpoint: string;
	provider: "azure-document-intelligence";
};

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const storageKey = "ruili.browser-ocr-provider";

function getStorage(): StorageLike | null {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

function normalizeEndpoint(endpoint: string) {
	return endpoint.trim().replace(/\/+$/, "");
}

function parseProvider(value: unknown): BrowserOcrProvider | null {
	if (!value || typeof value !== "object") return null;

	const provider = (value as BrowserOcrProvider).provider;
	const endpoint = normalizeEndpoint(String((value as BrowserOcrProvider).endpoint ?? ""));
	const apiKey = String((value as BrowserOcrProvider).apiKey ?? "").trim();

	if (provider !== "azure-document-intelligence" || !endpoint || !apiKey) return null;

	return { apiKey, endpoint, provider };
}

export function loadBrowserOcrProvider(storage = getStorage()) {
	if (!storage) return null;

	try {
		const raw = storage.getItem(storageKey);
		if (!raw) return null;

		return parseProvider(JSON.parse(raw));
	} catch {
		return null;
	}
}

export function saveBrowserOcrProvider(provider: BrowserOcrProvider, storage = getStorage()) {
	if (!storage) return;

	const parsed = parseProvider(provider);
	if (!parsed) {
		clearBrowserOcrProvider(storage);
		return;
	}

	storage.setItem(storageKey, JSON.stringify(parsed));
}

export function clearBrowserOcrProvider(storage = getStorage()) {
	storage?.removeItem(storageKey);
}
