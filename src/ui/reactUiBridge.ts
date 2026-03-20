type UiBridgeEvent = "explorer-changed" | "properties-changed";

const bridge = new EventTarget();

export function emitUiBridge(eventName: UiBridgeEvent): void {
    bridge.dispatchEvent(new Event(eventName));
}

export function subscribeUiBridge(eventName: UiBridgeEvent, listener: () => void): () => void {
    const wrapped = () => listener();
    bridge.addEventListener(eventName, wrapped);
    return () => bridge.removeEventListener(eventName, wrapped);
}
