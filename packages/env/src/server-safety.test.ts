import { describe, expect, it } from "vitest";
import { isProductionEnvValueSafe } from "./server-safety";

describe("isProductionEnvValueSafe", () => {
	it("allows development defaults outside production", () => {
		expect(
			isProductionEnvValueSafe({
				name: "AUTH_SECRET",
				nodeEnv: "development",
				value: "change-me-to-a-secure-secret-key-in-production",
			}),
		).toBe(true);
	});

	it("rejects known example secrets in production", () => {
		expect(
			isProductionEnvValueSafe({
				name: "AUTH_SECRET",
				nodeEnv: "production",
				value: "change-me-to-a-secure-secret-key-in-production",
			}),
		).toBe(false);

		expect(
			isProductionEnvValueSafe({
				name: "ENCRYPTION_SECRET",
				nodeEnv: "production",
				value: "change-me-to-a-secure-agent-secret-in-production",
			}),
		).toBe(false);
	});

	it("rejects localhost APP_URL in production", () => {
		expect(isProductionEnvValueSafe({ name: "APP_URL", nodeEnv: "production", value: "http://localhost:3000" })).toBe(
			false,
		);
		expect(
			isProductionEnvValueSafe({ name: "APP_URL", nodeEnv: "production", value: "https://resume.example.com" }),
		).toBe(true);
	});

	it("rejects default datastore credentials in production", () => {
		expect(
			isProductionEnvValueSafe({
				name: "DATABASE_URL",
				nodeEnv: "production",
				value: "postgresql://postgres:postgres@postgres:5432/postgres",
			}),
		).toBe(false);
		expect(
			isProductionEnvValueSafe({
				name: "DATABASE_URL",
				nodeEnv: "production",
				value: "postgresql://postgres:change-me-postgres-password@postgres:5432/postgres",
			}),
		).toBe(false);

		expect(isProductionEnvValueSafe({ name: "S3_ACCESS_KEY_ID", nodeEnv: "production", value: "seaweedfs" })).toBe(
			false,
		);
		expect(isProductionEnvValueSafe({ name: "S3_SECRET_ACCESS_KEY", nodeEnv: "production", value: "seaweedfs" })).toBe(
			false,
		);
		expect(
			isProductionEnvValueSafe({
				name: "S3_SECRET_ACCESS_KEY",
				nodeEnv: "production",
				value: "change-me-s3-secret-key",
			}),
		).toBe(false);
	});
});
