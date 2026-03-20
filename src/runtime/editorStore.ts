export interface GlobalElementMapValue {
    getMainHTMLElement(): HTMLElement;
    drag?(e: MouseEvent): void;
    stopDrag?(): void;
    resize?(e: MouseEvent): void;
    stopResize?(e: MouseEvent): void;
    [key: string]: any;
}

export interface ResizeableElementRuntime {
    resize(e: MouseEvent): void;
    stopResize(e: MouseEvent): void;
}

export const GLOBAL_ELEMENT_MAP: Map<string, GlobalElementMapValue> = new Map();

export let GLOBAL_FILE_SYSTEM: any = {};
export function setFileSystem(fs: any): void {
    GLOBAL_FILE_SYSTEM = fs;
}

export let draggedElement: GlobalElementMapValue | undefined = undefined;
export function setDraggedElement(classElement: GlobalElementMapValue | undefined): void {
    draggedElement = classElement;
}

export let resizedElement: ResizeableElementRuntime | undefined = undefined;
export function setResizedElement(classElement: ResizeableElementRuntime | undefined): void {
    resizedElement = classElement;
}
