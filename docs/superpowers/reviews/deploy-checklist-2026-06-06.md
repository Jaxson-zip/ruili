# 锐历 Beta 上线部署清单与最短上线方案

检查日期：2026-06-06  
范围：`.env.example`、`compose.yml`、`docs/self-hosting/chinese-resume-beta.md`、`README.md`，并抽查生产 env 校验、启动迁移、AI/OCR 失败态与开源署名实现。  
限制：本清单只做文档审查和本地配置验证，不代表已经部署到公网。

## 结论：今天能否上线

**可以做小流量 Beta 条件上线，但不建议直接公开放量。**

可行前提：

- 已准备真实 HTTPS 域名，并把 `APP_URL` 设置为该域名。
- 已把 `.env.example` 复制为 `.env`，替换所有 `change-me-*`、本地地址和弱密码。
- 已完成 Docker Compose 配置检查、生产 env 自检、数据库/上传目录备份策略、上线后冒烟测试。
- Beta 初期限制注册或控制邀请人数，避免 1C1G 机器上多人同时导出 PDF、上传文件或跑 AI/OCR。

不能承诺的部分：

- 本次没有执行真实部署、没有访问公网域名、没有跑注册/登录/PDF 导出等端到端冒烟。
- AI/OCR 体验依赖用户或实例管理员配置可用 Provider；没有平台兜底额度时，AI 导入和 OCR 导入不会开箱即用。

## 最短上线方案

1. 准备服务器：优先 2C2G；如果只能 1C1G，先开 2G Swap，并限制 Beta 用户数。
2. 安装 Docker 与 Docker Compose Plugin。
3. 准备代码和配置：

```bash
git pull
cp .env.example .env
```

4. 修改 `.env`，至少替换生产必填项：

```env
APP_URL="https://resume.example.com"
POSTGRES_PASSWORD="<strong-random-password>"
DATABASE_URL="postgresql://postgres:<same-password>@postgres:5432/postgres"
AUTH_SECRET="<openssl rand -hex 32>"
S3_ACCESS_KEY_ID="<strong-random-access-key>"
S3_SECRET_ACCESS_KEY="<strong-random-secret-key>"
REDIS_URL="redis://redis:6379"
ENCRYPTION_SECRET="<openssl rand -hex 32>"
```

5. 上线前本机检查：

```bash
pnpm deploy:check
docker compose -f compose.yml --env-file .env config --quiet
docker compose -f compose.yml up -d --build
docker compose -f compose.yml ps
curl -f http://127.0.0.1:3000/api/health
```

6. 配反向代理：Nginx/Caddy/1Panel 反代 `127.0.0.1:3000`，开启 HTTPS，只开放 `80/443/SSH`。
7. 上线后冒烟：注册/登录、创建简历、保存编辑、模板切换、PDF 导出、JSON 导入、DOCX/PDF 导入失败态、AI/OCR 配置入口、`/api/health`。

## 依赖服务

**必须：PostgreSQL。**  
`DATABASE_URL` 是服务端必填项，应用启动时会连接 Postgres，并在启动检查中自动执行 Drizzle migrations。`compose.yml` 内置 `postgres` 服务和 `postgres_data` 卷。

**生产 Compose 实际依赖：Redis。**  
`compose.yml` 默认启动 `redis`，应用容器等待 Redis 健康后才启动。`REDIS_URL` 主要用于 AI Agent workspace，保存 AI Providers 还需要 `ENCRYPTION_SECRET`。如果未来要做 Postgres-only 极简部署，需要另写 Compose，不是当前 `compose.yml`。

**生产 Compose 实际依赖：S3 兼容存储 SeaweedFS。**  
`compose.yml` 默认启动 `seaweedfs` 和 `seaweedfs_create_bucket`，应用容器等待 bucket 创建完成。`.env.example` 也默认配置 `S3_ENDPOINT=http://seaweedfs:8333`。如果清空所有 `S3_*`，代码支持本地存储，官方 Docker 默认路径是 `/app/data`，当前 Compose 也挂载了 `./data:/app/data`；但当前 Compose 仍会启动 SeaweedFS，所以最短上线建议直接使用内置 SeaweedFS。

**本地存储可作为简化备选，但不适合当前 Compose 的最短路径。**  
本地存储必须确保 `/app/data` 持久化和可写。AI Agent attachments/private objects 要求 S3 兼容存储，本地存储不够。

## 1C1G VPS 风险

1C1G 只能作为低流量试跑，不建议公开 Beta 放量。风险点：

- `APP_MEMORY_LIMIT` 默认 `900m`，再加 Postgres、Redis、SeaweedFS、系统进程，1G 内存余量很小。
- 图片处理、AI/OCR 导入、大文件上传和 PDF 导出同时发生时容易触发 OOM 或长时间卡顿。
- `docs/self-hosting/chinese-resume-beta.md` 已明确建议 2C2G 起步，并给出 1C1G 必须开启 2G Swap 的命令。
- 当前 `FLAG_DISABLE_IMAGE_PROCESSING=false`，低配机器可考虑改为 `true` 降低图片处理压力，但会牺牲相关体验。

上线建议：1C1G 仅邀请制，打开 Swap，限制并发，保留 `restart: unless-stopped`，并持续看 `docker compose logs -f reactive_resume postgres redis seaweedfs`。

## 生产 env 必填项

当前 `.env.example` 覆盖了生产最小项和常见可选项。上线必须确认：

- `APP_URL`：必须是公网 `https://` 域名，不能是 `localhost`。
- `POSTGRES_PASSWORD`：强随机，至少 16 位，且与 `DATABASE_URL` 中密码一致。
- `DATABASE_URL`：Compose 内部 host 用 `postgres`，密码有特殊字符时必须 URL encode。
- `AUTH_SECRET`：至少 32 字符，建议 `openssl rand -hex 32`。
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`：当前 Compose 的 SeaweedFS 必填，不能用示例值。
- `REDIS_URL`：当前 Compose 默认 `redis://redis:6379`。
- `ENCRYPTION_SECRET`：保存 AI Provider 和 Agent 所需，至少 32 字符。

强烈建议同步确认：

- `SMTP_*`：不配置时邮件只输出到服务端日志，公开注册/找回密码体验会受影响。
- `FLAG_DISABLE_SIGNUPS`：公开 Beta 前决定是否允许自由注册。
- `FLAG_TRUST_PROXY_HEADERS`：只有在可信反代/CDN 覆写来源 IP 头时才开启。
- `FLAG_ALLOW_UNSAFE_AI_BASE_URL`：公开多用户站点保持 `false`，避免 SSRF 风险。
- `OCR_PROVIDER` 与 Azure OCR env：公开站点可保持为空，让用户自带 OCR Provider。

仓库还提供 `pnpm deploy:check`，会检查 `.env` 中 HTTPS、本地地址、示例值、密码长度、Postgres 密码一致性等问题。

## AI/OCR 未配置时的用户体验

没有实例级 AI/OCR 兜底时，基础简历创建、编辑、模板切换、JSON 导入、PDF/DOCX 导出仍可用。

受影响的体验：

- PDF 导入：如果没有已测试并启用的 AI Provider，提示“PDF 导入需要一个已测试的 AI Provider，请先到 AI Providers 里配置。”
- Word 导入：如果没有已测试并启用的 AI Provider，提示“Word 导入需要一个已测试的 AI Provider，请先到 AI Providers 里配置。”
- 图片导入：需要已测试 AI Provider 和浏览器侧 OCR Provider；缺 OCR 时提示“图片/扫描件导入需要先到 AI / OCR Providers 配置 OCR Provider。”
- AI Provider 管理：如果 `REDIS_URL` 或 `ENCRYPTION_SECRET` 缺失，设置页会提示 AI Provider 管理不可用。
- AI Agent/JD 派生/AI Patch：依赖已测试并启用的 AI Provider；无可用模型时会阻断或显示中文失败提示。

上线文案需要明确：AI/OCR 是用户自带 Provider 的增强能力，不是平台默认免费额度。用户上传文件和解析文本可能发送到其配置或实例配置的第三方 AI/OCR Provider。

## Docker Compose 启动检查

当前 `compose.yml`：

- 包含 `postgres`、`redis`、`seaweedfs`、`seaweedfs_create_bucket`、`reactive_resume`。
- 只映射应用 `3000:3000`；Postgres、Redis、SeaweedFS 不暴露公网端口。
- 应用容器依赖 Postgres/Redis/SeaweedFS 健康检查和 bucket 创建完成。
- 应用容器使用 `env_file: .env required: true`，生产启动必须存在 `.env`。
- 应用启动时会自动跑数据库 migrations，并验证本地存储目录可写。
- `/api/health` 会检查数据库和存储，反向代理可用它做健康检查。

最短生产命令：

```bash
docker compose -f compose.yml --env-file .env config --quiet
docker compose -f compose.yml up -d --build
docker compose -f compose.yml ps
docker compose -f compose.yml logs -f reactive_resume
```

## MIT 二开署名

当前署名基本足够：

- `README.md` 首段、作品集说明、开源归属都写明基于 Reactive Resume 二次开发。
- `README.md` 包含上游项目、原作者 Amruth Pillai、MIT License 链接。
- 仓库根 `LICENSE` 保留 MIT License 和 Amruth Pillai 版权。
- 页面组件和设置页信息中也保留上游项目和许可证入口。
- 模板来源另有 NOTICE 文件记录 MIT 模板来源。

仍建议上线前人工检查页脚、关于页、邮件模板和公开首页，确保不会暗示这是 Reactive Resume 官方版本，也不要把“基于开源项目二次开发”的说明藏得过深。

## 上线前阻塞项清单

- 真实 `.env` 未完成：阻塞。
- `pnpm deploy:check` 未通过：阻塞。
- `docker compose -f compose.yml --env-file .env config --quiet` 未通过：阻塞。
- 生产域名 HTTPS 和 `APP_URL` 不一致：阻塞。
- `/api/health` 不健康：阻塞。
- 注册/登录、创建简历、PDF 导出未冒烟：阻塞。
- 1C1G 未开 Swap 且要公开放量：阻塞。
- 未告知 AI/OCR 第三方 Provider 数据流向：阻塞公开 Beta。
- README/页面/License 缺少上游 MIT 署名：当前未发现阻塞。

## 本次文档审查摘要

- `.env.example`：覆盖生产启动、Postgres、Auth、SMTP、存储、Redis/AI、OCR、Feature Flags；示例值不能直接生产使用。
- `compose.yml`：适合单机 Compose 最短上线，内置 Postgres/Redis/SeaweedFS，但资源上不适合 1C1G 放量。
- `docs/self-hosting/chinese-resume-beta.md`：已写明 1C1G + Swap、生产 env、OCR、反代和上线前检查。
- `README.md`：部署入口和 MIT 二开署名清楚，足够作为公开仓库说明。
