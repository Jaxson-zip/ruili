import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");

const runId = Date.now();
const email = `codex.template.${runId}@example.com`;
const username = `template-${runId}`;
const password = "Verify123!";
const starterName = process.env.STARTER_NAME ?? "前端工程师成品样张";
const collectionReferenceName = process.env.COLLECTION_REFERENCE_NAME;
const expectedResumeName =
	process.env.EXPECTED_RESUME_NAME ??
	(collectionReferenceName ? `前端开发-中文投递版-${collectionReferenceName}` : "前端开发-中文投递版");
const expectedCandidateName = process.env.EXPECTED_CANDIDATE_NAME ?? "陈嘉铭";
const screenshotPath = path.resolve("artifacts", "template-starter-builder.png");

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
	await page.goto(`${appUrl}/auth/register`, { waitUntil: "domcontentloaded" });
	await page.locator('input[name="name"]').fill("Codex Template Verify");
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

	await page.goto(`${appUrl}/dashboard/resumes`, { waitUntil: "domcontentloaded" });
	await page.getByText("从成品模板开始").waitFor({ state: "visible", timeout: 15_000 });
	await page.locator(".aspect-page").first().click();

	const dialog = page.locator('[role="dialog"]');
	await dialog.waitFor({ state: "visible", timeout: 15_000 });
	await dialog.getByText("从成品模板开始").waitFor({ state: "visible", timeout: 10_000 });
	await dialog.getByText("从推荐参考样张开始").waitFor({ state: "visible", timeout: 10_000 });
	await dialog.getByText(starterName).waitFor({ state: "visible", timeout: 10_000 });
	await dialog.getByText("或者从空白简历开始").waitFor({ state: "visible", timeout: 10_000 });

	if (collectionReferenceName) {
		await dialog.getByRole("button", { name: `套用开源参考样张：${collectionReferenceName}` }).click();
	} else {
		await dialog.getByRole("button", { name: new RegExp(starterName) }).click();
	}
	await page.waitForURL(/\/builder\/[^/]+$/, { timeout: 20_000 });
	await page.locator("h2").filter({ hasText: expectedResumeName }).waitFor({ state: "visible", timeout: 10_000 });

	const previewCanvas = page.locator("canvas").first();
	await previewCanvas.waitFor({ state: "visible", timeout: 30_000 });
	await page.waitForTimeout(500);

	const replacementChecklist = page.getByRole("region", { name: "替换清单" });
	await replacementChecklist.waitFor({ state: "visible", timeout: 10_000 });
	await replacementChecklist.getByRole("button", { name: /基本信息/ }).click();
	const basicsPanel = page.getByRole("region", { name: "快速编辑：基本信息" });
	await basicsPanel.waitFor({ state: "visible", timeout: 10_000 });
	const actualName = await basicsPanel.getByLabel("姓名").inputValue();
	if (actualName !== expectedCandidateName) {
		throw new Error(
			`Template starter candidate name mismatch. Expected "${expectedCandidateName}", got "${actualName}".`,
		);
	}

	await page.locator('nav[aria-label="快速编辑"]').getByRole("button", { name: "工作经历", exact: true }).click();
	await page.getByRole("region", { name: "快速编辑：工作经历" }).waitFor({ state: "visible", timeout: 10_000 });

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
				starterName,
				collectionReferenceName,
				url: page.url(),
				expectedResumeName,
				expectedCandidateName,
				screenshotPath,
			},
			null,
			2,
		),
	);
} finally {
	await browser.close();
}
