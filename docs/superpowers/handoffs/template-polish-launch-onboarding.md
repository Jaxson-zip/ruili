# 锐历模板打磨协作上手指南

更新时间：2026-06-06

这份文档给参与锐历模板打磨的小伙伴使用。目标是让你不用翻聊天记录，也能快速知道项目现状、怎么拉分支、负责什么、怎么判断一个模板是否能上线。

## 当前目标

锐历（Ruili）是基于 Reactive Resume 二次开发的中文简历产品。当前阶段不是重新做一个简历系统，而是把已有能力打磨成可以正式上线的中文求职产品。

本轮重点是模板：

- 模板不能重复、不能空、不能只是参考图。
- 首页缩略图、创建弹窗、Builder 预览、PDF 导出必须看起来是同一个模板。
- 中文简历优先，适配国内求职常见场景。
- Beta 可以先主打 PDF 交付，DOCX 作为文字保底导出。

## 分支

协作集成分支：

```bash
git fetch ruili
git switch -c your-name/template-polish ruili/codex/template-polish-launch
```

如果本地没有 `ruili` remote：

```bash
git remote add ruili https://github.com/Jaxson-zip/ruili.git
git fetch ruili
git switch -c your-name/template-polish ruili/codex/template-polish-launch
```

不要直接改 `main`。你可以从 `codex/template-polish-launch` 切自己的工作分支，完成后合回这个协作分支。

## 本地启动

项目是 pnpm monorepo。常用命令：

```bash
pnpm install
pnpm dev
```

本地页面通常在：

```text
http://localhost:3000
```

如果已有服务在跑，先确认当前终端或 Docker 状态，不要随手清库或重置。

## 你主要负责什么

你主要负责模板视觉与上线验收，不需要一开始就深改代码。

优先做这些：

1. 选出 8-12 个中文简历模板方向。
2. 给每个方向找清楚参考图或画出结构草图。
3. 标明模板适用人群和场景。
4. 判断现有模板里哪些可以保留、哪些太丑或太空。
5. 对已经接入的模板做人工验收：缩略图、创建后预览、PDF 导出是否一致。

推荐先覆盖这些模板类型：

- 技术岗：前端、后端、算法、测试、数据分析。
- 产品/运营：项目成果、数据指标、增长经历更突出。
- 校招/实习：教育、项目、竞赛、技能更紧凑。
- 国企/事业单位：稳重、标准、信息密度高，不要花哨。
- 外企/咨询/金融：简洁、留白适中、英文名和联系方式更清晰。
- 管理岗：经历层级、团队规模、业务结果更突出。

## 什么模板可以上线

一个模板必须同时满足这些条件，才算可上线：

- 缩略图不是重复图。
- 创建这个模板后，Builder 中看到的版式和缩略图基本一致。
- 导出的 PDF 和 Builder 预览基本一致。
- 中文不乱码，不挤出页面，不明显遮挡。
- 一页 A4 中信息密度合理，不像空白占位图。
- 样式是我们真实实现的，不是只放了一张网上参考图。

如果只是网上找到的好看参考图，请标记为“参考，不可直接上线”。

## 怎么验收一个模板

按这个流程测：

1. 打开首页模板区，检查缩略图是否重复、是否有明显占位感。
2. 进入工作台，点击“选择模板创建”。
3. 选择目标模板，创建简历。
4. 在 Builder 里看预览，确认不是跳到了另一个模板。
5. 修改姓名、工作经历、项目经历，确认排版不崩。
6. 导出 PDF，打开文件看中文、间距、分页、颜色是否正常。
7. 截图记录问题，按模板名归类。

记录格式建议：

```markdown
## 模板名称

结论：可上线 / 需调整 / 下线

问题：
- 缩略图和 Builder 不一致。
- 项目经历太长时右栏溢出。
- PDF 导出后标题间距过大。

建议：
- 改成更紧凑的两栏。
- 技能区放到右侧，减少正文挤压。
```

## 不要做什么

- 不要把网上模板截图直接当作可选模板上线。
- 不要只改首页图，不实现 PDF 模板。
- 不要为了好看牺牲导出稳定性。
- 不要删除 MIT License、Reactive Resume attribution 或原作者信息。
- 不要大规模重构无关模块。
- 不要执行 `git reset --hard`、整仓 `git clean`、批量删除文件。

## Codex 负责什么

Codex 负责代码接入和一致性：

- 把确定要上线的模板接入 `packages/pdf`。
- 更新 `packages/schema` 的模板枚举和 starter 数据。
- 更新 `apps/web` 的模板选择、缩略图和首页展示。
- 保证创建模板后不会串模板。
- 保证 Builder 预览和 PDF 导出一致。
- 补测试和跑验证命令。

你只要把模板方向、参考、问题截图和验收结论给清楚，Codex 就能按优先级接入。

## 关键文件

模板数据和创建入口：

- `packages/schema/src/templates.ts`
- `packages/schema/src/resume/starters.ts`
- `apps/web/src/dialogs/resume/template/data.ts`
- `apps/web/src/dialogs/resume/template/gallery.tsx`
- `apps/web/src/routes/_home/-sections/templates.tsx`

PDF 模板实现：

- `packages/pdf/src/templates/index.ts`
- `packages/pdf/src/templates/collection/CollectionPage.tsx`
- `packages/pdf/src/templates/azurill/AzurillPage.tsx`
- `packages/pdf/src/templates/onyx/OnyxPage.tsx`

缩略图资源：

- `apps/web/public/templates/jpg/`
- `apps/web/public/templates/starters/`

测试：

- `apps/web/src/dialogs/resume/template/*.test.ts*`
- `apps/web/src/routes/_home/-sections/templates.test.tsx`
- `packages/pdf/src/templates/index.test.ts`
- `packages/schema/src/templates.test.ts`
- `packages/schema/src/resume/starters.test.ts`

## 提交前检查

如果你只改文档、截图或验收报告，至少确认：

```bash
git status --short
```

如果你改了模板代码，建议跑：

```bash
pnpm.cmd --filter web exec vitest run src/dialogs/resume/template/data.test.ts src/dialogs/resume/template/gallery.test.tsx src/routes/_home/-sections/templates.test.tsx
pnpm.cmd --filter @reactive-resume/schema exec vitest run src/templates.test.ts src/resume/starters.test.ts
pnpm.cmd --filter @reactive-resume/pdf exec vitest run src/templates/index.test.ts
```

提交信息示例：

```bash
git commit -m "docs: add template polish review notes"
git commit -m "feat: add chinese operations resume template"
git commit -m "fix: align starter preview with exported template"
```

## 今日上线判断

模板打磨不是唯一上线条件，但它会直接影响用户第一印象。

当前建议：

- 小流量邀请制 Beta：可以推进。
- 正式公开上线：至少完成第一批高质量模板验收后再做。
- 第一批模板目标：6 个以上可上线模板，覆盖技术、产品运营、校招、通用商务。

最重要的上线标准：

```text
用户选哪个模板，创建后就是哪个模板，导出的 PDF 也像哪个模板。
```
