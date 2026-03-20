import { config } from "../../CONFIG.js";
import { openCreateFormModal } from "../react/modalBridge.js";

export async function createFormModal(): Promise<Record<string, any>> {
    return openCreateFormModal({
        formName: config.formFileName,
        titleFlag: config.title_flag,
    });
}
