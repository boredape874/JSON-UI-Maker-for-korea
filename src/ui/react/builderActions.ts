type BuilderApi = {
    handleUiTexturesUpload?: () => void;
    uploadForm?: () => void;
    importUiWorkspace?: () => void;
    openPasteFormModal?: () => void;
    openHudEditorModal?: () => void;
    openGlyphEditorModal?: () => void;
    openAuthModal?: (signup?: boolean) => void;
    logout?: () => void;
    openUploadPresetModal?: () => void;
    openPresetManagementModal?: () => void;
    texturePresetsModal?: () => void;
    undo?: () => void;
    redo?: () => void;
    openHelpMenu?: () => void;
    addPanel?: () => void;
    openAddImageMenu?: () => void;
    addButton?: () => void;
    addCollectionPanel?: () => void;
    addLabel?: () => void;
    addScrollingPanel?: () => void;
    reset?: () => void;
    deleteSelected?: () => void;
    openSaveFormsModal?: () => void;
    formatBindingsArea?: () => void;
    setFormIdentity?: (name: string) => boolean;
    generateAndCopyJsonUI?: (type: "copy" | "download") => void;
    downloadFormPackageZip?: (includeServerForm?: boolean) => Promise<void>;
    downloadServerForm?: (type: "copy" | "download") => void;
    downloadCurrentFormImages?: () => Promise<void>;
    downloadCurrentFormImagesZip?: () => Promise<void>;
    downloadLoadedPresetTextures?: () => Promise<void>;
    downloadLoadedPresetTexturesZip?: () => Promise<void>;
};

function getBuilder(): BuilderApi | undefined {
    return (window as { Builder?: BuilderApi }).Builder;
}

function call<K extends keyof BuilderApi>(method: K, ...args: Parameters<NonNullable<BuilderApi[K]>>): ReturnType<NonNullable<BuilderApi[K]>> | undefined {
    const fn = getBuilder()?.[method] as ((...values: unknown[]) => ReturnType<NonNullable<BuilderApi[K]>>) | undefined;
    return fn?.(...args);
}

export const builderActions = {
    handleUiTexturesUpload: () => call("handleUiTexturesUpload"),
    uploadForm: () => call("uploadForm"),
    importUiWorkspace: () => call("importUiWorkspace"),
    openPasteFormModal: () => call("openPasteFormModal"),
    openHudEditorModal: () => call("openHudEditorModal"),
    openGlyphEditorModal: () => call("openGlyphEditorModal"),
    openAuthModal: (signup = false) => call("openAuthModal", signup),
    logout: () => call("logout"),
    openUploadPresetModal: () => call("openUploadPresetModal"),
    openPresetManagementModal: () => call("openPresetManagementModal"),
    texturePresetsModal: () => call("texturePresetsModal"),
    undo: () => call("undo"),
    redo: () => call("redo"),
    openHelpMenu: () => call("openHelpMenu"),
    addPanel: () => call("addPanel"),
    openAddImageMenu: () => call("openAddImageMenu"),
    addButton: () => call("addButton"),
    addCollectionPanel: () => call("addCollectionPanel"),
    addLabel: () => call("addLabel"),
    addScrollingPanel: () => call("addScrollingPanel"),
    reset: () => call("reset"),
    deleteSelected: () => call("deleteSelected"),
    openSaveFormsModal: () => call("openSaveFormsModal"),
    formatBindingsArea: () => call("formatBindingsArea"),
    setFormIdentity: (name: string) => call("setFormIdentity", name) ?? false,
    generateAndCopyJsonUI: (type: "copy" | "download") => call("generateAndCopyJsonUI", type),
    downloadFormPackageZip: (includeServerForm = true) => call("downloadFormPackageZip", includeServerForm),
    downloadServerForm: (type: "copy" | "download") => call("downloadServerForm", type),
    downloadCurrentFormImages: () => call("downloadCurrentFormImages"),
    downloadCurrentFormImagesZip: () => call("downloadCurrentFormImagesZip"),
    downloadLoadedPresetTextures: () => call("downloadLoadedPresetTextures"),
    downloadLoadedPresetTexturesZip: () => call("downloadLoadedPresetTexturesZip"),
};
