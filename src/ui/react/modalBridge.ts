type CreateFormOptions = {
    form_name?: string;
    title_flag?: string;
    [key: string]: any;
};

type ModalBridgeEvent =
    | { type: "open-create-form"; resolve: (value: CreateFormOptions) => void }
    | { type: "open-save-forms" }
    | { type: "close-save-forms" };

const modalBridge = new EventTarget();

function emitModalBridge(detail: ModalBridgeEvent): void {
    modalBridge.dispatchEvent(new CustomEvent<ModalBridgeEvent>("modal-bridge", { detail }));
}

export function subscribeModalBridge(listener: (event: ModalBridgeEvent) => void): () => void {
    const wrapped = (event: Event) => listener((event as CustomEvent<ModalBridgeEvent>).detail);
    modalBridge.addEventListener("modal-bridge", wrapped);
    return () => modalBridge.removeEventListener("modal-bridge", wrapped);
}

export function openCreateFormModal(): Promise<CreateFormOptions> {
    return new Promise((resolve) => {
        emitModalBridge({ type: "open-create-form", resolve });
    });
}

export function openSaveFormsModal(): void {
    emitModalBridge({ type: "open-save-forms" });
}

export function closeSaveFormsModal(): void {
    emitModalBridge({ type: "close-save-forms" });
}
