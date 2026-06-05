# 中文简历 Beta 部署说明

这份说明面向单机 VPS + Docker Compose 部署。生产环境建议使用 Linux，不建议 Windows Server。

## 最低配置

- 可跑通：1 核 1G，但 PDF 导出、图片处理、AI/OCR 同时使用时会很紧。
- 建议 Beta：2 核 2G 起步。
- 建议系统：Debian 12 / Ubuntu 22.04+ / 1Panel 或纯 Docker Compose。

## 生产环境变量

不要直接使用 `.env.example` 启动生产服务。先复制一份：

```bash
cp .env.example .env
```

必须替换这些值：

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
docker compose -f compose.yml config
docker compose -f compose.yml up -d --build
```

只暴露 `3000` 给反向代理。Postgres、Redis、SeaweedFS 默认只在 Docker 网络内部通信，不应直接开放公网端口。

## 反向代理

用 Nginx / Caddy / 1Panel 反代到 `127.0.0.1:3000`，开启 HTTPS。

必须确认：

- `APP_URL` 与公网 HTTPS 域名一致。
- 反代保留 `Host`、`X-Forwarded-Proto`。
- 防火墙只开放 80/443/SSH。

## 上线前检查

```bash
pnpm.cmd --filter web typecheck
pnpm.cmd --filter @reactive-resume/api typecheck
pnpm.cmd --filter @reactive-resume/env typecheck
node tooling\verify-homepage-templates.mjs
node tooling\verify-template-starter.mjs
node tooling\verify-builder-quick-edit.mjs
docker compose -f compose.yml config
```

手工检查：

- 注册/登录。
- 导入 DOCX。
- 导入普通 PDF。
- 配置 OCR 后导入扫描 PDF 或图片。
- AI 简历分析输出中文。
- 切换模板后内容不丢失。
- PDF 导出非空白。

## 开源署名

本项目基于 Reactive Resume 二次开发，需保留 MIT License、原项目版权声明和开源链接。可以作为自己的作品集项目展示，但页面、README、仓库说明中要写清楚“基于 Reactive Resume 二次开发”。
