type CreateFormOptions = {
    form_name?: string;
    title_flag?: string;
    [key: string]: any;
};

type PasteFormResult = {
    formText?: string;
    fileName?: string;
};

type UiWorkspaceSelection = {
    candidateId: string;
};

type AddButtonOptions = Record<string, string>;

type CreateFormDefaults = {
    formName: string;
    titleFlag: string;
};

type PasteFormDefaults = {
    fileName?: string;
    formText?: string;
};

type UiWorkspaceCandidateData = {
    id: string;
    type: string;
    sourceFile: string;
};

type UiWorkspaceModalData = {
    filesCount: number;
    candidates: UiWorkspaceCandidateData[];
};

type ModalBridgeEvent =
    | { type: "open-create-form"; resolve: (value: CreateFormOptions) => void; defaults: CreateFormDefaults }
    | { type: "open-paste-form"; resolve: (value: PasteFormResult | undefined) => void; defaults?: PasteFormDefaults }
    | { type: "open-ui-workspace"; resolve: (value: UiWorkspaceSelection | undefined) => void; workspace: UiWorkspaceModalData }
    | { type: "open-add-button"; resolve: (value: AddButtonOptions) => void }
    | { type: "open-help" }
    | { type: "close-help" }
    | { type: "open-settings" }
    | { type: "close-settings" }
    | { type: "open-texture-presets" }
    | { type: "close-texture-presets" }
    | { type: "open-upload-preset" }
    | { type: "close-upload-preset" }
    | { type: "open-preset-management" }
    | { type: "close-preset-management" }
    | { type: "open-save-forms"; currentFormName: string }
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

export function openCreateFormModal(defaults: CreateFormDefaults): Promise<CreateFormOptions> {
    return new Promise((resolve) => {
        emitModalBridge({ type: "open-create-form", resolve, defaults });
    });
}

export function openPasteFormModal(defaults?: PasteFormDefaults): Promise<PasteFormResult | undefined> {
    return new Promise((resolve) => {
        emitModalBridge({ type: "open-paste-form", resolve, defaults });
    });
}

export function openUiWorkspaceModal(workspace: UiWorkspaceModalData): Promise<UiWorkspaceSelection | undefined> {
    return new Promise((resolve) => {
        emitModalBridge({ type: "open-ui-workspace", resolve, workspace });
    });
}

export function openAddButtonModal(): Promise<AddButtonOptions> {
    return new Promise((resolve) => {
        emitModalBridge({ type: "open-add-button", resolve });
    });
}

export function openHelpModal(): void {
    emitModalBridge({ type: "open-help" });
}

export function closeHelpModal(): void {
    emitModalBridge({ type: "close-help" });
}

export function openSettingsModal(): void {
    emitModalBridge({ type: "open-settings" });
}

export function closeSettingsModal(): void {
    emitModalBridge({ type: "close-settings" });
}

export function openTexturePresetsModal(): void {
    emitModalBridge({ type: "open-texture-presets" });
}

export function closeTexturePresetsModal(): void {
    emitModalBridge({ type: "close-texture-presets" });
}

export function openUploadPresetBridge(): void {
    emitModalBridge({ type: "open-upload-preset" });
}

export function closeUploadPresetBridge(): void {
    emitModalBridge({ type: "close-upload-preset" });
}

export function openPresetManagementBridge(): void {
    emitModalBridge({ type: "open-preset-management" });
}

export function closePresetManagementBridge(): void {
    emitModalBridge({ type: "close-preset-management" });
}

export function openSaveFormsModal(currentFormName: string): void {
    emitModalBridge({ type: "open-save-forms", currentFormName });
}

export function closeSaveFormsModal(): void {
    emitModalBridge({ type: "close-save-forms" });
}
