import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const allowLocal = args.includes("--allow-local");
const allowTrustedProxyHeaders = args.includes("--allow-trusted-proxy-headers");
const envArg = args.find((arg) => !arg.startsWith("--"));
const envPath = path.resolve(envArg ?? ".env");

const requiredKeys = [
	"APP_URL",
	"DATABASE_URL",
	"POSTGRES_PASSWORD",
	"AUTH_SECRET",
	"S3_ACCESS_KEY_ID",
	"S3_SECRET_ACCESS_KEY",
	"S3_ENDPOINT",
	"S3_BUCKET",
	"REDIS_URL",
	"ENCRYPTION_SECRET",
];

const placeholderPatterns = [/change-me/i, /your-secure/i, /example/i, /placeholder/i];

const stripInlineComment = (value) => {
	let quote = null;
	for (let index = 0; index < value.length; index++) {
		const char = value[index];
		if ((char === '"' || char === "'") && value[index - 1] !== "\\") {
			quote = quote === char ? null : (quote ?? char);
		}
		if (char === "#" && quote === null) return value.slice(0, index).trim();
	}
	return value.trim();
};

const unquote = (value) => {
	const trimmed = stripInlineComment(value);
	if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
};

const parseEnvFile = (filePath) => {
	const raw = fs.readFileSync(filePath, "utf8");
	const env = new Map();

	for (const line of raw.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const match = trimmed.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!match) continue;

		env.set(match[1], unquote(match[2]));
	}

	return env;
};

const isPlaceholder = (value) => {
	if (!value) return true;
	return placeholderPatterns.some((pattern) => pattern.test(value));
};

const tryParseUrl = (value) => {
	try {
		return new URL(value);
	} catch {
		return null;
	}
};

const safeDecodeURIComponent = (value) => {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};

const isTrue = (value) => value === "true";
const hasValue = (value) => (value ?? "").trim().length > 0;

const isLocalHostname = (hostname) =>
	["localhost", "127.0.0.1", "0.0.0.0", "::1", "host.docker.internal", "minio", "s3", "seaweedfs"].includes(hostname);

const isComposeInternalS3Endpoint = (url) =>
	url?.protocol === "http:" &&
	url.hostname === "seaweedfs" &&
	url.port === "8333" &&
	url.pathname === "/" &&
	url.search === "" &&
	url.hash === "";

const parsePort = (value) => {
	const port = Number(value);
	return Number.isInteger(port) && port >= 1 && port <= 65_535 ? port : null;
};

const parseSizeToMiB = (value) => {
	const match = value.trim().match(/^(\d+)([bkmg])?b?$/i);
	if (!match) return null;

	const amount = Number(match[1]);
	const unit = (match[2] ?? "b").toLowerCase();

	if (!Number.isSafeInteger(amount) || amount <= 0) return null;

	switch (unit) {
		case "b":
			return amount / 1024 / 1024;
		case "k":
			return amount / 1024;
		case "m":
			return amount;
		case "g":
			return amount * 1024;
		default:
			return null;
	}
};

const isAzureDocumentIntelligenceEndpoint = (url) => {
	const hostname = url?.hostname.toLowerCase() ?? "";
	return hostname.endsWith(".cognitiveservices.azure.com") || hostname.endsWith(".api.cognitive.microsoft.com");
};

const failures = [];
const warnings = [];

if (!fs.existsSync(envPath)) {
	failures.push(`找不到环境变量文件：${envPath}`);
} else {
	const env = parseEnvFile(envPath);

	for (const key of requiredKeys) {
		const value = env.get(key);
		if (!value) failures.push(`缺少 ${key}`);
	}

	for (const key of ["PORT", "SERVER_PORT", "SMTP_PORT"]) {
		const value = env.get(key);
		if (hasValue(value) && !parsePort(value)) failures.push(`${key} 必须是 1-65535 之间的端口号`);
	}

	for (const [key, minimumMiB] of [
		["APP_MEMORY_LIMIT", 512],
		["APP_SHM_SIZE", 64],
	]) {
		const value = env.get(key);
		if (!hasValue(value)) continue;

		const sizeMiB = parseSizeToMiB(value);
		if (sizeMiB === null) {
			failures.push(`${key} 必须使用 Docker 可识别的正数大小，例如 900m、1g、256m`);
		} else if (sizeMiB < minimumMiB) {
			warnings.push(`${key} 低于 ${minimumMiB}m；PDF 导出、图片处理或浏览器渲染可能不稳定`);
		}
	}

	const composeEnvFile = env.get("COMPOSE_ENV_FILE");
	if (hasValue(composeEnvFile)) {
		const composeEnvPath = path.resolve(composeEnvFile);
		if (!fs.existsSync(composeEnvPath)) {
			failures.push(`COMPOSE_ENV_FILE 指向的文件不存在：${composeEnvFile}`);
		}
	}

	const appUrl = env.get("APP_URL");
	if (appUrl) {
		const url = tryParseUrl(appUrl);
		if (!url) failures.push("APP_URL 不是有效 URL");
		if (!allowLocal && url?.protocol !== "https:") failures.push("APP_URL 正式上线必须使用 https:// 域名");
		if (!allowLocal && isLocalHostname(url?.hostname ?? "")) {
			failures.push("APP_URL 仍然指向本机地址");
		}
		if (url && (url.pathname !== "/" || url.search !== "" || url.hash !== "")) {
			failures.push("APP_URL 必须是站点根地址，不能带路径、查询参数或 hash");
		}
	}

	const databaseUrl = env.get("DATABASE_URL");
	if (databaseUrl) {
		const url = tryParseUrl(databaseUrl);
		if (!url) failures.push("DATABASE_URL 不是有效 PostgreSQL URL");
		if (url && !["postgres:", "postgresql:"].includes(url.protocol))
			failures.push("DATABASE_URL 协议必须是 postgres/postgresql");
		if (!allowLocal && isLocalHostname(url?.hostname ?? "")) {
			failures.push("DATABASE_URL 正式上线不应指向本机地址");
		}
		const urlPassword = url?.password ? safeDecodeURIComponent(url.password) : "";
		if (url?.username === "postgres" && urlPassword === "postgres")
			failures.push("DATABASE_URL 仍在使用默认 postgres 密码");

		const postgresPassword = env.get("POSTGRES_PASSWORD");
		if (url?.hostname === "postgres" && postgresPassword && urlPassword && postgresPassword !== urlPassword) {
			failures.push("POSTGRES_PASSWORD 和 DATABASE_URL 中的数据库密码不一致");
		}
	}

	const s3Endpoint = env.get("S3_ENDPOINT");
	if (s3Endpoint) {
		const url = tryParseUrl(s3Endpoint);
		if (isPlaceholder(s3Endpoint)) failures.push("S3_ENDPOINT 仍是示例值");
		if (!url) failures.push("S3_ENDPOINT 不是有效 URL");
		if (!allowLocal && url && !isComposeInternalS3Endpoint(url) && isLocalHostname(url.hostname)) {
			failures.push("S3_ENDPOINT 正式上线不应指向本机或内部开发服务");
		}
	}

	const s3Bucket = env.get("S3_BUCKET");
	if (s3Bucket && isPlaceholder(s3Bucket)) failures.push("S3_BUCKET 仍是示例值");

	for (const key of [
		"POSTGRES_PASSWORD",
		"AUTH_SECRET",
		"S3_ACCESS_KEY_ID",
		"S3_SECRET_ACCESS_KEY",
		"ENCRYPTION_SECRET",
	]) {
		const value = env.get(key);
		if (value && isPlaceholder(value)) failures.push(`${key} 仍是示例值`);
	}

	if ((env.get("POSTGRES_PASSWORD") ?? "").length > 0 && (env.get("POSTGRES_PASSWORD") ?? "").length < 16) {
		failures.push("POSTGRES_PASSWORD 长度至少建议 16 位");
	}

	if ((env.get("AUTH_SECRET") ?? "").length > 0 && (env.get("AUTH_SECRET") ?? "").length < 32) {
		failures.push("AUTH_SECRET 长度至少 32 位");
	}

	if ((env.get("ENCRYPTION_SECRET") ?? "").length > 0 && (env.get("ENCRYPTION_SECRET") ?? "").length < 32) {
		failures.push("ENCRYPTION_SECRET 长度至少 32 位");
	}

	if (isTrue(env.get("FLAG_ALLOW_UNSAFE_AI_BASE_URL")))
		failures.push("FLAG_ALLOW_UNSAFE_AI_BASE_URL 不能在生产环境开启");
	if (isTrue(env.get("FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI")))
		failures.push("FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI 不能在生产环境开启");
	if (isTrue(env.get("FLAG_TRUST_PROXY_HEADERS")) && !allowTrustedProxyHeaders) {
		failures.push("FLAG_TRUST_PROXY_HEADERS 已开启；如确认上游代理可信，请显式传入 --allow-trusted-proxy-headers");
	}

	const smtpKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
	const smtpTransportKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
	const configuredSmtpTransportKeys = smtpTransportKeys.filter((key) => hasValue(env.get(key)));
	const configuredSmtpKeys = smtpKeys.filter((key) => hasValue(env.get(key)));
	if (configuredSmtpTransportKeys.length === 0) warnings.push("SMTP 未配置：注册/找回密码邮件可能只能输出到日志");
	if (configuredSmtpTransportKeys.length > 0 && configuredSmtpKeys.length < smtpKeys.length) {
		failures.push(`SMTP 配置不完整：${smtpKeys.filter((key) => !hasValue(env.get(key))).join(", ")} 仍为空`);
	}
	if (hasValue(env.get("SMTP_HOST")) && isPlaceholder(env.get("SMTP_FROM"))) {
		failures.push("SMTP_FROM 仍是示例值，配置 SMTP 后必须使用真实发件地址");
	}

	const oauthEndpointKeys = [
		"OAUTH_DISCOVERY_URL",
		"OAUTH_AUTHORIZATION_URL",
		"OAUTH_TOKEN_URL",
		"OAUTH_USER_INFO_URL",
	];
	const configuredOauthKeys = [
		"OAUTH_PROVIDER_NAME",
		"OAUTH_CLIENT_ID",
		"OAUTH_CLIENT_SECRET",
		...oauthEndpointKeys,
	].filter((key) => hasValue(env.get(key)));
	if (configuredOauthKeys.length > 0) {
		if (!hasValue(env.get("OAUTH_CLIENT_ID"))) failures.push("自定义 OAuth 已部分配置，但缺少 OAUTH_CLIENT_ID");
		if (!hasValue(env.get("OAUTH_CLIENT_SECRET"))) failures.push("自定义 OAuth 已部分配置，但缺少 OAUTH_CLIENT_SECRET");

		const hasDiscovery = hasValue(env.get("OAUTH_DISCOVERY_URL"));
		const manualKeys = ["OAUTH_AUTHORIZATION_URL", "OAUTH_TOKEN_URL", "OAUTH_USER_INFO_URL"];
		const missingManualKeys = manualKeys.filter((key) => !hasValue(env.get(key)));
		if (!hasDiscovery && missingManualKeys.length > 0) {
			failures.push(`自定义 OAuth 需要 OAUTH_DISCOVERY_URL，或补齐手动端点：${missingManualKeys.join(", ")}`);
		}

		for (const key of oauthEndpointKeys) {
			const value = env.get(key);
			if (!hasValue(value)) continue;

			const url = tryParseUrl(value);
			if (!url) {
				failures.push(`${key} 不是有效 URL`);
			} else if (!allowLocal && url.protocol !== "https:") {
				failures.push(`${key} 正式上线必须使用 https://`);
			}
		}
	}

	const ocrKeys = ["OCR_PROVIDER", "OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY"];
	const configuredOcrKeys = ocrKeys.filter((key) => hasValue(env.get(key)));
	if (configuredOcrKeys.length > 0) {
		if (env.get("OCR_PROVIDER") !== "azure-document-intelligence") {
			failures.push("OCR_PROVIDER 当前只支持 azure-document-intelligence，或留空让用户自带 OCR Provider");
		}
		for (const key of ["OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY"]) {
			if (!hasValue(env.get(key))) failures.push(`实例级 OCR 已部分配置，但缺少 ${key}`);
		}

		const endpoint = env.get("OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT");
		if (hasValue(endpoint)) {
			const url = tryParseUrl(endpoint);
			if (!url) {
				failures.push("OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT 不是有效 URL");
			} else {
				if (url.protocol !== "https:") failures.push("OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT 必须使用 https://");
				if (!isAzureDocumentIntelligenceEndpoint(url)) {
					failures.push("OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT 必须是 Azure Document Intelligence 域名");
				}
			}
		}
	}
	if (env.get("FLAG_DISABLE_SIGNUPS") !== "true") warnings.push("当前允许公开注册；正式开放前确认是否需要关闭");
	if (env.get("FLAG_TRUST_PROXY_HEADERS") !== "true")
		warnings.push("如放在 Nginx/CDN 后面，建议确认是否需要开启 FLAG_TRUST_PROXY_HEADERS");
	if (!env.get("OCR_PROVIDER")) warnings.push("未配置实例级 OCR；这符合“用户自带 OCR 配置”的策略");
}

if (failures.length > 0) {
	console.error("生产环境自检失败：");
	for (const failure of failures) console.error(`- ${failure}`);
	if (warnings.length > 0) {
		console.error("\n需要确认：");
		for (const warning of warnings) console.error(`- ${warning}`);
	}
	process.exit(1);
}

console.log(`生产环境自检通过：${envPath}`);
if (warnings.length > 0) {
	console.log("需要确认：");
	for (const warning of warnings) console.log(`- ${warning}`);
}
