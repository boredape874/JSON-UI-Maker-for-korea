import type { DraggableButton } from "../elements/button.js";
import type { DraggableCanvas } from "../elements/canvas.js";
import type { DraggableCollectionPanel } from "../elements/collectionPanel.js";
import type { DraggableLabel } from "../elements/label.js";
import type { DraggablePanel } from "../elements/panel.js";
import type { ResizeableElements } from "../elements/sharedElement.js";
import type { DraggableScrollingPanel } from "../elements/scrollingPanel.js";
import type { DraggableStackPanel } from "../elements/stackPanel.js";

export type GlobalElementMapValue =
    | DraggableButton
    | DraggableCanvas
    | DraggablePanel
    | DraggableCollectionPanel
    | DraggableLabel
    | DraggableScrollingPanel
    | DraggableStackPanel;

export const GLOBAL_ELEMENT_MAP: Map<string, GlobalElementMapValue> = new Map();

export let GLOBAL_FILE_SYSTEM: any = {};
export function setFileSystem(fs: any): void {
    GLOBAL_FILE_SYSTEM = fs;
}

export let draggedElement: GlobalElementMapValue | undefined = undefined;
export function setDraggedElement(classElement: GlobalElementMapValue | undefined): void {
    draggedElement = classElement;
}

export let resizedElement: ResizeableElements | undefined = undefined;
export function setResizedElement(classElement: ResizeableElements | undefined): void {
    resizedElement = classElement;
}
