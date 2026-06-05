import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = path.resolve("tooling/check-production-env.mjs");
const createdFiles = [];

const validEnv = (filePath) => `
COMPOSE_ENV_FILE="${filePath.replaceAll("\\", "\\\\")}"
PORT="3000"
SERVER_PORT="3001"
APP_URL="https://resume.example.com"
POSTGRES_PASSWORD="strong-postgres-password"
DATABASE_URL="postgresql://postgres:strong-postgres-password@postgres:5432/postgres"
AUTH_SECRET="0123456789abcdef0123456789abcdef"
ENCRYPTION_SECRET="abcdef0123456789abcdef0123456789"
S3_ACCESS_KEY_ID="ruili-access-key"
S3_SECRET_ACCESS_KEY="ruili-secret-key"
S3_ENDPOINT="http://seaweedfs:8333"
S3_BUCKET="reactive-resume"
REDIS_URL="redis://redis:6379"
APP_MEMORY_LIMIT="900m"
APP_SHM_SIZE="256m"
FLAG_ALLOW_UNSAFE_AI_BASE_URL="false"
FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI="false"
FLAG_TRUST_PROXY_HEADERS="false"
FLAG_DISABLE_SIGNUPS="true"
`;

const writeEnv = (extra = "") => {
	const filePath = path.join(os.tmpdir(), `ruili-check-${crypto.randomUUID()}.env`);
	fs.writeFileSync(filePath, `${validEnv(filePath)}\n${extra}`, "utf8");
	createdFiles.push(filePath);

	return filePath;
};

const runCheck = (filePath) =>
	spawnSync(process.execPath, [scriptPath, filePath], {
		cwd: path.resolve("."),
		encoding: "utf8",
	});

afterEach(() => {
	while (createdFiles.length > 0) {
		const filePath = createdFiles.pop();
		if (filePath && fs.existsSync(filePath)) fs.rmSync(filePath);
	}
});

describe("check-production-env", () => {
	it("accepts a complete generated-like production environment", () => {
		const result = runCheck(writeEnv());

		expect(result.status).toBe(0);
		expect(result.stdout).toContain("生产环境自检通过");
	});

	it("rejects partial SMTP configuration", () => {
		const result = runCheck(writeEnv('SMTP_HOST="smtp.example.com"'));

		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain("SMTP_USER");
	});

	it("rejects partial custom OAuth configuration", () => {
		const result = runCheck(writeEnv('OAUTH_CLIENT_ID="client-id"'));

		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain("OAUTH_CLIENT_SECRET");
	});

	it("rejects partial instance-level OCR configuration", () => {
		const result = runCheck(
			writeEnv(`
OCR_PROVIDER="azure-document-intelligence"
OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://example.com"
`),
		);

		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain("OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY");
	});
});
