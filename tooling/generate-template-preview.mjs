import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const templateNames = {
	azurill: "标准双栏",
	bronzor: "企业简洁",
	chikorita: "柔和双栏",
	ditgar: "深色技术",
	ditto: "ATS 极简",
	gengar: "商务均衡",
	glalie: "克制灰栏",
	kakuna: "实习紧凑",
	lapras: "资深单栏",
	leafish: "自然侧栏",
	meowth: "亚洲精简",
	onyx: "通用一页",
	pikachu: "轻量创意",
	rhyhorn: "留白设计",
	scizor: "高管咨询",
};

const starterNames = {
	campus: "应届生求职成品样张",
	frontend: "前端工程师成品样张",
	growth: "运营增长成品样张",
	product: "产品经理成品样张",
};

const defaultStarterByTemplate = {
	azurill: "product",
	ditto: "campus",
	onyx: "frontend",
	scizor: "growth",
};

function getRequiredName(names, id, label) {
	const name = names[id];
	if (!name) throw new Error(`Unknown ${label}: ${id}`);

	return name;
}

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");

const targetTemplateId = process.env.TEMPLATE_ID ?? "onyx";
const targetTemplateName = process.env.TEMPLATE_NAME ?? getRequiredName(templateNames, targetTemplateId, "TEMPLATE_ID");
const starterId = process.env.STARTER_ID ?? defaultStarterByTemplate[targetTemplateId] ?? "frontend";
const starterName = process.env.STARTER_NAME ?? getRequiredName(starterNames, starterId, "STARTER_ID");
const runId = Date.now();
const email = `codex.preview.${runId}@example.com`;
const username = `preview-${runId}`;
const password = "Verify123!";
const screenshotPath = path.resolve("artifacts", `${targetTemplateId}-preview-canvas.png`);
const defaultOutputJpgPath = path.resolve("apps", "web", "public", "templates", "jpg", `${targetTemplateId}.jpg`);
const outputJpgPath = path.resolve(process.env.OUTPUT_JPG_PATH ?? defaultOutputJpgPath);

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
	await page.locator('input[name="name"]').fill("Codex Preview");
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
	await page.getByText("选择模板创建").waitFor({ state: "visible", timeout: 15_000 });
	await page.locator(".aspect-page").first().click();

	const createDialog = page.locator('[role="dialog"]');
	await createDialog.waitFor({ state: "visible", timeout: 15_000 });
	await createDialog.getByRole("button", { name: new RegExp(starterName) }).click();
	await page.waitForURL(/\/builder\/[^/]+$/, { timeout: 20_000 });

	const previewCanvas = page.locator("canvas").first();
	await previewCanvas.waitFor({ state: "visible", timeout: 30_000 });
	await page.waitForTimeout(500);

	await page.locator('nav[aria-label="快速编辑"]').getByRole("button", { name: "模板", exact: true }).click();
	await page.getByRole("button", { name: /更换模板/ }).click();

	const templateDialog = page.locator('[role="dialog"]');
	await templateDialog.waitFor({ state: "visible", timeout: 10_000 });
	const templatePreview = templateDialog.getByRole("img", { name: targetTemplateName });
	await templatePreview.waitFor({ state: "visible", timeout: 10_000 });
	await templatePreview.locator("xpath=ancestor::button[1]").click();
	await templateDialog.waitFor({ state: "hidden", timeout: 10_000 });
	await page.locator("h3").filter({ hasText: targetTemplateName }).waitFor({ state: "visible", timeout: 10_000 });
	await page.reload({ waitUntil: "domcontentloaded" });
	await page.locator("h3").filter({ hasText: targetTemplateName }).waitFor({ state: "visible", timeout: 10_000 });
	await previewCanvas.waitFor({ state: "visible", timeout: 30_000 });
	await page.waitForTimeout(800);

	await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
	const imageBase64 = await previewCanvas.evaluate((canvas) => {
		if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Expected resume preview to render as a canvas.");
		return canvas.toDataURL("image/png").split(",")[1];
	});
	if (!imageBase64) throw new Error("Preview canvas did not produce image data.");
	await fs.writeFile(screenshotPath, Buffer.from(imageBase64, "base64"));
	await sharp(screenshotPath)
		.flatten({ background: "#ffffff" })
		.resize(510, 720, { fit: "fill" })
		.jpeg({ quality: 88 })
		.toFile(outputJpgPath);

	const severeErrors = consoleErrors.filter((message) => !message.includes("[vite]"));
	if (severeErrors.length > 0) {
		throw new Error(`Browser console errors:\n${severeErrors.join("\n")}`);
	}

	console.log(
		JSON.stringify(
			{
				ok: true,
				email,
				url: page.url(),
				starterName,
				targetTemplateId,
				targetTemplateName,
				screenshotPath,
				outputJpgPath,
			},
			null,
			2,
		),
	);
} finally {
	await browser.close();
}
