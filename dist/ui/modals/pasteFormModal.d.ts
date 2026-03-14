export interface PasteFormResult {
    formText?: string;
    fileName?: string;
}
export declare function pasteFormModal(): Promise<PasteFormResult | undefined>;
