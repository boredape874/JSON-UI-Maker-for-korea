import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "../../lib/assetUrl.js";
import { closeChestUiEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

type ChestScreenType = "small" | "large";
type BuilderBlockMode = "ref" | "inline";
type RouteRule = { id: string; screen: ChestScreenType; title: string; targetRef: string };
type BuilderBlock = { id: string; name: string; mode: BuilderBlockMode; reference: string; controlType: string; overridesText: string };
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
type OverlayBlock = { id: string; label: string; type: string; x: number; y: number; width: number; height: number };
type DragState = { blockId: string; rect: DOMRect; offsetX: number; offsetY: number };
type VisualConfig = { className: string; dataset?: Record<string, string>; text?: string };

const STORAGE_KEY = "json_ui_maker:chest_structure_builder:v2";
const STYLE_ID = "json-ui-maker-structure-style";
const EDITOR_ATTR = "data-json-ui-maker-editor-overlay";
const PREVIEW_ATTR = "data-json-ui-maker-preview-overlay";

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
        routes: [{ id: createId("route"), screen: "large", title: "커스텀 상자", targetRef: "custom_chest.custom_panel" }],
        blocks: [
            { id: createId("block"), name: "recipe_back_image", mode: "inline", reference: "", controlType: "image", overridesText: "{\n  \"size\": [175, 150],\n  \"offset\": [-106, 0],\n  \"texture\": \"textures/gui/recipe/cooking_recipe\"\n}" },
            { id: createId("block"), name: "recipe_scrolling_panel", mode: "inline", reference: "", controlType: "scrolling_panel", overridesText: "{\n  \"size\": [160, 146],\n  \"offset\": [-106, 0],\n  \"$scroll_view_port_size\": [150, 146],\n  \"$scrolling_content\": \"custom_chest.recipe_grid_panel\"\n}" },
            { id: createId("block"), name: "cooking_grid", mode: "inline", reference: "", controlType: "grid", overridesText: "{\n  \"size\": [196, 18],\n  \"offset\": [12, 12],\n  \"grid_dimensions\": [11, 1],\n  \"collection_name\": \"container_items\"\n}" }
        ]
    };
}

function loadState(): ChestStructureState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return createDefaultState();
        const parsed = JSON.parse(raw) as ChestStructureState;
        return parsed && Array.isArray(parsed.routes) && Array.isArray(parsed.blocks) ? parsed : createDefaultState();
    } catch {
        return createDefaultState();
    }
}

const saveState = (state: ChestStructureState) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

function parseObject(text: string): Record<string, unknown> {
    if (!text.trim()) return {};
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Overrides JSON은 객체여야 합니다.");
    return parsed as Record<string, unknown>;
}

const stringifyObject = (value: Record<string, unknown>) => JSON.stringify(value, null, 2);

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
    return block.mode === "ref" ? { [`${block.name}@${block.reference}`]: overrides } : { [block.name]: { type: block.controlType || "panel", ...overrides } };
}

function buildCustomPanelFile(state: ChestStructureState) {
    const controls = state.blocks.map(buildBlockControl);
    if (state.includeBottomInventory) controls.push({ "inventory_panel_bottom_half_with_label@common.inventory_panel_bottom_half_with_label": {} });
    if (state.includeHotbar) controls.push({ "hotbar_grid@common.hotbar_grid_template": {} });
    if (state.includeTakeProgress) controls.push({ "inventory_take_progress_icon_button@common.inventory_take_progress_icon_button": {} });
    if (state.includeFlyingItemRenderer) controls.push({ "flying_item_renderer@common.flying_item_renderer": { layer: 15 } });
    return { namespace: state.namespace, [state.panelName]: { type: "panel", controls } };
}

function buildChestScreenFile(state: ChestStructureState) {
    const buildPanel = (screen: ChestScreenType) => {
        const routes = state.routes.filter((route) => route.screen === screen && route.title.trim());
        if (!routes.length) return undefined;
        const ignored = `(${routes.map((route) => `($container_ui_title = '${route.title.replace(/'/g, "\\'")}')`).join(" or ")})`;
        const controls: Record<string, unknown>[] = [{ "default_root_panel@common.root_panel": { ignored } }];
        for (const route of routes) {
            controls.push({ [`route_${route.id}@${route.targetRef}`]: { ignored: `(($container_ui_title - '${route.title.replace(/'/g, "\\'")}') = $container_ui_title)` } });
        }
        return { type: "panel", "$container_ui_title": "$container_title", controls };
    };
    const output: Record<string, unknown> = { namespace: "chest" };
    const largePanel = buildPanel("large");
    const smallPanel = buildPanel("small");
    if (largePanel) output.large_chest_panel = largePanel;
    if (smallPanel) output.small_chest_panel = smallPanel;
    return output;
}

const buildUiDefsFile = (state: ChestStructureState) => ({ ui_defs: ["ui/chest_screen.json", `ui/${state.fileName}`] });

function getOverlayBlocks(blocks: BuilderBlock[]): OverlayBlock[] {
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
    return { ...block, overridesText: stringifyObject(overrides) };
}

function getVisualConfig(block: BuilderBlock): VisualConfig {
    let overrides: Record<string, unknown> = {};
    try { overrides = parseObject(block.overridesText); } catch { overrides = {}; }

    const ref = block.reference.toLowerCase();
    const type = (block.controlType || "").toLowerCase();
    const texture = typeof overrides.texture === "string" ? overrides.texture : "";
    const text = typeof overrides.text === "string" ? overrides.text : block.name;
    const value = overrides.value == null ? "5" : String(overrides.value);

    if (ref.includes("container_item_with_picture") || type === "container_item_with_picture") {
        return { className: "container-item-with-picture", dataset: { picture: typeof overrides.picture === "string" ? overrides.picture : "textures/ui/book_ui" } };
    }
    if (ref.includes("container_item") || type === "container_item") return { className: "container-item" };
    if (ref.includes("progress") || type === "progress_bar") return { className: "progress-bar", dataset: { value } };
    if (ref.includes("on_off") || type === "on_off_item") return { className: `on_off-item${overrides.active ? " active" : ""}` };
    if (ref.includes("pot") || type === "pot") return { className: "pot", dataset: { texture: texture || "textures/ui/pot/pot" } };
    if (ref.includes("container_type") || type === "container_type") return { className: "container-type", dataset: { type: typeof overrides.container_type === "string" ? overrides.container_type : "0" } };
    if (ref.includes("label") || type === "label") return { className: "label", text };
    if (ref.includes("image") || type === "image") return { className: "image", dataset: texture ? { texture } : undefined };
    return { className: "json-ui-maker-structure-block", text: block.name };
}

function ensureStyle(doc: Document) {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .chest-top-half{position:relative}
        .json-ui-maker-structure-overlay{position:absolute;inset:0;pointer-events:none;z-index:20}
        .json-ui-maker-structure-block{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;justify-content:center;align-items:flex-start;padding:4px 6px;border-radius:6px;border:1px dashed rgba(96,191,255,.95);background:rgba(17,38,56,.64);color:#fff;font-size:10px;line-height:1.15;overflow:hidden;text-shadow:0 1px 1px rgba(0,0,0,.45)}
        .json-ui-maker-structure-block strong,.json-ui-maker-structure-block span{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .json-ui-maker-structure-overlay--editor .json-ui-maker-structure-block,
        .json-ui-maker-structure-overlay--editor .editor-component{pointer-events:auto;cursor:move}
        .json-ui-maker-structure-overlay--editor .json-ui-maker-structure-block{border-style:solid;background:rgba(63,95,144,.62);box-shadow:0 0 0 1px rgba(138,204,255,.3)}
        .json-ui-maker-structure-overlay--editor .json-ui-maker-structure-block.is-dragging{opacity:.7;box-shadow:0 0 0 2px rgba(188,115,255,.9)}
        .json-ui-maker-structure-overlay--editor .editor-component.is-dragging{opacity:.7;outline:2px solid rgba(188,115,255,.9)}
        .json-ui-maker-structure-overlay--preview .json-ui-maker-structure-block{background:rgba(74,51,27,.72);border-color:rgba(255,212,140,.82)}
        .json-ui-maker-structure-overlay--editor .label,
        .json-ui-maker-structure-overlay--preview .label{white-space:nowrap}
    `;
    doc.head.appendChild(style);
}

function ensureOverlayHost(doc: Document, canvasId: string, attr: string, modifier: string) {
    const topHalf = doc.getElementById(canvasId)?.querySelector(".chest-top-half");
    if (!(topHalf instanceof HTMLDivElement)) return null;
    let overlay = topHalf.querySelector(`div[${attr}='true']`);
    if (!(overlay instanceof HTMLDivElement)) {
        overlay = doc.createElement("div");
        overlay.setAttribute(attr, "true");
        overlay.className = `json-ui-maker-structure-overlay ${modifier}`;
        topHalf.appendChild(overlay);
    }
    return overlay;
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

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-chest-ui-editor") setOpen(true);
        if (event.type === "close-chest-ui-editor") setOpen(false);
    }), []);

    useEffect(() => {
        saveState(state);
        try {
            buildCustomPanelFile(state);
            buildChestScreenFile(state);
            buildUiDefsFile(state);
            getOverlayBlocks(state.blocks);
            setError("");
        } catch (buildError) {
            setError(buildError instanceof Error ? buildError.message : "구조 JSON을 확인하세요.");
        }
    }, [state]);

    useEffect(() => {
        const move = (event: MouseEvent) => {
            const drag = dragStateRef.current;
            if (!drag) return;
            const nextX = event.clientX - drag.rect.left - drag.offsetX;
            const nextY = event.clientY - drag.rect.top - drag.offsetY;
            setState((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === drag.blockId ? updateBlockOffset(block, nextX, nextY) : block) }));
        };
        const up = () => {
            dragStateRef.current = null;
            setDraggingBlockId(null);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, []);

    const iframeSrc = useMemo(() => assetUrl(`chest-ui-editor/index.html?v=${reloadKey}`), [reloadKey]);
    const uiDefsJson = useMemo(() => JSON.stringify(buildUiDefsFile(state), null, 2), [state]);
    const chestScreenJson = useMemo(() => {
        try { return JSON.stringify(buildChestScreenFile(state), null, 2); } catch { return ""; }
    }, [state]);
    const customPanelJson = useMemo(() => {
        try { return JSON.stringify(buildCustomPanelFile(state), null, 2); } catch { return ""; }
    }, [state]);

    useEffect(() => {
        if (!open || !iframeLoaded || !iframeRef.current) return;
        const doc = iframeRef.current.contentDocument;
        if (!doc) return;
        ensureStyle(doc);
        const editorHost = ensureOverlayHost(doc, "editor-canvas", EDITOR_ATTR, "json-ui-maker-structure-overlay--editor");
        const previewHost = ensureOverlayHost(doc, "preview-canvas", PREVIEW_ATTR, "json-ui-maker-structure-overlay--preview");
        if (!editorHost || !previewHost) return;
        editorHost.replaceChildren();
        previewHost.replaceChildren();

        let blocks: OverlayBlock[] = [];
        try { blocks = getOverlayBlocks(state.blocks); } catch { return; }

        for (const block of blocks) {
            const source = state.blocks.find((item) => item.id === block.id);
            const visual = source ? getVisualConfig(source) : { className: "json-ui-maker-structure-block", text: block.label };

            const createOverlayBlock = (interactive: boolean) => {
                const el = doc.createElement("div");
                const baseClass = interactive ? "editor-component" : "preview-component";
                const useVendorClass = visual.className !== "json-ui-maker-structure-block";
                el.className = `${useVendorClass ? `${baseClass} ${visual.className}` : "json-ui-maker-structure-block"}${interactive && draggingBlockId === block.id ? " is-dragging" : ""}`;
                el.style.left = `${block.x}px`;
                el.style.top = `${block.y}px`;
                el.style.width = `${block.width}px`;
                el.style.height = `${block.height}px`;

                if (visual.dataset) {
                    for (const [key, value] of Object.entries(visual.dataset)) {
                        el.dataset[key] = value;
                    }
                }

                if (visual.text) {
                    el.textContent = visual.text;
                } else if (!useVendorClass) {
                    const strong = doc.createElement("strong");
                    strong.textContent = block.label;
                    const span = doc.createElement("span");
                    span.textContent = block.type;
                    el.append(strong, span);
                }

                if (interactive) {
                    el.addEventListener("mousedown", (event) => {
                        const rect = editorHost.getBoundingClientRect();
                        const blockRect = el.getBoundingClientRect();
                        dragStateRef.current = { blockId: block.id, rect, offsetX: event.clientX - blockRect.left, offsetY: event.clientY - blockRect.top };
                        setDraggingBlockId(block.id);
                        event.preventDefault();
                        event.stopPropagation();
                    });
                }

                return el;
            };

            editorHost.appendChild(createOverlayBlock(true));
            previewHost.appendChild(createOverlayBlock(false));
        }
    }, [open, iframeLoaded, state.blocks, draggingBlockId]);

    if (!open) return null;

    return (
        <div id="chestUiEditorScreen" className="chestUiEditorScreen chestUiEditorScreen--builder" style={{ display: open ? "flex" : "none" }}>
            <div className="chestUiEditorScreenHeader">
                <div className="chestUiEditorScreenTitle">Chest UI Editor (New Beta)</div>
                <div className="chestUiEditorScreenActions">
                    <button type="button" className="propertyInputButton" onClick={() => setBuilderOpen((value) => !value)}>{builderOpen ? "구조 빌더 닫기" : "구조 빌더 열기"}</button>
                    <button type="button" className="propertyInputButton" onClick={() => { setIframeLoaded(false); setReloadKey((value) => value + 1); }}>새로고침</button>
                    <a className="propertyInputButton chestUiEditorExternalLink" href={iframeSrc} target="_blank" rel="noreferrer">새 탭 열기</a>
                    <button type="button" className="propertyInputButton chestUiEditorScreenClose" onClick={() => closeChestUiEditorModalBridge()}>닫기</button>
                </div>
            </div>

            <div className="chestUiEditorBuilderLayout">
                <div className="chestUiEditorEmbeddedBody">
                    <iframe key={reloadKey} ref={iframeRef} className="chestUiEditorIframe" src={iframeSrc} title="Chest UI Editor (New Beta)" onLoad={() => setIframeLoaded(true)} />
                </div>

                {builderOpen ? (
                    <aside className="chestUiStructureSidebar">
                        <section className="chestUiStructureSection">
                            <h3>구조 빌더</h3>
                            <p className="chestUiStructureHint">구조 블록은 기존 editor의 UI Layout과 Live Preview 안에 직접 표시됩니다. 위치 이동도 그 캔버스에서 바로 처리합니다.</p>
                            {error ? <div className="chestUiStructureError">{error}</div> : null}
                        </section>

                        <section className="chestUiStructureSection">
                            <h3>파일 설정</h3>
                            <label className="chestUiStructureField"><span>파일명</span><input value={state.fileName} onChange={(event) => setState((current) => ({ ...current, fileName: event.target.value }))} /></label>
                            <label className="chestUiStructureField"><span>Namespace</span><input value={state.namespace} onChange={(event) => setState((current) => ({ ...current, namespace: event.target.value }))} /></label>
                            <label className="chestUiStructureField"><span>최상위 Panel 이름</span><input value={state.panelName} onChange={(event) => setState((current) => ({ ...current, panelName: event.target.value }))} /></label>
                        </section>

                        <section className="chestUiStructureSection">
                            <div className="chestUiStructureSectionHeader">
                                <h3>라우터 규칙</h3>
                                <button type="button" className="propertyInputButton" onClick={() => setState((current) => ({ ...current, routes: [...current.routes, { id: createId("route"), screen: "large", title: "", targetRef: `${current.namespace}.${current.panelName}` }] }))}>규칙 추가</button>
                            </div>
                            {state.routes.map((route) => (
                                <div key={route.id} className="chestUiStructureCard">
                                    <label className="chestUiStructureField"><span>Screen</span><select value={route.screen} onChange={(event) => setState((current) => ({ ...current, routes: current.routes.map((item) => item.id === route.id ? { ...item, screen: event.target.value as ChestScreenType } : item) }))}><option value="large">large_chest_panel</option><option value="small">small_chest_panel</option></select></label>
                                    <label className="chestUiStructureField"><span>제목</span><input value={route.title} onChange={(event) => setState((current) => ({ ...current, routes: current.routes.map((item) => item.id === route.id ? { ...item, title: event.target.value } : item) }))} /></label>
                                    <label className="chestUiStructureField"><span>대상 Control Ref</span><input value={route.targetRef} onChange={(event) => setState((current) => ({ ...current, routes: current.routes.map((item) => item.id === route.id ? { ...item, targetRef: event.target.value } : item) }))} /></label>
                                    <button type="button" className="propertyInputButton" onClick={() => setState((current) => ({ ...current, routes: current.routes.filter((item) => item.id !== route.id) }))}>삭제</button>
                                </div>
                            ))}
                        </section>

                        <section className="chestUiStructureSection">
                            <div className="chestUiStructureSectionHeader">
                                <h3>커스텀 Panel 블록</h3>
                                <button type="button" className="propertyInputButton" onClick={() => setState((current) => ({ ...current, blocks: [...current.blocks, { id: createId("block"), name: `block_${current.blocks.length + 1}`, mode: "inline", reference: "", controlType: "panel", overridesText: "{\n  \"size\": [80, 24],\n  \"offset\": [0, 0]\n}" }] }))}>블록 추가</button>
                            </div>
                            {state.blocks.map((block) => (
                                <div key={block.id} className="chestUiStructureCard" draggable onDragStart={() => setDraggingCardId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => {
                                    if (!draggingCardId) return;
                                    setState((current) => ({ ...current, blocks: reorderItems(current.blocks, draggingCardId, block.id) }));
                                    setDraggingCardId(null);
                                }}>
                                    <label className="chestUiStructureField"><span>이름</span><input value={block.name} onChange={(event) => setState((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, name: event.target.value } : item) }))} /></label>
                                    <label className="chestUiStructureField"><span>모드</span><select value={block.mode} onChange={(event) => setState((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, mode: event.target.value as BuilderBlockMode } : item) }))}><option value="ref">Reference</option><option value="inline">Inline Control</option></select></label>
                                    {block.mode === "ref"
                                        ? <label className="chestUiStructureField"><span>Reference</span><input value={block.reference} onChange={(event) => setState((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, reference: event.target.value } : item) }))} /></label>
                                        : <label className="chestUiStructureField"><span>Control Type</span><input value={block.controlType} onChange={(event) => setState((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, controlType: event.target.value } : item) }))} /></label>}
                                    <label className="chestUiStructureField"><span>Overrides JSON</span><textarea value={block.overridesText} onChange={(event) => setState((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, overridesText: event.target.value } : item) }))} /></label>
                                    <button type="button" className="propertyInputButton" onClick={() => setState((current) => ({ ...current, blocks: current.blocks.filter((item) => item.id !== block.id) }))}>삭제</button>
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
