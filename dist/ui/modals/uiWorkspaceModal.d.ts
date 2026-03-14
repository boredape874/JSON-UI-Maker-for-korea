import { UiWorkspaceData } from "../uiWorkspace.js";
export interface UiWorkspaceSelection {
    candidateId: string;
}
export declare function uiWorkspaceModal(workspace: UiWorkspaceData): Promise<UiWorkspaceSelection | undefined>;
