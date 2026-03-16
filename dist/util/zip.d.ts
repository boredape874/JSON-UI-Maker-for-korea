export type ZipEntry = {
    name: string;
    data: Uint8Array;
};
export declare function createZipBlob(entries: ZipEntry[]): Blob;
