import { describe, expect, it, vi } from "vitest";

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
vi.mock("./service", () => ({ resumeService: { getById: vi.fn() } }));

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
