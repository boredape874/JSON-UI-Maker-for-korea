import { ChangeEvent, ReactNode, useEffect, useState } from "react";
import {
    addHudEditorProgressBar,
    addHudEditorSliceSlot,
    copyHudEditorText,
    deleteHudEditorProgressBar,
    downloadHudEditorJsonFile,
    getHudEditorSnapshot,
    removeHudEditorSliceSlot,
    resetHudEditorState,
    selectHudEditorItem,
    setHudEditorAutoFitPreview,
    setHudEditorPreviewZoom,
    startHudEditorDrag,
    subscribeHudEditorStore,
    toggleHudEditorAutoAnchorSnap,
    toggleHudEditorGuides,
    updateHudEditorSliceSlot,
    updateSelectedHudEditorField,
    type HudAnchor,
    type HudEditorPreviewItem,
    type HudElement,
    type HudFontSize,
    type HudProgressBar,
} from "../modals/hudEditorModal.js";

const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = 1500 / 1.7777777;
const ANCHORS: HudAnchor[] = [
    "top_left",
    "top_middle",
    "top_right",
    "left_middle",
    "center",
    "right_middle",
    "bottom_left",
    "bottom_middle",
    "bottom_right",
];
const FONT_SIZES: HudFontSize[] = ["small", "normal", "large", "extra_large"];
const CLIP_DIRECTIONS = ["left", "right", "up", "down"] as const;

function isProgressBarElement(element: HudElement | HudProgressBar): element is HudProgressBar {
    return "sourceChannel" in element;
}

function isSliceChannel(element: HudElement | HudProgressBar): element is HudElement {
    return !isProgressBarElement(element)
        && ((element.id === "title" && element.titleMode === "slice")
            || (element.id === "subtitle" && element.subtitleMode === "slice"));
}

function parseFieldValue(element: HudElement | HudProgressBar, field: string, event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): string | number | boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
        return target.checked;
    }

    if (isProgressBarElement(element)) {
        if (["x", "y", "width", "height", "layer", "maxValue", "barInsetX", "barInsetY"].includes(field)) {
            return Number.parseInt(target.value, 10) || 0;
        }
        if (["backgroundAlpha", "barAlpha", "trailAlpha", "duration", "trailDelay"].includes(field)) {
            const parsed = Number.parseFloat(target.value) || 0;
            return field === "backgroundAlpha" ? Math.min(Math.max(parsed, 0), 1) : Math.max(0, parsed);
        }
        return target.value;
    }

    if (["x", "y", "width", "height", "layer", "sliceSlotSize", "sliceColumns", "sliceGapX", "sliceGapY", "maxValue"].includes(field)) {
        return Number.parseInt(target.value, 10) || 0;
    }
    if (["animInDuration", "animHoldDuration", "animOutDuration"].includes(field)) {
        return Math.max(0, Number.parseFloat(target.value) || 0);
    }
    if (field === "backgroundAlpha") {
        return Math.min(Math.max(Number.parseFloat(target.value) || 0, 0), 1);
    }
    return target.value;
}

function fieldRow(label: string, control: ReactNode) {
    return (
        <>
            <label>{label}</label>
            {control}
        </>
    );
}

function previewTextStyle(item: HudEditorPreviewItem) {
    return {
        color: item.textColor,
        textShadow: item.shadow ? "0 2px 3px rgba(0,0,0,0.85)" : undefined,
    };
}

function CommonInspector({ element }: { element: HudElement | HudProgressBar }) {
    const onChange = (field: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        updateSelectedHudEditorField(field, parseFieldValue(element, field, event));
    };

    return (
        <div className="hudEditorInspectorCard">
            <div className="hudEditorInspectorTitle">{element.label}</div>
            <div className="hudEditorInspectorBody">
                {fieldRow("Enabled", <input type="checkbox" checked={element.enabled} onChange={onChange("enabled")} />)}
                {fieldRow("Ignored", <input type="checkbox" checked={element.ignored} onChange={onChange("ignored")} />)}
                {fieldRow("Anchor", (
                    <select value={element.anchor} onChange={onChange("anchor")}>
                        {ANCHORS.map((anchor) => <option key={anchor} value={anchor}>{anchor}</option>)}
                    </select>
                ))}
                {fieldRow("X", <input type="number" value={element.x} onChange={onChange("x")} />)}
                {fieldRow("Y", <input type="number" value={element.y} onChange={onChange("y")} />)}
                {fieldRow("Width", <input type="number" value={element.width} onChange={onChange("width")} />)}
                {fieldRow("Height", <input type="number" value={element.height} onChange={onChange("height")} />)}
                {fieldRow("Layer", <input type="number" value={element.layer} onChange={onChange("layer")} />)}
                {fieldRow("Font", (
                    <select value={element.fontSize} onChange={onChange("fontSize")}>
                        {FONT_SIZES.map((font) => <option key={font} value={font}>{font}</option>)}
                    </select>
                ))}
                {fieldRow("Text Color", <input type="color" value={element.textColor} onChange={onChange("textColor")} />)}
                {fieldRow("Shadow", <input type="checkbox" checked={element.shadow} onChange={onChange("shadow")} />)}
                {fieldRow("Background", (
                    <select value={element.background} onChange={onChange("background")}>
                        <option value="vanilla">vanilla</option>
                        <option value="solid">solid</option>
                        <option value="none">none</option>
                    </select>
                ))}
                {fieldRow("Background Alpha", <input type="number" min="0" max="1" step="0.05" value={element.backgroundAlpha} onChange={onChange("backgroundAlpha")} />)}
                {fieldRow("Background Color", <input type="color" value={element.backgroundColor} onChange={onChange("backgroundColor")} disabled={element.background !== "solid"} />)}
            </div>
        </div>
    );
}

function ChannelInspector({ element }: { element: HudElement }) {
    const onChange = (field: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        updateSelectedHudEditorField(field, parseFieldValue(element, field, event));
    };
    const sliceMode = isSliceChannel(element);
    const slots = sliceMode ? (element.sliceSlots ?? []) : [];

    return (
        <>
            <CommonInspector element={element} />
            <div className="hudEditorInspectorCard">
                <div className="hudEditorInspectorTitle">Channel Settings</div>
                <div className="hudEditorInspectorBody">
                    {fieldRow("Sample Text", <input type="text" value={element.sampleText} onChange={onChange("sampleText")} />)}
                    {fieldRow("Prefix", <input type="text" value={element.prefix} onChange={onChange("prefix")} />)}
                    {fieldRow("Strip Prefix", <input type="checkbox" checked={element.stripPrefix} onChange={onChange("stripPrefix")} />)}
                    {fieldRow("Hide Vanilla", <input type="checkbox" checked={element.hideVanilla} onChange={onChange("hideVanilla")} />)}
                    {element.id === "actionbar" ? fieldRow("Preserve", <input type="checkbox" checked={element.preserve} onChange={onChange("preserve")} />) : null}
                    {element.id !== "actionbar" ? fieldRow("Display", (
                        <select value={element.displayMode} onChange={onChange("displayMode")} disabled={sliceMode}>
                            <option value="text">text</option>
                            <option value="progress">progress</option>
                        </select>
                    )) : null}
                    {element.id !== "actionbar" && element.displayMode === "progress" ? (
                        <>
                            {fieldRow("Max Value", <input type="number" value={element.maxValue} onChange={onChange("maxValue")} disabled={sliceMode} />)}
                            {fieldRow("Fill Color", <input type="color" value={element.fillColor} onChange={onChange("fillColor")} disabled={sliceMode} />)}
                            {fieldRow("Clip Direction", (
                                <select value={element.clipDirection} onChange={onChange("clipDirection")} disabled={sliceMode}>
                                    {CLIP_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}
                                </select>
                            ))}
                        </>
                    ) : null}
                    {fieldRow("Animation", (
                        <select value={element.animationPreset} onChange={onChange("animationPreset")}>
                            <option value="none">none</option>
                            <option value="fade_out">fade_out</option>
                            <option value="fade_hold_fade">fade_hold_fade</option>
                        </select>
                    ))}
                    {fieldRow("Anim In", <input type="number" min="0" step="0.05" value={element.animInDuration} onChange={onChange("animInDuration")} />)}
                    {fieldRow("Anim Hold", <input type="number" min="0" step="0.05" value={element.animHoldDuration} onChange={onChange("animHoldDuration")} />)}
                    {fieldRow("Anim Out", <input type="number" min="0" step="0.05" value={element.animOutDuration} onChange={onChange("animOutDuration")} />)}
                    {element.id === "title" ? fieldRow("Title Mode", (
                        <select value={element.titleMode ?? "single"} onChange={onChange("titleMode")}>
                            <option value="single">single</option>
                            <option value="slice">slice</option>
                        </select>
                    )) : null}
                    {element.id === "subtitle" ? fieldRow("Subtitle Mode", (
                        <select value={element.subtitleMode ?? "single"} onChange={onChange("subtitleMode")}>
                            <option value="single">single</option>
                            <option value="slice">slice</option>
                        </select>
                    )) : null}
                </div>
            </div>
            {sliceMode ? (
                <div className="hudEditorInspectorCard">
                    <div className="hudEditorInspectorTitle">Slice Slots</div>
                    <div className="hudEditorInspectorBody">
                        {fieldRow("Slot Size", <input type="number" value={element.sliceSlotSize ?? 20} onChange={onChange("sliceSlotSize")} />)}
                        {fieldRow("Columns", <input type="number" value={element.sliceColumns ?? 2} onChange={onChange("sliceColumns")} />)}
                        {fieldRow("Gap X", <input type="number" value={element.sliceGapX ?? 8} onChange={onChange("sliceGapX")} />)}
                        {fieldRow("Gap Y", <input type="number" value={element.sliceGapY ?? 8} onChange={onChange("sliceGapY")} />)}
                        <div className="hudEditorSidebarActions">
                            <button type="button" className="propertyInputButton" onClick={() => addHudEditorSliceSlot(element.id)}>Add Slot</button>
                            <button type="button" className="propertyInputButton" onClick={() => removeHudEditorSliceSlot(element.id)}>Remove Slot</button>
                        </div>
                        {slots.map((slot, index) => (
                            <div key={`${element.id}-${index}`}>
                                {fieldRow(`Slot ${index + 1} Anchor`, (
                                    <select value={slot.anchor} onChange={(event) => updateHudEditorSliceSlot(index, "anchor", event.target.value as HudAnchor)}>
                                        {ANCHORS.map((anchor) => <option key={anchor} value={anchor}>{anchor}</option>)}
                                    </select>
                                ))}
                                {fieldRow(`Slot ${index + 1} X`, <input type="number" value={slot.x} onChange={(event) => updateHudEditorSliceSlot(index, "x", Number.parseInt(event.target.value, 10) || 0)} />)}
                                {fieldRow(`Slot ${index + 1} Y`, <input type="number" value={slot.y} onChange={(event) => updateHudEditorSliceSlot(index, "y", Number.parseInt(event.target.value, 10) || 0)} />)}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </>
    );
}

function ProgressInspector({ element }: { element: HudProgressBar }) {
    const onChange = (field: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        updateSelectedHudEditorField(field, parseFieldValue(element, field, event));
    };

    return (
        <>
            <CommonInspector element={element} />
            <div className="hudEditorInspectorCard">
                <div className="hudEditorInspectorTitle">Progress Settings</div>
                <div className="hudEditorInspectorBody">
                    {fieldRow("Label", <input type="text" value={element.label} onChange={onChange("label")} />)}
                    {fieldRow("Source Channel", (
                        <select value={element.sourceChannel} onChange={onChange("sourceChannel")}>
                            <option value="title">title</option>
                            <option value="subtitle">subtitle</option>
                            <option value="actionbar">actionbar</option>
                        </select>
                    ))}
                    {fieldRow("Sample Text", <input type="text" value={element.sampleText} onChange={onChange("sampleText")} />)}
                    {fieldRow("Prefix", <input type="text" value={element.prefix} onChange={onChange("prefix")} />)}
                    {fieldRow("Hide Vanilla", <input type="checkbox" checked={element.hideVanilla} onChange={onChange("hideVanilla")} />)}
                    {fieldRow("Max Mode", (
                        <select value={element.maxMode} onChange={onChange("maxMode")}>
                            <option value="fixed">fixed</option>
                            <option value="dynamic">dynamic</option>
                        </select>
                    ))}
                    {fieldRow("Max Value", <input type="number" value={element.maxValue} onChange={onChange("maxValue")} />)}
                    {fieldRow("Fill Color", <input type="color" value={element.fillColor} onChange={onChange("fillColor")} />)}
                    {fieldRow("Clip Direction", (
                        <select value={element.clipDirection} onChange={onChange("clipDirection")}>
                            {CLIP_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}
                        </select>
                    ))}
                    {fieldRow("Background Texture", <input type="text" value={element.backgroundTexture} onChange={onChange("backgroundTexture")} />)}
                    {fieldRow("Bar Texture", <input type="text" value={element.barTexture} onChange={onChange("barTexture")} />)}
                    {fieldRow("Trail Texture", <input type="text" value={element.trailTexture} onChange={onChange("trailTexture")} />)}
                    {fieldRow("Texture Type", (
                        <select value={element.textureType} onChange={onChange("textureType")}>
                            <option value="">default</option>
                            <option value="fixed">fixed</option>
                        </select>
                    ))}
                    {fieldRow("Bar Alpha", <input type="number" min="0" max="1" step="0.05" value={element.barAlpha} onChange={onChange("barAlpha")} />)}
                    {fieldRow("Trail Alpha", <input type="number" min="0" max="1" step="0.05" value={element.trailAlpha} onChange={onChange("trailAlpha")} />)}
                    {fieldRow("Duration", <input type="number" min="0" step="0.05" value={element.duration} onChange={onChange("duration")} />)}
                    {fieldRow("Trail Delay", <input type="number" min="0" step="0.05" value={element.trailDelay} onChange={onChange("trailDelay")} />)}
                    {fieldRow("Bar Inset X", <input type="number" value={element.barInsetX} onChange={onChange("barInsetX")} />)}
                    {fieldRow("Bar Inset Y", <input type="number" value={element.barInsetY} onChange={onChange("barInsetY")} />)}
                    {fieldRow("Show Text", <input type="checkbox" checked={element.showText} onChange={onChange("showText")} />)}
                    <div className="hudEditorSidebarActions">
                        <button type="button" className="propertyInputButton" onClick={() => deleteHudEditorProgressBar(element.id)}>Delete Progress Bar</button>
                    </div>
                </div>
            </div>
        </>
    );
}

export function HudEditorWorkspace() {
    const [, setVersion] = useState(0);

    useEffect(() => subscribeHudEditorStore(() => setVersion((value) => value + 1)), []);

    const snapshot = getHudEditorSnapshot();
    const selectedElement = snapshot.selectedElement;
    const scale = Math.round(snapshot.previewScale * 100);

    return (
        <div className="hudEditorLayout">
            <div className="hudEditorSidebar">
                <div className="hudEditorSidebarCard">
                    <div className="hudEditorSidebarTitle">HUD Items</div>
                    <div className="hudEditorSidebarList">
                        {Object.values(snapshot.state.elements).map((element) => (
                            <button key={element.id} type="button" className={`hudEditorChannelButton${element.id === snapshot.state.selectedId ? " hudEditorChannelButtonActive" : ""}`} onClick={() => selectHudEditorItem(element.id)}>
                                <span>{element.label}</span>
                                <span>{element.enabled ? "ON" : "OFF"}</span>
                            </button>
                        ))}
                        <div className="hudEditorSidebarTitle" style={{ marginTop: 12 }}>Progress Bars</div>
                        <div className="hudEditorSidebarActions">
                            <button type="button" className="propertyInputButton" onClick={() => addHudEditorProgressBar()}>Add</button>
                        </div>
                        {snapshot.state.progressBars.map((bar) => (
                            <button key={bar.id} type="button" className={`hudEditorChannelButton${bar.id === snapshot.state.selectedId ? " hudEditorChannelButtonActive" : ""}`} onClick={() => selectHudEditorItem(bar.id)}>
                                <span>{bar.label}</span>
                                <span>{bar.enabled ? "ON" : "OFF"}</span>
                            </button>
                        ))}
                    </div>
                    <div className="hudEditorSidebarActions">
                        <button type="button" className="propertyInputButton" onClick={() => resetHudEditorState()}>Reset</button>
                    </div>
                </div>
            </div>
            <div className="hudEditorCenter">
                <div className="hudEditorSidebarCard hudEditorPreviewToolbar">
                    <div className="hudEditorPreviewToolbarLeft">
                        <button type="button" className={`propertyInputButton ${snapshot.state.autoFitPreview ? "hudEditorZoomActive" : ""}`} onClick={() => setHudEditorAutoFitPreview(true)}>Fit</button>
                        {[0.75, 1, 1.25].map((zoom) => (
                            <button key={zoom} type="button" className={`propertyInputButton ${!snapshot.state.autoFitPreview && snapshot.state.previewZoom === zoom ? "hudEditorZoomActive" : ""}`} onClick={() => setHudEditorPreviewZoom(zoom)}>{Math.round(zoom * 100)}%</button>
                        ))}
                        <button type="button" className={`propertyInputButton ${snapshot.state.showAnchorGuides ? "hudEditorZoomActive" : ""}`} onClick={() => toggleHudEditorGuides()}>Guides</button>
                        <button type="button" className={`propertyInputButton ${snapshot.state.autoAnchorSnap ? "hudEditorZoomActive" : ""}`} onClick={() => toggleHudEditorAutoAnchorSnap()}>Snap</button>
                    </div>
                    <div className="hudEditorPreviewToolbarRight">Scale {scale}%</div>
                </div>
                <div className="hudEditorCanvasWrap">
                    <div className="hudEditorCanvasScale" style={{ width: `${PREVIEW_WIDTH * snapshot.previewScale}px`, height: `${PREVIEW_HEIGHT * snapshot.previewScale}px` }}>
                        <div className="hudEditorPreview" style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, transform: `scale(${snapshot.previewScale})` }}>
                            <img className="hudEditorCanvasBackgroundImage" src={snapshot.canvasBackgroundUrl} alt="HUD Background" />
                            <div className="hudEditorSafeZone"></div>
                            {snapshot.state.showAnchorGuides ? (
                                <>
                                    <div className="hudEditorAnchorGrid">
                                        {ANCHORS.map((anchor) => <div key={anchor} className={`hudEditorAnchorZone ${anchor === snapshot.activeGuideAnchor ? "hudEditorAnchorZoneActive" : ""}`}>{anchor}</div>)}
                                    </div>
                                    <div className="hudEditorAnchorLine hudEditorAnchorLineVertical1"></div>
                                    <div className="hudEditorAnchorLine hudEditorAnchorLineVertical2"></div>
                                    <div className="hudEditorAnchorLine hudEditorAnchorLineHorizontal1"></div>
                                    <div className="hudEditorAnchorLine hudEditorAnchorLineHorizontal2"></div>
                                </>
                            ) : null}
                            {snapshot.guides.map((guide) => (
                                <div key={guide.id} className="hudEditorGuideLabel" style={{ left: guide.left, top: guide.top, width: guide.width, height: guide.height }}>{guide.label}</div>
                            ))}
                            {snapshot.previewItems.map((item, index) => {
                                const backgroundStyle = item.background === "solid" ? { background: item.backgroundColor, opacity: item.backgroundAlpha } : undefined;
                                return (
                                    <div
                                        key={`${item.id}-${item.slotIndex ?? index}`}
                                        className={`hudEditorPreviewItem${item.kind === "slice" ? " hudEditorPreviewSliceItem" : ""}${item.selected ? " hudEditorPreviewItemSelected" : ""}${item.withBg ? " hudEditorPreviewItemWithBg" : ""}`}
                                        style={{ left: item.left, top: item.top, width: item.width, height: item.height, zIndex: item.layer, opacity: item.ignored ? 0.35 : 1 }}
                                        onMouseDown={(event) => startHudEditorDrag(item.id, event.clientX, event.clientY, item.slotIndex)}
                                        onClick={() => selectHudEditorItem(item.id)}
                                    >
                                        <div className={`hudEditorPreviewItemBg ${item.background === "vanilla" ? "hudEditorPreviewItemBgVanilla" : ""}`} style={backgroundStyle}></div>
                                        {item.fill ? <div style={{ position: "absolute", left: item.fill.left, top: item.fill.top, width: item.fill.width, height: item.fill.height, background: item.fill.color, opacity: 0.9 }}></div> : null}
                                        <div className={`hudEditorPreviewText hudEditorFont-${item.fontSize}`} style={previewTextStyle(item)}>{item.text}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="hudEditorJsonCard">
                    <div className="hudEditorSidebarTitle">hud_screen.json</div>
                    <textarea className="hudEditorOutput" spellCheck={false} readOnly value={snapshot.hudJson}></textarea>
                    <div className="hudEditorSidebarActions">
                        <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(snapshot.hudJson, "Copied hud_screen.json")}>Copy</button>
                        <button type="button" className="propertyInputButton" onClick={() => downloadHudEditorJsonFile("hud_screen.json", snapshot.hudJson)}>Download</button>
                    </div>
                </div>
                {snapshot.hasEnabledProgressBars ? (
                    <>
                        <div className="hudEditorJsonCard">
                            <div className="hudEditorSidebarTitle">animated_bar.json</div>
                            <textarea className="hudEditorOutput" spellCheck={false} readOnly value={snapshot.animatedBarJson}></textarea>
                            <div className="hudEditorSidebarActions">
                                <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(snapshot.animatedBarJson, "Copied animated_bar.json")}>Copy</button>
                                <button type="button" className="propertyInputButton" onClick={() => downloadHudEditorJsonFile("animated_bar.json", snapshot.animatedBarJson)}>Download</button>
                            </div>
                        </div>
                        <div className="hudEditorJsonCard">
                            <div className="hudEditorSidebarTitle">_ui_defs.json</div>
                            <textarea className="hudEditorOutput" spellCheck={false} readOnly value={snapshot.uiDefsJson}></textarea>
                            <div className="hudEditorSidebarActions">
                                <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(snapshot.uiDefsJson, "Copied _ui_defs.json")}>Copy</button>
                                <button type="button" className="propertyInputButton" onClick={() => downloadHudEditorJsonFile("_ui_defs.json", snapshot.uiDefsJson)}>Download</button>
                            </div>
                        </div>
                    </>
                ) : null}
                {snapshot.scriptHelpers.length > 0 ? (
                    <div className="hudEditorJsonCard hudEditorScriptCard">
                        {snapshot.scriptHelpers.map((helper) => (
                            <div key={helper.key}>
                                <div className="hudEditorSidebarTitle">{helper.title}</div>
                                <textarea className="hudEditorOutput hudEditorScriptOutput" spellCheck={false} readOnly value={helper.content}></textarea>
                                <div className="hudEditorSidebarActions">
                                    <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(helper.copyText, helper.notice)}>Copy Script</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
            <div className="hudEditorInspector">
                {isProgressBarElement(selectedElement) ? <ProgressInspector element={selectedElement} /> : <ChannelInspector element={selectedElement} />}
            </div>
        </div>
    );
}
