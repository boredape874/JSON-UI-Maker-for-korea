export interface BuilderRuntime {
    deleteSelected(): void;
    delete(id?: string): boolean;
    updateExplorer(): void;
    addLabel(): void;
    addPanel(): void;
    addCollectionPanel(): void;
    addScrollingPanel(): void;
    reset(): void;
    isValidPath(mainHTMLElement: HTMLElement): boolean;
    setSettingToggle(setting: string, value: any): void;
}

let builderRuntime: BuilderRuntime | null = null;

export function setBuilderRuntime(runtime: BuilderRuntime): void {
    builderRuntime = runtime;
}

export function getBuilderRuntime(): BuilderRuntime {
    if (!builderRuntime) {
        throw new Error("Builder runtime has not been initialized yet.");
    }

    return builderRuntime;
}
