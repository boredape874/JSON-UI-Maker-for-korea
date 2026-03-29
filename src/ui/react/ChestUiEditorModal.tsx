import { useEffect, useMemo, useState } from "react";
import { closeChestUiEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

type ChestComponentType =
    | "container_item"
    | "container_item_picture"
    | "progress_bar"
    | "toggle_item"
    | "disabled_slot"
    | "container_type"
    | "image"
    | "label";

type ChestTemplate = {
    id: string;
    name: string;
    description: string;
    width: number;
    height: number;
    previewSkin: "chest" | "stone" | "altar";
    previewBackgroundTexturePath: string;
    previewBackgroundImageUrl?: string;
    previewSlotImageUrl?: string;
    gridColumns?: number;
    gridRows?: number;
    slotSize?: number;
    slotGap?: number;
    gridLeft?: number;
    gridTop?: number;
};

type ChestComponentPreset = {
    id: ChestComponentType;
    name: string;
    description: string;
    defaultWidth: number;
    defaultHeight: number;
    defaultText?: string;
};

type ChestEditorNode = {
    id: string;
    type: ChestComponentType;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    texture: string;
    collectionIndex: number;
    color: string;
};

const GRID_SIZE = 8;

const CHEST_TEMPLATES: ChestTemplate[] = [
    {
        id: "small_chest",
        name: "Small Chest 9x3",
        description: "MCBVanillaResourcePack의 chest_screen.json 기준 9x3 grid 구조",
        width: 960,
        height: 540,
        previewSkin: "chest",
        previewBackgroundTexturePath: "textures/ui/inventory_desktop",
        previewBackgroundImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/inventory_desktop.png",
        previewSlotImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/highlight_slot.png",
        gridColumns: 9,
        gridRows: 3,
        slotSize: 48,
        slotGap: 6,
        gridLeft: 204,
        gridTop: 170,
    },
    {
        id: "large_chest",
        name: "Large Chest 9x6",
        description: "MCBVanillaResourcePack의 chest_screen.json 기준 9x6 grid 구조",
        width: 960,
        height: 600,
        previewSkin: "chest",
        previewBackgroundTexturePath: "textures/ui/inventory_desktop",
        previewBackgroundImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/inventory_desktop.png",
        previewSlotImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/highlight_slot.png",
        gridColumns: 9,
        gridRows: 6,
        slotSize: 48,
        slotGap: 6,
        gridLeft: 204,
        gridTop: 128,
    },
    {
        id: "cooking_pot",
        name: "Cooking Pot",
        description: "조리 슬롯과 진행 바 위주 레이아웃",
        width: 960,
        height: 540,
        previewSkin: "stone",
        previewBackgroundTexturePath: "textures/ui/background_panel",
        previewBackgroundImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/background_panel.png",
        previewSlotImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/control_white.png",
    },
    {
        id: "altar",
        name: "Altar",
        description: "의식/강화형 커스텀 레이아웃",
        width: 960,
        height: 540,
        previewSkin: "altar",
        previewBackgroundTexturePath: "textures/ui/background_panel",
        previewBackgroundImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/background_panel.png",
        previewSlotImageUrl: "https://raw.githubusercontent.com/ZtechNetwork/MCBVanillaResourcePack/master/textures/ui/focus_border_white.png",
    },
];

const CHEST_COMPONENTS: ChestComponentPreset[] = [
    { id: "container_item", name: "Container Item", description: "기본 슬롯", defaultWidth: 48, defaultHeight: 48, defaultText: "slot" },
    { id: "container_item_picture", name: "Container Item + Picture", description: "아이콘 포함 슬롯", defaultWidth: 56, defaultHeight: 56, defaultText: "icon_slot" },
    { id: "progress_bar", name: "Progress Bar", description: "clip 기반 진행 바", defaultWidth: 180, defaultHeight: 18, defaultText: "progress" },
    { id: "toggle_item", name: "On/Off Item", description: "토글형 항목", defaultWidth: 120, defaultHeight: 32, defaultText: "toggle" },
    { id: "disabled_slot", name: "Uninteractable Slot", description: "비활성 슬롯", defaultWidth: 48, defaultHeight: 48, defaultText: "disabled" },
    { id: "container_type", name: "Container Type", description: "컨테이너 타입 표시", defaultWidth: 160, defaultHeight: 30, defaultText: "container_type" },
    { id: "image", name: "Image", description: "장식 이미지", defaultWidth: 96, defaultHeight: 96, defaultText: "image" },
    { id: "label", name: "Label", description: "텍스트 라벨", defaultWidth: 180, defaultHeight: 28, defaultText: "label" },
];

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function snap(value: number): number {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function createNode(preset: ChestComponentPreset, index: number): ChestEditorNode {
    return {
        id: `${preset.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: preset.id,
        name: `${preset.name} ${index + 1}`,
        x: 48 + (index % 4) * 56,
        y: 64 + Math.floor(index / 4) * 56,
        width: preset.defaultWidth,
        height: preset.defaultHeight,
        text: preset.defaultText ?? preset.name,
        texture: "",
        collectionIndex: index,
        color: "#ffffff",
    };
}

function createGridNodes(template: ChestTemplate): ChestEditorNode[] {
    if (!template.gridColumns || !template.gridRows || !template.slotSize) {
        return [];
    }

    const gap = template.slotGap ?? 0;
    const left = template.gridLeft ?? 0;
    const top = template.gridTop ?? 0;
    const total = template.gridColumns * template.gridRows;
    const nodes: ChestEditorNode[] = [];

    for (let index = 0; index < total; index++) {
        const column = index % template.gridColumns;
        const row = Math.floor(index / template.gridColumns);
        nodes.push({
            id: `grid_slot_${template.id}_${index}`,
            type: "container_item",
            name: `Container Item ${index}`,
            x: left + column * (template.slotSize + gap),
            y: top + row * (template.slotSize + gap),
            width: template.slotSize,
            height: template.slotSize,
            text: "",
            texture: "",
            collectionIndex: index,
            color: "#ffffff",
        });
    }

    return nodes;
}

function previewNodeStyle(node: ChestEditorNode): React.CSSProperties {
    if (node.type === "progress_bar") {
        return {
            background: "linear-gradient(90deg, rgba(82,186,255,0.95) 0%, rgba(82,186,255,0.95) 62%, rgba(255,255,255,0.14) 62%, rgba(255,255,255,0.14) 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
        };
    }
    if (node.type === "label" || node.type === "container_type") {
        return {
            background: "rgba(10,14,22,0.45)",
            border: "1px dashed rgba(255,255,255,0.2)",
            color: node.color,
        };
    }
    if (node.type === "image") {
        return {
            background: "linear-gradient(135deg, rgba(255,208,92,0.22), rgba(255,255,255,0.08))",
            border: "1px solid rgba(255,255,255,0.16)",
        };
    }
    if (node.type === "disabled_slot") {
        return {
            background: "linear-gradient(180deg, rgba(66,66,66,0.92), rgba(32,32,32,0.98))",
            border: "1px solid rgba(255,255,255,0.08)",
        };
    }
    return {
        background: "linear-gradient(180deg, rgba(141,116,76,0.96), rgba(79,59,34,0.98))",
        border: "1px solid rgba(255,255,255,0.12)",
    };
}

function previewNodeTextureStyle(node: ChestEditorNode, template: ChestTemplate): React.CSSProperties {
    const textureUrl = node.texture || template.previewSlotImageUrl;
    if (!textureUrl || (node.type !== "container_item" && node.type !== "container_item_picture" && node.type !== "disabled_slot")) {
        return {};
    }

    return {
        backgroundImage: `url("${textureUrl}")`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
    };
}

export function ChestUiEditorModal() {
    const [open, setOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState(CHEST_TEMPLATES[0]?.id ?? "");
    const [selectedTool, setSelectedTool] = useState<ChestComponentType>(CHEST_COMPONENTS[0]?.id ?? "container_item");
    const [nodes, setNodes] = useState<ChestEditorNode[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [backgroundTexturePath, setBackgroundTexturePath] = useState(CHEST_TEMPLATES[0]?.previewBackgroundTexturePath ?? "textures/ui/inventory_desktop");

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-chest-ui-editor") setOpen(true);
        if (event.type === "close-chest-ui-editor") {
            setOpen(false);
            setDraggingId(null);
        }
    }), []);

    const selectedTemplate = useMemo(
        () => CHEST_TEMPLATES.find((entry) => entry.id === selectedTemplateId) ?? CHEST_TEMPLATES[0],
        [selectedTemplateId],
    );
    const selectedPreset = useMemo(
        () => CHEST_COMPONENTS.find((entry) => entry.id === selectedTool) ?? CHEST_COMPONENTS[0],
        [selectedTool],
    );
    const selectedNode = useMemo(
        () => nodes.find((entry) => entry.id === selectedId) ?? null,
        [nodes, selectedId],
    );

    useEffect(() => {
        setBackgroundTexturePath(selectedTemplate.previewBackgroundTexturePath);
    }, [selectedTemplate.previewBackgroundTexturePath]);

    useEffect(() => {
        if (!draggingId || !open) return;

        const handleMouseMove = (event: MouseEvent) => {
            const canvas = document.getElementById("chestUiEditorCanvasInner");
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const node = nodes.find((entry) => entry.id === draggingId);
            if (!node) return;

            const nextX = snap(clamp(event.clientX - rect.left - dragOffset.x, 0, selectedTemplate.width - node.width));
            const nextY = snap(clamp(event.clientY - rect.top - dragOffset.y, 0, selectedTemplate.height - node.height));

            setNodes((prev) => prev.map((entry) => entry.id === draggingId ? { ...entry, x: nextX, y: nextY } : entry));
        };

        const handleMouseUp = () => setDraggingId(null);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingId, dragOffset.x, dragOffset.y, nodes, open, selectedTemplate.height, selectedTemplate.width]);

    const addNode = () => {
        const next = createNode(selectedPreset, nodes.length);
        setNodes((prev) => [...prev, next]);
        setSelectedId(next.id);
    };

    const generateTemplateGrid = () => {
        const nextNodes = createGridNodes(selectedTemplate);
        setNodes(nextNodes);
        setSelectedId(nextNodes[0]?.id ?? null);
    };

    const clearCanvas = () => {
        setNodes([]);
        setSelectedId(null);
    };

    const removeSelected = () => {
        if (!selectedId) return;
        setNodes((prev) => prev.filter((entry) => entry.id !== selectedId));
        setSelectedId(null);
    };

    const updateSelectedNode = (patch: Partial<ChestEditorNode>) => {
        if (!selectedId) return;
        setNodes((prev) => prev.map((entry) => entry.id === selectedId ? { ...entry, ...patch } : entry));
    };

    const exportJson = useMemo(() => {
        const chestGrid = selectedTemplate.gridColumns && selectedTemplate.gridRows ? {
            type: "grid",
            collection_name: "container_items",
            grid_item_template: "common.container_item",
            grid_dimensions: [selectedTemplate.gridColumns, selectedTemplate.gridRows],
            maximum_grid_items: selectedTemplate.gridColumns * selectedTemplate.gridRows,
            size: [
                (selectedTemplate.gridColumns * 18),
                (selectedTemplate.gridRows * 18),
            ],
        } : null;

        return JSON.stringify({
            namespace: "chest",
            source_reference: "MCBVanillaResourcePack/ui/chest_screen.json",
            screen: {
                template: selectedTemplate.id,
                background_texture_hint: backgroundTexturePath,
                controls: [
                    ...(chestGrid ? [{ chest_grid: chestGrid }] : []),
                    ...nodes.map((node) => ({
                        id: node.id,
                        type: node.type,
                        name: node.name,
                        offset: [node.x, node.y],
                        size: [node.width, node.height],
                        text: node.text,
                        texture: node.texture,
                        collection_index: node.collectionIndex,
                        color: node.color,
                    })),
                ],
            },
        }, null, 2);
    }, [backgroundTexturePath, nodes, selectedTemplate]);

    return (
        <div id="chestUiEditorScreen" className="chestUiEditorScreen" style={{ display: open ? "flex" : "none" }}>
            <div className="chestUiEditorScreenHeader">
                <div className="chestUiEditorScreenTitle">Chest UI Editor</div>
                <div className="chestUiEditorScreenActions">
                    <button type="button" className="propertyInputButton" onClick={addNode}>요소 추가</button>
                    <button type="button" className="propertyInputButton" onClick={generateTemplateGrid} disabled={!selectedTemplate.gridColumns}>그리드 슬롯 생성</button>
                    <button type="button" className="propertyInputButton" onClick={clearCanvas}>전체 초기화</button>
                    <button type="button" className="propertyInputButton" onClick={removeSelected} disabled={!selectedId}>선택 삭제</button>
                    <button type="button" className="propertyInputButton chestUiEditorScreenClose" onClick={() => closeChestUiEditorModalBridge()}>닫기</button>
                </div>
            </div>

            <div className="chestUiEditorScreenBody">
                <div className="chestUiEditorSidebar">
                    <div className="chestUiEditorCard">
                        <div className="chestUiEditorSectionTitle">템플릿</div>
                        <select className="modalOptionInput" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                            {CHEST_TEMPLATES.map((entry) => (
                                <option key={entry.id} value={entry.id}>{entry.name}</option>
                            ))}
                        </select>
                        <div className="chestUiEditorHint">{selectedTemplate.description}</div>
                        {selectedTemplate.gridColumns ? (
                            <div className="chestUiEditorHint">
                                grid_dimensions: [{selectedTemplate.gridColumns}, {selectedTemplate.gridRows}] / collection_name: container_items / grid_item_template: common.container_item
                            </div>
                        ) : null}
                    </div>

                    <div className="chestUiEditorCard">
                        <div className="chestUiEditorSectionTitle">배경 참고 경로</div>
                        <input value={backgroundTexturePath} onChange={(event) => setBackgroundTexturePath(event.target.value)} />
                        <div className="chestUiEditorHint">
                            참고 기준: inventory_screen.json의 textures/ui/White, TabTopBackLeftMost 계열
                        </div>
                        {selectedTemplate.previewBackgroundImageUrl ? (
                            <div className="chestUiEditorHint">
                                프리뷰 이미지: {selectedTemplate.previewBackgroundTexturePath}
                            </div>
                        ) : null}
                    </div>

                    <div className="chestUiEditorCard">
                        <div className="chestUiEditorSectionTitle">도구 목록</div>
                        <div className="chestUiEditorList">
                            {CHEST_COMPONENTS.map((entry) => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    className={`hudEditorChannelButton${entry.id === selectedTool ? " hudEditorChannelButtonActive" : ""}`}
                                    onClick={() => setSelectedTool(entry.id)}
                                >
                                    {entry.name}
                                </button>
                            ))}
                        </div>
                        <div className="chestUiEditorHint">{selectedPreset.description}</div>
                    </div>

                    <div className="chestUiEditorCard">
                        <div className="chestUiEditorSectionTitle">배치된 요소</div>
                        <div className="chestUiEditorList">
                            {nodes.map((node) => (
                                <button
                                    key={node.id}
                                    type="button"
                                    className={`hudEditorChannelButton${node.id === selectedId ? " hudEditorChannelButtonActive" : ""}`}
                                    onClick={() => setSelectedId(node.id)}
                                >
                                    {node.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="chestUiEditorCenter">
                    <div className="chestUiEditorCanvasWrap">
                        <div
                            id="chestUiEditorCanvasInner"
                            className={`chestUiEditorCanvasInner chestUiEditorCanvasSkin-${selectedTemplate.previewSkin}`}
                            style={{ width: selectedTemplate.width, height: selectedTemplate.height }}
                            onMouseDown={(event) => {
                                if (event.target === event.currentTarget) {
                                    setSelectedId(null);
                                }
                            }}
                        >
                            {selectedTemplate.previewBackgroundImageUrl ? (
                                <img
                                    className="chestUiEditorCanvasBgImage"
                                    src={selectedTemplate.previewBackgroundImageUrl}
                                    alt={selectedTemplate.name}
                                />
                            ) : null}
                            <div className="chestUiEditorCanvasTopBar"></div>
                            <div className="chestUiEditorCanvasPanelInset"></div>
                            <div className="chestUiEditorCanvasGrid"></div>
                            <div className="chestUiEditorCanvasLabel">{selectedTemplate.name}</div>
                            {nodes.map((node) => (
                                <div
                                    key={node.id}
                                    className={`chestUiEditorNode${node.id === selectedId ? " chestUiEditorNodeSelected" : ""}`}
                                    style={{
                                        left: node.x,
                                        top: node.y,
                                        width: node.width,
                                        height: node.height,
                                        ...previewNodeStyle(node),
                                        ...previewNodeTextureStyle(node, selectedTemplate),
                                    }}
                                    onMouseDown={(event) => {
                                        const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                                        setSelectedId(node.id);
                                        setDraggingId(node.id);
                                        setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
                                        event.stopPropagation();
                                    }}
                                >
                                    <span className="chestUiEditorNodeLabel">{node.text || node.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="chestUiEditorJsonCard">
                        <div className="chestUiEditorSectionTitle">JSON 미리보기</div>
                        <textarea className="hudEditorOutput" spellCheck={false} readOnly value={exportJson}></textarea>
                    </div>
                </div>

                <div className="chestUiEditorInspector">
                    <div className="chestUiEditorCard">
                        <div className="chestUiEditorSectionTitle">인스펙터</div>
                        {selectedNode ? (
                            <div className="chestUiEditorInspectorBody">
                                <label>이름</label>
                                <input value={selectedNode.name} onChange={(event) => updateSelectedNode({ name: event.target.value })} />

                                <label>X</label>
                                <input
                                    type="number"
                                    value={selectedNode.x}
                                    onChange={(event) => updateSelectedNode({ x: snap(clamp(Number.parseInt(event.target.value, 10) || 0, 0, selectedTemplate.width - selectedNode.width)) })}
                                />

                                <label>Y</label>
                                <input
                                    type="number"
                                    value={selectedNode.y}
                                    onChange={(event) => updateSelectedNode({ y: snap(clamp(Number.parseInt(event.target.value, 10) || 0, 0, selectedTemplate.height - selectedNode.height)) })}
                                />

                                <label>너비</label>
                                <input
                                    type="number"
                                    value={selectedNode.width}
                                    onChange={(event) => updateSelectedNode({ width: Math.max(8, Number.parseInt(event.target.value, 10) || 8) })}
                                />

                                <label>높이</label>
                                <input
                                    type="number"
                                    value={selectedNode.height}
                                    onChange={(event) => updateSelectedNode({ height: Math.max(8, Number.parseInt(event.target.value, 10) || 8) })}
                                />

                                <label>텍스트</label>
                                <input value={selectedNode.text} onChange={(event) => updateSelectedNode({ text: event.target.value })} />

                                <label>텍스처 경로</label>
                                <input value={selectedNode.texture} onChange={(event) => updateSelectedNode({ texture: event.target.value })} />

                                <label>Collection Index</label>
                                <input
                                    type="number"
                                    value={selectedNode.collectionIndex}
                                    onChange={(event) => updateSelectedNode({ collectionIndex: Number.parseInt(event.target.value, 10) || 0 })}
                                />

                                <label>색상</label>
                                <input type="color" value={selectedNode.color} onChange={(event) => updateSelectedNode({ color: event.target.value })} />
                            </div>
                        ) : (
                            <div className="chestUiEditorHint">캔버스에서 요소를 선택하거나 왼쪽 도구로 새 요소를 추가하면 여기서 속성을 수정할 수 있습니다.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
