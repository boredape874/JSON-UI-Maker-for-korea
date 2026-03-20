type AuthBridgeEvent =
    | { type: "open-auth-modal"; signup: boolean }
    | { type: "close-auth-modal" };

const authModalBridge = new EventTarget();

function emitAuthModalBridge(detail: AuthBridgeEvent): void {
    authModalBridge.dispatchEvent(new CustomEvent<AuthBridgeEvent>("auth-modal-bridge", { detail }));
}

export function subscribeAuthModalBridge(listener: (event: AuthBridgeEvent) => void): () => void {
    const wrapped = (event: Event) => listener((event as CustomEvent<AuthBridgeEvent>).detail);
    authModalBridge.addEventListener("auth-modal-bridge", wrapped);
    return () => authModalBridge.removeEventListener("auth-modal-bridge", wrapped);
}

export function openAuthModalBridge(signup = false): void {
    emitAuthModalBridge({ type: "open-auth-modal", signup });
}

export function closeAuthModalBridge(): void {
    emitAuthModalBridge({ type: "close-auth-modal" });
}
