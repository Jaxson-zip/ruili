# 锐历 Ruili

锐历是一款面向中文求职场景的简历生成与优化工作台。它基于 [Reactive Resume](https://github.com/amruthpillai/reactive-resume) 二次开发，重点改造中文界面、中文示例简历、开源模板预览、PDF 导出体验和后续 AI 简历优化工作流。

这个仓库可以作为作品集项目展示：它不是从零开始的玩具 Demo，而是一次基于成熟开源项目的产品化二开，包含前端体验、模板视觉、中文本地化、AI 工作流预留、测试验证和开源合规处理。

## 当前改造重点

- 中文优先的首页、编辑器文案和示例数据
- 面向中国求职者的模板预览和岗位版本管理表达
- 基于 MIT / Apache-2.0 开源模板改造的中文样张滚动浏览
- 简历编辑、模板排版、PDF 导出和 AI 优化入口的统一产品叙事
- DOCX / PDF / 图片导入链路，图片和扫描件支持用户自配 OCR Provider
- 面向公开 Beta 的上传安全、生产环境变量和部署防呆
- 降低原项目品牌露出，仅在版权和许可证位置保留必要归属
- 默认中文样例隐藏头像、使用中文字体和更克制的黑蓝强调色

## 作品集说明

推荐在作品集里这样描述：

> 锐历是我基于 MIT 开源项目 Reactive Resume 二次开发的中文简历产品。我负责中文化改造、首页产品叙事、模板预览重构、默认中文示例、AI 简历优化入口规划，以及开源许可证归属处理。

不建议写成“完全从零开发”。更合适的表达是“基于开源项目的产品二开 / 本地化改造 / 中文求职场景产品化”。

## 开源归属

本项目基于 Reactive Resume 二次开发。

- 上游项目：[Reactive Resume](https://github.com/amruthpillai/reactive-resume)
- 原项目作者：[Amruth Pillai](https://amruthpillai.com)
- 上游许可证：[MIT License](https://github.com/AmruthPillai/Reactive-Resume/blob/main/LICENSE)

MIT License 允许修改、商用和再分发，但需要保留原版权和许可证声明。本仓库保留上游来源说明，避免暗示这是 Reactive Resume 官方版本。

## 本地运行

```bash
pnpm install
pnpm dev
```

默认 Web 服务运行在：

```text
http://localhost:3000
```

## 部署

中文 Beta 的 VPS / Docker Compose 部署说明见：

[docs/self-hosting/chinese-resume-beta.md](docs/self-hosting/chinese-resume-beta.md)

## 常用验证

```bash
pnpm --filter web typecheck
pnpm --filter @reactive-resume/pdf test
pnpm --filter @reactive-resume/schema test
```

## 后续方向

- 将首页模板预览逐步落到真实可编辑 PDF 模板
- 接入可配置 LLM Provider，用于简历解析、改写和岗位匹配
- 增加撤销、历史版本和多岗位版本管理
- 完善 Word / PDF 导入到结构化简历的流程
- 做面向中文求职者的模板库和投递建议体系
