import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);

const usage = `Usage:
  pnpm deploy:runbook --app-url https://resume.example.com [--output docs/self-hosting/generated-vps-runbook.md]

Options:
  --app-url <url>       Required. Public HTTPS root URL for the production site.
  --output <path>       Output markdown file. Default: docs/self-hosting/generated-vps-runbook.md
  --repo-url <url>      Git repository to clone on the VPS. Default: https://github.com/Jaxson-zip/ruili.git
  --app-dir <path>      Deployment directory on the VPS. Default: /opt/ruili
  --force               Allow overwriting an existing output file.
`;

const getArgValue = (name) => {
	const index = args.indexOf(name);
	if (index === -1) return "";

	return args[index + 1] ?? "";
};

const hasFlag = (name) => args.includes(name);

if (hasFlag("--help") || hasFlag("-h")) {
	console.log(usage);
	process.exit(0);
}

const appUrl = getArgValue("--app-url");
const outputPath = path.resolve(getArgValue("--output") || "docs/self-hosting/generated-vps-runbook.md");
const repoUrl = getArgValue("--repo-url") || "https://github.com/Jaxson-zip/ruili.git";
const appDir = getArgValue("--app-dir") || "/opt/ruili";
const force = hasFlag("--force");

if (!appUrl) {
	console.error(`Missing --app-url.\n\n${usage}`);
	process.exit(1);
}

let parsedUrl;
try {
	parsedUrl = new URL(appUrl);
} catch {
	console.error(`--app-url is not a valid URL: ${appUrl}`);
	process.exit(1);
}

if (parsedUrl.protocol !== "https:" || parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
	console.error("--app-url must be a HTTPS root URL, for example https://resume.example.com");
	process.exit(1);
}

if (!repoUrl.startsWith("https://") && !repoUrl.startsWith("git@")) {
	console.error("--repo-url must be an https:// or git@ repository URL");
	process.exit(1);
}

if (!path.posix.isAbsolute(appDir.replaceAll("\\", "/"))) {
	console.error("--app-dir must be an absolute Linux path, for example /opt/ruili");
	process.exit(1);
}

if (fs.existsSync(outputPath) && !force) {
	console.error(`Output already exists: ${outputPath}\nPass --force to overwrite it.`);
	process.exit(1);
}

const host = parsedUrl.hostname;
const origin = parsedUrl.origin;
const generatedAt = new Date().toISOString();
const appDirShell = appDir.replaceAll("'", "'\\''");
const code = (value) => `\`${value}\``;

const runbook = [
	"# 锐历 VPS 首次上线 Runbook",
	"",
	`生成时间：${generatedAt}`,
	`目标站点：${origin}`,
	`代码仓库：${repoUrl}`,
	`部署目录：${appDir}`,
	"",
	`这份文档不包含任何生产密钥，可以提交到仓库。真正的 ${code(".env.production")} 请在 VPS 上用 ${code("pnpm deploy:init")} 生成，并按机密文件保存。`,
	"",
	"## 1. DNS 与防火墙",
	"",
	"在域名 DNS 面板添加：",
	"",
	`- A 记录：${code(host)} -> VPS IPv4`,
	"- AAAA 记录：如果 VPS 有 IPv6，再指向 VPS IPv6",
	"",
	"防火墙只开放：",
	"",
	"- 22/tcp：SSH",
	"- 80/tcp：HTTP，用于 ACME/HTTPS 签发和跳转",
	"- 443/tcp：HTTPS",
	"",
	`不要把 Postgres、Redis、SeaweedFS 暴露到公网。应用容器只需要让反向代理访问 ${code("127.0.0.1:3000")}。`,
	"",
	"## 2. 首次准备 VPS",
	"",
	"建议系统：Debian 12 或 Ubuntu 22.04+。",
	"",
	"安装 Docker Engine、Docker Compose plugin、Git、Node.js 和 Corepack 后，确认这些命令可用：",
	"",
	"```bash",
	"docker --version",
	"docker compose version",
	"git --version",
	"node --version",
	"corepack --version",
	"```",
	"",
	"如果是 1 核 1G VPS，先开 2G swap：",
	"",
	"```bash",
	"sudo fallocate -l 2G /swapfile",
	"sudo chmod 600 /swapfile",
	"sudo mkswap /swapfile",
	"sudo swapon /swapfile",
	"echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab",
	"free -h",
	"```",
	"",
	"## 3. 拉代码与生成生产环境变量",
	"",
	"```bash",
	`sudo mkdir -p '${appDirShell}'`,
	`sudo chown "$USER":"$USER" '${appDirShell}'`,
	`git clone ${repoUrl} '${appDirShell}'`,
	`cd '${appDirShell}'`,
	"corepack enable",
	"corepack prepare pnpm@11.4.0 --activate",
	"pnpm install --frozen-lockfile",
	`pnpm deploy:init --app-url ${origin} --output .env.production`,
	"pnpm deploy:check .env.production",
	"docker compose -f compose.yml --env-file .env.production config --quiet",
	"```",
	"",
	`上线前按需补充 ${code(".env.production")}：`,
	"",
	"- SMTP：需要注册验证、找回密码邮件时配置。",
	"- OAuth/SSO：需要第三方登录时配置。",
	"- OCR：公开站点建议先让用户自带 OCR Key，平台实例级 OCR 可以先留空。",
	`- ${code("FLAG_DISABLE_SIGNUPS")}：内测期可设为 ${code("true")}，只保留已有账号。`,
	`- ${code("FLAG_TRUST_PROXY_HEADERS")}：只有确认所有公网流量都经过可信反代，并且应用端口没有直连公网时才设为 ${code("true")}。`,
	"",
	"## 4. 启动应用",
	"",
	"```bash",
	"docker compose -f compose.yml --env-file .env.production up -d --build",
	"docker compose -f compose.yml --env-file .env.production ps",
	"docker compose -f compose.yml --env-file .env.production logs --tail=120 reactive_resume",
	"curl -f http://127.0.0.1:3000/api/health",
	"```",
	"",
	"只有 health 返回 healthy 后，才接入公网反向代理。",
	"",
	"## 5. Caddy 反向代理示例",
	"",
	"```caddyfile",
	`${host} {`,
	"	encode zstd gzip",
	"",
	"	header {",
	'		Strict-Transport-Security "max-age=31536000; includeSubDomains"',
	'		X-Content-Type-Options "nosniff"',
	'		Referrer-Policy "strict-origin-when-cross-origin"',
	"	}",
	"",
	"	reverse_proxy 127.0.0.1:3000 {",
	"		header_up Host {host}",
	"		header_up X-Forwarded-Proto {scheme}",
	"		header_up X-Forwarded-For {remote_host}",
	"	}",
	"}",
	"```",
	"",
	"## 6. Nginx 反向代理示例",
	"",
	"```nginx",
	"server {",
	"    listen 80;",
	`    server_name ${host};`,
	"    return 301 https://$host$request_uri;",
	"}",
	"",
	"server {",
	"    listen 443 ssl http2;",
	`    server_name ${host};`,
	"",
	"    # 用 certbot、acme.sh、1Panel 或云厂商证书管理填充证书路径。",
	`    ssl_certificate /etc/letsencrypt/live/${host}/fullchain.pem;`,
	`    ssl_certificate_key /etc/letsencrypt/live/${host}/privkey.pem;`,
	"",
	"    client_max_body_size 25m;",
	"",
	"    location / {",
	"        proxy_pass http://127.0.0.1:3000;",
	"        proxy_http_version 1.1;",
	"        proxy_set_header Host $host;",
	"        proxy_set_header X-Real-IP $remote_addr;",
	"        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
	"        proxy_set_header X-Forwarded-Proto $scheme;",
	"        proxy_set_header Upgrade $http_upgrade;",
	'        proxy_set_header Connection "upgrade";',
	"    }",
	"}",
	"```",
	"",
	"## 7. 上线验收",
	"",
	"```bash",
	"pnpm deploy:check .env.production",
	"docker compose -f compose.yml --env-file .env.production config --quiet",
	"curl -f http://127.0.0.1:3000/api/health",
	`pnpm verify:production --url ${origin}`,
	`APP_URL_OVERRIDE=${origin} pnpm verify:beta`,
	"```",
	"",
	`验收截图和下载文件会写入 ${code("artifacts/")}。确认无误后再开放给真实用户。`,
	"",
	"## 8. 备份、更新与回滚",
	"",
	"首次开放前先备份一次：",
	"",
	"```bash",
	"pnpm deploy:backup --env-file .env.production",
	"pnpm deploy:backup --env-file .env.production --output backups/ruili-$(date +%Y%m%d-%H%M%S) --execute",
	"```",
	"",
	"更新代码：",
	"",
	"```bash",
	`cd '${appDirShell}'`,
	"pnpm deploy:backup --env-file .env.production --output backups/pre-update-$(date +%Y%m%d-%H%M%S) --execute",
	"git pull --ff-only",
	"pnpm install --frozen-lockfile",
	"pnpm deploy:check .env.production",
	"docker compose -f compose.yml --env-file .env.production up -d --build",
	`pnpm verify:production --url ${origin}`,
	"```",
	"",
	"回滚到上一版：",
	"",
	"```bash",
	`cd '${appDirShell}'`,
	"git log --oneline -5",
	"git checkout <last-known-good-commit>",
	"pnpm install --frozen-lockfile",
	"docker compose -f compose.yml --env-file .env.production up -d --build",
	"curl -f http://127.0.0.1:3000/api/health",
	`pnpm verify:production --url ${origin}`,
	"```",
	"",
	`如果数据也需要回滚，按 ${code("docs/self-hosting/chinese-resume-beta.md")} 的“备份与恢复”章节执行恢复。`,
	"",
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, runbook, "utf8");
console.log(`Generated VPS runbook: ${outputPath}`);
