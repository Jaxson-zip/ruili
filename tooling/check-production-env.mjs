import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const allowLocal = args.includes("--allow-local");
const envArg = args.find((arg) => !arg.startsWith("--"));
const envPath = path.resolve(envArg ?? ".env");

const requiredKeys = [
	"APP_URL",
	"DATABASE_URL",
	"POSTGRES_PASSWORD",
	"AUTH_SECRET",
	"S3_ACCESS_KEY_ID",
	"S3_SECRET_ACCESS_KEY",
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

	const appUrl = env.get("APP_URL");
	if (appUrl) {
		const url = tryParseUrl(appUrl);
		if (!url) failures.push("APP_URL 不是有效 URL");
		if (!allowLocal && url?.protocol !== "https:") failures.push("APP_URL 正式上线必须使用 https:// 域名");
		if (!allowLocal && ["localhost", "127.0.0.1", "0.0.0.0"].includes(url?.hostname ?? "")) {
			failures.push("APP_URL 仍然指向本机地址");
		}
	}

	const databaseUrl = env.get("DATABASE_URL");
	if (databaseUrl) {
		const url = tryParseUrl(databaseUrl);
		if (!url) failures.push("DATABASE_URL 不是有效 PostgreSQL URL");
		if (url && !["postgres:", "postgresql:"].includes(url.protocol))
			failures.push("DATABASE_URL 协议必须是 postgres/postgresql");
		if (!allowLocal && ["localhost", "127.0.0.1", "0.0.0.0"].includes(url?.hostname ?? "")) {
			failures.push("DATABASE_URL 正式上线不应指向本机地址");
		}
		if (databaseUrl.includes("postgres:postgres@")) failures.push("DATABASE_URL 仍在使用默认 postgres 密码");

		const postgresPassword = env.get("POSTGRES_PASSWORD");
		const urlPassword = url?.password ? decodeURIComponent(url.password) : "";
		if (url?.hostname === "postgres" && postgresPassword && urlPassword && postgresPassword !== urlPassword) {
			failures.push("POSTGRES_PASSWORD 和 DATABASE_URL 中的数据库密码不一致");
		}
	}

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

	if (!env.get("SMTP_HOST")) warnings.push("SMTP 未配置：注册/找回密码邮件可能只能输出到日志");
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
