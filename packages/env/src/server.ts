import { isAbsolute, join } from "node:path";
import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";
import { findWorkspaceRoot } from "@reactive-resume/utils/monorepo.node";
import { isProductionEnvValueSafe, productionSafetyMessage } from "./server-safety";

const workspaceRoot = findWorkspaceRoot();

if (workspaceRoot) {
	config({ path: join(workspaceRoot, ".env"), quiet: true });
}

export const env = createEnv({
	server: {
		// Application
		APP_URL: z
			.url({ protocol: /https?/ })
			.refine(
				(value) => isProductionEnvValueSafe({ name: "APP_URL", nodeEnv: process.env.NODE_ENV, value }),
				productionSafetyMessage("APP_URL"),
			),
		SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(3001),

		// Database
		DATABASE_URL: z
			.url({ protocol: /postgres(ql)?/ })
			.refine(
				(value) => isProductionEnvValueSafe({ name: "DATABASE_URL", nodeEnv: process.env.NODE_ENV, value }),
				productionSafetyMessage("DATABASE_URL"),
			),

		// Authentication
		AUTH_SECRET: z
			.string()
			.min(1)
			.refine(
				(value) => isProductionEnvValueSafe({ name: "AUTH_SECRET", nodeEnv: process.env.NODE_ENV, value }),
				productionSafetyMessage("AUTH_SECRET"),
			),
		BETTER_AUTH_API_KEY: z.string().min(1).optional(),

		// Social Auth (Google)
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

		// Social Auth (GitHub)
		GITHUB_CLIENT_ID: z.string().min(1).optional(),
		GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

		// Social Auth (LinkedIn)
		LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
		LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),

		// Custom OAuth Provider
		OAUTH_PROVIDER_NAME: z.string().min(1).optional(),
		OAUTH_CLIENT_ID: z.string().min(1).optional(),
		OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
		OAUTH_DISCOVERY_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_AUTHORIZATION_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_TOKEN_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_USER_INFO_URL: z.url({ protocol: /https?/ }).optional(),
		OAUTH_SCOPES: z
			.string()
			.min(1)
			.transform((value) => value.split(" "))
			.default(["openid", "profile", "email"]),

		// Email (SMTP)
		SMTP_HOST: z.string().min(1).optional(),
		SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
		SMTP_USER: z.string().min(1).optional(),
		SMTP_PASS: z.string().min(1).optional(),
		SMTP_FROM: z.string().min(1).optional(),
		SMTP_SECURE: z.stringbool().default(false),

		// Storage (Optional)
		LOCAL_STORAGE_PATH: z.string().min(1).refine(isAbsolute, "LOCAL_STORAGE_PATH must be an absolute path").optional(),
		S3_ACCESS_KEY_ID: z
			.string()
			.min(1)
			.refine(
				(value) => isProductionEnvValueSafe({ name: "S3_ACCESS_KEY_ID", nodeEnv: process.env.NODE_ENV, value }),
				productionSafetyMessage("S3_ACCESS_KEY_ID"),
			)
			.optional(),
		S3_SECRET_ACCESS_KEY: z
			.string()
			.min(1)
			.refine(
				(value) => isProductionEnvValueSafe({ name: "S3_SECRET_ACCESS_KEY", nodeEnv: process.env.NODE_ENV, value }),
				productionSafetyMessage("S3_SECRET_ACCESS_KEY"),
			)
			.optional(),
		S3_REGION: z.string().default("us-east-1"),
		S3_ENDPOINT: z.url({ protocol: /https?/ }).optional(),
		S3_BUCKET: z.string().min(1).optional(),
		S3_FORCE_PATH_STYLE: z.stringbool().default(false),

		// AI Agent Workspace (optional until the agent feature is used)
		REDIS_URL: z.url({ protocol: /redis(s)?/ }).optional(),
		ENCRYPTION_SECRET: z
			.string()
			.min(32, "ENCRYPTION_SECRET must be at least 32 characters")
			.refine(
				(value) => isProductionEnvValueSafe({ name: "ENCRYPTION_SECRET", nodeEnv: process.env.NODE_ENV, value }),
				productionSafetyMessage("ENCRYPTION_SECRET"),
			)
			.optional(),

		// Cloud OCR (optional)
		OCR_PROVIDER: z.enum(["azure-document-intelligence"]).optional(),
		OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: z.url({ protocol: /https?/ }).optional(),
		OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY: z.string().min(1).optional(),
		OCR_MIN_TEXT_CHARS: z.coerce.number().int().min(20).max(2000).default(120),
		OCR_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120_000).default(45_000),
		OCR_POLL_INTERVAL_MS: z.coerce.number().int().min(0).max(5000).default(1000),

		// Feature Flags
		FLAG_DISABLE_SIGNUPS: z.stringbool().default(false),
		FLAG_DISABLE_EMAIL_AUTH: z.stringbool().default(false),
		FLAG_DISABLE_IMAGE_PROCESSING: z.stringbool().default(false),
		FLAG_TRUST_PROXY_HEADERS: z.stringbool().default(false),
		FLAG_ALLOW_UNSAFE_AI_BASE_URL: z.stringbool().default(false),
		FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI: z.stringbool().default(false),

		// Crowdin (optional, for translation tooling)
		CROWDIN_PROJECT_ID: z.string().optional(),
		CROWDIN_API_TOKEN: z.string().optional(),
		GOOGLE_CLOUD_API_KEY: z.string().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
