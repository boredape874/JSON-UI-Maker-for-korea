import { StringObjectMap } from "../converter.js";
import { FormUploader, WorkspaceDefinition } from "../upload.js";
import { StringUtil } from "../util/stringUtil.js";

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

function isRenderableControl(value: unknown): value is StringObjectMap {
    return typeof value === "object" && value !== null && ("type" in (value as object) || "controls" in (value as object));
}

export async function loadUiWorkspace(files: File[]): Promise<UiWorkspaceData> {
    const definitions = new Map<string, WorkspaceDefinition>();
    const candidates: UiWorkspaceCandidate[] = [];
    const jsonFiles = files.filter((file) => file.name.endsWith(".json"));

    for (const file of jsonFiles) {
        const rawText = await file.text();
        const parsed = FormUploader.parseJsonWithComments(rawText) as StringObjectMap;
        const namespace = typeof parsed.namespace === "string" ? parsed.namespace : StringUtil.toSafeNamespace(file.name);
        const relativePath = file.webkitRelativePath || file.name;

        for (const [rawKey, rawValue] of Object.entries(parsed)) {
            if (rawKey === "namespace" || rawKey === "config") continue;
            if (!rawValue || typeof rawValue !== "object") continue;

            const { baseKey, type } = FormUploader.parseControlKey(rawKey);
            const id = `${namespace}.${baseKey}`;

            const definition: WorkspaceDefinition = {
                id,
                namespace,
                key: baseKey,
                rawKey,
                control: rawValue as StringObjectMap,
                sourceFile: relativePath,
            };

            definitions.set(id, definition);

            if (!isRenderableControl(rawValue)) continue;

            candidates.push({
                id,
                namespace,
                key: baseKey,
                sourceFile: relativePath,
                type: typeof (rawValue as StringObjectMap).type === "string" ? ((rawValue as StringObjectMap).type as string) : type,
            });
        }
    }

    return {
        definitions,
        candidates: candidates.sort((a, b) => a.id.localeCompare(b.id)),
        files: jsonFiles.map((file) => file.webkitRelativePath || file.name).sort((a, b) => a.localeCompare(b)),
    };
}

export function createSyntheticFormFromWorkspace(
    workspace: UiWorkspaceData,
    candidateId: string
): { parsed: StringObjectMap; uploadedFileName: string } | undefined {
    const selected = workspace.definitions.get(candidateId);
    if (!selected) return undefined;

    const parsed: StringObjectMap = {
        namespace: selected.namespace,
    };

    if (selected.key === selected.namespace) {
        parsed[selected.namespace] = structuredClone(selected.control);
    } else {
        parsed[selected.namespace] = {
            type: "panel",
            size: ["100%", "100%"],
            controls: [
                {
                    [`${selected.key}@${selected.id}`]: {},
                },
            ],
        };
    }

    return {
        parsed,
        uploadedFileName: `${selected.key}.json`,
    };
}
