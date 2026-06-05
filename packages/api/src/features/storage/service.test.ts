import { describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
	APP_URL: "https://example.com",
	LOCAL_STORAGE_PATH: "",
	S3_ACCESS_KEY_ID: undefined as string | undefined,
	S3_SECRET_ACCESS_KEY: undefined as string | undefined,
	S3_REGION: "us-east-1",
	S3_ENDPOINT: undefined as string | undefined,
	S3_BUCKET: undefined as string | undefined,
	S3_FORCE_PATH_STYLE: false,
	FLAG_DISABLE_IMAGE_PROCESSING: false,
}));

vi.mock("@reactive-resume/env/server", () => ({ env: envMock }));
// sharp is exercised by processImageForUpload; keep it out of the import graph entirely
// because resolving it loads native bindings we can't rely on in CI.
vi.mock("sharp", () => {
	const chain = {
		resize: () => chain,
		jpeg: () => chain,
		rotate: () => chain,
		toBuffer: async () => Buffer.from("processed"),
		metadata: async () => ({ width: 100, height: 100 }),
	};
	return { default: () => chain };
});
vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: vi.fn(),
	PutObjectCommand: vi.fn(),
	GetObjectCommand: vi.fn(),
	DeleteObjectCommand: vi.fn(),
	ListObjectsV2Command: vi.fn(),
}));

const {
	detectImageMimeType,
	getStorageService,
	inferContentType,
	isImageFile,
	processImageForUpload,
	verifyImageUpload,
} = await import("./service");

const makeFile = (bytes: Uint8Array, type = "image/png") =>
	({
		arrayBuffer: async () => bytes.buffer,
		type,
	}) as unknown as File;

describe("inferContentType", () => {
	it("maps common image extensions to their MIME types", () => {
		expect(inferContentType("photo.jpg")).toBe("image/jpeg");
		expect(inferContentType("photo.jpeg")).toBe("image/jpeg");
		expect(inferContentType("photo.png")).toBe("image/png");
		expect(inferContentType("animated.gif")).toBe("image/gif");
		expect(inferContentType("logo.svg")).toBe("image/svg+xml");
		expect(inferContentType("photo.webp")).toBe("image/webp");
	});

	it("maps .pdf to application/pdf", () => {
		expect(inferContentType("doc.pdf")).toBe("application/pdf");
	});

	it("is case-insensitive on the extension", () => {
		expect(inferContentType("PHOTO.JPG")).toBe("image/jpeg");
		expect(inferContentType("Document.PDF")).toBe("application/pdf");
	});

	it("falls back to application/octet-stream for unknown extensions", () => {
		expect(inferContentType("data.xyz")).toBe("application/octet-stream");
		expect(inferContentType("README")).toBe("application/octet-stream");
	});

	it("uses just the file extension regardless of path depth", () => {
		expect(inferContentType("/nested/dir/file.png")).toBe("image/png");
	});
});

describe("processImageForUpload", () => {
	it("returns the file untouched when image processing is disabled", async () => {
		envMock.FLAG_DISABLE_IMAGE_PROCESSING = true;
		const file = makeFile(new Uint8Array([1, 2, 3, 4]), "image/png");

		const result = await processImageForUpload(file);

		expect(result.contentType).toBe("image/png");
		expect(Array.from(result.data)).toEqual([1, 2, 3, 4]);
	});

	it("re-encodes to JPEG via sharp when processing is enabled", async () => {
		envMock.FLAG_DISABLE_IMAGE_PROCESSING = false;
		const file = makeFile(new Uint8Array([5, 6, 7, 8]), "image/png");

		const result = await processImageForUpload(file);

		expect(result.contentType).toBe("image/jpeg");
		// Sharp mock returns "processed" — ensure we got something not equal to the input.
		expect(result.data.length).toBeGreaterThan(0);
		expect(Array.from(result.data)).not.toEqual([5, 6, 7, 8]);
	});
});

describe("detectImageMimeType", () => {
	it("detects supported image signatures", () => {
		expect(detectImageMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xdb]))).toBe("image/jpeg");
		expect(detectImageMimeType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
		expect(detectImageMimeType(new TextEncoder().encode("GIF89a"))).toBe("image/gif");
		expect(detectImageMimeType(new TextEncoder().encode("RIFFxxxxWEBP"))).toBe("image/webp");
	});

	it("does not treat SVG or HTML as a safe uploaded image", () => {
		expect(detectImageMimeType(new TextEncoder().encode("<svg><script>alert(1)</script></svg>"))).toBeNull();
		expect(detectImageMimeType(new TextEncoder().encode("<!doctype html><script>alert(1)</script>"))).toBeNull();
	});
});

describe("isImageFile", () => {
	it("returns true for supported image mime types", () => {
		for (const type of ["image/gif", "image/png", "image/jpeg", "image/webp"]) {
			expect(isImageFile(type), type).toBe(true);
		}
	});

	it("returns false for image/svg+xml (not in the upload allowlist)", () => {
		expect(isImageFile("image/svg+xml")).toBe(false);
	});

	it("returns false for application/pdf and other non-image types", () => {
		expect(isImageFile("application/pdf")).toBe(false);
		expect(isImageFile("text/plain")).toBe(false);
		expect(isImageFile("")).toBe(false);
	});
});

describe("verifyImageUpload", () => {
	it("returns the verified image MIME type when declared type and signature agree", () => {
		const mimeType = verifyImageUpload({
			declaredMimeType: "image/png",
			data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		});

		expect(mimeType).toBe("image/png");
	});

	it("rejects non-image uploads and files spoofing an image MIME type", () => {
		expect(() =>
			verifyImageUpload({ declaredMimeType: "text/html", data: new TextEncoder().encode("<script>alert(1)</script>") }),
		).toThrow("UNSUPPORTED_IMAGE_MIME_TYPE");

		expect(() =>
			verifyImageUpload({ declaredMimeType: "image/png", data: new TextEncoder().encode("<script>alert(1)</script>") }),
		).toThrow("IMAGE_SIGNATURE_INVALID");
	});

	it("rejects mismatched declared MIME type and detected signature", () => {
		expect(() =>
			verifyImageUpload({ declaredMimeType: "image/png", data: new Uint8Array([0xff, 0xd8, 0xff, 0xdb]) }),
		).toThrow("IMAGE_MIME_MISMATCH");
	});
});

describe("LocalStorageService", () => {
	it("rejects private writes instead of silently storing them on the local filesystem", async () => {
		await expect(
			getStorageService().write({
				key: "uploads/user/agent/thread/file.txt",
				data: new TextEncoder().encode("private"),
				contentType: "text/plain",
				private: true,
			}),
		).rejects.toThrow("Private storage writes are not supported by the local filesystem backend.");
	});
});
