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

const ANCHOR_LABELS: Record<HudAnchor, string> = {
    top_left: "좌상단",
    top_middle: "상단 중앙",
    top_right: "우상단",
    left_middle: "좌측 중앙",
    center: "정중앙",
    right_middle: "우측 중앙",
    bottom_left: "좌하단",
    bottom_middle: "하단 중앙",
    bottom_right: "우하단",
};

const FONT_SIZE_LABELS: Record<HudFontSize, string> = {
    small: "작게",
    normal: "보통",
    large: "크게",
    extra_large: "매우 크게",
};

const CLIP_DIRECTION_LABELS: Record<(typeof CLIP_DIRECTIONS)[number], string> = {
    left: "왼쪽",
    right: "오른쪽",
    up: "위쪽",
    down: "아래쪽",
};

function backgroundLabel(value: "vanilla" | "solid" | "none"): string {
    switch (value) {
        case "vanilla":
            return "바닐라";
        case "solid":
            return "단색";
        case "none":
            return "없음";
    }
}

function animationLabel(value: "none" | "fade_out" | "fade_hold_fade"): string {
    switch (value) {
        case "none":
            return "없음";
        case "fade_out":
            return "페이드 아웃";
        case "fade_hold_fade":
            return "페이드 인/유지/아웃";
    }
}

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
                {fieldRow("활성화", <input type="checkbox" checked={element.enabled} onChange={onChange("enabled")} />)}
                {fieldRow("무시", <input type="checkbox" checked={element.ignored} onChange={onChange("ignored")} />)}
                {fieldRow("앵커", (
                    <select value={element.anchor} onChange={onChange("anchor")}>
                        {ANCHORS.map((anchor) => <option key={anchor} value={anchor}>{ANCHOR_LABELS[anchor]}</option>)}
                    </select>
                ))}
                {fieldRow("X", <input type="number" value={element.x} onChange={onChange("x")} />)}
                {fieldRow("Y", <input type="number" value={element.y} onChange={onChange("y")} />)}
                {fieldRow("너비", <input type="number" value={element.width} onChange={onChange("width")} />)}
                {fieldRow("높이", <input type="number" value={element.height} onChange={onChange("height")} />)}
                {fieldRow("레이어", <input type="number" value={element.layer} onChange={onChange("layer")} />)}
                {fieldRow("폰트", (
                    <select value={element.fontSize} onChange={onChange("fontSize")}>
                        {FONT_SIZES.map((font) => <option key={font} value={font}>{FONT_SIZE_LABELS[font]}</option>)}
                    </select>
                ))}
                {fieldRow("글자 색상", <input type="color" value={element.textColor} onChange={onChange("textColor")} />)}
                {fieldRow("그림자", <input type="checkbox" checked={element.shadow} onChange={onChange("shadow")} />)}
                {fieldRow("배경", (
                    <select value={element.background} onChange={onChange("background")}>
                        <option value="vanilla">{backgroundLabel("vanilla")}</option>
                        <option value="solid">{backgroundLabel("solid")}</option>
                        <option value="none">{backgroundLabel("none")}</option>
                    </select>
                ))}
                {fieldRow("배경 알파", <input type="number" min="0" max="1" step="0.05" value={element.backgroundAlpha} onChange={onChange("backgroundAlpha")} />)}
                {fieldRow("배경 색상", <input type="color" value={element.backgroundColor} onChange={onChange("backgroundColor")} disabled={element.background !== "solid"} />)}
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
                <div className="hudEditorInspectorTitle">채널 설정</div>
                <div className="hudEditorInspectorBody">
                    {fieldRow("샘플 텍스트", <input type="text" value={element.sampleText} onChange={onChange("sampleText")} />)}
                    {fieldRow("접두사", <input type="text" value={element.prefix} onChange={onChange("prefix")} />)}
                    {fieldRow("접두사 제거", <input type="checkbox" checked={element.stripPrefix} onChange={onChange("stripPrefix")} />)}
                    {fieldRow("바닐라 숨김", <input type="checkbox" checked={element.hideVanilla} onChange={onChange("hideVanilla")} />)}
                    {element.id === "actionbar" ? fieldRow("보존 표시", <input type="checkbox" checked={element.preserve} onChange={onChange("preserve")} />) : null}
                    {element.id !== "actionbar" ? fieldRow("표시 방식", (
                        <select value={element.displayMode} onChange={onChange("displayMode")} disabled={sliceMode}>
                            <option value="text">텍스트</option>
                            <option value="progress">진행 바</option>
                        </select>
                    )) : null}
                    {element.id !== "actionbar" && element.displayMode === "progress" ? (
                        <>
                            {fieldRow("최대값", <input type="number" value={element.maxValue} onChange={onChange("maxValue")} disabled={sliceMode} />)}
                            {fieldRow("채우기 색상", <input type="color" value={element.fillColor} onChange={onChange("fillColor")} disabled={sliceMode} />)}
                            {fieldRow("클립 방향", (
                                <select value={element.clipDirection} onChange={onChange("clipDirection")} disabled={sliceMode}>
                                    {CLIP_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{CLIP_DIRECTION_LABELS[direction]}</option>)}
                                </select>
                            ))}
                        </>
                    ) : null}
                    {fieldRow("애니메이션", (
                        <select value={element.animationPreset} onChange={onChange("animationPreset")}>
                            <option value="none">{animationLabel("none")}</option>
                            <option value="fade_out">{animationLabel("fade_out")}</option>
                            <option value="fade_hold_fade">{animationLabel("fade_hold_fade")}</option>
                        </select>
                    ))}
                    {fieldRow("시작 시간", <input type="number" min="0" step="0.05" value={element.animInDuration} onChange={onChange("animInDuration")} />)}
                    {fieldRow("유지 시간", <input type="number" min="0" step="0.05" value={element.animHoldDuration} onChange={onChange("animHoldDuration")} />)}
                    {fieldRow("종료 시간", <input type="number" min="0" step="0.05" value={element.animOutDuration} onChange={onChange("animOutDuration")} />)}
                    {element.id === "title" ? fieldRow("타이틀 모드", (
                        <select value={element.titleMode ?? "single"} onChange={onChange("titleMode")}>
                            <option value="single">단일</option>
                            <option value="slice">슬라이싱</option>
                        </select>
                    )) : null}
                    {element.id === "subtitle" ? fieldRow("서브타이틀 모드", (
                        <select value={element.subtitleMode ?? "single"} onChange={onChange("subtitleMode")}>
                            <option value="single">단일</option>
                            <option value="slice">슬라이싱</option>
                        </select>
                    )) : null}
                </div>
            </div>
            {sliceMode ? (
                <div className="hudEditorInspectorCard">
                    <div className="hudEditorInspectorTitle">슬롯 설정</div>
                    <div className="hudEditorInspectorBody">
                        {fieldRow("슬롯 크기", <input type="number" value={element.sliceSlotSize ?? 20} onChange={onChange("sliceSlotSize")} />)}
                        {fieldRow("열 수", <input type="number" value={element.sliceColumns ?? 2} onChange={onChange("sliceColumns")} />)}
                        {fieldRow("가로 간격", <input type="number" value={element.sliceGapX ?? 8} onChange={onChange("sliceGapX")} />)}
                        {fieldRow("세로 간격", <input type="number" value={element.sliceGapY ?? 8} onChange={onChange("sliceGapY")} />)}
                        <div className="hudEditorSidebarActions">
                            <button type="button" className="propertyInputButton" onClick={() => addHudEditorSliceSlot(element.id)}>슬롯 추가</button>
                            <button type="button" className="propertyInputButton" onClick={() => removeHudEditorSliceSlot(element.id)}>슬롯 제거</button>
                        </div>
                        {slots.map((slot, index) => (
                            <div key={`${element.id}-${index}`}>
                                {fieldRow(`슬롯 ${index + 1} 앵커`, (
                                    <select value={slot.anchor} onChange={(event) => updateHudEditorSliceSlot(index, "anchor", event.target.value as HudAnchor)}>
                                        {ANCHORS.map((anchor) => <option key={anchor} value={anchor}>{ANCHOR_LABELS[anchor]}</option>)}
                                    </select>
                                ))}
                                {fieldRow(`슬롯 ${index + 1} X`, <input type="number" value={slot.x} onChange={(event) => updateHudEditorSliceSlot(index, "x", Number.parseInt(event.target.value, 10) || 0)} />)}
                                {fieldRow(`슬롯 ${index + 1} Y`, <input type="number" value={slot.y} onChange={(event) => updateHudEditorSliceSlot(index, "y", Number.parseInt(event.target.value, 10) || 0)} />)}
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
                <div className="hudEditorInspectorTitle">진행 바 설정</div>
                <div className="hudEditorInspectorBody">
                    {fieldRow("이름", <input type="text" value={element.label} onChange={onChange("label")} />)}
                    {fieldRow("소스 채널", (
                        <select value={element.sourceChannel} onChange={onChange("sourceChannel")}>
                            <option value="title">타이틀</option>
                            <option value="subtitle">서브타이틀</option>
                            <option value="actionbar">액션바</option>
                        </select>
                    ))}
                    {fieldRow("샘플 텍스트", <input type="text" value={element.sampleText} onChange={onChange("sampleText")} />)}
                    {fieldRow("접두사", <input type="text" value={element.prefix} onChange={onChange("prefix")} />)}
                    {fieldRow("바닐라 숨김", <input type="checkbox" checked={element.hideVanilla} onChange={onChange("hideVanilla")} />)}
                    {fieldRow("최대값 모드", (
                        <select value={element.maxMode} onChange={onChange("maxMode")}>
                            <option value="fixed">고정</option>
                            <option value="dynamic">동적</option>
                        </select>
                    ))}
                    {fieldRow("최대값", <input type="number" value={element.maxValue} onChange={onChange("maxValue")} />)}
                    {fieldRow("채우기 색상", <input type="color" value={element.fillColor} onChange={onChange("fillColor")} />)}
                    {fieldRow("클립 방향", (
                        <select value={element.clipDirection} onChange={onChange("clipDirection")}>
                            {CLIP_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{CLIP_DIRECTION_LABELS[direction]}</option>)}
                        </select>
                    ))}
                    {fieldRow("배경 텍스처", <input type="text" value={element.backgroundTexture} onChange={onChange("backgroundTexture")} />)}
                    {fieldRow("바 텍스처", <input type="text" value={element.barTexture} onChange={onChange("barTexture")} />)}
                    {fieldRow("트레일 텍스처", <input type="text" value={element.trailTexture} onChange={onChange("trailTexture")} />)}
                    {fieldRow("텍스처 타입", (
                        <select value={element.textureType} onChange={onChange("textureType")}>
                            <option value="">기본</option>
                            <option value="fixed">고정</option>
                        </select>
                    ))}
                    {fieldRow("바 알파", <input type="number" min="0" max="1" step="0.05" value={element.barAlpha} onChange={onChange("barAlpha")} />)}
                    {fieldRow("트레일 알파", <input type="number" min="0" max="1" step="0.05" value={element.trailAlpha} onChange={onChange("trailAlpha")} />)}
                    {fieldRow("지속 시간", <input type="number" min="0" step="0.05" value={element.duration} onChange={onChange("duration")} />)}
                    {fieldRow("트레일 지연", <input type="number" min="0" step="0.05" value={element.trailDelay} onChange={onChange("trailDelay")} />)}
                    {fieldRow("바 여백 X", <input type="number" value={element.barInsetX} onChange={onChange("barInsetX")} />)}
                    {fieldRow("바 여백 Y", <input type="number" value={element.barInsetY} onChange={onChange("barInsetY")} />)}
                    {fieldRow("텍스트 표시", <input type="checkbox" checked={element.showText} onChange={onChange("showText")} />)}
                    <div className="hudEditorSidebarActions">
                        <button type="button" className="propertyInputButton" onClick={() => deleteHudEditorProgressBar(element.id)}>진행 바 삭제</button>
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
                    <div className="hudEditorSidebarTitle">HUD 항목</div>
                    <div className="hudEditorSidebarList">
                        {Object.values(snapshot.state.elements).map((element) => (
                            <button key={element.id} type="button" className={`hudEditorChannelButton${element.id === snapshot.state.selectedId ? " hudEditorChannelButtonActive" : ""}`} onClick={() => selectHudEditorItem(element.id)}>
                                <span>{element.label}</span>
                                <span>{element.enabled ? "사용" : "끔"}</span>
                            </button>
                        ))}
                        <div className="hudEditorSidebarTitle" style={{ marginTop: 12 }}>진행 바</div>
                        <div className="hudEditorSidebarActions">
                            <button type="button" className="propertyInputButton" onClick={() => addHudEditorProgressBar()}>추가</button>
                        </div>
                        {snapshot.state.progressBars.map((bar) => (
                            <button key={bar.id} type="button" className={`hudEditorChannelButton${bar.id === snapshot.state.selectedId ? " hudEditorChannelButtonActive" : ""}`} onClick={() => selectHudEditorItem(bar.id)}>
                                <span>{bar.label}</span>
                                <span>{bar.enabled ? "사용" : "끔"}</span>
                            </button>
                        ))}
                    </div>
                    <div className="hudEditorSidebarActions">
                        <button type="button" className="propertyInputButton" onClick={() => resetHudEditorState()}>초기화</button>
                    </div>
                </div>
            </div>
            <div className="hudEditorCenter">
                <div className="hudEditorSidebarCard hudEditorPreviewToolbar">
                    <div className="hudEditorPreviewToolbarLeft">
                        <button type="button" className={`propertyInputButton ${snapshot.state.autoFitPreview ? "hudEditorZoomActive" : ""}`} onClick={() => setHudEditorAutoFitPreview(true)}>맞춤</button>
                        {[0.75, 1, 1.25].map((zoom) => (
                            <button key={zoom} type="button" className={`propertyInputButton ${!snapshot.state.autoFitPreview && snapshot.state.previewZoom === zoom ? "hudEditorZoomActive" : ""}`} onClick={() => setHudEditorPreviewZoom(zoom)}>{Math.round(zoom * 100)}%</button>
                        ))}
                        <button type="button" className={`propertyInputButton ${snapshot.state.showAnchorGuides ? "hudEditorZoomActive" : ""}`} onClick={() => toggleHudEditorGuides()}>가이드</button>
                        <button type="button" className={`propertyInputButton ${snapshot.state.autoAnchorSnap ? "hudEditorZoomActive" : ""}`} onClick={() => toggleHudEditorAutoAnchorSnap()}>자동 앵커</button>
                    </div>
                    <div className="hudEditorPreviewToolbarRight">배율 {scale}%</div>
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
                        <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(snapshot.hudJson, "hud_screen.json 복사됨")}>복사</button>
                        <button type="button" className="propertyInputButton" onClick={() => downloadHudEditorJsonFile("hud_screen.json", snapshot.hudJson)}>다운로드</button>
                    </div>
                </div>
                {snapshot.hasEnabledProgressBars ? (
                    <>
                        <div className="hudEditorJsonCard">
                            <div className="hudEditorSidebarTitle">animated_bar.json</div>
                            <textarea className="hudEditorOutput" spellCheck={false} readOnly value={snapshot.animatedBarJson}></textarea>
                            <div className="hudEditorSidebarActions">
                                <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(snapshot.animatedBarJson, "animated_bar.json 복사됨")}>복사</button>
                                <button type="button" className="propertyInputButton" onClick={() => downloadHudEditorJsonFile("animated_bar.json", snapshot.animatedBarJson)}>다운로드</button>
                            </div>
                        </div>
                        <div className="hudEditorJsonCard">
                            <div className="hudEditorSidebarTitle">_ui_defs.json</div>
                            <textarea className="hudEditorOutput" spellCheck={false} readOnly value={snapshot.uiDefsJson}></textarea>
                            <div className="hudEditorSidebarActions">
                                <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(snapshot.uiDefsJson, "_ui_defs.json 복사됨")}>복사</button>
                                <button type="button" className="propertyInputButton" onClick={() => downloadHudEditorJsonFile("_ui_defs.json", snapshot.uiDefsJson)}>다운로드</button>
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
                                    <button type="button" className="propertyInputButton" onClick={() => void copyHudEditorText(helper.copyText, helper.notice)}>스크립트 복사</button>
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
