import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);

const getArgValue = (name) => {
	const index = args.indexOf(name);
	if (index === -1) return "";

	return args[index + 1] ?? "";
};

const hasFlag = (name) => args.includes(name);

const appUrlInput = getArgValue("--url") || process.env.APP_URL_OVERRIDE || process.env.APP_URL || "";
const allowLocal = hasFlag("--allow-local");
const skipBrowser = hasFlag("--skip-browser");
const timeoutMs = Number(getArgValue("--timeout-ms") || 15_000);
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");

const usage = `用法：
  pnpm verify:production --url https://resume.example.com
  pnpm verify:production --url http://localhost:3000 --allow-local

说明：
  --url            要检查的公网根地址，也可用 APP_URL_OVERRIDE 或 APP_URL 提供。
  --allow-local    允许 http:// 或 localhost，仅用于本地/内网验证。
  --skip-browser   只跑 fetch 级检查，不启动 Playwright。
  --timeout-ms     单个网络请求超时时间，默认 15000。
`;

const expectedTemplateAssetPaths = [
	"/templates/jpg/ditto.jpg",
	"/templates/jpg/scizor.jpg",
	"/templates/jpg/onyx.jpg",
	"/templates/jpg/azurill.jpg",
	"/templates/jpg/homepage-ditto-campus.jpg",
	"/templates/jpg/homepage-ditto-frontend.jpg",
	"/templates/jpg/homepage-scizor-growth.jpg",
	"/templates/jpg/homepage-scizor-product.jpg",
];

const fail = (message) => {
	console.error(message);
	process.exit(1);
};

if (!appUrlInput) fail(`缺少 --url。\n\n${usage}`);

let appUrl;
try {
	appUrl = new URL(appUrlInput);
} catch {
	fail(`--url 不是有效 URL：${appUrlInput}`);
}

appUrl.pathname = "/";
appUrl.search = "";
appUrl.hash = "";

const isLocalHostname = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(appUrl.hostname);
if (!allowLocal && appUrl.protocol !== "https:") fail("正式上线 canary 必须使用 https:// URL");
if (!allowLocal && isLocalHostname) fail("正式上线 canary 不能指向 localhost/本机地址");
if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000) {
	fail("--timeout-ms 必须是 1000 到 120000 之间的数字");
}

const rootUrl = appUrl.toString().replace(/\/$/, "");

const withTimeout = async (promiseFactory, label) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);

	try {
		return await promiseFactory(controller.signal);
	} finally {
		clearTimeout(timeout);
	}
};

const fetchText = async (pathname) =>
	await withTimeout(async (signal) => {
		const response = await fetch(`${rootUrl}${pathname}`, { signal });
		if (!response.ok) throw new Error(`${pathname} returned HTTP ${response.status}`);

		return { response, text: await response.text() };
	}, pathname);

const fetchBinary = async (pathname) =>
	await withTimeout(async (signal) => {
		const response = await fetch(`${rootUrl}${pathname}`, { signal });
		if (!response.ok) throw new Error(`${pathname} returned HTTP ${response.status}`);

		return { response, bytes: new Uint8Array(await response.arrayBuffer()) };
	}, pathname);

const record = async (checks, name, run) => {
	const startedAt = Date.now();
	await run();
	checks.push({ durationMs: Date.now() - startedAt, name, ok: true });
};

async function main() {
	const checks = [];

	await record(checks, "health", async () => {
		const { text } = await fetchText("/api/health");
		const payload = JSON.parse(text);

		if (payload.status !== "healthy") throw new Error(`/api/health status is ${payload.status}`);
		if (payload.database?.status !== "healthy") throw new Error("/api/health database is not healthy");
		if (payload.storage?.status !== "healthy") throw new Error("/api/health storage is not healthy");
	});

	await record(checks, "homepage html", async () => {
		const { response, text } = await fetchText("/");
		const contentType = response.headers.get("content-type") ?? "";

		if (!contentType.includes("text/html")) throw new Error(`homepage content-type is ${contentType}`);
		if (!text.includes("<html") || !text.includes("main.tsx")) {
			throw new Error("homepage HTML does not look like the web app entrypoint");
		}
	});

	await record(checks, "template assets", async () => {
		for (const assetPath of expectedTemplateAssetPaths) {
			const { response, bytes } = await fetchBinary(assetPath);
			const contentType = response.headers.get("content-type") ?? "";

			if (!contentType.includes("image/")) throw new Error(`${assetPath} content-type is ${contentType}`);
			if (bytes.length < 10_000) throw new Error(`${assetPath} looks too small (${bytes.length} bytes)`);
		}
	});

	if (!skipBrowser) {
		await record(checks, "browser pages", async () => {
			const browser = await chromium.launch({
				executablePath: chromiumPath,
				headless: true,
			});

			const context = await browser.newContext({
				locale: "zh-CN",
				viewport: { width: 1366, height: 900 },
			});
			const page = await context.newPage();
			const consoleErrors = [];

			page.on("console", (message) => {
				if (message.type() === "error") consoleErrors.push(message.text());
			});
			page.on("pageerror", (error) => consoleErrors.push(error.message));

			try {
				await page.goto(`${rootUrl}/`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
				await page.locator("main").waitFor({ timeout: timeoutMs });
				const homeText = await page.locator("main").innerText({ timeout: timeoutMs });
				for (const expected of ["锐历", "中文简历模板与风格", "隐私与数据处理"]) {
					if (!homeText.includes(expected)) throw new Error(`homepage missing text: ${expected}`);
				}

				await page.goto(`${rootUrl}/privacy`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
				await page.locator("main h1").waitFor({ timeout: timeoutMs });
				const privacyText = await page.locator("main").innerText({ timeout: timeoutMs });
				for (const expected of ["隐私与数据处理说明", "AI/OCR", "Azure Document Intelligence", "MIT License"]) {
					if (!privacyText.includes(expected)) throw new Error(`privacy page missing text: ${expected}`);
				}

				await fs.mkdir("artifacts", { recursive: true });
				const screenshotPath = path.resolve("artifacts", "production-canary.png");
				await page.screenshot({ fullPage: false, path: screenshotPath });
				checks.push({ name: "browser screenshot", ok: true, screenshotPath });

				const severeErrors = consoleErrors.filter((message) => !message.includes("[vite]"));
				if (severeErrors.length > 0) throw new Error(`Browser console errors:\n${severeErrors.join("\n")}`);
			} finally {
				await browser.close();
			}
		});
	}

	console.log(
		JSON.stringify(
			{
				ok: true,
				rootUrl,
				checks,
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
