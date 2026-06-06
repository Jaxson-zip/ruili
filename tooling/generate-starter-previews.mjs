import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const defaultStarterIds = [
	"frontend-engineer",
	"product-manager",
	"campus-student",
	"growth-operations",
	"frontend-engineer-one-page",
	"frontend-engineer-senior",
	"product-manager-clean",
	"product-manager-one-page",
	"campus-student-compact",
	"campus-student-asian",
	"growth-operations-two-column",
	"growth-operations-consulting",
	"campus-student-blue-blocks",
	"frontend-engineer-dark-orange",
	"growth-operations-blue-qr",
];
const starterIds = (process.env.STARTER_IDS ? process.env.STARTER_IDS.split(",") : defaultStarterIds).map((id) =>
	id.trim(),
);

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");
const outputDir = path.resolve("apps", "web", "public", "templates", "starters");
const artifactDir = path.resolve("artifacts", "starter-previews");
const runId = Date.now();
const password = "Verify123!";

async function register(page, starterId, index) {
	const email = `codex.starter.preview.${runId}.${index}@example.com`;
	const username = `starter-preview-${runId}-${index}`;

	await page.goto(`${appUrl}/auth/register`, { waitUntil: "domcontentloaded" });
	await page.locator('input[name="name"]').fill("Codex Starter Preview");
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

	return { email, starterId };
}

async function openCreateDialog(page) {
	await page.goto(`${appUrl}/dashboard/resumes`, { waitUntil: "domcontentloaded" });

	const createButton = page.getByTestId("create-resume-from-starter");
	await createButton.waitFor({ state: "visible", timeout: 15_000 });
	await createButton.click();

	const dialog = page.locator('[role="dialog"]');
	await dialog.waitFor({ state: "visible", timeout: 15_000 });

	return dialog;
}

async function waitForPreviewCanvas(page) {
	const previewCanvas = page.locator("canvas").first();
	await previewCanvas.waitFor({ state: "visible", timeout: 30_000 });
	await page.waitForFunction(
		() => {
			const canvas = document.querySelector("canvas");
			if (!(canvas instanceof HTMLCanvasElement)) return false;
			if (canvas.width < 1000 || canvas.height < 1000) return false;

			const context = canvas.getContext("2d");
			if (!context) return false;

			const sample = context.getImageData(0, 0, Math.min(canvas.width, 160), Math.min(canvas.height, 160)).data;

			for (let index = 0; index < sample.length; index += 4) {
				if (sample[index] !== 255 || sample[index + 1] !== 255 || sample[index + 2] !== 255) return true;
			}

			return false;
		},
		{ timeout: 30_000 },
	);

	return previewCanvas;
}

async function createStarterPreview(page, starterId) {
	const dialog = await openCreateDialog(page);
	const starterButton = dialog.locator(`[data-starter-id="${starterId}"]`);
	await starterButton.waitFor({ state: "visible", timeout: 15_000 });
	await starterButton.scrollIntoViewIfNeeded();
	await starterButton.evaluate((element) => {
		if (!(element instanceof HTMLButtonElement)) throw new Error("Expected starter trigger to be a button.");
		element.click();
	});
	try {
		await page.waitForFunction(() => /^\/builder\/[^/]+$/.test(window.location.pathname), { timeout: 30_000 });
	} catch (error) {
		const diagnostics = await page.evaluate(
			(id) => ({
				url: window.location.href,
				toasts: Array.from(document.querySelectorAll("[data-sonner-toast], [role='status'], [role='alert']")).map(
					(element) => element.textContent?.trim(),
				),
				dialogText: document.querySelector('[role="dialog"]')?.textContent?.trim().slice(0, 1000),
				buttonDisabled: document.querySelector(`[data-starter-id="${id}"]`)?.hasAttribute("disabled"),
			}),
			starterId,
		);

		throw new Error(`Timed out creating starter ${starterId}: ${JSON.stringify(diagnostics, null, 2)}`, {
			cause: error,
		});
	}

	const previewCanvas = await waitForPreviewCanvas(page);
	const pngPath = path.join(artifactDir, `${starterId}.png`);
	const jpgPath = path.join(outputDir, `${starterId}.jpg`);
	const imageBase64 = await previewCanvas.evaluate((canvas) => {
		if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Expected resume preview to render as a canvas.");

		return canvas.toDataURL("image/png").split(",")[1];
	});

	if (!imageBase64) throw new Error(`Preview canvas did not produce image data for ${starterId}.`);

	await fs.writeFile(pngPath, Buffer.from(imageBase64, "base64"));
	await sharp(pngPath)
		.flatten({ background: "#ffffff" })
		.resize(510, 720, { fit: "contain", background: "#ffffff" })
		.jpeg({ quality: 88 })
		.toFile(jpgPath);

	return jpgPath;
}

const browser = await chromium.launch({
	executablePath: chromiumPath,
	headless: true,
});

const generated = [];
const sessions = [];

try {
	await fs.mkdir(outputDir, { recursive: true });
	await fs.mkdir(artifactDir, { recursive: true });

	for (const [index, starterId] of starterIds.entries()) {
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
			const session = await register(page, starterId, index);
			const jpgPath = await createStarterPreview(page, starterId);
			const severeErrors = consoleErrors.filter((message) => !message.includes("[vite]"));
			if (severeErrors.length > 0) {
				throw new Error(`Browser console errors while generating ${starterId}:\n${severeErrors.join("\n")}`);
			}

			generated.push(path.relative(process.cwd(), jpgPath));
			sessions.push(session);
			console.log(`generated ${starterId}`);
		} finally {
			await context.close();
		}
	}

	console.log(JSON.stringify({ ok: true, sessions, generated }, null, 2));
} finally {
	await browser.close();
}
