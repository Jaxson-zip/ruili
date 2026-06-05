# 中文简历 Beta 部署说明

这份说明面向单机 VPS + Docker Compose 部署。生产环境建议使用 Linux，不建议 Windows Server。

## 最低配置

- 可跑通：1 核 1G，但 PDF 导出、图片处理、AI/OCR 同时使用时会很紧。
- 建议 Beta：2 核 2G 起步。
- 建议系统：Debian 12 / Ubuntu 22.04+ / 1Panel 或纯 Docker Compose。

如果只能用 1 核 1G，务必先开启 2G 左右 Swap。PDF 导出会启动无头浏览器，和 AI/OCR 导入同时发生时容易触发 OOM。低配机器建议先限制内测人数，避免多人同时导出 PDF。

Ubuntu / Debian 可以参考：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 生产环境变量

不要直接使用 `.env.example` 启动生产服务。推荐先用正式 HTTPS 域名生成一份生产环境变量：

```bash
pnpm deploy:init --app-url https://resume.example.com --output .env.production
pnpm deploy:check .env.production
docker compose -f compose.yml --env-file .env.production config --quiet
```

这个命令会自动生成强随机的 `POSTGRES_PASSWORD`、`AUTH_SECRET`、`ENCRYPTION_SECRET`、SeaweedFS / S3 密钥，并写好匹配的 `DATABASE_URL`。

如果你手动从 `.env.example` 复制，必须替换这些值：

- `APP_URL`: 必须是你的 HTTPS 域名，例如 `https://resume.example.com`
- `AUTH_SECRET`: `openssl rand -hex 32`
- `ENCRYPTION_SECRET`: `openssl rand -hex 32`
- `POSTGRES_PASSWORD`: 强随机密码
- `DATABASE_URL`: 使用上面的 Postgres 密码
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`: 强随机值
- `S3_ENDPOINT`: Docker Compose 内部用 `http://seaweedfs:8333`

生产启动时会拒绝 `change-me-*`、`localhost`、`postgres:postgres`、`seaweedfs/seaweedfs` 这类示例值。

## OCR Provider

第一版 OCR 支持 Azure AI Document Intelligence 的 prebuilt-read。

公开多用户站点建议让用户在「AI / OCR Providers」里配置自己的 OCR Key。这样图片简历和扫描版 PDF 的 OCR 调用走用户自己的 Azure 账号，平台不会承担 OCR 费用。当前实现把用户 OCR Key 保存在当前浏览器，导入时随请求发送给后端调用 Azure，不写入数据库；换设备需要重新配置。

下面这些环境变量只建议用于可信自托管或单租户实例，作为服务端统一兜底。公开站点如果不想承担 OCR 费用，可以保持为空。

```env
OCR_PROVIDER="azure-document-intelligence"
OCR_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://xxx.cognitiveservices.azure.com"
OCR_AZURE_DOCUMENT_INTELLIGENCE_KEY="..."
OCR_MIN_TEXT_CHARS="120"
OCR_TIMEOUT_MS="45000"
OCR_POLL_INTERVAL_MS="1000"
```

隐私要求：用户上传的扫描件和 OCR 文本会发送给用户配置或你配置的 OCR / AI Provider。上线页面需要明确告知用户。

## 启动

```bash
pnpm deploy:check .env.production
docker compose -f compose.yml --env-file .env.production config --quiet
docker compose -f compose.yml --env-file .env.production up -d --build
docker compose -f compose.yml --env-file .env.production ps
```

只暴露 `3000` 给反向代理。Postgres、Redis、SeaweedFS 默认只在 Docker 网络内部通信，不应直接开放公网端口。

启动后至少确认：

```bash
docker compose -f compose.yml --env-file .env.production ps
docker compose -f compose.yml --env-file .env.production logs --tail=120 reactive_resume
curl -f http://127.0.0.1:3000/api/health
```

`/api/health` 不健康时不要接入公网流量。

## 反向代理

用 Nginx / Caddy / 1Panel 反代到 `127.0.0.1:3000`，开启 HTTPS。

必须确认：

- `APP_URL` 与公网 HTTPS 域名一致。
- 反代保留 `Host`、`X-Forwarded-Proto`。
- 防火墙只开放 80/443/SSH。

## 上线前检查

```bash
pnpm deploy:check .env.production
docker compose -f compose.yml --env-file .env.production config --quiet
docker compose -f compose.yml --env-file .env.production up -d --build
docker compose -f compose.yml --env-file .env.production ps
curl -f http://127.0.0.1:3000/api/health
APP_URL_OVERRIDE=https://resume.example.com pnpm verify:beta
```

手工检查：

- 注册/登录。
- 导入 DOCX。
- 导入普通 PDF。
- 配置 OCR 后导入扫描 PDF 或图片。
- AI 简历分析输出中文。
- 切换模板后内容不丢失。
- PDF 导出非空白。
- 1 核 1G 机器已开启 Swap，并测试连续导出 3 次 PDF。

## 免费部署取舍

不建议把完整产品直接部署到 Vercel。锐历 Ruili 的完整运行依赖 API、worker、Postgres、Redis、S3/SeaweedFS、Chromium/PDF 导出等服务，单纯前端托管无法覆盖这些运行时。

可选路径：

- Vercel/Cloudflare Pages：只适合放静态营销页、文档页或下载入口，再链接到 VPS 上的产品实例。
- 低价 VPS + Docker Compose：当前最短上线方案，成本可控，服务边界清楚。
- Render/Fly/Railway 等 PaaS：可以部署完整产品或拆分服务，但免费层休眠、资源限制、持久化和出站网络策略不稳定，不建议作为正式 Beta 唯一承载。

## 开源署名

本项目基于 Reactive Resume 二次开发，需保留 MIT License、原项目版权声明和开源链接。可以作为作品集项目、商业 Beta 或自托管服务展示，但页面、README、页脚、仓库说明中要写清楚“基于 Reactive Resume 二次开发”。

上线前不要做这些事：

- 不要删除仓库根目录 `LICENSE` 中的 MIT License 和上游 copyright。
- 不要移除 README、页脚或关于页里的 Reactive Resume attribution/link。
- 不要使用“官方版”“官方合作”“上游背书”等容易暗示 Reactive Resume/原作者认可或背书的表述。
