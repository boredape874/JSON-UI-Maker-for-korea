import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "../../lib/assetUrl.js";
import { closeChestUiEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

type ChestScreenType = "small" | "large";
type BuilderBlockMode = "ref" | "inline";

type RouteRule = {
    id: string;
    screen: ChestScreenType;
    title: string;
    targetRef: string;
};

type BuilderBlock = {
    id: string;
    name: string;
    mode: BuilderBlockMode;
    reference: string;
    controlType: string;
    overridesText: string;
};

type ChestStructureState = {
    fileName: string;
    namespace: string;
    panelName: string;
    includeBottomInventory: boolean;
    includeHotbar: boolean;
    includeTakeProgress: boolean;
    includeFlyingItemRenderer: boolean;
    routes: RouteRule[];
    blocks: BuilderBlock[];
};

type PreviewBlock = {
    id: string;
    label: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

const STRUCTURE_STORAGE_KEY = "json_ui_maker:chest_structure_builder:v2";
const PREVIEW_WIDTH = 176;
const SMALL_TOP_HEIGHT = 66;
const LARGE_TOP_HEIGHT = 120;
const BOTTOM_HEIGHT = 92;

function createId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultState(): ChestStructureState {
    return {
        fileName: "custom_panel.json",
        namespace: "custom_chest",
        panelName: "custom_panel",
        includeBottomInventory: true,
        includeHotbar: true,
        includeTakeProgress: true,
        includeFlyingItemRenderer: true,
        routes: [
            {
                id: createId("route"),
                screen: "large",
                title: "커스텀 상자",
                targetRef: "custom_chest.custom_panel"
            }
        ],
        blocks: [
            {
                id: createId("block"),
                name: "recipe_back_image",
                mode: "inline",
                reference: "",
                controlType: "image",
                overridesText: "{\n  \"size\": [175, 150],\n  \"offset\": [-106, 0],\n  \"texture\": \"textures/gui/recipe/cooking_recipe\"\n}"
            },
            {
                id: createId("block"),
                name: "recipe_scrolling_panel",
                mode: "inline",
                reference: "",
                controlType: "scrolling_panel",
                overridesText: "{\n  \"size\": [160, 146],\n  \"offset\": [-106, 0],\n  \"$scroll_view_port_size\": [150, 146],\n  \"$scrolling_content\": \"custom_chest.recipe_grid_panel\"\n}"
            },
            {
                id: createId("block"),
                name: "cooking_grid",
                mode: "inline",
                reference: "",
                controlType: "grid",
                overridesText: "{\n  \"size\": [196, 18],\n  \"offset\": [12, 12],\n  \"grid_dimensions\": [11, 1],\n  \"collection_name\": \"container_items\"\n}"
            }
        ]
    };
}

function loadStructureState(): ChestStructureState {
    try {
        const raw = localStorage.getItem(STRUCTURE_STORAGE_KEY);
        if (!raw) return createDefaultState();
        const parsed = JSON.parse(raw) as ChestStructureState;
        if (!parsed || !Array.isArray(parsed.routes) || !Array.isArray(parsed.blocks)) {
            return createDefaultState();
        }
        return parsed;
    } catch {
        return createDefaultState();
    }
}

function saveStructureState(state: ChestStructureState) {
    localStorage.setItem(STRUCTURE_STORAGE_KEY, JSON.stringify(state));
}

function parseObject(text: string): Record<string, unknown> {
    if (!text.trim()) return {};
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("Overrides JSON은 객체여야 합니다.");
    }
    return parsed as Record<string, unknown>;
}

function stringifyObject(value: Record<string, unknown>) {
    return JSON.stringify(value, null, 2);
}

function reorderItems<T extends { id: string }>(items: T[], draggedId: string, targetId: string) {
    if (draggedId === targetId) return items;
    const sourceIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return items;
    const next = [...items];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    return next;
}

function buildBlockControl(block: BuilderBlock) {
    const overrides = parseObject(block.overridesText);
    if (block.mode === "ref") {
        return { [`${block.name}@${block.reference}`]: overrides };
    }
    return {
        [block.name]: {
            type: block.controlType || "panel",
            ...overrides
        }
    };
}

function buildCustomPanelFile(state: ChestStructureState) {
    const controls = state.blocks.map(buildBlockControl);

    if (state.includeBottomInventory) {
        controls.push({ "inventory_panel_bottom_half_with_label@common.inventory_panel_bottom_half_with_label": {} });
    }
    if (state.includeHotbar) {
        controls.push({ "hotbar_grid@common.hotbar_grid_template": {} });
    }
    if (state.includeTakeProgress) {
        controls.push({ "inventory_take_progress_icon_button@common.inventory_take_progress_icon_button": {} });
    }
    if (state.includeFlyingItemRenderer) {
        controls.push({ "flying_item_renderer@common.flying_item_renderer": { layer: 15 } });
    }

    return {
        namespace: state.namespace,
        [state.panelName]: {
            type: "panel",
            controls
        }
    };
}

function buildChestScreenFile(state: ChestStructureState) {
    const buildPanel = (screen: ChestScreenType) => {
        const routes = state.routes.filter((route) => route.screen === screen && route.title.trim());
        if (!routes.length) return undefined;

        const ignoredExpression = `(${routes.map((route) => `($container_ui_title = '${route.title.replace(/'/g, "\\'")}')`).join(" or ")})`;
        const controls: Record<string, unknown>[] = [
            {
                "default_root_panel@common.root_panel": {
                    ignored: ignoredExpression
                }
            }
        ];

        for (const route of routes) {
            controls.push({
                [`route_${route.id}@${route.targetRef}`]: {
                    ignored: `(($container_ui_title - '${route.title.replace(/'/g, "\\'")}') = $container_ui_title)`
                }
            });
        }

        return {
            type: "panel",
            "$container_ui_title": "$container_title",
            controls
        };
    };

    const output: Record<string, unknown> = { namespace: "chest" };
    const largePanel = buildPanel("large");
    const smallPanel = buildPanel("small");
    if (largePanel) output.large_chest_panel = largePanel;
    if (smallPanel) output.small_chest_panel = smallPanel;
    return output;
}

function buildUiDefsFile(state: ChestStructureState) {
    return {
        ui_defs: [
            "ui/chest_screen.json",
            `ui/${state.fileName}`
        ]
    };
}

function getPreviewBlocks(blocks: BuilderBlock[]): PreviewBlock[] {
    return blocks.map((block) => {
        const overrides = parseObject(block.overridesText);
        const offset = Array.isArray(overrides.offset) ? overrides.offset : [0, 0];
        const size = Array.isArray(overrides.size) ? overrides.size : [80, 24];
        return {
            id: block.id,
            label: block.name,
            type: block.mode === "ref" ? block.reference || "reference" : block.controlType || "panel",
            x: Number(offset[0] ?? 0),
            y: Number(offset[1] ?? 0),
            width: Math.max(40, Number(size[0] ?? 80)),
            height: Math.max(18, Number(size[1] ?? 24))
        };
    });
}

function updateBlockOffset(block: BuilderBlock, x: number, y: number): BuilderBlock {
    const overrides = parseObject(block.overridesText);
    overrides.offset = [Math.round(x), Math.round(y)];
    return {
        ...block,
        overridesText: stringifyObject(overrides)
    };
}

export function ChestUiEditorModal() {
    const [open, setOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [builderOpen, setBuilderOpen] = useState(true);
    const [state, setState] = useState<ChestStructureState>(() => loadStructureState());
    const [error, setError] = useState("");
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-chest-ui-editor") setOpen(true);
        if (event.type === "close-chest-ui-editor") setOpen(false);
    }), []);

    useEffect(() => {
        saveStructureState(state);
        try {
            buildCustomPanelFile(state);
            buildChestScreenFile(state);
            buildUiDefsFile(state);
            getPreviewBlocks(state.blocks);
            setError("");
        } catch (buildError) {
            setError(buildError instanceof Error ? buildError.message : "구조 JSON을 확인하세요.");
        }
    }, [state]);

    useEffect(() => {
        const handleMove = (event: MouseEvent) => {
            if (!draggingBlockId || !previewRef.current) return;
            const rect = previewRef.current.getBoundingClientRect();
            const nextX = event.clientX - rect.left - dragOffsetRef.current.x;
            const nextY = event.clientY - rect.top - dragOffsetRef.current.y;

            setState((current) => ({
                ...current,
                blocks: current.blocks.map((block) => block.id === draggingBlockId ? updateBlockOffset(block, nextX, nextY) : block)
            }));
        };

        const handleUp = () => {
            setDraggingBlockId(null);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [draggingBlockId]);

    const iframeSrc = useMemo(() => assetUrl(`chest-ui-editor/index.html?v=${reloadKey}`), [reloadKey]);
    const previewBlocks = useMemo(() => {
        try {
            return getPreviewBlocks(state.blocks);
        } catch {
            return [];
        }
    }, [state.blocks]);
    const previewHeight = Math.max(
        state.routes.some((route) => route.screen === "large") ? LARGE_TOP_HEIGHT : SMALL_TOP_HEIGHT,
        ...previewBlocks.map((block) => block.y + block.height + 12),
        SMALL_TOP_HEIGHT
    );
    const previewPanelHeight = previewHeight + (state.includeBottomInventory ? BOTTOM_HEIGHT + 12 : 0) + 24;
    const uiDefsJson = useMemo(() => JSON.stringify(buildUiDefsFile(state), null, 2), [state]);
    const chestScreenJson = useMemo(() => {
        try {
            return JSON.stringify(buildChestScreenFile(state), null, 2);
        } catch {
            return "";
        }
    }, [state]);
    const customPanelJson = useMemo(() => {
        try {
            return JSON.stringify(buildCustomPanelFile(state), null, 2);
        } catch {
            return "";
        }
    }, [state]);

    if (!open) {
        return null;
    }

    return (
        <div
            id="chestUiEditorScreen"
            className="chestUiEditorScreen chestUiEditorScreen--builder"
            style={{ display: open ? "flex" : "none" }}
        >
            <div className="chestUiEditorScreenHeader">
                <div className="chestUiEditorScreenTitle">Chest UI Editor (New Beta)</div>
                <div className="chestUiEditorScreenActions">
                    <button type="button" className="propertyInputButton" onClick={() => setBuilderOpen((value) => !value)}>
                        {builderOpen ? "구조 빌더 닫기" : "구조 빌더 열기"}
                    </button>
                    <button type="button" className="propertyInputButton" onClick={() => setReloadKey((value) => value + 1)}>
                        새로고침
                    </button>
                    <a className="propertyInputButton chestUiEditorExternalLink" href={iframeSrc} target="_blank" rel="noreferrer">
                        새 탭 열기
                    </a>
                    <button type="button" className="propertyInputButton chestUiEditorScreenClose" onClick={() => closeChestUiEditorModalBridge()}>
                        닫기
                    </button>
                </div>
            </div>

            <div className="chestUiEditorBuilderLayout">
                <div className="chestUiEditorEmbeddedBody">
                    <iframe key={reloadKey} className="chestUiEditorIframe" src={iframeSrc} title="Chest UI Editor (New Beta)" />
                </div>

                {builderOpen ? (
                    <aside className="chestUiStructureSidebar">
                        <section className="chestUiStructureSection">
                            <h3>구조 빌더</h3>
                            <p className="chestUiStructureHint">
                                오른쪽에서 `router`, `common 하단부`, `custom panel block`을 조합합니다.
                                블록은 아래 미리보기에서 직접 드래그해 위치를 바꿀 수 있습니다.
                            </p>
                            {error ? <div className="chestUiStructureError">{error}</div> : null}
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>실시간 구조 미리보기</h3>
                            <div ref={previewRef} className="chestUiStructurePreviewArea">
                                <div className="chestUiStructurePreviewPanel" style={{ height: previewPanelHeight }}>
                                    <div className="chestUiStructurePreviewTop" style={{ height: previewHeight }}>
                                        {previewBlocks.map((block) => (
                                            <div
                                                key={block.id}
                                                className={`chestUiStructurePreviewBlock ${draggingBlockId === block.id ? "is-dragging" : ""}`}
                                                style={{ left: block.x, top: block.y, width: block.width, height: block.height }}
                                                onMouseDown={(event) => {
                                                    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                                                    dragOffsetRef.current = {
                                                        x: event.clientX - rect.left,
                                                        y: event.clientY - rect.top
                                                    };
                                                    setDraggingBlockId(block.id);
                                                }}
                                            >
                                                <strong>{block.label}</strong>
                                                <span>{block.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {state.includeBottomInventory ? (
                                        <div className="chestUiStructurePreviewBottom">
                                            <div className="chestUiStructurePreviewBottomLabel">common.inventory_panel_bottom_half_with_label</div>
                                            <div className="chestUiStructurePreviewInventoryGrid">
                                                {Array.from({ length: 27 }).map((_, index) => (
                                                    <div key={index} className="chestUiStructurePreviewCell" />
                                                ))}
                                            </div>
                                            {state.includeHotbar ? (
                                                <div className="chestUiStructurePreviewHotbar">
                                                    {Array.from({ length: 9 }).map((_, index) => (
                                                        <div key={index} className="chestUiStructurePreviewCell" />
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>파일 설정</h3>
                            <label className="chestUiStructureField">
                                <span>파일명</span>
                                <input value={state.fileName} onChange={(event) => setState((current) => ({ ...current, fileName: event.target.value }))} />
                            </label>
                            <label className="chestUiStructureField">
                                <span>Namespace</span>
                                <input value={state.namespace} onChange={(event) => setState((current) => ({ ...current, namespace: event.target.value }))} />
                            </label>
                            <label className="chestUiStructureField">
                                <span>최상위 Panel 이름</span>
                                <input value={state.panelName} onChange={(event) => setState((current) => ({ ...current, panelName: event.target.value }))} />
                            </label>
                        </section>

                        <section className="chestUiStructureSection">
                            <div className="chestUiStructureSectionHeader">
                                <h3>라우터 규칙</h3>
                                <button
                                    type="button"
                                    className="propertyInputButton"
                                    onClick={() => setState((current) => ({
                                        ...current,
                                        routes: [...current.routes, { id: createId("route"), screen: "large", title: "", targetRef: `${current.namespace}.${current.panelName}` }]
                                    }))}
                                >
                                    규칙 추가
                                </button>
                            </div>
                            {state.routes.map((route) => (
                                <div key={route.id} className="chestUiStructureCard">
                                    <label className="chestUiStructureField">
                                        <span>Screen</span>
                                        <select
                                            value={route.screen}
                                            onChange={(event) => setState((current) => ({
                                                ...current,
                                                routes: current.routes.map((item) => item.id === route.id ? { ...item, screen: event.target.value as ChestScreenType } : item)
                                            }))}
                                        >
                                            <option value="large">large_chest_panel</option>
                                            <option value="small">small_chest_panel</option>
                                        </select>
                                    </label>
                                    <label className="chestUiStructureField">
                                        <span>제목</span>
                                        <input
                                            value={route.title}
                                            onChange={(event) => setState((current) => ({
                                                ...current,
                                                routes: current.routes.map((item) => item.id === route.id ? { ...item, title: event.target.value } : item)
                                            }))}
                                        />
                                    </label>
                                    <label className="chestUiStructureField">
                                        <span>대상 Control Ref</span>
                                        <input
                                            value={route.targetRef}
                                            onChange={(event) => setState((current) => ({
                                                ...current,
                                                routes: current.routes.map((item) => item.id === route.id ? { ...item, targetRef: event.target.value } : item)
                                            }))}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="propertyInputButton"
                                        onClick={() => setState((current) => ({ ...current, routes: current.routes.filter((item) => item.id !== route.id) }))}
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </section>

                        <section className="chestUiStructureSection">
                            <div className="chestUiStructureSectionHeader">
                                <h3>커스텀 Panel 블록</h3>
                                <button
                                    type="button"
                                    className="propertyInputButton"
                                    onClick={() => setState((current) => ({
                                        ...current,
                                        blocks: [...current.blocks, {
                                            id: createId("block"),
                                            name: `block_${current.blocks.length + 1}`,
                                            mode: "inline",
                                            reference: "",
                                            controlType: "panel",
                                            overridesText: "{\n  \"size\": [80, 24],\n  \"offset\": [0, 0]\n}"
                                        }]
                                    }))}
                                >
                                    블록 추가
                                </button>
                            </div>
                            {state.blocks.map((block) => (
                                <div
                                    key={block.id}
                                    className="chestUiStructureCard"
                                    draggable
                                    onDragStart={() => setDraggingCardId(block.id)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => {
                                        if (!draggingCardId) return;
                                        setState((current) => ({ ...current, blocks: reorderItems(current.blocks, draggingCardId, block.id) }));
                                        setDraggingCardId(null);
                                    }}
                                >
                                    <label className="chestUiStructureField">
                                        <span>이름</span>
                                        <input
                                            value={block.name}
                                            onChange={(event) => setState((current) => ({
                                                ...current,
                                                blocks: current.blocks.map((item) => item.id === block.id ? { ...item, name: event.target.value } : item)
                                            }))}
                                        />
                                    </label>
                                    <label className="chestUiStructureField">
                                        <span>모드</span>
                                        <select
                                            value={block.mode}
                                            onChange={(event) => setState((current) => ({
                                                ...current,
                                                blocks: current.blocks.map((item) => item.id === block.id ? { ...item, mode: event.target.value as BuilderBlockMode } : item)
                                            }))}
                                        >
                                            <option value="ref">Reference</option>
                                            <option value="inline">Inline Control</option>
                                        </select>
                                    </label>
                                    {block.mode === "ref" ? (
                                        <label className="chestUiStructureField">
                                            <span>Reference</span>
                                            <input
                                                value={block.reference}
                                                onChange={(event) => setState((current) => ({
                                                    ...current,
                                                    blocks: current.blocks.map((item) => item.id === block.id ? { ...item, reference: event.target.value } : item)
                                                }))}
                                            />
                                        </label>
                                    ) : (
                                        <label className="chestUiStructureField">
                                            <span>Control Type</span>
                                            <input
                                                value={block.controlType}
                                                onChange={(event) => setState((current) => ({
                                                    ...current,
                                                    blocks: current.blocks.map((item) => item.id === block.id ? { ...item, controlType: event.target.value } : item)
                                                }))}
                                            />
                                        </label>
                                    )}
                                    <label className="chestUiStructureField">
                                        <span>Overrides JSON</span>
                                        <textarea
                                            value={block.overridesText}
                                            onChange={(event) => setState((current) => ({
                                                ...current,
                                                blocks: current.blocks.map((item) => item.id === block.id ? { ...item, overridesText: event.target.value } : item)
                                            }))}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="propertyInputButton"
                                        onClick={() => setState((current) => ({ ...current, blocks: current.blocks.filter((item) => item.id !== block.id) }))}
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>공통 하단부</h3>
                            <label className="chestUiStructureCheck"><input type="checkbox" checked={state.includeBottomInventory} onChange={(event) => setState((current) => ({ ...current, includeBottomInventory: event.target.checked }))} /> inventory_panel_bottom_half_with_label</label>
                            <label className="chestUiStructureCheck"><input type="checkbox" checked={state.includeHotbar} onChange={(event) => setState((current) => ({ ...current, includeHotbar: event.target.checked }))} /> hotbar_grid_template</label>
                            <label className="chestUiStructureCheck"><input type="checkbox" checked={state.includeTakeProgress} onChange={(event) => setState((current) => ({ ...current, includeTakeProgress: event.target.checked }))} /> inventory_take_progress_icon_button</label>
                            <label className="chestUiStructureCheck"><input type="checkbox" checked={state.includeFlyingItemRenderer} onChange={(event) => setState((current) => ({ ...current, includeFlyingItemRenderer: event.target.checked }))} /> flying_item_renderer</label>
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>출력</h3>
                            <label className="chestUiStructureField"><span>_ui_defs.json</span><textarea readOnly value={uiDefsJson} /></label>
                            <label className="chestUiStructureField"><span>chest_screen.json</span><textarea readOnly value={chestScreenJson} /></label>
                            <label className="chestUiStructureField"><span>{state.fileName}</span><textarea readOnly value={customPanelJson} /></label>
                        </section>
                    </aside>
                ) : null}
            </div>
        </div>
    );
}
