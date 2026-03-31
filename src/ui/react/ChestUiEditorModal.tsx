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

type StructureVisualBlock = {
    id: string;
    label: string;
    kind: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

type DragState = {
    blockId: string;
    rect: DOMRect;
    offsetX: number;
    offsetY: number;
};

type VisualConfig = {
    className: string;
    dataset?: Record<string, string>;
    text?: string;
};

const STORAGE_KEY = "json_ui_maker:chest_structure_builder:v3";
const STYLE_ID = "json-ui-maker-structure-style";
const EDITOR_LAYER_ATTR = "data-json-ui-maker-structure-editor";
const PREVIEW_LAYER_ATTR = "data-json-ui-maker-structure-preview";

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

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
                overridesText: JSON.stringify(
                    {
                        size: [175, 150],
                        offset: [-106, 0],
                        texture: "textures/gui/recipe/cooking_recipe"
                    },
                    null,
                    2
                )
            },
            {
                id: createId("block"),
                name: "recipe_scrolling_panel",
                mode: "inline",
                reference: "",
                controlType: "scrolling_panel",
                overridesText: JSON.stringify(
                    {
                        size: [160, 146],
                        offset: [-106, 0],
                        $scroll_view_port_size: [150, 146],
                        $scrolling_content: "custom_chest.recipe_grid_panel"
                    },
                    null,
                    2
                )
            },
            {
                id: createId("block"),
                name: "cooking_grid",
                mode: "inline",
                reference: "",
                controlType: "grid",
                overridesText: JSON.stringify(
                    {
                        size: [196, 18],
                        offset: [12, 12],
                        grid_dimensions: [11, 1],
                        collection_name: "container_items"
                    },
                    null,
                    2
                )
            }
        ]
    };
}

function loadState(): ChestStructureState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
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

function saveState(state: ChestStructureState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function parseObject(text: string): Record<string, unknown> {
    if (!text.trim()) return {};
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("Overrides JSON은 객체 형태여야 합니다.");
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
    const output: Record<string, unknown> = { namespace: "chest" };

    const buildScreenPanel = (screen: ChestScreenType) => {
        const routes = state.routes.filter((route) => route.screen === screen && route.title.trim());
        if (!routes.length) return undefined;

        const titleConditions = routes
            .map((route) => `($container_ui_title = '${route.title.replace(/'/g, "\\'")}')`)
            .join(" or ");

        const controls: Record<string, unknown>[] = [
            {
                "default_root_panel@common.root_panel": {
                    ignored: `(${titleConditions})`
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
            $container_ui_title: "$container_title",
            controls
        };
    };

    const largePanel = buildScreenPanel("large");
    const smallPanel = buildScreenPanel("small");

    if (largePanel) output.large_chest_panel = largePanel;
    if (smallPanel) output.small_chest_panel = smallPanel;

    return output;
}

function buildUiDefsFile(state: ChestStructureState) {
    return {
        ui_defs: ["ui/chest_screen.json", `ui/${state.fileName}`]
    };
}

function getStructureBlocks(blocks: BuilderBlock[]): StructureVisualBlock[] {
    return blocks.map((block) => {
        const overrides = parseObject(block.overridesText);
        const offset = Array.isArray(overrides.offset) ? overrides.offset : [0, 0];
        const size = Array.isArray(overrides.size) ? overrides.size : [80, 24];

        return {
            id: block.id,
            label: block.name,
            kind: block.mode === "ref" ? block.reference || "reference" : block.controlType || "panel",
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

function getVisualConfig(block: BuilderBlock): VisualConfig {
    let overrides: Record<string, unknown> = {};
    try {
        overrides = parseObject(block.overridesText);
    } catch {
        overrides = {};
    }

    const reference = block.reference.toLowerCase();
    const controlType = (block.controlType || "").toLowerCase();
    const texture = typeof overrides.texture === "string" ? overrides.texture : "";
    const text = typeof overrides.text === "string" ? overrides.text : block.name;
    const value = overrides.value == null ? "5" : String(overrides.value);

    if (reference.includes("container_item_with_picture") || controlType === "container_item_with_picture") {
        return {
            className: "container-item-with-picture",
            dataset: {
                picture: typeof overrides.picture === "string" ? overrides.picture : "textures/ui/book_ui"
            }
        };
    }

    if (reference.includes("container_item") || controlType === "container_item") {
        return { className: "container-item" };
    }

    if (reference.includes("progress") || controlType === "progress_bar") {
        return {
            className: "progress-bar",
            dataset: { value }
        };
    }

    if (reference.includes("on_off") || controlType === "on_off_item") {
        return {
            className: `on_off-item${overrides.active ? " active" : ""}`
        };
    }

    if (reference.includes("pot") || controlType === "pot") {
        return {
            className: "pot",
            dataset: {
                texture: texture || "textures/ui/pot/pot"
            }
        };
    }

    if (reference.includes("container_type") || controlType === "container_type") {
        return {
            className: "container-type",
            dataset: {
                type: typeof overrides.container_type === "string" ? overrides.container_type : "0"
            }
        };
    }

    if (reference.includes("label") || controlType === "label") {
        return {
            className: "label",
            text
        };
    }

    if (reference.includes("image") || controlType === "image") {
        return {
            className: "image",
            dataset: texture ? { texture } : undefined
        };
    }

    return {
        className: "json-ui-maker-structure-box",
        text: block.name
    };
}

function ensureStyle(doc: Document) {
    if (doc.getElementById(STYLE_ID)) return;

    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .json-ui-maker-structure-layer {
            position: absolute;
            inset: 0;
            z-index: 25;
            pointer-events: none;
        }
        .json-ui-maker-structure-layer--editor {
            z-index: 35;
        }
        .json-ui-maker-structure-layer--editor .json-ui-maker-structure-box,
        .json-ui-maker-structure-layer--editor .editor-component {
            pointer-events: auto;
            cursor: move;
        }
        .json-ui-maker-structure-box {
            position: absolute;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 2px;
            padding: 4px 6px;
            overflow: hidden;
            border: 1px dashed rgba(96, 191, 255, 0.95);
            border-radius: 6px;
            background: rgba(17, 38, 56, 0.64);
            color: #fff;
            font-size: 10px;
            line-height: 1.15;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.45);
        }
        .json-ui-maker-structure-box strong,
        .json-ui-maker-structure-box span {
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .json-ui-maker-structure-layer--editor .json-ui-maker-structure-box {
            border-style: solid;
            background: rgba(63, 95, 144, 0.62);
            box-shadow: 0 0 0 1px rgba(138, 204, 255, 0.3);
        }
        .json-ui-maker-structure-layer--preview .json-ui-maker-structure-box {
            background: rgba(74, 51, 27, 0.72);
            border-color: rgba(255, 212, 140, 0.82);
        }
        .json-ui-maker-structure-layer--editor .json-ui-maker-structure-box.is-dragging,
        .json-ui-maker-structure-layer--editor .editor-component.is-dragging {
            opacity: 0.72;
            outline: 2px solid rgba(188, 115, 255, 0.9);
        }
    `;

    doc.head.appendChild(style);
}

function ensureStructureLayer(
    doc: Document,
    container: HTMLElement | null,
    attr: string,
    className: string
) {
    if (!container) return null;

    const computedPosition = doc.defaultView?.getComputedStyle(container).position;
    if (!computedPosition || computedPosition === "static") {
        container.style.position = "relative";
    }

    let layer = container.querySelector(`div[${attr}="true"]`);
    if (!(layer instanceof HTMLDivElement)) {
        layer = doc.createElement("div");
        layer.setAttribute(attr, "true");
        layer.className = `json-ui-maker-structure-layer ${className}`;
        container.appendChild(layer);
    }
    return layer;
}

export function ChestUiEditorModal() {
    const [open, setOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [builderOpen, setBuilderOpen] = useState(true);
    const [state, setState] = useState<ChestStructureState>(() => loadState());
    const [error, setError] = useState("");
    const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const dragStateRef = useRef<DragState | null>(null);

    useEffect(
        () =>
            subscribeModalBridge((event) => {
                if (event.type === "open-chest-ui-editor") setOpen(true);
                if (event.type === "close-chest-ui-editor") setOpen(false);
            }),
        []
    );

    useEffect(() => {
        saveState(state);
        try {
            buildUiDefsFile(state);
            buildChestScreenFile(state);
            buildCustomPanelFile(state);
            getStructureBlocks(state.blocks);
            setError("");
        } catch (buildError) {
            setError(buildError instanceof Error ? buildError.message : "구조 설정을 확인하세요.");
        }
    }, [state]);

    useEffect(() => {
        const handleMove = (event: MouseEvent) => {
            const dragState = dragStateRef.current;
            if (!dragState) return;

            const nextX = event.clientX - dragState.rect.left - dragState.offsetX;
            const nextY = event.clientY - dragState.rect.top - dragState.offsetY;

            setState((current) => ({
                ...current,
                blocks: current.blocks.map((block) =>
                    block.id === dragState.blockId ? updateBlockOffset(block, nextX, nextY) : block
                )
            }));
        };

        const handleUp = () => {
            dragStateRef.current = null;
            setDraggingBlockId(null);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, []);

    const iframeSrc = useMemo(() => assetUrl(`chest-ui-editor/index.html?v=${reloadKey}`), [reloadKey]);

    const uiDefsJson = useMemo(() => JSON.stringify(buildUiDefsFile(state), null, 2), [state]);
    const chestScreenJson = useMemo(() => JSON.stringify(buildChestScreenFile(state), null, 2), [state]);
    const customPanelJson = useMemo(() => JSON.stringify(buildCustomPanelFile(state), null, 2), [state]);

    useEffect(() => {
        if (!open || !iframeLoaded || !iframeRef.current) return;

        const win = iframeRef.current.contentWindow;
        const doc = iframeRef.current.contentDocument;
        if (!win || !doc) return;

        ensureStyle(doc);

        const editorContainer =
            (win as { editor?: { canvas?: HTMLElement } }).editor?.canvas ??
            (doc.getElementById("component-container") as HTMLElement | null);
        const previewContainer =
            (win as { preview?: { previewContainer?: HTMLElement } }).preview?.previewContainer ??
            (doc.getElementById("preview-component-container") as HTMLElement | null);

        const editorLayer = ensureStructureLayer(
            doc,
            editorContainer,
            EDITOR_LAYER_ATTR,
            "json-ui-maker-structure-layer--editor"
        );
        const previewLayer = ensureStructureLayer(
            doc,
            previewContainer,
            PREVIEW_LAYER_ATTR,
            "json-ui-maker-structure-layer--preview"
        );

        if (!editorLayer || !previewLayer) return;

        editorLayer.replaceChildren();
        previewLayer.replaceChildren();

        let blocks: StructureVisualBlock[] = [];
        try {
            blocks = getStructureBlocks(state.blocks);
        } catch {
            return;
        }

        const renderElement = (block: StructureVisualBlock, interactive: boolean) => {
            const source = state.blocks.find((item) => item.id === block.id);
            const visual = source
                ? getVisualConfig(source)
                : { className: "json-ui-maker-structure-box", text: block.label };

            const element = doc.createElement("div");
            const baseClass = interactive ? "editor-component" : "preview-component";
            const useVendorVisual = visual.className !== "json-ui-maker-structure-box";
            element.className = `${useVendorVisual ? `${baseClass} ${visual.className}` : "json-ui-maker-structure-box"}${
                interactive && draggingBlockId === block.id ? " is-dragging" : ""
            }`;

            element.style.left = `${block.x}px`;
            element.style.top = `${block.y}px`;
            element.style.width = `${block.width}px`;
            element.style.height = `${block.height}px`;
            element.style.position = "absolute";

            if (visual.dataset) {
                Object.entries(visual.dataset).forEach(([key, value]) => {
                    element.dataset[key] = value;
                });
            }

            if (visual.text) {
                element.textContent = visual.text;
            } else if (!useVendorVisual) {
                const title = doc.createElement("strong");
                title.textContent = block.label;
                const kind = doc.createElement("span");
                kind.textContent = block.kind;
                element.append(title, kind);
            }

            if (interactive) {
                element.addEventListener("mousedown", (event) => {
                    const layerRect = editorLayer.getBoundingClientRect();
                    const blockRect = element.getBoundingClientRect();
                    dragStateRef.current = {
                        blockId: block.id,
                        rect: layerRect,
                        offsetX: event.clientX - blockRect.left,
                        offsetY: event.clientY - blockRect.top
                    };
                    setDraggingBlockId(block.id);
                    event.preventDefault();
                    event.stopPropagation();
                });
            }

            return element;
        };

        for (const block of blocks) {
            editorLayer.appendChild(renderElement(block, true));
            previewLayer.appendChild(renderElement(block, false));
        }
    }, [open, iframeLoaded, state.blocks, draggingBlockId]);

    if (!open) return null;

    return (
        <div
            id="chestUiEditorScreen"
            className="chestUiEditorScreen chestUiEditorScreen--builder"
            style={{ display: open ? "flex" : "none" }}
        >
            <div className="chestUiEditorScreenHeader">
                <div className="chestUiEditorScreenTitle">Chest UI Editor (New Beta)</div>
                <div className="chestUiEditorScreenActions">
                    <button
                        type="button"
                        className="propertyInputButton"
                        onClick={() => setBuilderOpen((value) => !value)}
                    >
                        {builderOpen ? "구조 빌더 닫기" : "구조 빌더 열기"}
                    </button>
                    <button
                        type="button"
                        className="propertyInputButton"
                        onClick={() => {
                            setIframeLoaded(false);
                            setReloadKey((value) => value + 1);
                        }}
                    >
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
                    <iframe
                        key={reloadKey}
                        ref={iframeRef}
                        className="chestUiEditorIframe"
                        src={iframeSrc}
                        title="Chest UI Editor (New Beta)"
                        onLoad={() => setIframeLoaded(true)}
                    />
                </div>
                {builderOpen ? (
                    <aside className="chestUiStructureSidebar">
                        <section className="chestUiStructureSection">
                            <h3>구조 빌더</h3>
                            <p className="chestUiStructureHint">
                                구조 블록은 기존 Chest UI Editor의 <code>UI Layout</code>과 <code>Live Preview</code> 안에
                                직접 표시됩니다. 별도 구조 미리보기는 쓰지 않습니다.
                            </p>
                            {error ? <div className="chestUiStructureError">{error}</div> : null}
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>파일 설정</h3>
                            <label className="chestUiStructureField">
                                <span>파일명</span>
                                <input
                                    value={state.fileName}
                                    onChange={(event) =>
                                        setState((current) => ({ ...current, fileName: event.target.value }))
                                    }
                                />
                            </label>
                            <label className="chestUiStructureField">
                                <span>Namespace</span>
                                <input
                                    value={state.namespace}
                                    onChange={(event) =>
                                        setState((current) => ({ ...current, namespace: event.target.value }))
                                    }
                                />
                            </label>
                            <label className="chestUiStructureField">
                                <span>최상위 Panel 이름</span>
                                <input
                                    value={state.panelName}
                                    onChange={(event) =>
                                        setState((current) => ({ ...current, panelName: event.target.value }))
                                    }
                                />
                            </label>
                        </section>

                        <section className="chestUiStructureSection">
                            <div className="chestUiStructureSectionHeader">
                                <h3>라우터 규칙</h3>
                                <button
                                    type="button"
                                    className="propertyInputButton"
                                    onClick={() =>
                                        setState((current) => ({
                                            ...current,
                                            routes: [
                                                ...current.routes,
                                                {
                                                    id: createId("route"),
                                                    screen: "large",
                                                    title: "",
                                                    targetRef: `${current.namespace}.${current.panelName}`
                                                }
                                            ]
                                        }))
                                    }
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
                                            onChange={(event) =>
                                                setState((current) => ({
                                                    ...current,
                                                    routes: current.routes.map((item) =>
                                                        item.id === route.id
                                                            ? { ...item, screen: event.target.value as ChestScreenType }
                                                            : item
                                                    )
                                                }))
                                            }
                                        >
                                            <option value="large">large_chest_panel</option>
                                            <option value="small">small_chest_panel</option>
                                        </select>
                                    </label>
                                    <label className="chestUiStructureField">
                                        <span>제목</span>
                                        <input
                                            value={route.title}
                                            onChange={(event) =>
                                                setState((current) => ({
                                                    ...current,
                                                    routes: current.routes.map((item) =>
                                                        item.id === route.id ? { ...item, title: event.target.value } : item
                                                    )
                                                }))
                                            }
                                        />
                                    </label>
                                    <label className="chestUiStructureField">
                                        <span>대상 Control Ref</span>
                                        <input
                                            value={route.targetRef}
                                            onChange={(event) =>
                                                setState((current) => ({
                                                    ...current,
                                                    routes: current.routes.map((item) =>
                                                        item.id === route.id ? { ...item, targetRef: event.target.value } : item
                                                    )
                                                }))
                                            }
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="propertyInputButton"
                                        onClick={() =>
                                            setState((current) => ({
                                                ...current,
                                                routes: current.routes.filter((item) => item.id !== route.id)
                                            }))
                                        }
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
                                    onClick={() =>
                                        setState((current) => ({
                                            ...current,
                                            blocks: [
                                                ...current.blocks,
                                                {
                                                    id: createId("block"),
                                                    name: `block_${current.blocks.length + 1}`,
                                                    mode: "inline",
                                                    reference: "",
                                                    controlType: "panel",
                                                    overridesText: JSON.stringify(
                                                        {
                                                            size: [80, 24],
                                                            offset: [0, 0]
                                                        },
                                                        null,
                                                        2
                                                    )
                                                }
                                            ]
                                        }))
                                    }
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
                                        setState((current) => ({
                                            ...current,
                                            blocks: reorderItems(current.blocks, draggingCardId, block.id)
                                        }));
                                        setDraggingCardId(null);
                                    }}
                                >
                                    <label className="chestUiStructureField">
                                        <span>이름</span>
                                        <input
                                            value={block.name}
                                            onChange={(event) =>
                                                setState((current) => ({
                                                    ...current,
                                                    blocks: current.blocks.map((item) =>
                                                        item.id === block.id ? { ...item, name: event.target.value } : item
                                                    )
                                                }))
                                            }
                                        />
                                    </label>
                                    <label className="chestUiStructureField">
                                        <span>모드</span>
                                        <select
                                            value={block.mode}
                                            onChange={(event) =>
                                                setState((current) => ({
                                                    ...current,
                                                    blocks: current.blocks.map((item) =>
                                                        item.id === block.id
                                                            ? { ...item, mode: event.target.value as BuilderBlockMode }
                                                            : item
                                                    )
                                                }))
                                            }
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
                                                onChange={(event) =>
                                                    setState((current) => ({
                                                        ...current,
                                                        blocks: current.blocks.map((item) =>
                                                            item.id === block.id
                                                                ? { ...item, reference: event.target.value }
                                                                : item
                                                        )
                                                    }))
                                                }
                                            />
                                        </label>
                                    ) : (
                                        <label className="chestUiStructureField">
                                            <span>Control Type</span>
                                            <input
                                                value={block.controlType}
                                                onChange={(event) =>
                                                    setState((current) => ({
                                                        ...current,
                                                        blocks: current.blocks.map((item) =>
                                                            item.id === block.id
                                                                ? { ...item, controlType: event.target.value }
                                                                : item
                                                        )
                                                    }))
                                                }
                                            />
                                        </label>
                                    )}
                                    <label className="chestUiStructureField">
                                        <span>Overrides JSON</span>
                                        <textarea
                                            value={block.overridesText}
                                            onChange={(event) =>
                                                setState((current) => ({
                                                    ...current,
                                                    blocks: current.blocks.map((item) =>
                                                        item.id === block.id
                                                            ? { ...item, overridesText: event.target.value }
                                                            : item
                                                    )
                                                }))
                                            }
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="propertyInputButton"
                                        onClick={() =>
                                            setState((current) => ({
                                                ...current,
                                                blocks: current.blocks.filter((item) => item.id !== block.id)
                                            }))
                                        }
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>공통 하단부</h3>
                            <label className="chestUiStructureCheck">
                                <input
                                    type="checkbox"
                                    checked={state.includeBottomInventory}
                                    onChange={(event) =>
                                        setState((current) => ({
                                            ...current,
                                            includeBottomInventory: event.target.checked
                                        }))
                                    }
                                />
                                inventory_panel_bottom_half_with_label
                            </label>
                            <label className="chestUiStructureCheck">
                                <input
                                    type="checkbox"
                                    checked={state.includeHotbar}
                                    onChange={(event) =>
                                        setState((current) => ({
                                            ...current,
                                            includeHotbar: event.target.checked
                                        }))
                                    }
                                />
                                hotbar_grid_template
                            </label>
                            <label className="chestUiStructureCheck">
                                <input
                                    type="checkbox"
                                    checked={state.includeTakeProgress}
                                    onChange={(event) =>
                                        setState((current) => ({
                                            ...current,
                                            includeTakeProgress: event.target.checked
                                        }))
                                    }
                                />
                                inventory_take_progress_icon_button
                            </label>
                            <label className="chestUiStructureCheck">
                                <input
                                    type="checkbox"
                                    checked={state.includeFlyingItemRenderer}
                                    onChange={(event) =>
                                        setState((current) => ({
                                            ...current,
                                            includeFlyingItemRenderer: event.target.checked
                                        }))
                                    }
                                />
                                flying_item_renderer
                            </label>
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>출력</h3>
                            <label className="chestUiStructureField">
                                <span>_ui_defs.json</span>
                                <textarea readOnly value={uiDefsJson} />
                            </label>
                            <label className="chestUiStructureField">
                                <span>chest_screen.json</span>
                                <textarea readOnly value={chestScreenJson} />
                            </label>
                            <label className="chestUiStructureField">
                                <span>{state.fileName}</span>
                                <textarea readOnly value={customPanelJson} />
                            </label>
                        </section>
                    </aside>
                ) : null}
            </div>
        </div>
    );
}
