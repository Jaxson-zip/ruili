# Gemini 下一步任务书

> 目标：Gemini 继续做 Beta 上线前的只读 QA、文档更新和竞品复核；不要修改 `apps/`、`packages/`、`compose.yml` 的核心业务代码。  
> 当前基准提交：`ebc377b7 feat: derive resume copies from job descriptions`

## 1. 更新已过期 QA 结论

请重新阅读并更新：

- `docs/superpowers/reviews/gemini-beta-readiness.md`
- `docs/superpowers/reviews/beta-acceptance-checklist.md`

这些项已经有代码实现或产品提示，不能继续写成“缺失”：

- 单条工作经历 / 项目经历的 `AI 润色`
- 导入 PDF / Word / 图片时的 AI Provider / OCR Provider 阻断提示
- Dashboard 简历卡片菜单里的 `结合 JD 派生副本`
- PDF 导出的小内存 VPS 风险提示和 Docker 内存配置

请把它们改成：

- `已修复，待人工复测`
- 或 `已部分修复，剩余风险如下`

不要简单删除风险，要保留真实边界，例如：JD 派生仍依赖用户自己配置可用 LLM，DOCX 仍不是高保真 Word 排版引擎。

## 2. 做一次 Beta 验收复测清单

基于最新代码，输出一份复测结果到：

`docs/superpowers/reviews/beta-retest-2026-06-06.md`

至少覆盖：

- 注册 / 登录 / 退出
- 创建简历
- 编辑基础信息、工作经历、项目经历
- 模板切换
- PDF 导出
- Word / DOCX 导出
- JSON / PDF / DOCX / 图片导入的可用性和失败提示
- AI Provider 未配置时的阻断提示
- 单条 AI 润色按钮是否可见，失败态是否中文可读
- JD 派生副本入口是否可见，缺少模型时是否阻断
- 工作台中间区域是否是真实简历预览，不再是占位文案

复测时请明确写：

- 测试账号 / 环境
- 是否需要 Postgres / Redis / Docker
- 复现步骤
- 期望结果
- 实际结果
- 是否阻塞 Beta 上线

## 3. 对比 OrtonY/smart-resume 的当前差距

请重新对比 `OrtonY/smart-resume`，只输出产品差距，不做代码修改。

重点看：

- 首页样张 / 模板观感
- AI 改写流程
- JD 匹配流程
- 导出能力
- 部署门槛
- 中文求职场景适配

输出到：

`docs/superpowers/reviews/smart-resume-gap-2026-06-06.md`

结论要按 `P0 / P1 / P2` 分级，并标注哪些是“上线前必须做”，哪些可以 Beta 后做。

## 4. 部署前检查

请基于当前仓库更新一份部署核对表，不要真的部署。

输出到：

`docs/superpowers/reviews/deploy-checklist-2026-06-06.md`

至少检查：

- `.env.example` 是否覆盖必须项
- `compose.yml` 是否能 `docker compose config`
- 1C1G VPS 风险和 Swap 提醒是否明确
- 数据库迁移路径是否清楚
- `APP_URL`、`AUTH_SECRET`、`DATABASE_URL`、`REDIS_URL`、`ENCRYPTION_SECRET` 是否有生产配置说明
- AI Provider / OCR Provider 在没有平台兜底额度时，用户会看到什么
- MIT 二开署名和原项目链接是否在 README / 页面 / License 说明里足够清楚

## 5. 不要做的事

- 不要改 `apps/`、`packages/`、`compose.yml` 的业务代码。
- 不要改数据库 schema。
- 不要重写 README 大段内容，只能提出建议或小范围文档补丁。
- 不要声称“可上线”，除非完成复测并列出证据。
- 不要把 MIT 署名从页面、README 或 License 说明中删掉。
