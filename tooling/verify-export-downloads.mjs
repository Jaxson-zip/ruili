import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");

const runId = Date.now();
const email = `codex.export.${runId}@example.com`;
const username = `export-${runId}`;
const password = "Verify123!";
const artifactDir = path.resolve("artifacts", "downloads");
const screenshotPath = path.resolve("artifacts", "export-downloads.png");

const browser = await chromium.launch({
	executablePath: chromiumPath,
	headless: true,
});

const context = await browser.newContext({
	acceptDownloads: true,
	locale: "zh-CN",
	viewport: { width: 1440, height: 960 },
});

const page = await context.newPage();
const consoleErrors = [];

page.on("console", (message) => {
	if (message.type() === "error") consoleErrors.push(message.text());
});

page.on("pageerror", (error) => {
	consoleErrors.push(error.message);
});

const saveAndCheckDownload = async (download, expectedExtension) => {
	const suggestedFilename = download.suggestedFilename();
	if (!suggestedFilename.endsWith(expectedExtension)) {
		throw new Error(`Expected ${expectedExtension} download, got ${suggestedFilename}.`);
	}

	await fs.mkdir(artifactDir, { recursive: true });
	const targetPath = path.join(artifactDir, `${runId}-${suggestedFilename}`);
	await download.saveAs(targetPath);
	const stats = await fs.stat(targetPath);

	if (stats.size <= 0) throw new Error(`Downloaded file is empty: ${targetPath}`);

	return { suggestedFilename, targetPath, size: stats.size };
};

try {
	await page.goto(`${appUrl}/auth/register`, { waitUntil: "domcontentloaded" });
	await page.locator('input[name="name"]').fill("Codex Export Verify");
	await page.locator('input[name="username"]').fill(username);
	await page.locator('input[name="email"]').fill(email);
	await page.locator('input[name="password"]').fill(password);
	await page.locator('button[type="submit"]').click();

	const continueLink = page.locator('a[href="/dashboard"]');
	await continueLink.waitFor({ state: "visible", timeout: 15_000 });
	await continueLink.click();
	await page.waitForLoadState("domcontentloaded");

	if (page.url().includes("/auth/login")) {
		await page.locator('input[name="identifier"]').fill(email);
		await page.locator('input[name="password"]').fill(password);
		await page.locator('button[type="submit"]').click();
		await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
	}

	const resumeName = `导出验证 ${runId}`;
	const createResponse = await page.request.post(`${appUrl}/api/openapi/resumes`, {
		data: {
			name: resumeName,
			slug: `export-${runId}`,
			tags: [],
			withSampleData: true,
		},
	});

	if (!createResponse.ok()) {
		throw new Error(`Failed to create export smoke resume: ${createResponse.status()} ${await createResponse.text()}`);
	}

	const resumeId = await createResponse.json();
	await page.goto(`${appUrl}/builder/${resumeId}`, { waitUntil: "domcontentloaded" });

	const exportSection = page.locator("#sidebar-export");
	await exportSection.waitFor({ state: "visible", timeout: 20_000 });
	const docxButton = exportSection.getByRole("button", { name: /DOCX\s+生成可编辑的 Word/ });
	const pdfButton = exportSection.getByRole("button", { name: /PDF\s+导出最终投递版本/ });

	await docxButton.waitFor({ state: "visible", timeout: 10_000 });
	await pdfButton.waitFor({ state: "visible", timeout: 10_000 });
	await exportSection.getByText("复杂双栏或强视觉模板请以 PDF 为准").waitFor({ state: "visible", timeout: 10_000 });

	const docxDownloadPromise = page.waitForEvent("download", { timeout: 20_000 });
	await docxButton.click();
	const docx = await saveAndCheckDownload(await docxDownloadPromise, ".docx");

	await page.getByText("正式投递建议使用 PDF").waitFor({ state: "visible", timeout: 10_000 });

	const pdfDownloadPromise = page.waitForEvent("download", { timeout: 45_000 });
	await pdfButton.click();
	const pdf = await saveAndCheckDownload(await pdfDownloadPromise, ".pdf");

	await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
	await page.screenshot({ path: screenshotPath, fullPage: false });

	const severeErrors = consoleErrors.filter((message) => !message.includes("[vite]"));
	if (severeErrors.length > 0) {
		throw new Error(`Browser console errors:\n${severeErrors.join("\n")}`);
	}

	console.log(
		JSON.stringify(
			{
				ok: true,
				email,
				resumeId,
				docx,
				pdf,
				screenshotPath,
				url: page.url(),
			},
			null,
			2,
		),
	);
} finally {
	await browser.close();
}
