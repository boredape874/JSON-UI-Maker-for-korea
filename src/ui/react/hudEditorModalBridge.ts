type HudEditorBridgeEvent =
    | { type: "open" }
    | { type: "close" };

const hudEditorModalBridge = new EventTarget();

function emitHudEditorModalBridge(detail: HudEditorBridgeEvent): void {
    hudEditorModalBridge.dispatchEvent(new CustomEvent<HudEditorBridgeEvent>("hud-editor-modal-bridge", { detail }));
}

export function subscribeHudEditorModalBridge(listener: (event: HudEditorBridgeEvent) => void): () => void {
    const wrapped = (event: Event) => listener((event as CustomEvent<HudEditorBridgeEvent>).detail);
    hudEditorModalBridge.addEventListener("hud-editor-modal-bridge", wrapped);
    return () => hudEditorModalBridge.removeEventListener("hud-editor-modal-bridge", wrapped);
}

export function openHudEditorBridge(): void {
    emitHudEditorModalBridge({ type: "open" });
}

export function closeHudEditorBridge(): void {
    emitHudEditorModalBridge({ type: "close" });
}
