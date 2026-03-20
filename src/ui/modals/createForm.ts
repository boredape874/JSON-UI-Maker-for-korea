import { openCreateFormModal } from "../react/modalBridge.js";

export async function createFormModal(): Promise<Record<string, any>> {
    return openCreateFormModal();
}
