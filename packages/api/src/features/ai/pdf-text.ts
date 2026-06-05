export async function extractPdfTextFromBuffer(buffer: Buffer) {
	const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
	const loadingTask = getDocument({
		data: new Uint8Array(buffer),
		disableFontFace: true,
		useWorkerFetch: false,
	});

	const document = await loadingTask.promise;

	try {
		const pages: string[] = [];

		for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
			const page = await document.getPage(pageNumber);
			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.map((item) => {
					if (!("str" in item)) return "";
					return `${item.str}${item.hasEOL ? "\n" : ""}`;
				})
				.join(" ")
				.replace(/[ \t]+\n/g, "\n")
				.replace(/[ \t]{2,}/g, " ")
				.trim();

			if (pageText) pages.push(pageText);
			page.cleanup();
		}

		const text = pages.join("\n\n").trim();
		if (!text) throw new Error("PDF_TEXT_EMPTY");

		return text;
	} finally {
		await document.destroy();
		await loadingTask.destroy();
	}
}

export async function extractPdfTextFromBase64(base64: string) {
	return extractPdfTextFromBuffer(Buffer.from(base64, "base64"));
}
