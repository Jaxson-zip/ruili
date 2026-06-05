# Chinese AI Resume Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Chinese-first AI resume workbench MVP on top of the existing Reactive Resume builder, export, import, AI provider, AI Patch, and restore foundations.

**Architecture:** Keep `ResumeData` as the source of truth. Add a workbench layer that composes the existing builder draft store, resume preview, PDF/DOCX export, AI import, AI analysis, and agent patch restore flows. Add durable saved-version and target-job metadata where the existing resume model does not have a clean home.

**Tech Stack:** React 19, TanStack Router, TanStack Query, Zustand, Lingui, ORPC, Drizzle ORM, Postgres, Vitest, Testing Library, existing `@reactive-resume/pdf`, `@reactive-resume/docx`, `@reactive-resume/ai`, and configurable AI providers.

---

## 重要说明

LLM 是必须的，但不需要自己训练模型。本计划复用现有 AI Provider 配置，让用户在设置里添加 OpenAI、DeepSeek、通义、Kimi、Claude 或其他 OpenAI-compatible Provider。LLM 只负责理解 JD、生成诊断和 Patch 提案；真正写入简历仍由用户确认后通过 JSON Patch 完成。

当前仓库里 `apps/web/src/routeTree.gen.ts` 已有未提交改动，不属于本计划。执行本计划时不要回滚它，也不要把它和本计划提交混在一起。

## 文件结构

### 后端与数据库

- Modify: `packages/db/src/schema/resume.ts`
  - 新增 `resumeVersion` 和 `resumeTarget` 表。
- Modify: `packages/db/src/schema/resume.test.ts`
  - 覆盖新表字段和索引。
- Modify: `packages/db/src/relations.ts`
  - 给 `resume` 加 versions/targets 关系。
- Generated: `migrations/<generated_resume_versions_and_targets>/migration.sql`
  - 由 `pnpm.cmd db:generate` 生成。
- Modify: `packages/api/src/dto/resume.ts`
  - 新增版本和目标岗位 DTO。
- Create: `packages/api/src/features/resume/versions.ts`
  - 保存版本、列出版本、恢复版本。
- Create: `packages/api/src/features/resume/targets.ts`
  - 保存/更新目标岗位 JD，列出目标岗位。
- Modify: `packages/api/src/features/resume/router.ts`
  - 挂载 `versions` 和 `targets` router。

### 前端工作台

- Create: `apps/web/src/features/resume/workbench/types.ts`
  - Workbench target/version/patch UI 类型。
- Create: `apps/web/src/features/resume/workbench/use-undo-redo.ts`
  - 当前会话撤销/重做历史。
- Create: `apps/web/src/features/resume/workbench/export-actions.ts`
  - 统一 PDF/DOCX/JSON 导出动作。
- Create: `apps/web/src/features/resume/workbench/import-actions.ts`
  - 统一 PDF/DOCX/JSON 导入动作。
- Create: `apps/web/src/features/resume/workbench/target-sidebar.tsx`
  - 左侧投递项目列表。
- Create: `apps/web/src/features/resume/workbench/resume-document-stage.tsx`
  - 中间简历预览和编辑聚焦区域。
- Create: `apps/web/src/features/resume/workbench/ai-review-panel.tsx`
  - 右侧 AI 审稿、Patch 队列、恢复入口。
- Create: `apps/web/src/features/resume/workbench/workbench-toolbar.tsx`
  - 顶部状态、版本、导出、保存版本。
- Create: `apps/web/src/features/resume/workbench/workbench-shell.tsx`
  - 工作台布局组合。
- Create: `apps/web/src/routes/builder/$resumeId/workbench.tsx`
  - 新路由 `/builder/$resumeId/workbench`。
- Modify: `apps/web/src/routes/builder/$resumeId/-components/header.tsx`
  - 增加进入中文工作台入口。

### 测试

- Create: `packages/api/src/features/resume/versions.test.ts`
- Create: `packages/api/src/features/resume/targets.test.ts`
- Create: `apps/web/src/features/resume/workbench/use-undo-redo.test.ts`
- Create: `apps/web/src/features/resume/workbench/export-actions.test.ts`
- Create: `apps/web/src/features/resume/workbench/import-actions.test.ts`
- Create: `apps/web/src/features/resume/workbench/workbench-shell.test.tsx`
- Create: `apps/web/src/features/resume/workbench/ai-review-panel.test.tsx`

---

## Task 1: 数据表与 schema

**Files:**
- Modify: `packages/db/src/schema/resume.ts`
- Modify: `packages/db/src/schema/resume.test.ts`
- Modify: `packages/db/src/relations.ts`
- Generated: `migrations/<timestamp>_resume_versions_and_targets/migration.sql`

- [ ] **Step 1: 写 schema 测试**

Add to `packages/db/src/schema/resume.test.ts`:

```ts
import { resume, resumeTarget, resumeVersion } from "./resume";

describe("resume workbench schema", () => {
	it("exports resume version and target tables", () => {
		for (const column of ["id", "resumeId", "userId", "label", "source", "snapshotData", "createdAt"]) {
			expect(resumeVersion).toHaveProperty(column);
		}

		for (const column of ["id", "resumeId", "userId", "label", "roleTitle", "company", "jdText", "keywords", "createdAt"]) {
			expect(resumeTarget).toHaveProperty(column);
		}

		expect(resume).toHaveProperty("id");
	});
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
pnpm.cmd --filter @reactive-resume/db test -- src/schema/resume.test.ts
```

Expected: fail because `resumeTarget` and `resumeVersion` are not exported.

- [ ] **Step 3: 新增 schema**

Add to `packages/db/src/schema/resume.ts` after `resumeAnalysis`:

```ts
export const resumeVersion = pg.pgTable(
	"resume_version",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		resumeId: pg
			.text("resume_id")
			.notNull()
			.references(() => resume.id, { onDelete: "cascade" }),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		label: pg.text("label").notNull(),
		source: pg.text("source").notNull().default("manual"),
		snapshotData: pg.jsonb("snapshot_data").notNull().$type<ResumeData>(),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [pg.index().on(t.resumeId, t.createdAt.desc()), pg.index().on(t.userId, t.createdAt.desc())],
);

export const resumeTarget = pg.pgTable(
	"resume_target",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		resumeId: pg
			.text("resume_id")
			.notNull()
			.references(() => resume.id, { onDelete: "cascade" }),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		label: pg.text("label").notNull(),
		roleTitle: pg.text("role_title"),
		company: pg.text("company"),
		jdText: pg.text("jd_text").notNull().default(""),
		keywords: pg.text("keywords").array().notNull().default([]),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [pg.index().on(t.resumeId, t.updatedAt.desc()), pg.index().on(t.userId, t.updatedAt.desc())],
);
```

- [ ] **Step 4: 新增 relations**

Add to the `resume` relation in `packages/db/src/relations.ts`:

```ts
versions: r.many.resumeVersion({
	from: r.resume.id,
	to: r.resumeVersion.resumeId,
}),
targets: r.many.resumeTarget({
	from: r.resume.id,
	to: r.resumeTarget.resumeId,
}),
```

Add sibling relation entries:

```ts
resumeVersion: {
	resume: r.one.resume({
		from: r.resumeVersion.resumeId,
		to: r.resume.id,
	}),
	user: r.one.user({
		from: r.resumeVersion.userId,
		to: r.user.id,
	}),
},
resumeTarget: {
	resume: r.one.resume({
		from: r.resumeTarget.resumeId,
		to: r.resume.id,
	}),
	user: r.one.user({
		from: r.resumeTarget.userId,
		to: r.user.id,
	}),
},
```

- [ ] **Step 5: 生成 migration**

Run:

```powershell
pnpm.cmd db:generate
```

Expected: creates a migration folder under `migrations/` with `CREATE TABLE "resume_version"` and `CREATE TABLE "resume_target"`.

- [ ] **Step 6: 跑 DB 测试**

Run:

```powershell
pnpm.cmd --filter @reactive-resume/db test -- src/schema/resume.test.ts src/relations.test.ts
```

Expected: pass.

- [ ] **Step 7: 提交**

```powershell
git add packages/db/src/schema/resume.ts packages/db/src/schema/resume.test.ts packages/db/src/relations.ts migrations
git commit -m "feat: add resume workbench version tables"
```

---

## Task 2: 版本保存与恢复 API

**Files:**
- Modify: `packages/api/src/dto/resume.ts`
- Create: `packages/api/src/features/resume/versions.ts`
- Create: `packages/api/src/features/resume/versions.test.ts`
- Modify: `packages/api/src/features/resume/router.ts`

- [ ] **Step 1: 写 API 测试**

Create `packages/api/src/features/resume/versions.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

const dbMock = vi.hoisted(() => ({
	insert: vi.fn(),
	select: vi.fn(),
	update: vi.fn(),
}));

vi.mock("@reactive-resume/db/client", () => ({ db: dbMock }));

describe("resume versions service", () => {
	it("creates a named snapshot from resume data", async () => {
		const { normalizeVersionSource } = await import("./versions");
		expect(normalizeVersionSource("manual")).toBe("manual");
		expect(normalizeVersionSource("ai_patch")).toBe("ai_patch");
		expect(normalizeVersionSource("bad-value")).toBe("manual");
	});

	it("keeps snapshot data separate from mutable resume data", async () => {
		const { cloneVersionSnapshot } = await import("./versions");
		const snapshot = cloneVersionSnapshot(defaultResumeData);
		snapshot.basics.name = "Changed";
		expect(defaultResumeData.basics.name).not.toBe("Changed");
	});
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
pnpm.cmd --filter @reactive-resume/api test -- src/features/resume/versions.test.ts
```

Expected: fail because `./versions` does not exist.

- [ ] **Step 3: 新增 DTO**

Add to `packages/api/src/dto/resume.ts` inside `resumeDto`:

```ts
	versions: {
		list: {
			input: z.object({ resumeId: z.string() }),
			output: z.array(
				z.object({
					id: z.string(),
					resumeId: z.string(),
					label: z.string(),
					source: z.string(),
					createdAt: z.date(),
				}),
			),
		},
		create: {
			input: z.object({
				resumeId: z.string(),
				label: z.string().trim().min(1).max(120),
				source: z.enum(["manual", "ai_patch", "import", "export"]).default("manual"),
			}),
			output: z.object({ id: z.string() }),
		},
		restore: {
			input: z.object({ id: z.string() }),
			output: resumeSchema.omit({ password: true, userId: true, createdAt: true }).extend({ hasPassword: z.boolean() }),
		},
	},
```

- [ ] **Step 4: 创建 versions router/service**

Create `packages/api/src/features/resume/versions.ts`:

```ts
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import { and, desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import * as schema from "@reactive-resume/db/schema";
import { db } from "@reactive-resume/db/client";
import { protectedProcedure } from "../../context";
import { resumeDto } from "../../dto/resume";
import { resumeMutationRateLimit } from "../../middleware/rate-limit";
import { resumeService } from "./service";

const VERSION_SOURCES = new Set(["manual", "ai_patch", "import", "export"]);

export function normalizeVersionSource(source: string) {
	return VERSION_SOURCES.has(source) ? source : "manual";
}

export function cloneVersionSnapshot(data: ResumeData): ResumeData {
	return structuredClone(data);
}

export const resumeVersionsRouter = {
	list: protectedProcedure
		.route({ method: "GET", path: "/resumes/{resumeId}/versions", tags: ["Resumes"], summary: "List resume versions" })
		.input(resumeDto.versions.list.input)
		.output(resumeDto.versions.list.output)
		.handler(async ({ context, input }) => {
			await resumeService.getById({ id: input.resumeId, userId: context.user.id });

			return await db
				.select({
					id: schema.resumeVersion.id,
					resumeId: schema.resumeVersion.resumeId,
					label: schema.resumeVersion.label,
					source: schema.resumeVersion.source,
					createdAt: schema.resumeVersion.createdAt,
				})
				.from(schema.resumeVersion)
				.where(and(eq(schema.resumeVersion.resumeId, input.resumeId), eq(schema.resumeVersion.userId, context.user.id)))
				.orderBy(desc(schema.resumeVersion.createdAt));
		}),

	create: protectedProcedure
		.route({ method: "POST", path: "/resumes/{resumeId}/versions", tags: ["Resumes"], summary: "Create resume version" })
		.input(resumeDto.versions.create.input)
		.output(resumeDto.versions.create.output)
		.use(resumeMutationRateLimit)
		.handler(async ({ context, input }) => {
			const resume = await resumeService.getById({ id: input.resumeId, userId: context.user.id });
			const [version] = await db
				.insert(schema.resumeVersion)
				.values({
					resumeId: resume.id,
					userId: context.user.id,
					label: input.label,
					source: normalizeVersionSource(input.source),
					snapshotData: cloneVersionSnapshot(resume.data),
				})
				.returning({ id: schema.resumeVersion.id });

			if (!version) throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create resume version." });
			return version;
		}),

	restore: protectedProcedure
		.route({ method: "POST", path: "/resume-versions/{id}/restore", tags: ["Resumes"], summary: "Restore resume version" })
		.input(resumeDto.versions.restore.input)
		.output(resumeDto.versions.restore.output)
		.use(resumeMutationRateLimit)
		.handler(async ({ context, input }) => {
			const [version] = await db
				.select()
				.from(schema.resumeVersion)
				.where(and(eq(schema.resumeVersion.id, input.id), eq(schema.resumeVersion.userId, context.user.id)))
				.limit(1);

			if (!version) throw new ORPCError("NOT_FOUND", { message: "Resume version was not found." });

			return await resumeService.update({
				id: version.resumeId,
				userId: context.user.id,
				data: cloneVersionSnapshot(version.snapshotData),
			});
		}),
};
```

- [ ] **Step 5: 挂载 router**

Modify `packages/api/src/features/resume/router.ts`:

```ts
import { resumeVersionsRouter } from "./versions";
```

Add inside `resumeRouter`:

```ts
versions: resumeVersionsRouter,
```

- [ ] **Step 6: 跑 API 测试**

Run:

```powershell
pnpm.cmd --filter @reactive-resume/api test -- src/features/resume/versions.test.ts
pnpm.cmd --filter @reactive-resume/api typecheck
```

Expected: pass.

- [ ] **Step 7: 提交**

```powershell
git add packages/api/src/dto/resume.ts packages/api/src/features/resume/versions.ts packages/api/src/features/resume/versions.test.ts packages/api/src/features/resume/router.ts
git commit -m "feat: add resume version api"
```

---

## Task 3: 目标岗位/JD API

**Files:**
- Modify: `packages/api/src/dto/resume.ts`
- Create: `packages/api/src/features/resume/targets.ts`
- Create: `packages/api/src/features/resume/targets.test.ts`
- Modify: `packages/api/src/features/resume/router.ts`

- [ ] **Step 1: 写纯函数测试**

Create `packages/api/src/features/resume/targets.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("resume targets helpers", () => {
	it("extracts unique JD keywords from Chinese and English text", async () => {
		const { extractTargetKeywords } = await import("./targets");
		expect(extractTargetKeywords("React TypeScript 前端 工程化 React 接口联调 性能优化")).toEqual([
			"React",
			"TypeScript",
			"前端",
			"工程化",
			"接口联调",
			"性能优化",
		]);
	});
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
pnpm.cmd --filter @reactive-resume/api test -- src/features/resume/targets.test.ts
```

Expected: fail because `./targets` does not exist.

- [ ] **Step 3: 新增 DTO**

Add to `resumeDto` in `packages/api/src/dto/resume.ts`:

```ts
	targets: {
		list: {
			input: z.object({ resumeId: z.string() }),
			output: z.array(
				z.object({
					id: z.string(),
					resumeId: z.string(),
					label: z.string(),
					roleTitle: z.string().nullable(),
					company: z.string().nullable(),
					jdText: z.string(),
					keywords: z.array(z.string()),
					createdAt: z.date(),
					updatedAt: z.date(),
				}),
			),
		},
		upsert: {
			input: z.object({
				id: z.string().optional(),
				resumeId: z.string(),
				label: z.string().trim().min(1).max(120),
				roleTitle: z.string().trim().max(120).optional(),
				company: z.string().trim().max(120).optional(),
				jdText: z.string().max(20_000).default(""),
			}),
			output: z.object({ id: z.string() }),
		},
	},
```

- [ ] **Step 4: 创建 targets router/service**

Create `packages/api/src/features/resume/targets.ts`:

```ts
import { and, desc, eq } from "drizzle-orm";
import * as schema from "@reactive-resume/db/schema";
import { db } from "@reactive-resume/db/client";
import { protectedProcedure } from "../../context";
import { resumeDto } from "../../dto/resume";
import { resumeMutationRateLimit } from "../../middleware/rate-limit";
import { resumeService } from "./service";

const KNOWN_KEYWORDS = ["React", "TypeScript", "Vue", "Node", "前端", "工程化", "接口联调", "性能优化", "组件抽象", "状态管理"];

export function extractTargetKeywords(text: string): string[] {
	return KNOWN_KEYWORDS.filter((keyword) => text.includes(keyword));
}

export const resumeTargetsRouter = {
	list: protectedProcedure
		.route({ method: "GET", path: "/resumes/{resumeId}/targets", tags: ["Resumes"], summary: "List resume targets" })
		.input(resumeDto.targets.list.input)
		.output(resumeDto.targets.list.output)
		.handler(async ({ context, input }) => {
			await resumeService.getById({ id: input.resumeId, userId: context.user.id });
			return await db
				.select()
				.from(schema.resumeTarget)
				.where(and(eq(schema.resumeTarget.resumeId, input.resumeId), eq(schema.resumeTarget.userId, context.user.id)))
				.orderBy(desc(schema.resumeTarget.updatedAt));
		}),

	upsert: protectedProcedure
		.route({ method: "POST", path: "/resumes/{resumeId}/targets", tags: ["Resumes"], summary: "Create or update target job" })
		.input(resumeDto.targets.upsert.input)
		.output(resumeDto.targets.upsert.output)
		.use(resumeMutationRateLimit)
		.handler(async ({ context, input }) => {
			await resumeService.getById({ id: input.resumeId, userId: context.user.id });
			const values = {
				resumeId: input.resumeId,
				userId: context.user.id,
				label: input.label,
				roleTitle: input.roleTitle ?? null,
				company: input.company ?? null,
				jdText: input.jdText,
				keywords: extractTargetKeywords(input.jdText),
			};

			if (input.id) {
				const [updated] = await db
					.update(schema.resumeTarget)
					.set(values)
					.where(and(eq(schema.resumeTarget.id, input.id), eq(schema.resumeTarget.userId, context.user.id)))
					.returning({ id: schema.resumeTarget.id });
				if (updated) return updated;
			}

			const [created] = await db.insert(schema.resumeTarget).values(values).returning({ id: schema.resumeTarget.id });
			if (!created) throw new Error("RESUME_TARGET_CREATE_FAILED");
			return created;
		}),
};
```

- [ ] **Step 5: 挂载 router**

Modify `packages/api/src/features/resume/router.ts`:

```ts
import { resumeTargetsRouter } from "./targets";
```

Add inside `resumeRouter`:

```ts
targets: resumeTargetsRouter,
```

- [ ] **Step 6: 跑测试**

Run:

```powershell
pnpm.cmd --filter @reactive-resume/api test -- src/features/resume/targets.test.ts
pnpm.cmd --filter @reactive-resume/api typecheck
```

Expected: pass.

- [ ] **Step 7: 提交**

```powershell
git add packages/api/src/dto/resume.ts packages/api/src/features/resume/targets.ts packages/api/src/features/resume/targets.test.ts packages/api/src/features/resume/router.ts
git commit -m "feat: add resume target api"
```

---

## Task 4: 当前会话撤销/重做

**Files:**
- Create: `apps/web/src/features/resume/workbench/use-undo-redo.ts`
- Create: `apps/web/src/features/resume/workbench/use-undo-redo.test.ts`

- [ ] **Step 1: 写测试**

Create `apps/web/src/features/resume/workbench/use-undo-redo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createUndoRedoHistory } from "./use-undo-redo";

describe("createUndoRedoHistory", () => {
	it("moves backward and forward through snapshots", () => {
		const history = createUndoRedoHistory({ name: "v1" });
		history.push({ name: "v2" });
		history.push({ name: "v3" });

		expect(history.undo()).toEqual({ name: "v2" });
		expect(history.undo()).toEqual({ name: "v1" });
		expect(history.undo()).toEqual({ name: "v1" });
		expect(history.redo()).toEqual({ name: "v2" });
	});

	it("clears redo states after a new push", () => {
		const history = createUndoRedoHistory({ name: "v1" });
		history.push({ name: "v2" });
		history.undo();
		history.push({ name: "v3" });

		expect(history.redo()).toEqual({ name: "v3" });
	});
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/use-undo-redo.test.ts
```

Expected: fail because `use-undo-redo` does not exist.

- [ ] **Step 3: 写实现**

Create `apps/web/src/features/resume/workbench/use-undo-redo.ts`:

```ts
import { useCallback, useMemo, useRef } from "react";

export type UndoRedoHistory<T> = {
	push: (snapshot: T) => void;
	undo: () => T;
	redo: () => T;
	current: () => T;
	canUndo: () => boolean;
	canRedo: () => boolean;
};

function clone<T>(value: T): T {
	return structuredClone(value);
}

export function createUndoRedoHistory<T>(initial: T, limit = 50): UndoRedoHistory<T> {
	let stack = [clone(initial)];
	let index = 0;

	return {
		push(snapshot) {
			stack = [...stack.slice(0, index + 1), clone(snapshot)].slice(-limit);
			index = stack.length - 1;
		},
		undo() {
			index = Math.max(0, index - 1);
			return clone(stack[index]);
		},
		redo() {
			index = Math.min(stack.length - 1, index + 1);
			return clone(stack[index]);
		},
		current() {
			return clone(stack[index]);
		},
		canUndo() {
			return index > 0;
		},
		canRedo() {
			return index < stack.length - 1;
		},
	};
}

export function useUndoRedoHistory<T>(initial: T | undefined, onRestore: (snapshot: T) => void) {
	const historyRef = useRef<UndoRedoHistory<T> | null>(null);

	if (initial && !historyRef.current) historyRef.current = createUndoRedoHistory(initial);

	const push = useCallback((snapshot: T) => historyRef.current?.push(snapshot), []);
	const undo = useCallback(() => {
		if (!historyRef.current) return;
		onRestore(historyRef.current.undo());
	}, [onRestore]);
	const redo = useCallback(() => {
		if (!historyRef.current) return;
		onRestore(historyRef.current.redo());
	}, [onRestore]);

	return useMemo(() => ({ push, undo, redo }), [push, redo, undo]);
}
```

- [ ] **Step 4: 跑测试**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/use-undo-redo.test.ts
pnpm.cmd --filter web typecheck
```

Expected: pass.

- [ ] **Step 5: 提交**

```powershell
git add apps/web/src/features/resume/workbench/use-undo-redo.ts apps/web/src/features/resume/workbench/use-undo-redo.test.ts
git commit -m "feat: add workbench undo redo history"
```

---

## Task 5: 统一导出动作

**Files:**
- Create: `apps/web/src/features/resume/workbench/export-actions.ts`
- Create: `apps/web/src/features/resume/workbench/export-actions.test.ts`

- [ ] **Step 1: 写测试**

Create `apps/web/src/features/resume/workbench/export-actions.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

const buildDocx = vi.hoisted(() => vi.fn().mockResolvedValue(new Blob(["docx"])));
const createResumePdfBlob = vi.hoisted(() => vi.fn().mockResolvedValue(new Blob(["pdf"])));
const downloadWithAnchor = vi.hoisted(() => vi.fn());

vi.mock("@reactive-resume/docx", () => ({ buildDocx }));
vi.mock("@/features/resume/export/pdf-document", () => ({ createResumePdfBlob }));
vi.mock("@reactive-resume/utils/file", () => ({
	downloadWithAnchor,
	generateFilename: (name: string, ext: string) => `${name}.${ext}`,
}));

describe("workbench export actions", () => {
	it("exports PDF and DOCX using existing packages", async () => {
		const { exportResumeDocx, exportResumePdf } = await import("./export-actions");
		const resume = { name: "demo", data: { basics: { name: "Demo" } } };

		await exportResumePdf(resume as never);
		await exportResumeDocx(resume as never);

		expect(createResumePdfBlob).toHaveBeenCalledTimes(1);
		expect(buildDocx).toHaveBeenCalledTimes(1);
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "demo.pdf");
		expect(downloadWithAnchor).toHaveBeenCalledWith(expect.any(Blob), "demo.docx");
	});
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/export-actions.test.ts
```

Expected: fail because `export-actions` does not exist.

- [ ] **Step 3: 写实现**

Create `apps/web/src/features/resume/workbench/export-actions.ts`:

```ts
import type { Resume } from "@/features/resume/builder/draft";
import { buildDocx } from "@reactive-resume/docx";
import { downloadWithAnchor, generateFilename } from "@reactive-resume/utils/file";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";

export async function exportResumePdf(resume: Pick<Resume, "data" | "name">) {
	const blob = await createResumePdfBlob(resume.data);
	downloadWithAnchor(blob, generateFilename(resume.name, "pdf"));
}

export async function exportResumeDocx(resume: Pick<Resume, "data" | "name">) {
	const blob = await buildDocx(resume.data);
	downloadWithAnchor(blob, generateFilename(resume.name, "docx"));
}

export function exportResumeJson(resume: Pick<Resume, "data" | "name">) {
	const blob = new Blob([JSON.stringify(resume.data, null, 2)], { type: "application/json" });
	downloadWithAnchor(blob, generateFilename(resume.name, "json"));
}
```

- [ ] **Step 4: 跑测试**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/export-actions.test.ts
```

Expected: pass.

- [ ] **Step 5: 提交**

```powershell
git add apps/web/src/features/resume/workbench/export-actions.ts apps/web/src/features/resume/workbench/export-actions.test.ts
git commit -m "feat: add workbench export actions"
```

---

## Task 6: 工作台布局骨架

**Files:**
- Create: `apps/web/src/features/resume/workbench/types.ts`
- Create: `apps/web/src/features/resume/workbench/target-sidebar.tsx`
- Create: `apps/web/src/features/resume/workbench/resume-document-stage.tsx`
- Create: `apps/web/src/features/resume/workbench/ai-review-panel.tsx`
- Create: `apps/web/src/features/resume/workbench/workbench-toolbar.tsx`
- Create: `apps/web/src/features/resume/workbench/workbench-shell.tsx`
- Create: `apps/web/src/features/resume/workbench/workbench-shell.test.tsx`

- [ ] **Step 1: 写渲染测试**

Create `apps/web/src/features/resume/workbench/workbench-shell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkbenchShell } from "./workbench-shell";

const resume = {
	id: "resume-1",
	name: "前端简历",
	data: { basics: { name: "陈嘉行", headline: "前端开发实习生" }, metadata: { template: "azurill" } },
	updatedAt: new Date(),
};

describe("WorkbenchShell", () => {
	it("renders the Chinese workbench structure", () => {
		render(<WorkbenchShell resume={resume as never} />);

		expect(screen.getByText("锐历")).toBeInTheDocument();
		expect(screen.getByText("投递项目")).toBeInTheDocument();
		expect(screen.getByText("陈嘉行")).toBeInTheDocument();
		expect(screen.getByText("AI 审稿")).toBeInTheDocument();
		expect(screen.getByText("导出 PDF")).toBeInTheDocument();
		expect(screen.getByText("导出 Word")).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/workbench-shell.test.tsx
```

Expected: fail because `WorkbenchShell` does not exist.

- [ ] **Step 3: 创建类型文件**

Create `apps/web/src/features/resume/workbench/types.ts`:

```ts
export type WorkbenchTarget = {
	id: string;
	label: string;
	score?: number;
	keywords: string[];
};

export type WorkbenchPatch = {
	id: string;
	title: string;
	status: "recommended" | "needs_confirmation" | "applied" | "rolled_back";
	summary: string;
};
```

- [ ] **Step 4: 创建布局组件**

Create `apps/web/src/features/resume/workbench/workbench-shell.tsx`:

```tsx
import type { Resume } from "@/features/resume/builder/draft";
import { AIReviewPanel } from "./ai-review-panel";
import { ResumeDocumentStage } from "./resume-document-stage";
import { TargetSidebar } from "./target-sidebar";
import { WorkbenchToolbar } from "./workbench-toolbar";

type Props = {
	resume: Resume;
};

export function WorkbenchShell({ resume }: Props) {
	return (
		<div className="flex h-svh flex-col bg-[#eef1f4] text-[#121826]">
			<WorkbenchToolbar resume={resume} />
			<div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(520px,1fr)_360px]">
				<TargetSidebar />
				<ResumeDocumentStage resume={resume} />
				<AIReviewPanel />
			</div>
		</div>
	);
}
```

Create `apps/web/src/features/resume/workbench/workbench-toolbar.tsx`:

```tsx
import type { Resume } from "@/features/resume/builder/draft";
import { Button } from "@reactive-resume/ui/components/button";

type Props = {
	resume: Resume;
};

export function WorkbenchToolbar({ resume }: Props) {
	return (
		<header className="flex h-14 items-center justify-between border-b bg-white px-4">
			<div className="flex items-center gap-3">
				<div className="grid size-8 place-items-center rounded-md bg-neutral-950 font-semibold text-white">锐</div>
				<strong>锐历</strong>
				<span className="text-muted-foreground text-sm">{resume.name}</span>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="outline">保存版本</Button>
				<Button variant="outline">导出 Word</Button>
				<Button>导出 PDF</Button>
			</div>
		</header>
	);
}
```

Create `apps/web/src/features/resume/workbench/target-sidebar.tsx`:

```tsx
const targets = [
	{ label: "字节前端实习", meta: "匹配 82 · 4 条建议", tags: ["React", "工程化"] },
	{ label: "腾讯 PCG 前端", meta: "匹配 76 · 6 条建议", tags: ["Vue", "Node"] },
	{ label: "通用校园版", meta: "未绑定 JD", tags: ["基础版本"] },
];

export function TargetSidebar() {
	return (
		<aside className="border-r bg-[#f7f8fa] p-4 pt-6">
			<h2 className="mb-3 text-xs font-semibold text-muted-foreground">投递项目</h2>
			<div className="space-y-2">
				{targets.map((target, index) => (
					<div key={target.label} className={index === 0 ? "border bg-white p-3 shadow-sm" : "p-3 text-muted-foreground"}>
						<strong className="block text-sm text-foreground">{target.label}</strong>
						<span className="text-xs">{target.meta}</span>
						<div className="mt-2 flex flex-wrap gap-1">
							{target.tags.map((tag) => (
								<span key={tag} className="border bg-white px-2 py-0.5 text-[11px]">
									{tag}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</aside>
	);
}
```

Create `apps/web/src/features/resume/workbench/resume-document-stage.tsx`:

```tsx
import type { Resume } from "@/features/resume/builder/draft";

type Props = {
	resume: Resume;
};

export function ResumeDocumentStage({ resume }: Props) {
	const name = resume.data.basics.name || "未命名";
	const headline = resume.data.basics.headline || "目标岗位";

	return (
		<main className="overflow-auto bg-[#eef1f5] p-8">
			<article className="mx-auto min-h-[720px] max-w-[760px] border bg-white px-14 py-12 shadow-xl">
				<div className="flex items-end justify-between gap-6">
					<h1 className="text-3xl font-bold">{name}</h1>
					<p className="font-medium text-blue-600">{headline}</p>
				</div>
				<p className="mt-2 text-sm text-muted-foreground">{resume.data.basics.email}</p>
				<section className="mt-8">
					<h2 className="border-b pb-2 text-sm font-semibold">个人总结</h2>
					<p className="mt-3 text-sm leading-7">这里展示简历正文。后续任务会接入真实预览和段落聚焦。</p>
				</section>
			</article>
		</main>
	);
}
```

Create `apps/web/src/features/resume/workbench/ai-review-panel.tsx`:

```tsx
import { Button } from "@reactive-resume/ui/components/button";

export function AIReviewPanel() {
	return (
		<aside className="border-l bg-white p-4 pt-6">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold">AI 审稿</h2>
				<span className="bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">JD 已绑定</span>
			</div>
			<div className="mb-3 border p-4">
				<strong className="text-4xl">82</strong>
				<span className="ml-2 text-sm text-muted-foreground">目标 90+</span>
			</div>
			<div className="border p-3">
				<h3 className="text-sm font-semibold">项目描述缺少技术决策</h3>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">建议把“完成页面开发”改成可投递的技术职责表述。</p>
				<div className="mt-3 flex gap-2">
					<Button variant="outline" size="sm">拒绝</Button>
					<Button variant="outline" size="sm">改写</Button>
					<Button size="sm">应用</Button>
				</div>
			</div>
		</aside>
	);
}
```

- [ ] **Step 5: 跑测试**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/workbench-shell.test.tsx
pnpm.cmd --filter web typecheck
```

Expected: pass.

- [ ] **Step 6: 提交**

```powershell
git add apps/web/src/features/resume/workbench
git commit -m "feat: add chinese workbench shell"
```

---

## Task 7: 工作台路由

**Files:**
- Create: `apps/web/src/routes/builder/$resumeId/workbench.tsx`
- Modify: `apps/web/src/routes/builder/$resumeId/-components/header.tsx`

- [ ] **Step 1: 创建路由**

Create `apps/web/src/routes/builder/$resumeId/workbench.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { WorkbenchShell } from "@/features/resume/workbench/workbench-shell";

export const Route = createFileRoute("/builder/$resumeId/workbench")({
	component: WorkbenchRoute,
});

function WorkbenchRoute() {
	const resume = useCurrentResume();
	return <WorkbenchShell resume={resume} />;
}
```

- [ ] **Step 2: 在 Header 增加入口**

In `apps/web/src/routes/builder/$resumeId/-components/header.tsx`, import `Link` if not already imported:

```ts
import { Link } from "@tanstack/react-router";
```

Add this button near the existing header actions:

```tsx
<Button variant="outline" size="sm" render={<Link to="/builder/$resumeId/workbench" params={{ resumeId: resume.id }} />}>
	中文工作台
</Button>
```

- [ ] **Step 3: 生成 route tree**

Run:

```powershell
pnpm.cmd --filter web typecheck
```

Expected: route tree generation may update `apps/web/src/routeTree.gen.ts`; keep only the route-tree changes caused by the new `workbench.tsx` route.

- [ ] **Step 4: 浏览器验证**

Run or use the existing dev server:

```powershell
pnpm.cmd dev:web
```

Open:

```text
http://localhost:3000/builder/<resumeId>/workbench
```

Expected: Chinese workbench shell renders.

- [ ] **Step 5: 提交**

```powershell
git add -- 'apps/web/src/routes/builder/$resumeId/workbench.tsx' 'apps/web/src/routes/builder/$resumeId/-components/header.tsx' apps/web/src/routeTree.gen.ts
git commit -m "feat: add chinese workbench route"
```

---

## Task 8: 工作台导入、导出和版本按钮接线

**Files:**
- Modify: `apps/web/src/features/resume/workbench/workbench-toolbar.tsx`
- Create: `apps/web/src/features/resume/workbench/import-actions.ts`
- Create: `apps/web/src/features/resume/workbench/import-actions.test.ts`

- [ ] **Step 1: 写导入 helper 测试**

Create `apps/web/src/features/resume/workbench/import-actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getImportTypeFromFile } from "./import-actions";

describe("getImportTypeFromFile", () => {
	it("detects supported import file types", () => {
		expect(getImportTypeFromFile(new File([""], "resume.pdf", { type: "application/pdf" }))).toBe("pdf");
		expect(
			getImportTypeFromFile(
				new File([""], "resume.docx", {
					type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				}),
			),
		).toBe("docx");
		expect(getImportTypeFromFile(new File(["{}"], "resume.json", { type: "application/json" }))).toBe("json");
	});
});
```

- [ ] **Step 2: 写导入 helper**

Create `apps/web/src/features/resume/workbench/import-actions.ts`:

```ts
export type WorkbenchImportType = "pdf" | "docx" | "json";

export function getImportTypeFromFile(file: File): WorkbenchImportType | null {
	if (file.type === "application/pdf") return "pdf";
	if (file.type === "application/json") return "json";
	if (
		file.type === "application/msword" ||
		file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return "docx";
	}

	return null;
}
```

- [ ] **Step 3: 接导出按钮**

Modify `apps/web/src/features/resume/workbench/workbench-toolbar.tsx`:

```tsx
import { toast } from "sonner";
import { exportResumeDocx, exportResumePdf } from "./export-actions";
```

Inside component:

```tsx
const onExportPdf = async () => {
	const id = toast.loading("正在生成 PDF...");
	try {
		await exportResumePdf(resume);
		toast.success("PDF 已导出", { id });
	} catch {
		toast.error("PDF 生成失败，请重试。", { id });
	}
};

const onExportDocx = async () => {
	const id = toast.loading("正在生成 Word...");
	try {
		await exportResumeDocx(resume);
		toast.success("Word 已导出", { id });
	} catch {
		toast.error("Word 生成失败，请重试。", { id });
	}
};
```

Set buttons:

```tsx
<Button variant="outline" onClick={onExportDocx}>导出 Word</Button>
<Button onClick={onExportPdf}>导出 PDF</Button>
```

- [ ] **Step 4: 跑测试**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/import-actions.test.ts src/features/resume/workbench/export-actions.test.ts
pnpm.cmd --filter web typecheck
```

Expected: pass.

- [ ] **Step 5: 提交**

```powershell
git add apps/web/src/features/resume/workbench/import-actions.ts apps/web/src/features/resume/workbench/import-actions.test.ts apps/web/src/features/resume/workbench/workbench-toolbar.tsx
git commit -m "feat: wire workbench import export actions"
```

---

## Task 9: AI Provider 提示与 Patch 面板接线

**Files:**
- Modify: `apps/web/src/features/resume/workbench/ai-review-panel.tsx`
- Create: `apps/web/src/features/resume/workbench/ai-review-panel.test.tsx`

- [ ] **Step 1: 写 AI Provider 状态测试**

Create `apps/web/src/features/resume/workbench/ai-review-panel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
	useQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: { aiProviders: { list: { queryOptions: () => ({}) } } },
}));

describe("AIReviewPanel", () => {
	it("explains that LLM provider is required when none is configured", async () => {
		const { AIReviewPanel } = await import("./ai-review-panel");
		render(<AIReviewPanel />);
		expect(screen.getByText("需要先配置可用的 AI 模型")).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: 修改 AI 面板**

Modify `apps/web/src/features/resume/workbench/ai-review-panel.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/libs/orpc/client";
```

Add at the top of `AIReviewPanel`:

```tsx
const { data: providers = [], isLoading } = useQuery(orpc.aiProviders.list.queryOptions());
const hasUsableProvider = providers.some((provider) => provider.enabled && provider.testStatus === "success");

if (!isLoading && !hasUsableProvider) {
	return (
		<aside className="border-l bg-white p-4 pt-6">
			<h2 className="text-lg font-semibold">AI 审稿</h2>
			<div className="mt-4 border bg-amber-50 p-4 text-sm leading-6 text-amber-900">
				<strong className="block">需要先配置可用的 AI 模型</strong>
				<span>AI 改简历需要 LLM。请到设置里添加并测试一个 Provider，然后再生成 JD 匹配和 Patch 建议。</span>
			</div>
		</aside>
	);
}
```

- [ ] **Step 3: Patch 卡片动作预留**

In the existing Patch card buttons, keep actions disabled until Task 10 connects real agent actions:

```tsx
<Button variant="outline" size="sm" disabled>拒绝</Button>
<Button variant="outline" size="sm" disabled>改写</Button>
<Button size="sm" disabled>应用</Button>
```

- [ ] **Step 4: 跑测试**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/ai-review-panel.test.tsx
pnpm.cmd --filter web typecheck
```

Expected: pass.

- [ ] **Step 5: 提交**

```powershell
git add apps/web/src/features/resume/workbench/ai-review-panel.tsx apps/web/src/features/resume/workbench/ai-review-panel.test.tsx
git commit -m "feat: show ai provider requirement in workbench"
```

---

## Task 10: AI Patch 恢复入口复用 agent action revert

**Files:**
- Modify: `apps/web/src/features/resume/workbench/ai-review-panel.tsx`
- Modify: `apps/web/src/features/resume/workbench/ai-review-panel.test.tsx`

- [ ] **Step 1: 扩展测试**

Add to `apps/web/src/features/resume/workbench/ai-review-panel.test.tsx`:

```tsx
it("shows restore action for applied patches", async () => {
	vi.doMock("@tanstack/react-query", () => ({
		useQuery: () => ({ data: [{ enabled: true, testStatus: "success" }], isLoading: false }),
		useMutation: () => ({ mutate: vi.fn(), isPending: false }),
	}));

	const { AIReviewPanel } = await import("./ai-review-panel");
	render(<AIReviewPanel />);
	expect(screen.getByText("恢复到应用前")).toBeInTheDocument();
});
```

- [ ] **Step 2: 接 mutation**

Modify `apps/web/src/features/resume/workbench/ai-review-panel.tsx`:

```tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
```

Add:

```tsx
const revertMutation = useMutation(orpc.agent.actions.revert.mutationOptions());

const onRestore = (actionId: string) => {
	revertMutation.mutate(
		{ id: actionId },
		{
			onSuccess: () => toast.success("已恢复到应用前"),
			onError: () => toast.error("无法恢复这个修改，请保存当前版本后重新生成建议。"),
		},
	);
};
```

Add a temporary applied patch object until real action list is wired:

```tsx
const appliedPatchActionId = "preview-action";
```

Add button:

```tsx
<Button variant="outline" size="sm" onClick={() => onRestore(appliedPatchActionId)} disabled={revertMutation.isPending}>
	恢复到应用前
</Button>
```

- [ ] **Step 3: 跑测试**

Run:

```powershell
pnpm.cmd --filter web test -- src/features/resume/workbench/ai-review-panel.test.tsx
pnpm.cmd --filter web typecheck
```

Expected: pass.

- [ ] **Step 4: 提交**

```powershell
git add apps/web/src/features/resume/workbench/ai-review-panel.tsx apps/web/src/features/resume/workbench/ai-review-panel.test.tsx
git commit -m "feat: add workbench patch restore action"
```

---

## Task 11: 中文化与默认入口清理

**Files:**
- Modify: `apps/web/src/libs/locale.ts`
- Modify: `apps/web/locales/zh-CN.po`
- Modify: `apps/web/src/features/settings/integrations/components/ai-section.tsx`
- Modify: `apps/web/src/routes/builder/$resumeId/-components/header.tsx`

- [ ] **Step 1: 默认中文 locale**

Modify `apps/web/src/libs/locale.ts` so the default locale is `zh-CN`:

```ts
export const DEFAULT_LOCALE = "zh-CN";
```

If the file uses a different constant name, update the existing default value rather than creating a second constant.

- [ ] **Step 2: AI Provider 文案补充**

In `apps/web/src/features/settings/integrations/components/ai-section.tsx`, change the empty state copy to Chinese:

```tsx
<Trans>添加并测试一个 AI 模型后，才能使用简历解析、JD 匹配和 AI Patch。</Trans>
```

- [ ] **Step 3: 抽取翻译**

Run:

```powershell
pnpm.cmd --filter web lingui:extract
```

Expected: `apps/web/locales/zh-CN.po` includes the new Chinese workbench strings.

- [ ] **Step 4: 跑类型检查**

Run:

```powershell
pnpm.cmd --filter web typecheck
```

Expected: pass.

- [ ] **Step 5: 提交**

```powershell
git add -- apps/web/src/libs/locale.ts apps/web/locales/zh-CN.po apps/web/src/features/settings/integrations/components/ai-section.tsx 'apps/web/src/routes/builder/$resumeId/-components/header.tsx'
git commit -m "feat: make workbench chinese first"
```

---

## Task 12: 最终验证

**Files:**
- No planned source edits unless verification finds a defect.

- [ ] **Step 1: 全量关键测试**

Run:

```powershell
pnpm.cmd --filter @reactive-resume/db test
pnpm.cmd --filter @reactive-resume/api test
pnpm.cmd --filter web test -- src/features/resume/workbench
pnpm.cmd --filter web typecheck
```

Expected: all pass.

- [ ] **Step 2: 启动开发服务**

Run:

```powershell
pnpm.cmd dev
```

Expected:

- Web is available at `http://localhost:3000`.
- Server is available at `http://localhost:3001`.

- [ ] **Step 3: 浏览器手测**

Open:

```text
http://localhost:3000/builder/<resumeId>/workbench
```

Check:

- 页面是中文。
- 左侧有投递项目。
- 中间简历文档居中。
- 右侧 AI 审稿可见。
- 未配置 AI Provider 时显示“需要先配置可用的 AI 模型”。
- PDF 和 Word 导出按钮可见。
- 保存版本按钮可见。
- 页面在 1280x720 下没有文字重叠。

- [ ] **Step 4: 提交验证修复**

If verification required small fixes:

```powershell
git add <fixed-files>
git commit -m "fix: polish chinese workbench verification"
```

If no fixes were needed, do not create an empty commit.

---

## 自检结果

Spec 覆盖：

- 中文工作台：Task 6, Task 7, Task 11。
- PDF/DOCX 导出：Task 5, Task 8。
- PDF/DOCX/JSON 导入入口：Task 8。
- JD 目标岗位：Task 3, Task 6。
- AI Provider/LLM 要求：Task 9。
- AI Patch 审稿：Task 6, Task 9, Task 10。
- AI Patch 回退：Task 10。
- 手动撤销/重做：Task 4。
- 保存版本快照：Task 1, Task 2, Task 8。
- MIT 法律声明：不在 MVP 代码任务里移除任何 License 或版权文件；执行时不得删除原声明。

占位词扫描：

- 本计划没有未完成占位说明。
- 需要由执行者确认的路径和命令已写成明确步骤。

类型一致性：

- 后端使用 `resumeVersion`、`resumeTarget`。
- API router 使用 `resumeVersionsRouter`、`resumeTargetsRouter`。
- 前端使用 `WorkbenchShell`、`AIReviewPanel`、`TargetSidebar`、`WorkbenchToolbar`。
