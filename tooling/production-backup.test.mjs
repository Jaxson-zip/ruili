import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = path.resolve("tooling/production-backup.mjs");
const createdPaths = [];

const writeEnv = () => {
	const filePath = path.join(os.tmpdir(), `ruili-backup-${crypto.randomUUID()}.env`);
	fs.writeFileSync(
		filePath,
		`
COMPOSE_ENV_FILE="${filePath.replaceAll("\\", "\\\\")}"
APP_URL="https://resume.example.com"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="strong-postgres-password"
DATABASE_URL="postgresql://postgres:strong-postgres-password@postgres:5432/postgres"
AUTH_SECRET="0123456789abcdef0123456789abcdef"
ENCRYPTION_SECRET="abcdef0123456789abcdef0123456789"
S3_ACCESS_KEY_ID="ruili-access-key"
S3_SECRET_ACCESS_KEY="ruili-secret-key"
S3_ENDPOINT="http://seaweedfs:8333"
S3_BUCKET="reactive-resume"
REDIS_URL="redis://redis:6379"
`,
		"utf8",
	);
	createdPaths.push(filePath);

	return filePath;
};

const runPlan = (args = []) =>
	spawnSync(process.execPath, [scriptPath, "--json", ...args], {
		cwd: path.resolve("."),
		encoding: "utf8",
	});

afterEach(() => {
	while (createdPaths.length > 0) {
		const filePath = createdPaths.pop();
		if (!filePath || !fs.existsSync(filePath)) continue;
		fs.rmSync(filePath, { force: true, recursive: true });
	}
});

describe("production-backup", () => {
	it("prints a dry-run plan without executing docker commands", () => {
		const envFile = writeEnv();
		const outputDir = path.join(os.tmpdir(), `ruili-backup-output-${crypto.randomUUID()}`);
		createdPaths.push(outputDir);

		const result = runPlan(["--env-file", envFile, "--output", outputDir]);

		expect(result.status).toBe(0);
		const plan = JSON.parse(result.stdout);
		expect(plan.mode).toBe("plan");
		expect(plan.outputDir).toBe(outputDir);
		expect(plan.steps.map((step) => step.name)).toEqual([
			"environment check",
			"postgres pg_dump",
			"redis bgsave",
			"redis dump copy",
			"seaweedfs volume archive",
			"env snapshot",
			"manifest",
		]);
		expect(plan.steps.find((step) => step.name === "postgres pg_dump").command).toContain("pg_dump");
		expect(plan.steps.find((step) => step.name === "seaweedfs volume archive").command).toContain(
			"reactive_resume_seaweedfs_data:/data:ro",
		);
		expect(fs.existsSync(outputDir)).toBe(false);
	});

	it("can omit the env snapshot from the plan", () => {
		const envFile = writeEnv();
		const result = runPlan(["--env-file", envFile, "--exclude-env"]);

		expect(result.status).toBe(0);
		const plan = JSON.parse(result.stdout);
		expect(plan.includeEnv).toBe(false);
		expect(plan.steps.map((step) => step.name)).not.toContain("env snapshot");
	});
});
