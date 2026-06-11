import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const appUrl = process.env.APP_URL_OVERRIDE ?? "http://localhost:3000";
const chromiumPath =
	process.env.PLAYWRIGHT_CHROMIUM_PATH ??
	path.join(os.homedir(), "AppData", "Local", "ms-playwright", "chromium-1208", "chrome-win64", "chrome.exe");

const runId = Date.now();
const email = `codex.word-template.${runId}@example.com`;
const username = `word-template-${runId}`;
const password = "Verify123!";
const artifactDir = path.resolve("artifacts", "word-template-mode");

const text = {
	addedSchool: "\u65b0\u589e\u6d4b\u8bd5\u5927\u5b66",
	addedDegree: "\u7855\u58eb",
	addedArea: "\u4eba\u5de5\u667a\u80fd",
	awards: "\u5956\u9879\u8363\u8a89",
	checklist: "\u6a21\u677f\u6a21\u5757\u68c0\u67e5",
	education: "\u6559\u80b2\u7ecf\u5386",
	exported22: "\u4f1a\u5bfc\u51fa 2/2",
	hiddenModule: "\u6a21\u5757\u5df2\u9690\u85cf",
	twoItems: "2 \u9879\u5185\u5bb9",
	useTemplate: "\u4f7f\u7528\u6b64\u6a21\u677f",
	wordExport: "Word \u5bfc\u51fa",
};

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

async function registerTempUser() {
	await page.goto(`${appUrl}/auth/register`, { waitUntil: "domcontentloaded" });
	await page.locator('input[name="name"]').fill("Codex Word Template Verify");
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
}

async function createSmokeResume() {
	const response = await page.request.post(`${appUrl}/api/openapi/resumes`, {
		data: {
			name: `Word Template Verify ${runId}`,
			slug: `word-template-verify-${runId}`,
			tags: [],
			withSampleData: true,
		},
	});

	if (!response.ok()) {
		throw new Error(`Failed to create smoke resume: ${response.status()} ${await response.text()}`);
	}

	return await response.json();
}

async function selectFirstWordTemplate(resumeId) {
	await page.goto(`${appUrl}/builder/${resumeId}`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(1500);

	const button = page.locator("button").filter({ hasText: text.useTemplate }).first();
	await button.waitFor({ state: "visible", timeout: 15_000 });
	await button.click();
	await page.waitForTimeout(1500);

	const previewPages = await page.locator("[data-word-template-preview-page]").count();
	if (previewPages === 0) throw new Error("Word template realtime preview did not render.");

	return previewPages;
}

async function getResume(resumeId) {
	const response = await page.request.get(`${appUrl}/api/openapi/resumes/${resumeId}`);
	if (!response.ok()) throw new Error(`Failed to get resume: ${response.status()} ${await response.text()}`);
	return await response.json();
}

async function updateResumeData(resumeId, data) {
	const response = await page.request.put(`${appUrl}/api/openapi/resumes/${resumeId}`, {
		data: { id: resumeId, data },
	});

	if (!response.ok()) {
		throw new Error(`Failed to update resume: ${response.status()} ${await response.text()}`);
	}
}

async function reloadBuilder() {
	await page.reload({ waitUntil: "domcontentloaded" });
	await page.waitForTimeout(1500);
}

async function verifyAddedEducation(resumeId) {
	const resume = await getResume(resumeId);
	const firstEducation = resume.data.sections.education.items[0];
	if (!firstEducation) throw new Error("Sample resume has no education item to duplicate.");

	resume.data.sections.education.items.push({
		...firstEducation,
		area: text.addedArea,
		degree: text.addedDegree,
		hidden: false,
		id: `added-education-${runId}`,
		period: "2026.9-2028.6",
		school: text.addedSchool,
	});

	await updateResumeData(resumeId, resume.data);
	await reloadBuilder();

	const sidebarEducation = await page.locator("#sidebar-education").innerText();
	const previewText = await page
		.locator("[data-word-template-preview-page]")
		.evaluateAll((pages) => pages.map((pageElement) => pageElement.textContent ?? "").join("\n"));
	const checklist = await page.locator(`section[aria-label="${text.checklist}"]`).innerText();

	if (!sidebarEducation.includes(text.addedSchool))
		throw new Error("Added education is missing from the left sidebar.");
	if (!sidebarEducation.includes(text.exported22)) throw new Error("Added education is not labelled as exported 2/2.");
	if (!previewText.includes(text.addedSchool)) throw new Error("Added education is missing from realtime preview.");
	if (!checklist.includes(text.education) || !checklist.includes(text.twoItems)) {
		throw new Error("Template checklist did not update the education count to 2.");
	}

	return { checklist, previewContainsAdded: true, sidebarEducation };
}

async function verifyHiddenAwardsAndDownloads(resumeId) {
	const resume = await getResume(resumeId);
	resume.data.sections.awards.hidden = true;

	await updateResumeData(resumeId, resume.data);
	await reloadBuilder();

	const awardsText = await page.locator("#sidebar-awards").innerText();
	const checklistText = await page.locator(`section[aria-label="${text.checklist}"]`).innerText();
	const layoutText = await page.locator("#sidebar-layout").innerText();

	if (!awardsText.includes(text.hiddenModule)) throw new Error("Hidden awards section does not show hidden state.");
	if (awardsText.includes("\u4f1a\u5bfc\u51fa")) {
		throw new Error("Hidden awards section still labels items as exported.");
	}
	if (checklistText.includes(text.awards)) throw new Error("Hidden awards section still appears in checklist.");
	if (layoutText.includes(text.awards)) throw new Error("Hidden awards section still appears in Word layout order.");

	const wordDownloadPromise = page.waitForEvent("download", { timeout: 30_000 });
	await page.locator("#sidebar-export button").filter({ hasText: text.wordExport }).last().click();
	const word = await saveDownload(await wordDownloadPromise, ".docx");

	const pdfDownloadPromise = page.waitForEvent("download", { timeout: 45_000 });
	await page.locator("#sidebar-export button").filter({ hasText: "PDF" }).first().click();
	const pdf = await saveDownload(await pdfDownloadPromise, ".pdf");

	return { awardsText, checklistText, layoutText, pdf, word };
}

async function saveDownload(download, expectedExtension) {
	const suggestedFilename = download.suggestedFilename();
	if (!suggestedFilename.endsWith(expectedExtension)) {
		throw new Error(`Expected ${expectedExtension} download, got ${suggestedFilename}.`);
	}

	await fs.mkdir(artifactDir, { recursive: true });
	const targetPath = path.join(artifactDir, `${runId}-${suggestedFilename}`);
	await download.saveAs(targetPath);
	const stats = await fs.stat(targetPath);

	if (stats.size <= 0) throw new Error(`Downloaded file is empty: ${targetPath}`);

	return { size: stats.size, suggestedFilename, targetPath };
}

try {
	await registerTempUser();
	const resumeId = await createSmokeResume();
	const previewPages = await selectFirstWordTemplate(resumeId);
	const addedEducation = await verifyAddedEducation(resumeId);
	const hiddenAwards = await verifyHiddenAwardsAndDownloads(resumeId);

	const severeErrors = consoleErrors.filter((message) => !message.includes("[vite]"));
	if (severeErrors.length > 0) {
		throw new Error(`Browser console errors:\n${severeErrors.join("\n")}`);
	}

	console.log(
		JSON.stringify(
			{
				ok: true,
				addedEducation,
				email,
				hiddenAwards,
				previewPages,
				resumeId,
				url: page.url(),
			},
			null,
			2,
		),
	);
} finally {
	await browser.close();
}
