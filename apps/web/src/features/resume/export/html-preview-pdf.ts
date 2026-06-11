export const wordTemplatePreviewPageSelector = "[data-word-template-preview-page]";
export const wordTemplateExportRootSelector = "[data-word-template-export-root]";

type CreateWordTemplateHtmlPreviewPdfOptions = {
	pixelRatio?: number;
	quality?: number;
	root?: ParentNode;
};

type JpegPage = {
	bytes: Uint8Array;
	height: number;
	width: number;
};

const a4Page = {
	width: 595.28,
	height: 841.89,
};

const a4ExportPage = {
	width: 794,
	height: 1123,
};

export async function createWordTemplateHtmlPreviewPdfBlob({
	pixelRatio = 2,
	quality = 0.95,
	root = document,
}: CreateWordTemplateHtmlPreviewPdfOptions = {}) {
	const exportRoot = root.querySelector<HTMLElement>(wordTemplateExportRootSelector);
	const pageRoot = exportRoot ?? root;
	const sourcePages = Array.from(pageRoot.querySelectorAll<HTMLElement>(wordTemplatePreviewPageSelector));
	if (sourcePages.length === 0) throw new Error("No Word template HTML preview pages found.");

	const { toJpeg } = await import("html-to-image");
	const exportHost = createFixedA4ExportHost(sourcePages);
	const pages = Array.from(exportHost.querySelectorAll<HTMLElement>(wordTemplatePreviewPageSelector));

	try {
		await waitForImages(pages);

		const jpegPages: JpegPage[] = [];

		for (const page of pages) {
			const dataUrl = await toJpeg(page, {
				backgroundColor: "#ffffff",
				cacheBust: true,
				pixelRatio,
				quality,
			});
			const { height, width } = getElementPixelSize(page, pixelRatio);
			jpegPages.push({ bytes: dataUrlToBytes(dataUrl), height, width });
		}

		return createPdfBlobFromJpegPages(jpegPages);
	} finally {
		exportHost.remove();
	}
}

function createPdfBlobFromJpegPages(pages: JpegPage[]) {
	const encoder = new TextEncoder();
	const chunks: Uint8Array[] = [];
	const offsets: number[] = [0];
	let length = 0;

	const push = (chunk: Uint8Array) => {
		chunks.push(chunk);
		length += chunk.byteLength;
	};

	const write = (value: string) => push(encoder.encode(value));

	const writeObject = (objectId: number, body: Array<string | Uint8Array>) => {
		offsets[objectId] = length;
		write(`${objectId} 0 obj\n`);
		for (const part of body) {
			if (typeof part === "string") write(part);
			else push(part);
		}
		write("\nendobj\n");
	};

	write("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

	const pageObjectIds = pages.map((_, index) => 3 + index * 3);
	const objectCount = 2 + pages.length * 3;

	writeObject(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
	writeObject(2, [
		`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
	]);

	pages.forEach((page, index) => {
		const pageObjectId = pageObjectIds[index];
		const contentObjectId = pageObjectId + 1;
		const imageObjectId = pageObjectId + 2;
		const imageName = `Im${index + 1}`;
		const content = `q\n${a4Page.width} 0 0 ${a4Page.height} 0 0 cm\n/${imageName} Do\nQ\n`;
		const contentBytes = encoder.encode(content);

		writeObject(pageObjectId, [
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${a4Page.width} ${a4Page.height}] /Resources << /XObject << /${imageName} ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
		]);
		writeObject(contentObjectId, [`<< /Length ${contentBytes.byteLength} >>\nstream\n`, contentBytes, "\nendstream"]);
		writeObject(imageObjectId, [
			`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.byteLength} >>\nstream\n`,
			page.bytes,
			"\nendstream",
		]);
	});

	const xrefOffset = length;
	write(`xref\n0 ${objectCount + 1}\n`);
	write("0000000000 65535 f \n");
	for (let objectId = 1; objectId <= objectCount; objectId += 1) {
		write(`${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`);
	}
	write(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

	const pdfBytes = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		pdfBytes.set(chunk, offset);
		offset += chunk.byteLength;
	}

	return new Blob([pdfBytes.buffer.slice(0)], { type: "application/pdf" });
}

async function waitForImages(pages: HTMLElement[]) {
	const images = pages.flatMap((page) => Array.from(page.querySelectorAll("img")));

	await Promise.all(
		images.map(async (image) => {
			if (image.complete) return;
			await image.decode().catch(() => undefined);
		}),
	);
}

function getElementPixelSize(element: HTMLElement, pixelRatio: number) {
	const rect = element.getBoundingClientRect();
	const width = Math.max(1, Math.round((rect.width || element.offsetWidth || a4ExportPage.width) * pixelRatio));
	const height = Math.max(1, Math.round((rect.height || element.offsetHeight || a4ExportPage.height) * pixelRatio));

	return { height, width };
}

function createFixedA4ExportHost(sourcePages: HTMLElement[]) {
	const host = document.createElement("div");
	host.setAttribute("data-word-template-export-host", "true");
	Object.assign(host.style, {
		background: "#ffffff",
		display: "flex",
		flexDirection: "column",
		gap: "16px",
		left: "-100000px",
		position: "fixed",
		top: "0",
		width: `${a4ExportPage.width}px`,
		zIndex: "-1",
	});

	for (const sourcePage of sourcePages) {
		const page = sourcePage.cloneNode(true) as HTMLElement;
		Object.assign(page.style, {
			boxShadow: "none",
			color: "#2d2d2d",
			fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif',
			height: `${a4ExportPage.height}px`,
			maxWidth: "none",
			minWidth: `${a4ExportPage.width}px`,
			transform: "none",
			width: `${a4ExportPage.width}px`,
		});

		if (!sourcePage.style.fontSize) {
			page.style.fontSize = "14px";
		}

		host.append(page);
	}

	document.body.append(host);
	return host;
}

function dataUrlToBytes(dataUrl: string) {
	const [header, base64] = dataUrl.split(",", 2);
	if (!header?.startsWith("data:image/jpeg;base64") || !base64) {
		throw new Error("Expected html-to-image to produce a JPEG data URL.");
	}

	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}
