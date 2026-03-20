interface UndoRedoOperationLike {
    type: "add" | "delete" | "modify" | "drag" | "resize";
    elementId?: string;
    elementData?: any;
    previousState?: any;
    newState?: any;
}

export interface UndoRedoRuntime {
    push(operation: UndoRedoOperationLike): void;
    undo(): void;
    redo(): void;
    recordResizeStart(elementId: string): void;
    recordResizeEnd(): void;
    recordDragStart(elementId: string): void;
    recordDragEnd(): void;
}

let undoRedoRuntime: UndoRedoRuntime | null = null;

export function setUndoRedoRuntime(runtime: UndoRedoRuntime): void {
    undoRedoRuntime = runtime;
}

export function getUndoRedoRuntime(): UndoRedoRuntime {
    if (!undoRedoRuntime) {
        throw new Error("Undo/redo runtime has not been initialized yet.");
    }

    return undoRedoRuntime;
}
