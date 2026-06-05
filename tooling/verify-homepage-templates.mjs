import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");
const screenshotPath = path.resolve("artifacts", "homepage-templates.png");
const expectedFeaturedTemplates = ["通用一页", "企业简洁", "标准双栏", "ATS 极简", "资深单栏", "高管咨询"];

const browser = await chromium.launch({
	executablePath: chromiumPath,
	headless: true,
});

const context = await browser.newContext({
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

try {
	await page.goto(`${appUrl}/#templates`, { waitUntil: "domcontentloaded" });
	await page.getByRole("heading", { name: "中文简历模板与风格" }).waitFor({ state: "visible", timeout: 15_000 });

	for (const templateName of expectedFeaturedTemplates) {
		await page.locator(`img[alt="${templateName}"]`).first().waitFor({ state: "visible", timeout: 15_000 });
	}

	const onlineStyleCount = await page.locator('img[src*="/templates/online/"]').count();
	if (onlineStyleCount > 0) {
		throw new Error(`Homepage rendered ${onlineStyleCount} online style reference images.`);
	}

	const collectionReferenceCount = await page.locator('img[src*="/templates/collection/"]').count();
	if (collectionReferenceCount > 0) {
		throw new Error(`Homepage rendered ${collectionReferenceCount} collection reference images.`);
	}

	const deferredReferenceCount = await page.locator('img[alt="014 彩色技能栏"]').count();
	if (deferredReferenceCount > 0) {
		throw new Error(`Homepage rendered deferred template reference 014 (${deferredReferenceCount} matches).`);
	}

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
				url: page.url(),
				featuredTemplateCount: expectedFeaturedTemplates.length,
				onlineStyleCount,
				collectionReferenceCount,
				deferredReferenceCount,
				screenshotPath,
			},
			null,
			2,
		),
	);
} finally {
	await browser.close();
}
