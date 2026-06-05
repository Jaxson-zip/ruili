# 锐历 Beta 上线前复测报告

复测日期：2026-06-06  
复测分支：`codex/chinese-ai-resume-workbench`  
复测提交：`d37fade3 chore: prepare ruili beta launch checks`  
本地地址：`http://localhost:3000`  
测试账号：`beta.retest.1780679812458@example.com`（本地开发库一次性账号）  

## 结论

可以进入小流量 Beta 继续人工冒烟，但不建议在未补完导入端到端复测前公开放量。

核心创建、编辑、模板切换、真实预览、PDF 导出、DOCX 导出、注册/登录/退出、AI/OCR 设置页提示和 MIT 二开署名均完成本地复测。导入文件的真实上传失败态、单条 AI 润色失败态、JD 派生副本失败态因本地未配置 AI/OCR Provider 及导入弹窗自动化未成功打开，只能确认页面/代码/单测中的前置提示与失败文案，仍建议上线前再做一次人工点测。

## 环境和命令验证

| 检查项 | 结果 | 输出摘要 |
| --- | --- | --- |
| `pnpm.cmd --filter web typecheck` | 通过 | `tsgo --noEmit`，exit 0 |
| `pnpm.cmd --filter server typecheck` | 通过 | `tsgo --noEmit`，exit 0 |
| `pnpm.cmd --filter web test -- src/features/settings/integrations/components/integrations-copy.test.tsx` | 通过 | Vitest 输出 `Test Files 100 passed (100)`、`Tests 481 passed (481)`，exit 0；注意该命令在当前脚本配置下跑了 web 包测试集，而不是单文件限定 |
| `docker compose -f compose.yml --env-file .env.example config --quiet` | 通过 | 无输出，exit 0 |
| `GET http://localhost:3000/api/health` | 通过 | 返回 200，`status: healthy` |
| `GET http://localhost:3001/api/health` | 通过 | 返回 200，`status: healthy` |

备注：复测期间 `git status --short` 已存在大量 `apps/web` 修改和未跟踪文件，视为其他工作者变更；本报告未回滚、未修改 `apps/`、`packages/`、`compose.yml`。

## 逐项复测

### 1. 首页中文化和明显原项目英文残留

- 测试步骤：打开 `http://localhost:3000/`，检查首屏、能力区、模板区、统计区、源码入口和控制台。
- 预期结果：首页主叙事、按钮、模板样张、核心能力为中文；不出现明显 Reactive Resume 英文产品文案残留。
- 实际结果：通过。首页标题为“锐历 - 中文简历生成与优化工作台”，首屏文案、功能卡片和模板名均为中文；可见“GitHub”作为源码入口，属于合理品牌/技术名。控制台未见阻塞错误。
- 是否阻塞上线：否。
- 证据：`http://localhost:3000/`；截图说明：首页首屏显示“一款更懂中文求职的简历工作台”“开始使用”“查看源码”，模板区显示“通用一页 / 标准双栏 / ATS 极简”等中文样张。

### 2. 注册 / 登录 / 退出可用性

- 测试步骤：从已有登录态打开用户菜单退出；进入 `/auth/register` 创建新账号；点击注册后的“继续”；再退出并用新账号登录。
- 预期结果：退出后进入登录页；注册可创建账号；登录可进入工作台。
- 实际结果：通过。退出菜单显示“退出登录”，点击后 URL 到 `/auth/login`；注册提交后显示“你有新邮件！请检查你的电子邮件...此步骤可选”；点击“继续”进入 `/dashboard/resumes`；干净新标签页用新账号登录成功。
- 是否阻塞上线：否。
- 证据：`http://localhost:3000/auth/register`、`http://localhost:3000/auth/login`、`http://localhost:3000/dashboard/resumes`；本地 API 登录返回 200 和 session token。

### 3. 创建简历

- 测试步骤：在工作台点击“从成品模板开始”，选择“前端工程师成品样张”。
- 预期结果：创建成功并进入编辑器，带中文样张内容。
- 实际结果：通过。进入 `http://localhost:3000/builder/019e98cc-d9e2-71e7-97a5-52ae81574a54`，页面提示“模板简历已创建”，编辑器包含基础、工作经历、教育经历、项目、技能等中文模块。
- 是否阻塞上线：否。
- 证据：builder URL；页面文本包含“前端开发-中文投递版”“工作经历”“项目”“导出”。

### 4. 编辑基础信息、工作经历、项目经历

- 测试步骤：在 builder 左侧编辑基础信息姓名；切到工作经历模块修改字段；切到项目模块修改字段。
- 预期结果：字段可编辑，页面状态保留修改内容，不白屏。
- 实际结果：通过。姓名输入框值改为“Beta 复测工程师”；工作经历列表出现“锐历 Beta 复测公司”；项目经历列表出现“Beta 复测项目经历”。
- 是否阻塞上线：否。
- 证据：`http://localhost:3000/builder/019e98cc-d9e2-71e7-97a5-52ae81574a54`；页面文本摘要包含“字节跳动 / 锐历 Beta 复测公司”和“企业级组件库建设 / Beta 复测项目经历”。

### 5. 模板切换

- 测试步骤：在右侧“模板”面板点击“更换模板”，从“标准双栏”切到“通用一页”。
- 预期结果：模板说明和预览更新，正文内容不被替换。
- 实际结果：通过。右侧模板说明变为“通用一页”，预览从双栏变为单栏一页样式；工作经历和项目经历的已编辑文本仍保留。
- 是否阻塞上线：否。
- 证据：builder URL；截图说明：右侧面板显示“通用一页”，预览顶部显示“Beta 复测工程师”，正文仍含已编辑经历。

### 6. 工作台真实简历预览

- 测试步骤：创建简历后返回工作台，检查简历卡片是否展示真实简历，而非空占位。
- 预期结果：工作台展示真实简历卡片和最近更新时间。
- 实际结果：基本通过。工作台显示“前端开发-中文投递版 / 最后更新于 2026年6月6日 01:22”。本次没有进一步截取卡片缩略图像素，但 builder 内真实 canvas 预览已确认。
- 是否阻塞上线：否。
- 证据：`http://localhost:3000/dashboard/resumes`；页面文本包含简历标题和更新时间。

### 7. PDF 导出

- 测试步骤：用独立 Chromium 登录，打开 builder，点击精确 PDF 导出卡片。
- 预期结果：触发 PDF 下载，文件非空。
- 实际结果：通过。下载文件 `worldwide-gray-krill.pdf`，大小 197,783 bytes。Codex in-app Browser 不支持 download 事件，改用本机 Playwright Chromium 验证。
- 是否阻塞上线：否。
- 证据：命令输出 `PDF_CANDIDATES=[{"i":240,"text":"PDF..."}]`，下载摘要 `{ "filename": "worldwide-gray-krill.pdf", "bytes": 197783 }`。

### 8. Word / DOCX 导出

- 测试步骤：用独立 Chromium 登录，打开 builder，点击 DOCX 导出卡片。
- 预期结果：触发 DOCX 下载，文件非空。
- 实际结果：通过。下载文件 `communist-plum-mouse.docx`，大小 11,132 bytes。另一次误点 PDF 文案中“以 PDF 为准”的 DOCX 卡片，也下载了 `blonde-tomato-swift.docx`，大小 11,137 bytes。
- 是否阻塞上线：否。
- 证据：命令输出 `{ "docx": { "count": 1, "filename": "communist-plum-mouse.docx", "bytes": 11132 } }`。

### 9. JSON / PDF / DOCX / 图片导入提示和失败态

- 测试步骤：在工作台查看“导入已有简历”入口；尝试自动化打开导入弹窗；用指定测试命令覆盖导入提示单测；静态核对导入失败文案。
- 预期结果：JSON 可直接导入；PDF / Word 缺 AI Provider 时清晰阻断；图片缺 AI/OCR 时清晰阻断；坏文件失败态不长时间卡住。
- 实际结果：部分通过，仍需人工复测。工作台入口“导入已有简历 / 继续编辑已有版本”可见，但该卡片未暴露为 button，自动化坐标点击未成功打开弹窗；一次坏文件上传脚本超时，未能取得真实失败 toast。代码和测试覆盖显示前置提示存在：`PDF、Word 和图片导入需要 LLM...`、`PDF 导入需要一个已测试的 AI 模型服务商...`、`Word 导入需要一个已测试的 AI 模型服务商...`、`图片导入需要一个已测试的 AI 模型服务商...`、`图片导入还需要 OCR Provider`。
- 是否阻塞上线：是，针对公开放量；否，针对受控小流量 Beta 且人工补测通过后。
- 证据：`pnpm.cmd --filter web test -- src/features/settings/integrations/components/integrations-copy.test.tsx` 通过；`rg` 摘要命中 `apps/web/src/dialogs/resume/import.tsx` 和 `apps/web/src/dialogs/resume/import-file.ts` 的中文失败文案。

### 10. AI Provider 未配置提示

- 测试步骤：新账号不添加 AI 服务商，打开 builder 右侧 AI 分析区和设置页。
- 预期结果：AI 相关能力明确提示需要先配置并测试 AI Provider。
- 实际结果：通过。builder 显示“配置 AI 模型服务商后，可以生成中文简历分析...”和“打开 AI 服务商”；设置页显示“未配置已测试的服务商”“添加 AI 服务商”“保存 AI 服务商”，并提示“添加并测试一个 AI 模型后，才能使用简历解析、JD 匹配和 AI Patch。”
- 是否阻塞上线：否。
- 证据：`http://localhost:3000/dashboard/settings/integrations`；页面文本包含上述提示。

### 11. OCR Provider 未配置提示

- 测试步骤：打开 AI/OCR 设置页，不填写 OCR。
- 预期结果：OCR 区域说明用途，显示未配置状态和保存入口。
- 实际结果：通过。设置页显示“OCR 服务商 / Azure Document Intelligence”“用于图片简历和扫描版 PDF 识别。Key 仅保存在当前浏览器...”“未配置 OCR 服务商”“保存 OCR 服务商”。
- 是否阻塞上线：否。
- 证据：`http://localhost:3000/dashboard/settings/integrations` 页面文本。

### 12. 单条 AI 润色入口和失败态

- 测试步骤：检查 builder 内工作经历 / 项目经历编辑入口和相关按钮；静态核对 AI 润色组件文案。
- 预期结果：单条经历存在“AI 润色”入口；未配置 AI 时失败态清晰，不丢失原文。
- 实际结果：部分通过。左侧工作经历和项目经历条目可打开编辑；静态核对存在 `AI 润色`、`正在润色这段经历...`、`AI 润色失败`、`AI 润色已写入描述`。本次浏览器自动化未成功打开单条编辑弹窗中的润色按钮，未实际触发失败 toast。
- 是否阻塞上线：建议作为 Beta 人工补测项，不阻塞小流量上线。
- 证据：`rg` 命中 `apps/web/src/dialogs/resume/sections/ai-polish-action.tsx` 和 `ai-polish-action.test.tsx`；builder 页面可见工作经历/项目经历编辑条目。

### 13. JD 派生副本入口和失败态

- 测试步骤：检查工作台和相关实现文案。
- 预期结果：已有简历可发起 JD 派生；未配置 LLM 时清晰提示。
- 实际结果：部分通过。实现中存在失败提示“JD 派生需要 LLM。请先到设置里添加并测试一个 AI Provider。”；本次自动化没有成功打开简历卡片的更多操作菜单，未实际触发 JD 派生失败态。
- 是否阻塞上线：建议作为 Beta 人工补测项，不阻塞小流量上线。
- 证据：`rg` 命中 `apps/web/src/dialogs/resume/derive-with-job.tsx:123`；工作台已有简历卡片存在。

### 14. 设置页 AI/OCR 中文化

- 测试步骤：打开 `/dashboard/settings/integrations`。
- 预期结果：AI/OCR 设置页主要说明、按钮和状态为中文。
- 实际结果：通过。页面标题为“AI / OCR 服务商”，主要按钮为“添加 AI 服务商”“保存 AI 服务商”“保存 OCR 服务商”，状态提示为“未配置已测试的服务商”“未配置 OCR 服务商”。保留 `API Key`、`Base URL`、`DeepSeek / Doubao / Qwen / Kimi / OpenAI` 等行业名词合理。
- 是否阻塞上线：否。
- 证据：`http://localhost:3000/dashboard/settings/integrations` 页面文本。

### 15. MIT 二开署名、原作者和原项目链接是否保留

- 测试步骤：检查 README、首页 / 工作台侧栏 / builder 信息区。
- 预期结果：明确说明基于 Reactive Resume 二次开发，保留原作者 Amruth Pillai、原项目链接和 MIT License 链接。
- 实际结果：通过。README 首段和开源归属区说明锐历基于 Reactive Resume 二次开发；工作台侧栏和 builder 信息区显示“锐历是基于 Reactive Resume 二次开发的中文简历产品改造，原项目作者为 Amruth Pillai。上游项目遵循 MIT 许可证...”；链接保留到上游项目、作者主页和 MIT License。
- 是否阻塞上线：否。
- 证据：`README.md`；`http://localhost:3000/dashboard/resumes`；builder 信息区。

### 16. 控制台和本地服务异常

- 测试步骤：复测过程中收集浏览器和本地日志。
- 预期结果：无阻塞前端错误；本地服务健康。
- 实际结果：基本通过但有低风险噪声。浏览器控制台多次出现 `Messages for locale "zh-CN" not loaded.`，开发模式还出现过 `Buffer is not defined` warning；未阻止首页、登录、工作台、builder、导出。`server.err.log` 里存在较早的 Drizzle migration `relation "resume_target" already exists` 错误，但当前 `/api/health` 为 healthy，复测期间核心链路可用。
- 是否阻塞上线：否，但建议清理开发环境迁移状态和 i18n warning。
- 证据：浏览器日志摘要；`GET /api/health` 200 healthy；`server.err.log` tail。

## 上线前建议

1. 人工补测导入弹窗：分别上传合法 JSON、坏 JSON、PDF、DOCX、PNG/JPG，在无 AI/OCR Provider 下确认 toast 和跳转设置入口。
2. 人工补测单条 AI 润色和 JD 派生：在无 Provider 下触发失败态；在至少一个已测试 AI Provider 下验证成功回填/派生副本。
3. 修一下工作台“从成品模板开始 / 导入已有简历”卡片的可访问性语义，建议暴露为 button 或 link，自动化和键盘用户都会更稳。
4. 处理或确认 `Messages for locale "zh-CN" not loaded.` warning 是否只影响开发环境。
