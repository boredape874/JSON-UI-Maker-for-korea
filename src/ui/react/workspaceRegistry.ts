export type WorkspaceTabId = "visual" | "hud" | "chest" | "glyph";
export type InspectorTabId = "properties" | "script" | "bindings";
export type WorkspaceToolStatus = "ready" | "hosted" | "planned";

export type WorkspaceToolDefinition = {
    id: WorkspaceTabId;
    label: string;
    description: string;
    category: "Core UI" | "HUD" | "Resource Pack";
    status: WorkspaceToolStatus;
};

export const workspaceTools: WorkspaceToolDefinition[] = [
    {
        id: "visual",
        label: "Visual UI",
        description: "기본 JSON UI 캔버스",
        category: "Core UI",
        status: "ready",
    },
    {
        id: "hud",
        label: "HUD Editor",
        description: "title / actionbar / progress bar",
        category: "HUD",
        status: "hosted",
    },
    {
        id: "chest",
        label: "Chest UI Editor",
        description: "container screen / inventory layout",
        category: "Core UI",
        status: "hosted",
    },
    {
        id: "glyph",
        label: "Glyph Editor",
        description: "font glyph / texture helper",
        category: "Resource Pack",
        status: "hosted",
    },
];

export const inspectorTabs: Array<{ id: InspectorTabId; label: string; description: string }> = [
    { id: "properties", label: "Properties", description: "선택한 JSON UI control 속성을 편집합니다." },
    { id: "script", label: "Script", description: "Form generator용 JS/TS helper를 복사합니다." },
    { id: "bindings", label: "Bindings", description: "고급 bindings JSON을 직접 편집합니다." },
];
