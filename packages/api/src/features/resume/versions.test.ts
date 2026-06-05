import { describe, expect, it, vi } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

const dbMock = vi.hoisted(() => ({
	insert: vi.fn(),
	select: vi.fn(),
	update: vi.fn(),
}));

const procedureMock = vi.hoisted(() => {
	const procedure = {
		route: vi.fn(() => procedure),
		input: vi.fn(() => procedure),
		output: vi.fn(() => procedure),
		use: vi.fn(() => procedure),
		handler: vi.fn((handler) => handler),
	};

	return procedure;
});

vi.mock("@reactive-resume/db/client", () => ({ db: dbMock }));
vi.mock("../../context", () => ({ protectedProcedure: procedureMock }));
vi.mock("../../middleware/rate-limit", () => ({ resumeMutationRateLimit: vi.fn() }));
vi.mock("./service", () => ({ resumeService: { getById: vi.fn(), update: vi.fn() } }));

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
