export interface CopiedElementData {
    [key: string]: any;
    children?: CopiedElementData[];
}

export let copiedElementData: CopiedElementData | undefined = undefined;

export function setCopiedElementData(data: CopiedElementData | undefined): void {
    copiedElementData = data;
}
