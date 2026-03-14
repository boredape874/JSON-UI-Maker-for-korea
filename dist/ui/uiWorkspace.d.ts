import { StringObjectMap } from "../converter.js";
import { WorkspaceDefinition } from "../upload.js";
export interface UiWorkspaceCandidate {
    id: string;
    namespace: string;
    key: string;
    sourceFile: string;
    type: string;
}
export interface UiWorkspaceData {
    definitions: Map<string, WorkspaceDefinition>;
    candidates: UiWorkspaceCandidate[];
    files: string[];
}
export declare function loadUiWorkspace(files: File[]): Promise<UiWorkspaceData>;
export declare function createSyntheticFormFromWorkspace(workspace: UiWorkspaceData, candidateId: string): {
    parsed: StringObjectMap;
    uploadedFileName: string;
} | undefined;
