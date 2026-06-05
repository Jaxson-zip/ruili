import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
	OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: "https://example.cognitiveservices.azure.com",
	OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY: "test-key",
	OCR_MIN_TEXT_CHARS: 120,
	OCR_POLL_INTERVAL_MS: 0,
	OCR_PROVIDER: "azure-document-intelligence" as string | undefined,
	OCR_TIMEOUT_MS: 1000,
}));

vi.mock("@reactive-resume/env/server", () => ({ env: envMock }));

const { extractTextWithCloudOcr, isCloudOcrConfigured, shouldUseExtractedText } = await import("./ocr");

describe("shouldUseExtractedText", () => {
	it("uses local extracted text only when it has enough meaningful characters", () => {
		expect(shouldUseExtractedText("张三 前端工程师 React 项目经验".repeat(8))).toBe(true);
		expect(shouldUseExtractedText("页眉 1")).toBe(false);
		expect(shouldUseExtractedText(null)).toBe(false);
	});
});

describe("isCloudOcrConfigured", () => {
	it("requires a configured provider and provider credentials", () => {
		expect(isCloudOcrConfigured()).toBe(true);

		envMock.OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY = "";
		expect(isCloudOcrConfigured()).toBe(false);
	});

	it("accepts request-scoped user OCR credentials without requiring server OCR env vars", () => {
		envMock.OCR_PROVIDER = undefined;
		envMock.OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "";
		envMock.OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY = "";

		expect(
			isCloudOcrConfigured({
				apiKey: "user-key",
				endpoint: "https://user.cognitiveservices.azure.com",
				provider: "azure-document-intelligence",
			}),
		).toBe(true);
	});

	it("rejects request-scoped OCR endpoints outside Azure Document Intelligence", () => {
		expect(
			isCloudOcrConfigured({
				apiKey: "user-key",
				endpoint: "https://localhost:8443",
				provider: "azure-document-intelligence",
			}),
		).toBe(false);
	});
});

describe("extractTextWithCloudOcr", () => {
	beforeEach(() => {
		envMock.OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "https://example.cognitiveservices.azure.com";
		envMock.OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY = "test-key";
		envMock.OCR_PROVIDER = "azure-document-intelligence";
		vi.restoreAllMocks();
	});

	it("submits the file to Azure Document Intelligence and reads analyzeResult.content", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(
				new Response(null, {
					status: 202,
					headers: { "Operation-Location": "https://example.cognitiveservices.azure.com/result/1" },
				}),
			)
			.mockResolvedValueOnce(
				Response.json({
					status: "succeeded",
					analyzeResult: { content: "张三\n前端工程师\nReact 项目经验" },
				}),
			);

		const result = await extractTextWithCloudOcr({
			file: { name: "resume.pdf", data: Buffer.from("%PDF").toString("base64") },
			mediaType: "application/pdf",
		});

		expect(result?.text).toContain("张三");
		expect(result?.provider).toBe("azure-document-intelligence");
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			method: "POST",
			headers: expect.objectContaining({
				"Content-Type": "application/pdf",
				"Ocp-Apim-Subscription-Key": "test-key",
			}),
		});
	});

	it("returns null when cloud OCR is not configured", async () => {
		envMock.OCR_PROVIDER = undefined;

		await expect(
			extractTextWithCloudOcr({
				file: { name: "resume.pdf", data: Buffer.from("%PDF").toString("base64") },
				mediaType: "application/pdf",
			}),
		).resolves.toBeNull();
	});

	it("uses request-scoped user OCR credentials before server OCR credentials", async () => {
		envMock.OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "https://server.cognitiveservices.azure.com";
		envMock.OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY = "server-key";
		envMock.OCR_PROVIDER = "azure-document-intelligence";

		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValueOnce(
				new Response(null, {
					status: 202,
					headers: { "Operation-Location": "https://user.cognitiveservices.azure.com/result/1" },
				}),
			)
			.mockResolvedValueOnce(
				Response.json({
					status: "succeeded",
					analyzeResult: { content: "李四\n产品经理\n增长项目经验" },
				}),
			);

		const result = await extractTextWithCloudOcr({
			credentials: {
				apiKey: "user-key",
				endpoint: "https://user.cognitiveservices.azure.com",
				provider: "azure-document-intelligence",
			},
			file: { name: "resume.pdf", data: Buffer.from("%PDF").toString("base64") },
			mediaType: "application/pdf",
		});

		expect(result?.text).toContain("李四");
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			"https://user.cognitiveservices.azure.com/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30",
		);
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			headers: expect.objectContaining({ "Ocp-Apim-Subscription-Key": "user-key" }),
		});
	});
});
