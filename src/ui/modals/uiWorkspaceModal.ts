import { UiWorkspaceCandidate, UiWorkspaceData } from "../uiWorkspace.js";
import { openUiWorkspaceModal as openUiWorkspaceModalBridge } from "../react/modalBridge.js";

export interface UiWorkspaceSelection {
    candidateId: string;
}

export async function uiWorkspaceModal(workspace: UiWorkspaceData): Promise<UiWorkspaceSelection | undefined> {
    return openUiWorkspaceModalBridge({
        filesCount: workspace.files.length,
        candidates: workspace.candidates.map((candidate: UiWorkspaceCandidate) => ({
            id: candidate.id,
            type: candidate.type,
            sourceFile: candidate.sourceFile,
        })),
    });
}
