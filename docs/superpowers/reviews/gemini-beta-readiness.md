# 锐历 (Ruili) Beta 上线前 QA 与竞品分析报告

> 对标竞品：OrtonY/smart-resume

## 重点功能状态检查

- **注册登录**：已实现（基础邮箱/密码/OAuth 等），但需确认生产环境下是否有顺畅的兜底方案以防邮件推送链路失败。
- **简历创建**：已实现，基础编辑器及数据结构可用。
- **模板切换**：已实现，支持多种开源/定制模板实时预览与切换。
- **PDF/DOCX 导出**：均已实现。但 DOCX 导出会因为流式 HTML 转换丢失复杂双栏排版布局。
- **PDF/DOCX/图片导入**：已实现，重度依赖外部 AI/OCR Providers，解析流程基本跑通。
- **AI Provider 配置**：已实现，支持用户端配置与环境变量服务端兜底。
- **OCR 配置**：已实现，目前仅支持 Azure 方案，且密钥临时储存于浏览器本地。
- **部署 env**：文档（`chinese-resume-beta.md`）基本闭环，`compose.yml` 提供了详细组件编排。

---

## 缺口清单与建议

### 【P0 级】严重影响核心体验或产品定位

#### 1. 缺乏单条经历的 AI 深度润色与 JD 匹配
* **复现步骤**：
  1. 进入编辑器页面。
  2. 新增或编辑某一段工作经历/项目经历。
  3. 寻找“AI 一键润色”、“扩写”或“结合 JD 优化”的按钮，发现缺失。
* **影响**：OrtonY/smart-resume 的核心护城河是“写”，而锐历目前的主要 AI 落地依然在“解析导入”环节。这导致用户最终仍需手工完成大量文字润色，未能解决“不想写简历”的核心痛点，缺乏竞争优势。
* **建议修复位置**：`apps/web/src/routes/builder/$resumeId/` 相关的表单组件内增加 AI 润色动作，并在 `@reactive-resume/api` 的 AI Router 中增加专门用于字段润色和扩写的 Prompt 与接口。

#### 2. AI/OCR Provider 的强阻断与配置门槛过高
* **复现步骤**：
  1. 首次注册/登录新账号。
  2. 在 Dashboard 直接点击导入，选择图片或 DOCX 文件。
  3. 系统因为未能检测到配置好的 AI Provider 或 OCR，直接弹出报错，要求用户中断流程跳去设置页配置。
* **影响**：相比于竞品开箱即用的体验，强阻断极大地增加了新用户的流失率。另外，OCR 配置目前仅储存在浏览器本地（Storage key: `ruili.browser-ocr-provider`），意味着用户跨设备使用时需要重新寻找并配置 API Key。
* **建议修复位置**：
  1. `apps/web/src/dialogs/resume/import.tsx` 的导入流程中，如果未配置，可在对话框内提供更平滑的引导，或提供平台的免费公用额度兜底。
  2. 将 OCR Provider 配置迁移到后端用户数据库（`packages/schema`）统一管理，实现多端漫游。

### 【P1 级】影响进阶体验和部分转化

#### 3. 缺乏多岗位版本管理与 JD 派生能力
* **复现步骤**：
  1. 在 Dashboard 拥有一份满意的“基础版简历”。
  2. 尝试基于这份简历和某家公司的 JD，生成一份高度定制的新简历版本，发现只能手工点击“复制”后逐行改写。
* **影响**：无法满足求职者“海投不同岗位”需微调关键字的刚需。竞品通常支持基于 JD 自动派生版本，而我们只有最基础的复制粘贴，版本管理较原始。
* **建议修复位置**：在 `apps/web/src/routes/dashboard/` 的简历卡片操作菜单中，新增“结合 JD 派生副本”的独立工作流组件。

#### 4. 小内存 VPS 部署下的 PDF 导出稳定性风险
* **复现步骤**：
  1. 按照 `chinese-resume-beta.md` 提及的最低配置（1核1G）启动单机 Docker 服务。
  2. 多人（或压测）同时点击导出 PDF。
* **影响**：PDF 导出依赖无头浏览器（Puppeteer/Playwright），极度消耗内存。在小内存实例下频繁导出容易触发 OOM 导致 Node.js 进程崩溃或一直 Pending。
* **建议修复位置**：在部署文档 `docs/self-hosting/chinese-resume-beta.md` 中增加开启 Swap 交换分区的强制提醒。并在 `compose.yml` 的 PDF 服务节点添加内存上限与重启策略策略。

### 【P2 级】体验瑕疵，可在 Beta 后迭代

#### 5. DOCX 导出的排版保真度存在上限
* **复现步骤**：
  1. 在编辑器中切换到一个左右双栏分布的复杂模板。
  2. 导出为 DOCX。
  3. 在 Office Word 中打开，发现原本的双栏变成了单栏的流式排版，且存在局部样式错位。
* **影响**：`packages/docx/src/builder.ts` 是基于 HTML to DOCX 进行的流式内容构建。求职者下载 DOCX 往往为了微调格式，如果保真度过低，将打击用户导出此格式的积极性。
* **建议修复位置**：在 DOCX 导出操作点（例如 `apps/web/src/routes/dashboard/resumes/index.tsx` 附近）增加产品提示词：“复杂模板导出的 DOCX 为流式纯文本结构，如需完美保留排版样式，请使用 PDF 导出”。

#### 6. OCR Provider 渠道单一且局限于 Azure
* **复现步骤**：
  1. 进入设置 -> AI/OCR Providers 页面。
  2. 发现 OCR 引擎选项仅支持通过 Endpoint 和 API Key 配置（底层硬编码适配 Azure Document Intelligence）。
* **影响**：对于国内个人开发者和求职者来说，注册并绑定外币卡开通 Azure 服务的门槛较高。
* **建议修复位置**：在后端 `packages/api/src/features/ai/ocr.ts` 以及前端的设置表单中，后续逐步扩展接入国内常见的 OCR 引擎（如阿里云、百度 AI），或直接兼容使用支持多模态的 LLM 直读图片。
