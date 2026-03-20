import { emitUiBridge } from "../ui/reactUiBridge.js";

export let selectedElement: HTMLElement | undefined = undefined;
const selectionBridge = new EventTarget();

export function subscribeSelectionChange(listener: () => void): () => void {
    const wrapped = () => listener();
    selectionBridge.addEventListener("selection-changed", wrapped);
    return () => selectionBridge.removeEventListener("selection-changed", wrapped);
}

export function setSelectedElement(element: HTMLElement | undefined): void {
    selectedElement = element;
    selectionBridge.dispatchEvent(new Event("selection-changed"));
    emitUiBridge("properties-changed");
    emitUiBridge("explorer-changed");
}
