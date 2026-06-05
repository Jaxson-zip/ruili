# 锐历 2026-06-06 上线阻塞清单

检查日期：2026-06-06  
范围：`docs/superpowers/reviews/deploy-checklist-2026-06-06.md`、`docs/superpowers/reviews/beta-acceptance-checklist.md`、`docs/superpowers/reviews/gemini-beta-readiness.md`、`docs/self-hosting/chinese-resume-beta.md`、`README.md`、`compose.yml`、`.env.example`。  
限制：本清单只判断今天是否能小流量 Beta 上线，不代表已经完成公网部署或端到端验收。

## 结论

**今天可以做小流量、邀请制 Beta 条件上线；不能直接公开放量。**

可以上线的前提是：生产 `.env` 已替换示例值、真实 HTTPS 域名已绑定、Docker Compose 配置通过、`/api/health` 健康、注册/登录/创建简历/模板切换/PDF 导出完成线上冒烟。若上述任一项缺失，今天不应上线。

AI/OCR、DOCX 高保真、更多模板审美和国内 OCR 生态不是今天的小流量 Beta P0。它们影响转化和体验，但不应阻止一个明确告知能力边界、限制流量、主推 PDF 交付的 Beta。

## P0 真阻塞：不解决就不能上线

1. **没有真实生产 `.env`，或仍使用 `.env.example` 示例值。**
   `.env.example` 中 `APP_URL=http://localhost:3000`、`change-me-*`、示例 S3 密钥和弱 Postgres 密码都不能用于生产。生产必须替换 `APP_URL`、`POSTGRES_PASSWORD`、`DATABASE_URL`、`AUTH_SECRET`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`ENCRYPTION_SECRET`。

2. **生产域名、HTTPS 与 `APP_URL` 未闭环。**
   `APP_URL` 必须是公网 `https://` 域名，且反代必须正确保留 `Host` 与 `X-Forwarded-Proto`。否则登录回调、绝对上传 URL、OpenGraph 和安全上下文都可能出错。

3. **Docker Compose 配置或启动健康检查未通过。**
   `compose.yml` 的最短路径依赖 Postgres、Redis、SeaweedFS、SeaweedFS bucket 创建和应用健康检查。`docker compose -f compose.yml --env-file .env config --quiet`、`docker compose up -d --build`、`docker compose ps`、`curl -f http://127.0.0.1:3000/api/health` 必须通过。

4. **核心产品链路未完成线上冒烟。**
   至少要在生产域名上通过注册/登录、创建简历、保存编辑、模板切换、PDF 导出。验收清单明确这些是 Blocker；PDF 是核心求职交付物，失败则产品工具属性不成立。

5. **数据持久化和备份策略未确认。**
   Compose 使用 `postgres_data`、`redis_data`、`seaweedfs_data` 卷，并挂载 `./data:/app/data`。上线前必须确认数据库和上传对象的备份/恢复方式，至少有首次备份命令和回滚预案。

6. **1C1G 机器未开启 Swap 却计划公开放量。**
   文档已说明 1C1G 只能低流量试跑。PDF 导出、图片处理、AI/OCR 同时发生容易 OOM。若只有 1C1G，必须先开约 2G Swap，并采用邀请制和并发限制。

7. **未告知 AI/OCR 第三方 Provider 数据流向却公开 Beta。**
   上传文件和解析文本可能发送给用户配置或实例配置的第三方 AI/OCR Provider。公开 Beta 页面或上线说明必须明确这一点，否则不应公开引流。

## P1 上线当天必须人工兜底/限制

1. **限制注册和流量。**
   建议邀请制或小范围白名单。若无法做白名单，至少人工控制传播面，并准备把 `FLAG_DISABLE_SIGNUPS=true` 作为当天止血开关。

2. **人工监控日志和健康状态。**
   上线当天持续观察 `docker compose logs -f reactive_resume postgres redis seaweedfs`、`docker compose ps`、磁盘、内存和重启次数。PDF 导出异常、健康检查失败、SeaweedFS bucket 异常要立即暂停放量。

3. **SMTP 缺失时人工兜底。**
   `.env.example` 说明 SMTP 不完整时邮件会输出到服务端日志。若上线当天不配 SMTP，需要人工确认注册/验证/找回密码路径不会卡死，并准备从日志辅助用户。

4. **AI/OCR 能力边界要讲清楚。**
   没有平台兜底额度时，PDF/DOCX/图片导入、AI 润色、JD 派生都依赖用户或部署方配置可用 Provider。上线当天文案应明确“自带 Provider 的增强能力”，不要承诺开箱即用。

5. **AI/OCR 失败态必须复测。**
   验收清单显示 AI Provider 未配置、OCR Provider 未配置、单条 AI 润色、JD 派生副本、工作台真实预览均是“已修复，待复测”。小流量可上线，但当天必须手工确认失败提示清晰、不会白屏、不会长时间 Pending。

6. **1C1G 或低配 VPS 限制并发 PDF 导出。**
   低配机器当天不要做并发压测式放量。至少连续导出 3 次 PDF，观察内存、耗时、重启恢复。

7. **开源署名上线前人工扫一遍。**
   README 和 License 当前足够，但仍需人工检查公开首页、页脚、关于页、邮件模板，避免暗示这是 Reactive Resume 官方版本。

## P2 Beta 后优化

1. **DOCX 高保真导出。**
   当前 DOCX 可接受流式文字保底，复杂双栏模板不应作为 P0。Beta 后可在导出入口增加提示，长期再优化 Word 排版引擎。

2. **国内 OCR Provider。**
   Azure/浏览器本地 OCR 配置门槛较高，但更多国内 OCR 接入不是今天 P0。Beta 后可接入阿里云、百度 AI 或多模态 LLM 直读图片。

3. **平台级免费 LLM/OCR 额度。**
   这会显著降低首用门槛，但当前可作为用户自带 Provider 的增强能力上线。

4. **模板视觉继续打磨。**
   “模板还可以更美”不是 P0。Beta 先保证编辑、保存、预览、PDF 导出稳定。

5. **JD 派生和 AI 润色边界增强。**
   Beta 后继续覆盖长 JD、空 JD、重复点击、LLM 超时、字段回填准确性和生成质量。

6. **资源隔离和压测。**
   Beta 后补齐 1C1G/2C2G 下 PDF 导出、上传、AI/OCR 并发压测数据，并据此调 `APP_MEMORY_LIMIT`、`APP_SHM_SIZE` 和限流策略。

## 最短上线路径

### VPS

1. 优先准备 2C2G Linux VPS，Debian 12 或 Ubuntu 22.04+。
2. 如果只能 1C1G，先开启 2G Swap：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

3. 防火墙只开放 `80/443/SSH`，应用端口 `3000` 仅给本机反代访问。

### Docker

1. 安装 Docker 和 Docker Compose Plugin。
2. 拉取代码并准备生产配置：

```bash
git pull
cp .env.example .env
```

3. 修改 `.env`，替换所有生产必填项和示例值。
4. 启动前检查：

```bash
docker compose -f compose.yml --env-file .env config --quiet
docker compose -f compose.yml up -d --build
docker compose -f compose.yml ps
```

### 域名

1. 准备真实域名，例如 `resume.example.com`。
2. DNS A/AAAA 记录指向 VPS。
3. `.env` 中设置：

```env
APP_URL="https://resume.example.com"
```

### HTTPS

1. 用 Caddy、Nginx 或 1Panel 反代到 `127.0.0.1:3000`。
2. 开启 HTTPS。
3. 确认反代保留 `Host`、`X-Forwarded-Proto`。
4. 多用户公开站点保持：

```env
FLAG_TRUST_PROXY_HEADERS="false"
FLAG_ALLOW_UNSAFE_AI_BASE_URL="false"
FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI="false"
```

只有在可信代理/CDN 覆写来源 IP 头时，再考虑打开 `FLAG_TRUST_PROXY_HEADERS`。

### env

生产至少确认：

```env
APP_URL="https://resume.example.com"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="<strong-random-password>"
DATABASE_URL="postgresql://postgres:<url-encoded-password>@postgres:5432/postgres"
AUTH_SECRET="<openssl rand -hex 32>"
S3_ACCESS_KEY_ID="<strong-random-access-key>"
S3_SECRET_ACCESS_KEY="<strong-random-secret-key>"
S3_ENDPOINT="http://seaweedfs:8333"
S3_BUCKET="reactive-resume"
REDIS_URL="redis://redis:6379"
ENCRYPTION_SECRET="<openssl rand -hex 32>"
```

建议同步确认 `SMTP_*`、`FLAG_DISABLE_SIGNUPS`、`OCR_PROVIDER` 和 Azure OCR 相关 env 是否留空或配置。

### 备份

1. Postgres：备份 `postgres_data`，并准备 `pg_dump` 方案。
2. SeaweedFS：备份 `seaweedfs_data`，这是 S3 兼容上传对象的主要存储。
3. 本地数据：备份 `./data`，避免本地存储或缓存文件丢失。
4. Redis：备份 `redis_data` 可选，但上线当天至少要知道 Redis 丢失会影响哪些 AI Agent/stream 状态。
5. 首次上线前做一次冷备份；正式邀请用户前再做一次。

### 冒烟验证步骤

1. `docker compose -f compose.yml ps` 确认服务健康。
2. `curl -f http://127.0.0.1:3000/api/health` 本机健康检查通过。
3. 访问生产 HTTPS 域名，确认无证书错误。
4. 注册新账号并登录。
5. 创建一份简历，填写基础信息、工作经历、教育经历。
6. 切换至少两款模板，确认数据不丢失、预览不白屏。
7. 导出 PDF，确认文件非空、中文不乱码、排版与预览一致。
8. 测试 DOCX 导出，接受复杂模板降级但确认基础文字完整。
9. 在未配置 AI/OCR 时测试 PDF/DOCX/图片导入失败态，确认提示清晰并指向配置入口。
10. 如配置了真实 Provider，再测试 PDF/DOCX/图片导入和单条 AI 润色。
11. 检查公开页面和说明中的 AI/OCR 数据流向、开源署名和 Beta 限制说明。

## 需要用户提供的生产配置清单

- 生产域名：最终 `APP_URL`。
- VPS 规格：CPU、内存、磁盘、系统版本，是否 1C1G，是否允许开启 Swap。
- DNS 管理权限：A/AAAA 记录配置方式。
- HTTPS/反代方案：Caddy、Nginx、1Panel 或其他网关。
- 生产 `.env` 的强随机值：`POSTGRES_PASSWORD`、`AUTH_SECRET`、`ENCRYPTION_SECRET`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`。
- SMTP 配置：`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM`、`SMTP_SECURE`，或确认上线当天只用日志兜底。
- 注册策略：开放注册、邀请制，或 `FLAG_DISABLE_SIGNUPS=true`。
- OAuth 配置：Google/GitHub/LinkedIn/自定义 OAuth 是否启用。
- AI Provider 策略：平台是否提供兜底 LLM，还是完全由用户自带 Provider。
- OCR Provider 策略：是否配置实例级 Azure OCR，还是完全由用户在浏览器侧自配。
- 备份策略：备份目录、频率、保留周期、恢复负责人。
- 监控和应急联系人：上线当天谁看日志、谁能停注册、谁能回滚。

## 今天上线判定

**Go / No-Go 判定：条件 Go。**

满足以下条件即可小流量 Beta：

- 真实生产 `.env` 完成并通过部署检查。
- HTTPS 域名可访问且与 `APP_URL` 一致。
- Compose 启动和 `/api/health` 通过。
- 注册/登录、创建简历、模板切换、PDF 导出线上冒烟通过。
- 备份已做，低配机器已开 Swap。
- 上线说明明确 AI/OCR 依赖第三方 Provider，不承诺免费开箱即用。
- Beta 采用邀请制或人工限流。

任一条件不满足则 **No-Go**，先补 P0，不要用“模板还可以更美”“以后接国内 OCR”“DOCX 还不够高保真”这类 P2 项掩盖真正上线风险。
