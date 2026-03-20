import { config } from "../../CONFIG.js";
import { openSettingsModal as openSettingsModalBridge } from "../react/modalBridge.js";

export function openSettingsModal(): void {
    openSettingsModalBridge();
}

export function getSettingsSnapshot() {
    return config.settings;
}
