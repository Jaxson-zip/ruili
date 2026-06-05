import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");

const runId = Date.now();
const email = `codex.verify.${runId}@example.com`;
const username = `verify-${runId}`;
const password = "Verify123!";
const importedName = `导入候选人 ${runId}`;
const importedEmail = `candidate.${runId}@example.com`;
const importFilePath = path.resolve("artifacts", "import-json-resume.json");
const templateGalleryScreenshotPath = path.resolve("artifacts", "template-gallery.png");
const screenshotPath = path.resolve("artifacts", "builder-quick-edit.png");

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
	await page.locator('input[name="name"]').fill("Codex Verify");
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

	await fs.mkdir(path.dirname(importFilePath), { recursive: true });
	await fs.writeFile(
		importFilePath,
		JSON.stringify(
			{
				basics: {
					name: importedName,
					label: "前端工程师",
					email: importedEmail,
					phone: "13800000000",
					location: {
						city: "上海",
						region: "上海",
						countryCode: "CN",
					},
					summary: "这是从 JSON Resume 文件导入的候选人总结。",
				},
				work: [
					{
						name: "导入科技有限公司",
						position: "前端工程师",
						startDate: "2023-01",
						endDate: "2025-01",
						summary: "负责简历编辑器和导出流程。",
					},
				],
				education: [
					{
						institution: "导入大学",
						area: "计算机科学",
						studyType: "本科",
						startDate: "2019-09",
						endDate: "2023-06",
					},
				],
				skills: [{ name: "React", level: "advanced", keywords: ["TypeScript", "Vite"] }],
			},
			null,
			2,
		),
		"utf8",
	);

	await page.locator(".aspect-page").nth(1).click();

	const dialog = page.locator('[role="dialog"]');
	await dialog.waitFor({ state: "visible", timeout: 15_000 });
	await dialog.getByText(/隐私提示/).waitFor({ state: "visible", timeout: 10_000 });
	await dialog.getByText(/JSON 导入只在本系统内读取/).waitFor({ state: "visible", timeout: 10_000 });

	await dialog.locator('[data-slot="combobox-trigger"]').click();
	await page.getByText("JSON Resume（标准简历数据，不是模板）").click();

	await dialog.locator('input[type="file"]').setInputFiles(importFilePath);
	await dialog.locator('button[type="submit"]').click();

	await page.waitForURL(/\/builder\/[^/]+$/, { timeout: 20_000 });
	await page.locator("h2").filter({ hasText: importedName }).waitFor({ state: "visible", timeout: 10_000 });
	const previewCanvas = page.locator("canvas").first();
	try {
		await previewCanvas.waitFor({ state: "visible", timeout: 30_000 });
	} catch (error) {
		throw new Error(`Imported resume preview canvas did not render.\n${consoleErrors.join("\n")}`, { cause: error });
	}
	await page.waitForTimeout(500);

	const previewHasInk = await previewCanvas.evaluate((canvas) => {
		const context = canvas.getContext("2d");
		if (!context) return false;

		const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
		let nonWhitePixels = 0;

		for (let index = 0; index < data.length; index += 4) {
			const red = data[index];
			const green = data[index + 1];
			const blue = data[index + 2];
			const alpha = data[index + 3];

			if (alpha > 0 && (red < 245 || green < 245 || blue < 245)) {
				nonWhitePixels += 1;
				if (nonWhitePixels > 100) return true;
			}
		}

		return false;
	});

	if (!previewHasInk) {
		throw new Error("Imported resume preview rendered as a blank page.");
	}

	const clickablePreview = page.getByRole("button", { name: "双击简历预览快速编辑" });
	await clickablePreview.waitFor({ state: "visible", timeout: 10_000 });
	await clickablePreview.click({ position: { x: 320, y: 40 } });
	const quickEditAfterSingleClick = await page
		.getByRole("region", { name: "快速编辑：基本信息" })
		.isVisible()
		.catch(() => false);
	if (quickEditAfterSingleClick) {
		throw new Error("Quick edit opened after a single click; it should require a double click.");
	}

	await clickablePreview.dblclick({ position: { x: 320, y: 40 } });
	await page.getByRole("region", { name: "快速编辑：基本信息" }).waitFor({ state: "visible", timeout: 10_000 });

	const replacementChecklist = page.getByRole("region", { name: "替换清单" });
	await replacementChecklist.waitFor({ state: "visible", timeout: 10_000 });
	await replacementChecklist.getByRole("button", { name: /基本信息/ }).click();
	const basicsPanel = page.getByRole("region", { name: "快速编辑：基本信息" });
	await basicsPanel.waitFor({ state: "visible", timeout: 10_000 });
	const actualName = await basicsPanel.getByLabel("姓名").inputValue();
	if (actualName !== importedName) {
		throw new Error(`Imported resume name was not preserved. Expected "${importedName}", got "${actualName}".`);
	}

	const actualEmail = await basicsPanel.getByLabel("邮箱").inputValue();
	if (actualEmail !== importedEmail) {
		throw new Error(`Imported resume email was not preserved. Expected "${importedEmail}", got "${actualEmail}".`);
	}

	await replacementChecklist.getByRole("button", { name: /个人总结/ }).click();
	await page.getByRole("region", { name: "快速编辑：个人总结" }).waitFor({ state: "visible", timeout: 10_000 });

	await page.locator('nav[aria-label="快速编辑"]').getByRole("button", { name: "模板", exact: true }).click();
	await page.getByRole("button", { name: /更换模板|切换模板/ }).click();
	const templateDialog = page.locator('[role="dialog"]');
	await templateDialog.waitFor({ state: "visible", timeout: 10_000 });
	await templateDialog.getByLabel("搜索模板").fill("技术");
	const stylePreview = templateDialog.getByRole("img", { name: "技术侧栏" });
	await stylePreview.waitFor({ state: "visible", timeout: 10_000 });

	for (const disallowedText of ["待重做参考", "内部筛选", "推荐参考样张", "更多参考样张"]) {
		const count = await templateDialog.getByText(disallowedText).count();
		if (count > 0) {
			throw new Error(`Template gallery exposed non-user-facing text: ${disallowedText}`);
		}
	}

	await fs.mkdir(path.dirname(templateGalleryScreenshotPath), { recursive: true });
	await page.screenshot({ path: templateGalleryScreenshotPath, fullPage: false });
	await templateDialog.getByLabel("套用参考样式：技术侧栏").click();
	await templateDialog.waitFor({ state: "hidden", timeout: 10_000 });
	await page.locator("h3").filter({ hasText: "标准双栏" }).waitFor({ state: "visible", timeout: 10_000 });
	await page.waitForTimeout(500);

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
				importedName,
				appliedStyle: "技术侧栏",
				switchedTemplate: "标准双栏",
				url: page.url(),
				importFilePath,
				templateGalleryScreenshotPath,
				screenshotPath,
			},
			null,
			2,
		),
	);
} finally {
	await browser.close();
}
