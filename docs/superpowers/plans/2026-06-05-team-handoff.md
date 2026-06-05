# 中文简历 Beta 协作交接

当前集成分支：`codex/chinese-ai-resume-workbench`

这份文档给外部队友或新开的 Codex 线程使用。目标是并行推进到可上线 Beta，同时避免多人改同一批文件导致冲突。

## 先同步

在当前工作做成 checkpoint commit 或推到远端分支之前，队友不要从旧 `main` 直接开工。现在本地有大量未提交二开改动，旧分支会缺中文化、模板、AI 导入、安全基线等上下文。

推荐流程：

```bash
git fetch origin
git switch codex/chinese-ai-resume-workbench
git pull --ff-only
git switch -c feat/<your-task-name>
pnpm.cmd install
```

如果远端还没有 `codex/chinese-ai-resume-workbench`，先等 checkpoint，或者让队友在当前本地工作区开新线程读取上下文，但不要覆盖已有改动。

## 通用规则

- 不要执行 `git reset --hard`、`git checkout -- .`、批量格式化全仓。
- 每个队友只改自己负责的文件范围。
- 新增功能必须带最小测试或烟测脚本。
- UI 文案默认简体中文；品牌名保留英文，例如 `Gemini`、`OpenAI`、`DeepSeek`、`Doubao`。
- 商业/VIP 简历模板不能直接复制进项目；只能做原创模板，参考通用排版规律。

## A：模板库与首页展示

分支：`feat/template-library-polish`

只改：

- `apps/web/src/dialogs/resume/template/**`
- `apps/web/src/routes/_home/-sections/templates.tsx`
- `apps/web/public/templates/**`
- `packages/schema/src/resume/starters.ts`
- `packages/pdf/src/templates/**`
- `tooling/verify-homepage-templates.mjs`
- `tooling/verify-template-starter.mjs`

目标：

- 默认只露出 6-8 个真实稳定模板，后续扩到 12-20 个。
- 首页滚动展示和站内模板库使用同一批精选模板。
- 不让用户选到“缩略图很好看但实际 PDF 只是配色近似”的模板。
- 导入简历后切换模板，内容不能被系统样例覆盖。

验收：

```bash
pnpm.cmd --filter web test -- template gallery templates
pnpm.cmd --filter @reactive-resume/schema test -- starters
node tooling\verify-homepage-templates.mjs
node tooling\verify-template-starter.mjs
```

## B：AI 简历优化闭环

分支：`feat/ai-optimization-loop`

只改：

- `packages/ai/src/prompts/**`
- `packages/ai/src/tools/patch-proposal.ts`
- `apps/web/src/features/resume/workbench/**`
- `apps/web/src/routes/builder/$resumeId/-sidebar/right/sections/resume-analysis.tsx`

目标：

- AI 分析、建议、改写结果全部中文。
- 支持输入岗位目标/JD。
- AI 只给建议和可应用改动，不能静默覆盖整份简历。
- 外层 AI 助手偏问答/规划，编辑器内 AI 偏对当前简历做结构化修改。

验收：

```bash
pnpm.cmd --filter @reactive-resume/ai test
pnpm.cmd --filter web test -- ai-review workbench resume-analysis
pnpm.cmd --filter web typecheck
```

## C：导入 DOCX/PDF/图片与 OCR

分支：`feat/import-ocr-providers`

只改：

- `packages/api/src/features/ai/docx-text.ts`
- `packages/api/src/features/ai/pdf-text.ts`
- `packages/api/src/features/ai/ocr.ts`
- `packages/api/src/features/ai/service.ts`
- `packages/api/src/features/ai/router.ts`
- `apps/web/src/dialogs/resume/import.tsx`
- `apps/web/src/dialogs/resume/import-file.ts`
- `packages/env/src/server.ts`

目标：

- DOCX/PDF 先本地提取文字，提取不到或过短再走 OCR。
- 图片/扫描件走云 OCR，再交给大模型结构化。
- 后续可接入国内 OCR：火山引擎、腾讯云、百度智能云、阿里云。
- 失败时给中文错误，不暴露 provider stack trace。

验收：

```bash
pnpm.cmd --filter @reactive-resume/api test -- docx-text pdf-text ocr service file-input
pnpm.cmd --filter web test -- import
pnpm.cmd --filter @reactive-resume/api typecheck
```

## D：部署与安全

分支：`feat/vps-deploy-security`

只改：

- `.env.example`
- `compose.yml`
- `docs/self-hosting/**`
- `README.md`
- `packages/env/src/**`
- `packages/api/src/middleware/rate-limit/**`
- `packages/utils/src/rate-limit.ts`

目标：

- Docker Compose 可用于 Linux VPS/1Panel/宝塔 Docker 场景。
- 生产环境必须使用强密钥，不能默认暴露 Postgres/S3。
- 默认不信任 `X-Forwarded-For` 等代理头，只有显式开启才使用。
- 文档写清楚 MIT 二开署名、上游链接、VPS 配置、备份、HTTPS、环境变量。

验收：

```bash
pnpm.cmd --filter @reactive-resume/env test
pnpm.cmd --filter @reactive-resume/env typecheck
pnpm.cmd --filter @reactive-resume/api typecheck
docker compose config
```

## E：人工验收

适合不写代码的小伙伴。

流程：

- 登录测试账号。
- 创建空白简历。
- 导入 DOCX。
- 导入普通 PDF。
- 切换模板。
- 修改一段文字。
- 运行 AI 分析。
- 导出 PDF。

记录格式：

```text
页面：
操作：
期望：
实际：
截图：
严重程度：P0/P1/P2/P3
```

优先级：

- P0：无法登录、无法创建、无法导出、导入后内容丢失、安全问题。
- P1：模板明显错位、中文乱码、AI 结果不可用。
- P2：排版丑、按钮挤、文案不清楚。
- P3：细节体验优化。

## 我这边继续推进

我优先做不依赖审美反复确认的部分：

1. 限流和可信代理头安全修复。
2. 导入链路的错误提示和文件校验。
3. 模板切换时不覆盖用户导入内容。
4. 首页和模板库只展示精选模板。
5. 最后跑类型检查、单元测试、浏览器烟测。

