import { FormUploader } from "../upload.js";
import { StringUtil } from "../util/stringUtil.js";
function isRenderableControl(value) {
    return typeof value === "object" && value !== null && ("type" in value || "controls" in value);
}
export async function loadUiWorkspace(files) {
    const definitions = new Map();
    const candidates = [];
    const jsonFiles = files.filter((file) => file.name.endsWith(".json"));
    for (const file of jsonFiles) {
        const rawText = await file.text();
        const parsed = FormUploader.parseJsonWithComments(rawText);
        const namespace = typeof parsed.namespace === "string" ? parsed.namespace : StringUtil.toSafeNamespace(file.name);
        const relativePath = file.webkitRelativePath || file.name;
        for (const [rawKey, rawValue] of Object.entries(parsed)) {
            if (rawKey === "namespace" || rawKey === "config")
                continue;
            if (!rawValue || typeof rawValue !== "object")
                continue;
            const { baseKey, type } = FormUploader.parseControlKey(rawKey);
            const id = `${namespace}.${baseKey}`;
            const definition = {
                id,
                namespace,
                key: baseKey,
                rawKey,
                control: rawValue,
                sourceFile: relativePath,
            };
            definitions.set(id, definition);
            if (!isRenderableControl(rawValue))
                continue;
            candidates.push({
                id,
                namespace,
                key: baseKey,
                sourceFile: relativePath,
                type: typeof rawValue.type === "string" ? rawValue.type : type,
            });
        }
    }
    return {
        definitions,
        candidates: candidates.sort((a, b) => a.id.localeCompare(b.id)),
        files: jsonFiles.map((file) => file.webkitRelativePath || file.name).sort((a, b) => a.localeCompare(b)),
    };
}
export function createSyntheticFormFromWorkspace(workspace, candidateId) {
    const selected = workspace.definitions.get(candidateId);
    if (!selected)
        return undefined;
    const parsed = {
        namespace: selected.namespace,
    };
    if (selected.key === selected.namespace) {
        parsed[selected.namespace] = structuredClone(selected.control);
    }
    else {
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
//# sourceMappingURL=uiWorkspace.js.map