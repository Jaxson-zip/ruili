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
	const maxLength = Math.max(1, limit);
	let stack = [clone(initial)];
	let index = 0;

	return {
		push(snapshot) {
			stack = [...stack.slice(0, index + 1), clone(snapshot)].slice(-maxLength);
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

	if (initial !== undefined && !historyRef.current) historyRef.current = createUndoRedoHistory<T>(initial);

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
