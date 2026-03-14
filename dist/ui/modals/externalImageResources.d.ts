export interface ExternalImageState {
    png?: ImageData;
    json?: {
        nineslice_size?: number[];
        base_size?: number[];
        [key: string]: any;
    };
}
export interface ExternalRepoInfo {
    owner: string;
    repo: string;
    ref: string;
    htmlUrl: string;
    gitResourceUrl: string;
    licenseName: string | null;
}
export interface ExternalImageEntry {
    repoInfo: ExternalRepoInfo;
    path: string;
    name: string;
    extension: string;
    downloadUrl: string;
    htmlUrl: string;
    jsonDownloadUrl?: string;
    importPath: string;
}
export interface ExternalRepoLoadResult {
    repoInfo: ExternalRepoInfo;
    images: ExternalImageEntry[];
    truncated: boolean;
}
export declare function loadExternalImageRepo(repoInput: string, refInput: string): Promise<ExternalRepoLoadResult>;
export declare function fetchExternalImageState(entry: ExternalImageEntry): Promise<ExternalImageState>;
export declare function downloadExternalImage(entry: ExternalImageEntry): Promise<void>;
