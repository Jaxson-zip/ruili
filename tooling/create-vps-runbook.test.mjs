import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = path.resolve("tooling/create-vps-runbook.mjs");
const createdFiles = [];

const outputPath = () => {
	const filePath = path.join(os.tmpdir(), `ruili-vps-runbook-${crypto.randomUUID()}.md`);
	createdFiles.push(filePath);

	return filePath;
};

const runScript = (args) =>
	spawnSync(process.execPath, [scriptPath, ...args], {
		cwd: path.resolve("."),
		encoding: "utf8",
	});

afterEach(() => {
	while (createdFiles.length > 0) {
		const filePath = createdFiles.pop();
		if (filePath && fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
	}
});

describe("create-vps-runbook", () => {
	it("generates a domain-specific deployment runbook without secrets", () => {
		const filePath = outputPath();
		const result = runScript(["--app-url", "https://resume.example.com", "--output", filePath]);

		expect(result.status).toBe(0);
		const content = fs.readFileSync(filePath, "utf8");
		expect(content).toContain("目标站点：https://resume.example.com");
		expect(content).toContain("server_name resume.example.com;");
		expect(content).toContain("pnpm deploy:init --app-url https://resume.example.com --output .env.production");
		expect(content).toContain("pnpm verify:production --url https://resume.example.com");
		expect(content).toContain("DNS 与防火墙");
		expect(content).toContain("上线验收");
		expect(content).not.toMatch(/AUTH_SECRET=|POSTGRES_PASSWORD=|ENCRYPTION_SECRET=/);
	});

	it("rejects non-HTTPS app URLs", () => {
		const filePath = outputPath();
		const result = runScript(["--app-url", "http://localhost:3000", "--output", filePath]);

		expect(result.status).not.toBe(0);
		expect(fs.existsSync(filePath)).toBe(false);
		expect(result.stderr).toContain("HTTPS root URL");
	});
});
