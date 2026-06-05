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
