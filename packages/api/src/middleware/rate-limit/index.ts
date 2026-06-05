import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { MemoryRatelimiter } from "@orpc/experimental-ratelimit/memory";
import { env } from "@reactive-resume/env/server";
import { rateLimitConfig, TRUSTED_IP_HEADERS } from "@reactive-resume/utils/rate-limit";

const isRateLimitEnabled = process.env.NODE_ENV === "production";

type ContextWithHeaders = {
	reqHeaders?: Headers;
	user?: { id: string } | null;
};

type ClientKeyOptions = {
	trustProxyHeaders?: boolean;
};

export function getTrustedIp(headers?: Headers, options: ClientKeyOptions = {}): string | null {
	const trustProxyHeaders = options.trustProxyHeaders ?? env.FLAG_TRUST_PROXY_HEADERS;
	if (!trustProxyHeaders || !headers) return null;

	for (const headerName of TRUSTED_IP_HEADERS) {
		const raw = headers.get(headerName)?.trim();
		if (!raw) continue;

		// Some proxies provide a comma-delimited chain; first item is the original client.
		const ip = raw.split(",")[0]?.trim();
		if (!ip) continue;

		return ip;
	}

	return null;
}

export function getClientKey(headers?: Headers, options: ClientKeyOptions = {}): string {
	const trustedIp = getTrustedIp(headers, options);
	if (trustedIp) return `ip:${trustedIp}`;

	return "anon:no-trusted-ip";
}

function getUserKey(context: ContextWithHeaders): string {
	return context.user?.id ?? "anon";
}

function getInputKeyPart(input: unknown): string {
	if (!input || typeof input !== "object") return "no-input";

	const inputRecord = input as Record<string, unknown>;

	const fields = ["resumeId", "threadId", "conversationId", "messageId", "fileId", "id"] as const;
	for (const field of fields) {
		const value = inputRecord[field];
		if (typeof value !== "string") continue;

		const trimmedValue = value.trim();
		if (trimmedValue) return `${field}:${trimmedValue}`;
	}

	const username = inputRecord.username;
	const slug = inputRecord.slug;

	if (typeof username === "string" && typeof slug === "string") return `${username}:${slug}`;

	return "no-id";
}

const resumePasswordLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.resumePassword);
const pdfLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.pdfExport);
const aiLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.aiRequest);
const storageUploadLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.storageUpload);
const storageDeleteLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.storageDelete);
const resumeMutationLimiter = new MemoryRatelimiter(rateLimitConfig.orpc.resumeMutations);
const disabledLimiter = {
	limit: async () => ({
		success: true,
		remaining: Number.POSITIVE_INFINITY,
		reset: Date.now(),
	}),
};

const productionLimiter = (limiter: MemoryRatelimiter) => (isRateLimitEnabled ? limiter : disabledLimiter);

export const resumePasswordRateLimit = createRatelimitMiddleware<
	ContextWithHeaders,
	{ username: string; slug: string }
>({
	limiter: productionLimiter(resumePasswordLimiter),
	key: ({ context }, input) => `resume-password:${input.username}:${input.slug}:${getClientKey(context.reqHeaders)}`,
});

export const pdfExportRateLimit = createRatelimitMiddleware<ContextWithHeaders, { id: string }>({
	limiter: productionLimiter(pdfLimiter),
	key: ({ context }, input) => `pdf-export:${getUserKey(context)}:${input.id}`,
});

export const aiRequestRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: productionLimiter(aiLimiter),
	key: ({ context }, input) => `ai-request:${getUserKey(context)}:${getInputKeyPart(input)}`,
});

export const storageUploadRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: productionLimiter(storageUploadLimiter),
	key: ({ context }) => `storage-upload:${getUserKey(context)}`,
});

export const storageDeleteRateLimit = createRatelimitMiddleware<ContextWithHeaders, { filename: string }>({
	limiter: productionLimiter(storageDeleteLimiter),
	key: ({ context }, input) => `storage-delete:${getUserKey(context)}:${input.filename}`,
});

export const resumeMutationRateLimit = createRatelimitMiddleware<ContextWithHeaders, unknown>({
	limiter: productionLimiter(resumeMutationLimiter),
	key: ({ context }, input) => `resume-mutation:${getUserKey(context)}:${getInputKeyPart(input)}`,
});
