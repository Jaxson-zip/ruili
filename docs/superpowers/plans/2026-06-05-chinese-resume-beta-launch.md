# Chinese Resume Beta Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or execute the assigned branch task directly with TDD. Do not revert unrelated dirty work. Keep changes inside the assigned file scope and report changed files.

**Goal:** Ship a public Beta of the Chinese resume product with import, AI optimization, curated templates, export, deployment, and launch security baseline.

**Architecture:** Keep Reactive Resume's existing data model and PDF renderer. Add missing launch behavior through bounded modules: import/OCR safety in `packages/api/src/features/ai`, template curation in `apps/web/src/dialogs/resume/template` and `packages/pdf/src/templates`, AI review polish in `features/resume/workbench`, and deployment/security hardening in config/docs.

**Tech Stack:** TypeScript, React, Vite, ORPC, Drizzle/PostgreSQL, AI SDK, Playwright smoke scripts, Vitest, Docker Compose.

---

## Branch Strategy

Current integration branch: `codex/chinese-ai-resume-workbench`

The current workspace has many uncommitted local changes. Before external teammates branch from GitHub, create a checkpoint commit or push a checkpoint branch so they receive the current Chinese-product work. Until that exists, agent workers should treat this workspace as the source of truth.

Recommended branches:

- `feat/beta-security-baseline`
- `feat/cloud-ocr-import`
- `feat/template-library-polish`
- `feat/ai-optimization-loop`
- `feat/vps-deploy-docs`
- `release/chinese-resume-beta`

Merge order:

1. `feat/beta-security-baseline`
2. `feat/cloud-ocr-import`
3. `feat/ai-optimization-loop`
4. `feat/template-library-polish`
5. `feat/vps-deploy-docs`
6. Final integration into `release/chinese-resume-beta`

## Day 1 Acceptance

- User can register/login with the test account flow.
- User can import JSON Resume, Reactive Resume JSON, DOCX, normal text PDF, and scanned PDF/image through the same "导入已有简历" entry.
- DOCX and text PDF use local extraction first.
- Scanned PDF/image uses cloud OCR only after local extraction fails or returns too little text.
- OCR/AI output becomes structured resume data without replacing the user's content with system demo text.
- User can run AI analysis in Chinese and see actionable suggestions.
- User can open quick edit from preview and update basics/summary/work/project/skills.

## Day 2 Acceptance

- Homepage only shows curated templates, no deferred/ugly references.
- Template library separates "上线推荐", "更多参考", and "待重做"; deferred templates are hidden by default.
- Imported resume can switch templates without losing basics, work, education, skills, projects, or summary.
- PDF export renders nonblank pages for the curated templates.
- DOCX export either works or is clearly marked with a recoverable fallback.
- Production deployment has security baseline: strong secrets, CORS/origin config, file limits, API rate limits, no resume body in logs, OCR/AI key server-side only, HTTPS proxy notes.
- README/deployment docs include MIT attribution to upstream Reactive Resume and links to open-source template references.

## Work Package A: Security Baseline

**Owner branch:** `feat/beta-security-baseline`

**Files:**

- Modify: `packages/api/src/features/ai/service.ts`
- Modify: `packages/api/src/features/ai/router.ts`
- Modify: `packages/api/src/middleware/rate-limit/index.ts`
- Modify: `packages/utils/src/rate-limit.ts`
- Modify: `.env.example`
- Modify: `docs/self-hosting/docker.mdx`
- Add tests under: `packages/api/src/features/ai/*.test.ts`

**Tasks:**

- Add strict file input validation: file name length, extension allowlist, base64 decode validation, exact byte limit, and accepted media type.
- Keep AI/OCR cost controls separate from ordinary chat if OCR endpoint is added.
- Ensure parsing errors never return raw resume text or provider stack traces to the user.
- Ensure `ENCRYPTION_SECRET`, `AUTH_SECRET`, and AI provider credentials are required for production launch paths.
- Add deployment checklist for secrets, HTTPS, CORS, backups, and disabling signup if the instance is private.

**Verification:**

```bash
pnpm.cmd --filter @reactive-resume/api test -- ai
pnpm.cmd --filter @reactive-resume/api typecheck
pnpm.cmd --filter web typecheck
```

## Work Package B: Cloud OCR Import

**Owner branch:** `feat/cloud-ocr-import`

**Files:**

- Add: `packages/api/src/features/ai/ocr.ts`
- Add: `packages/api/src/features/ai/ocr.test.ts`
- Modify: `packages/api/src/features/ai/service.ts`
- Modify: `packages/api/src/features/ai/router.ts`
- Modify: `apps/web/src/dialogs/resume/import-file.ts`
- Modify: `apps/web/src/dialogs/resume/import.tsx`
- Add or modify tests under: `apps/web/src/dialogs/resume/*import*.test.ts`

**Tasks:**

- Add a provider-neutral `extractTextWithCloudOcr` interface with disabled-by-default behavior.
- First pass should support a single configured provider through env vars, then keep the interface open for Tencent/Alibaba/Baidu/Volcengine adapters.
- Use this flow: local PDF text -> if text is too short, cloud OCR -> LLM structure extraction.
- Add image import type for PNG/JPEG if the OCR provider is enabled.
- Surface plain Chinese errors: OCR not configured, file too large, unsupported file, provider failed, AI parse failed.
- Include privacy copy: uploaded resume content may be sent to the configured OCR/AI provider.

**Verification:**

```bash
pnpm.cmd --filter @reactive-resume/api test -- ocr pdf-text docx-text service
pnpm.cmd --filter web test -- import
node tooling\verify-builder-quick-edit.mjs
```

## Work Package C: AI Optimization Loop

**Owner branch:** `feat/ai-optimization-loop`

**Files:**

- Modify: `packages/ai/src/prompts/*.md`
- Modify: `packages/ai/src/tools/patch-proposal.ts`
- Modify: `packages/api/src/features/ai/service.ts`
- Modify: `apps/web/src/features/resume/workbench/ai-review-panel.tsx`
- Modify: `apps/web/src/features/resume/workbench/workbench-shell.tsx`
- Add tests under: `packages/ai/src/*.test.ts`, `apps/web/src/features/resume/workbench/*.test.tsx`

**Tasks:**

- Ensure all AI analysis and patch proposal copy is Simplified Chinese.
- Keep provider names in English where they are brands: Gemini, OpenAI, DeepSeek, Doubao, OpenRouter.
- AI should propose changes first; user explicitly applies them.
- Add "岗位目标/JD" input path if not already visible.
- Ensure AI cannot silently overwrite the entire resume when it only needs targeted changes.

**Verification:**

```bash
pnpm.cmd --filter @reactive-resume/ai test
pnpm.cmd --filter @reactive-resume/api test -- ai
pnpm.cmd --filter web test -- ai-review workbench
```

## Work Package D: Template Library Polish

**Owner branch:** `feat/template-library-polish`

**Files:**

- Modify: `apps/web/src/dialogs/resume/template/data.ts`
- Modify: `apps/web/src/dialogs/resume/template/gallery.tsx`
- Modify: `apps/web/src/routes/_home/-sections/templates.tsx`
- Modify: `packages/schema/src/resume/starters.ts`
- Modify selected files under: `packages/pdf/src/templates/*`
- Add or update tests under corresponding `*.test.ts(x)`

**Tasks:**

- Keep only curated templates visible by default.
- Hide "待重做" references behind explicit manual expansion.
- Ensure homepage and template dialog use the same curated data source.
- Add 12-20 starter resumes with real Chinese density; no empty-looking sample pages.
- For ugly PDF templates, either remove from visible list or remap to better starter content.
- Avoid uploading or redistributing VIP/commercial templates unless licensing permits it.

**Verification:**

```bash
pnpm.cmd --filter web test -- template gallery templates
pnpm.cmd --filter @reactive-resume/schema test -- starters
node tooling\verify-homepage-templates.mjs
node tooling\verify-template-starter.mjs
```

## Work Package E: VPS Deploy Docs

**Owner branch:** `feat/vps-deploy-docs`

**Files:**

- Modify: `.env.example`
- Modify: `compose.yml`
- Modify: `docs/self-hosting/docker.mdx`
- Modify: `README.md`
- Add: `docs/self-hosting/chinese-resume-beta.md`

**Tasks:**

- Document Linux + Docker Compose deployment for 1Panel/Docker marketplace images.
- Include minimum VPS sizing and realistic warning: 1C1G is tight; 2C2G is safer for browser/PDF export.
- Include reverse proxy HTTPS notes.
- Include Postgres/Redis/S3 or local storage persistence notes.
- Include backup and upgrade procedure.
- Include upstream MIT attribution and project portfolio wording.

**Verification:**

```bash
docker compose config
pnpm.cmd typecheck
```

## Final Beta Gate

Run these from repo root after merging work packages:

```bash
pnpm.cmd --filter web typecheck
pnpm.cmd --filter @reactive-resume/api typecheck
pnpm.cmd --filter @reactive-resume/ai test
pnpm.cmd --filter web test -- template import workbench
node tooling\verify-homepage-templates.mjs
node tooling\verify-template-starter.mjs
node tooling\verify-builder-quick-edit.mjs
docker compose config
```

Manual browser checks:

- Register/login.
- Import DOCX.
- Import normal PDF.
- Import scanned PDF/image with OCR enabled.
- AI analysis in Chinese.
- Apply one AI patch.
- Switch template after import.
- Export PDF.
- Confirm no obvious English product copy remains in primary user flow.

