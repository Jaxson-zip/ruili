import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const JSZip = require("../apps/web/node_modules/jszip");

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");

const runId = Date.now();
const email = `codex.docx.${runId}@example.com`;
const username = `docx-${runId}`;
const password = "Verify123!";
const artifactDir = path.resolve("artifacts");
const templatePath = path.join(artifactDir, `docx-template-${runId}.docx`);
const screenshotPath = path.join(artifactDir, "docx-template-export.png");

async function writeTemplateDocx() {
	const zip = new JSZip();
	zip.file("[Content_Types].xml", "<Types></Types>");
	zip.file("word/document.xml", "<w:document><w:body><w:t>{{basics.name}}</w:t></w:body></w:document>");

	const buffer = await zip.generateAsync({
		type: "nodebuffer",
		mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	});

	await fs.mkdir(artifactDir, { recursive: true });
	await fs.writeFile(templatePath, buffer);
}

await writeTemplateDocx();

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

try {
	await page.goto(`${appUrl}/auth/register`, { waitUntil: "domcontentloaded" });
	await page.locator('input[name="name"]').fill("Codex DOCX Verify");
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

	const createResponse = await page.request.post(`${appUrl}/api/openapi/resumes`, {
		data: {
			name: `DOCX 模板验证 ${runId}`,
			slug: `docx-template-${runId}`,
			tags: [],
			withSampleData: true,
		},
	});

	if (!createResponse.ok()) {
		throw new Error(`Failed to create smoke resume: ${createResponse.status()} ${await createResponse.text()}`);
	}

	const resumeId = await createResponse.json();
	await page.goto(`${appUrl}/builder/${resumeId}`, { waitUntil: "domcontentloaded" });

	const exportSection = page.locator("#sidebar-export");
	await exportSection.waitFor({ state: "visible", timeout: 20_000 });
	await exportSection.getByText("DOCX 模板 Beta").waitFor({ state: "visible", timeout: 10_000 });

	await exportSection.getByLabel("上传 DOCX 模板").setInputFiles(templatePath);
	await exportSection.getByText(path.basename(templatePath)).waitFor({ state: "visible", timeout: 10_000 });
	await exportSection.getByText("basics.name").waitFor({ state: "visible", timeout: 10_000 });

	const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
	await exportSection.getByRole("button", { name: "用当前简历生成 Word" }).click();
	const download = await downloadPromise;
	const suggestedFilename = download.suggestedFilename();

	if (!suggestedFilename.endsWith(".docx")) {
		throw new Error(`Generated template export used an unexpected filename: ${suggestedFilename}`);
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
				email,
				resumeId,
				suggestedFilename,
				templatePath,
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
