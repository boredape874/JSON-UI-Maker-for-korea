let panelContainer: HTMLElement | null = null;
let isInMainWindow = false;

export function initEditorCanvasRuntime(container: HTMLElement): void {
    panelContainer = container;
    panelContainer.addEventListener("mouseenter", () => {
        isInMainWindow = true;
    });

    panelContainer.addEventListener("mouseleave", () => {
        isInMainWindow = false;
    });
}

export function getPanelContainer(): HTMLElement {
    if (!panelContainer) {
        throw new Error("Panel container is not initialized.");
    }

    return panelContainer;
}

export function getIsInMainWindow(): boolean {
    return isInMainWindow;
}
