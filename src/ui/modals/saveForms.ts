import { config } from "../../CONFIG.js";
import { openSaveFormsModal } from "../react/modalBridge.js";

export function saveFormsModal(): void {
    openSaveFormsModal(config.formFileName);
}
