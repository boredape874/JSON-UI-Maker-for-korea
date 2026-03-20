import { openPasteFormModal as openPasteFormModalBridge } from "../react/modalBridge.js";

export interface PasteFormResult {
    formText?: string;
    fileName?: string;
}

export async function pasteFormModal(): Promise<PasteFormResult | undefined> {
    return openPasteFormModalBridge();
}
