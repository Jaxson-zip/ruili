# 模板与编辑器审查结论

目标参照：中文在线简历编辑器的成熟体验，例如模板选择、在线替换文字、导入 Word/PDF、导出 PDF/Word/图片。不能复制商业/VIP 模板，只能做原创模板并参考通用排版规律。

## 当前最大问题

1. 模板选择看起来很多，但真实 PDF 渲染器没有那么多。
   当前模板库里有一批 collection/reference 选项，本质是 `baseTemplate + accentColor + sidebarPosition`，不是独立版式。用户看到漂亮缩略图后，实际导出可能只是近似配色。

2. 部分中文文案已经乱码。
   模板名称、标签、描述、快捷编辑标签里有 mojibake。中文产品上线前必须先统一修掉，否则用户会直接觉得不可靠。

3. 现在还不是真正“在简历上改字”。
   预览是 PDF/canvas，点击后打开浮层表单。当前点击命中主要靠比例估算，不是根据真实 section 位置，因此模板变化、内容变长、分页后容易选错区域。

4. 换模板保内容，但不保版式语义。
   系统会把内容塞进通用 main/sidebar 顺序，不能保证“个人信息仍在左栏”“技能仍在侧栏”“项目不被挤到奇怪位置”。

5. DOCX/PDF 导入是“提取内容”，不是“复刻原排版”。
   这点要对用户讲清楚：导入后可以编辑和换模板，但不会 1:1 复原原 Word/PDF 的视觉样式。

6. PDF 导出缺少上线前预检。
   需要检查空字段、乱码、页数过多、字体太小、联系方式缺失、明显溢出风险，再让用户导出。

## 1-2 天内最该做

1. 只保留 6-8 个真实稳定模板作为默认推荐。
2. 把 collection/reference 缩略图降级成“配色/布局预设”，或者先隐藏，避免承诺过高。
3. 做 4 个真实原创中文模板：
   - ATS 单栏通用版
   - 校招紧凑版
   - 成熟双栏侧边栏版
   - 资深/管理岗时间线版
4. 把快捷编辑从“比例点击”改成更明确的 section overlay/chip，先做到点“教育/工作/项目/技能”能稳定打开对应编辑区。
5. 导入后自动应用一个安全中文默认模板，并提示“导入内容可能需要检查排版”。
6. PDF 导出前增加“简历就绪检查”。

## 模板小伙伴文件范围

优先看这些文件：

- `apps/web/src/dialogs/resume/template/data.ts`
- `apps/web/src/dialogs/resume/template/gallery.tsx`
- `apps/web/src/routes/_home/-sections/templates.tsx`
- `packages/pdf/src/templates/index.ts`
- `packages/pdf/src/templates/**`
- `packages/schema/src/resume/starters.ts`
- `apps/web/src/routes/builder/$resumeId/-components/clickable-preview.tsx`
- `apps/web/src/routes/builder/$resumeId/-components/preview-section-picker.ts`

