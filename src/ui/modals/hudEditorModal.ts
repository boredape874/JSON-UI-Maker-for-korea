import { Notification } from "../notifs/noficationMaker.js";

type HudChannel = "title" | "subtitle" | "actionbar";
type HudBackground = "vanilla" | "solid" | "none";
type HudFontSize = "normal" | "large" | "extra_large";
type HudAnchor =
    | "top_left"
    | "top_middle"
    | "top_right"
    | "left_middle"
    | "center"
    | "right_middle"
    | "bottom_left"
    | "bottom_middle"
    | "bottom_right";

type HudElement = {
    id: HudChannel;
    label: string;
    enabled: boolean;
    sampleText: string;
    prefix: string;
    stripPrefix: boolean;
    hideVanilla: boolean;
    preserve: boolean;
    anchor: HudAnchor;
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
    fontSize: HudFontSize;
    textColor: string;
    shadow: boolean;
    background: HudBackground;
    backgroundAlpha: number;
    backgroundColor: string;
};

type HudEditorState = {
    selectedId: HudChannel;
    elements: Record<HudChannel, HudElement>;
    drag: null | {
        id: HudChannel;
        startMouseX: number;
        startMouseY: number;
        startX: number;
        startY: number;
    };
};

const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = 1500 / 1.7777777;

const state: HudEditorState = {
    selectedId: "title",
    elements: {
        title: {
            id: "title",
            label: "Title",
            enabled: true,
            sampleText: "info:공지입니다",
            prefix: "info:",
            stripPrefix: true,
            hideVanilla: true,
            preserve: true,
            anchor: "top_middle",
            x: 0,
            y: 130,
            width: 440,
            height: 56,
            layer: 30,
            fontSize: "extra_large",
            textColor: "#ffffff",
            shadow: true,
            background: "vanilla",
            backgroundAlpha: 0.75,
            backgroundColor: "#1f2432",
        },
        subtitle: {
            id: "subtitle",
            label: "Subtitle",
            enabled: true,
            sampleText: "부제목입니다",
            prefix: "",
            stripPrefix: false,
            hideVanilla: true,
            preserve: false,
            anchor: "top_middle",
            x: 0,
            y: 190,
            width: 380,
            height: 42,
            layer: 31,
            fontSize: "large",
            textColor: "#dfe9ff",
            shadow: true,
            background: "vanilla",
            backgroundAlpha: 0.75,
            backgroundColor: "#1f2432",
        },
        actionbar: {
            id: "actionbar",
            label: "Actionbar",
            enabled: true,
            sampleText: "info:오른쪽 표시",
            prefix: "info:",
            stripPrefix: true,
            hideVanilla: true,
            preserve: false,
            anchor: "bottom_middle",
            x: 0,
            y: -96,
            width: 340,
            height: 38,
            layer: 32,
            fontSize: "normal",
            textColor: "#ffffff",
            shadow: true,
            background: "vanilla",
            backgroundAlpha: 0.75,
            backgroundColor: "#1f2432",
        },
    },
    drag: null,
};

function getModal(): HTMLElement {
    return document.getElementById("modalHudEditor") as HTMLElement;
}

function getCloseButton(): HTMLElement {
    return document.getElementById("modalHudEditorClose") as HTMLElement;
}

function getForm(): HTMLDivElement {
    return document.getElementsByClassName("modalHudEditorForm")[0] as HTMLDivElement;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function quoteString(value: string): string {
    return JSON.stringify(value);
}

function hexToRgb(color: string): [number, number, number] {
    const normalized = color.replace("#", "");
    const safe = normalized.length === 3
        ? normalized.split("").map((char) => `${char}${char}`).join("")
        : normalized.padEnd(6, "0").slice(0, 6);
    const number = Number.parseInt(safe, 16);
    return [
        ((number >> 16) & 255) / 255,
        ((number >> 8) & 255) / 255,
        (number & 255) / 255,
    ];
}

function getSelectedElement(): HudElement {
    return state.elements[state.selectedId];
}

function getCanvasBackgroundHtml(): string {
    const mainWindow = document.getElementById("main_window");
    const bgImage = mainWindow?.querySelector(".bg_image") as HTMLImageElement | null;
    if (bgImage?.src) {
        return `<img class="hudEditorCanvasBackgroundImage" src="${bgImage.src}" alt="HUD Background">`;
    }

    return `<div class="hudEditorCanvasBackgroundFallback"></div>`;
}

function prefixMatchExpression(source: string, prefix: string): string {
    if (!prefix) return "true";
    return `(not ((${source} - ${quoteString(prefix)}) = ${source}))`;
}

function removePrefixExpression(source: string, prefix: string, stripPrefix: boolean): string {
    if (!prefix || !stripPrefix) return source;
    return `(${source} - ${quoteString(prefix)})`;
}

function backgroundDefinition(element: HudElement): Record<string, unknown> | null {
    if (element.background === "none") return null;

    const base: Record<string, unknown> = {
        type: "image",
        size: ["100%", "100%"],
        alpha: element.backgroundAlpha,
    };

    if (element.background === "vanilla") {
        base.texture = "textures/ui/hud_tip_text_background";
        return base;
    }

    base.texture = "textures/ui/white_background";
    base.color = hexToRgb(element.backgroundColor);
    return base;
}

function buildTitleControl(element: HudElement): Record<string, unknown> {
    const dataBindings: Record<string, unknown>[] = [
        {
            binding_name: "#hud_title_text_string",
            binding_name_override: "#source_text",
            binding_type: "global",
        },
    ];

    if (element.preserve) {
        dataBindings.push({
            binding_name: "#hud_title_text_string",
            binding_name_override: "#preserved_text",
            binding_condition: "visibility_changed",
            binding_type: "global",
        });
    }

    dataBindings.push({
        binding_type: "view",
        source_property_name: element.preserve
            ? `(not (#source_text = #preserved_text) and ${prefixMatchExpression("#source_text", element.prefix)})`
            : prefixMatchExpression("#source_text", element.prefix),
        target_property_name: "#visible",
    });

    const controls: Record<string, unknown>[] = [
        {
            title_data: {
                type: "panel",
                size: [0, 0],
                property_bag: {
                    "#source_text": "",
                    "#preserved_text": "",
                },
                bindings: dataBindings,
            },
        },
    ];

    const background = backgroundDefinition(element);
    if (background) {
        controls.push({
            title_background: background,
        });
    }

    controls.push({
        title_label: {
            type: "label",
            text: "#text",
            localize: false,
            size: ["100%", "default"],
            max_size: ["100%", "default"],
            anchor_from: "center",
            anchor_to: "center",
            color: hexToRgb(element.textColor),
            shadow: element.shadow,
            layer: 31,
            font_size: element.fontSize,
            text_alignment: "center",
            bindings: [
                {
                    binding_type: "view",
                    source_control_name: "title_data",
                    source_property_name: removePrefixExpression(element.preserve ? "#preserved_text" : "#source_text", element.prefix, element.stripPrefix),
                    target_property_name: "#text",
                },
            ],
        },
    });

    return {
        type: "panel",
        size: [element.width, element.height],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        controls,
        bindings: [
            {
                binding_type: "view",
                source_control_name: "title_data",
                source_property_name: element.preserve ? "(not (#preserved_text = ''))" : "#visible",
                target_property_name: "#visible",
            },
        ],
    };
}

function buildSubtitleControl(element: HudElement): Record<string, unknown> {
    const controls: Record<string, unknown>[] = [];
    const background = backgroundDefinition(element);
    if (background) {
        controls.push({
            subtitle_background: background,
        });
    }

    controls.push({
        subtitle_label: {
            type: "label",
            text: "#text",
            localize: false,
            size: ["100%", "default"],
            max_size: ["100%", "default"],
            anchor_from: "center",
            anchor_to: "center",
            color: hexToRgb(element.textColor),
            shadow: element.shadow,
            layer: 31,
            font_size: element.fontSize,
            text_alignment: "center",
            bindings: [
                {
                    binding_name: "#hud_subtitle_text_string",
                    binding_name_override: "#text",
                    binding_type: "global",
                },
                {
                    binding_type: "view",
                    source_property_name: removePrefixExpression("#text", element.prefix, element.stripPrefix),
                    target_property_name: "#text",
                },
                {
                    binding_type: "view",
                    source_property_name: element.prefix
                        ? prefixMatchExpression("#text", element.prefix)
                        : "(not (#text = ''))",
                    target_property_name: "#visible",
                },
            ],
        },
    });

    return {
        type: "panel",
        size: [element.width, element.height],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        controls,
    };
}

function buildActionbarControl(element: HudElement): Record<string, unknown> {
    const control: Record<string, unknown> = {
        type: element.background === "none" ? "panel" : "image",
        size: [element.width, element.height],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        $atext: "$actionbar_text",
        visible: element.prefix ? prefixMatchExpression("$atext", element.prefix) : "(not ($atext = ''))",
        controls: [
            {
                actionbar_label: {
                    type: "label",
                    text: "$display_text",
                    localize: false,
                    size: ["100%", "default"],
                    max_size: ["100%", "default"],
                    anchor_from: "center",
                    anchor_to: "center",
                    color: hexToRgb(element.textColor),
                    shadow: element.shadow,
                    layer: 31,
                    font_size: element.fontSize,
                    text_alignment: "center",
                    $atext: "$actionbar_text",
                    "$display_text|default": "$atext",
                    variables: [
                        {
                            requires: element.prefix ? prefixMatchExpression("$atext", element.prefix) : "(not ($atext = ''))",
                            $display_text: element.prefix && element.stripPrefix
                                ? removePrefixExpression("$atext", element.prefix, true)
                                : "$atext",
                        },
                    ],
                },
            },
        ],
    };

    if (element.background !== "none") {
        control.texture = element.background === "vanilla" ? "textures/ui/hud_tip_text_background" : "textures/ui/white_background";
        control.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            control.color = hexToRgb(element.backgroundColor);
        }
    }

    return control;
}

function buildHudJson(): string {
    const json: Record<string, unknown> = {
        namespace: "hud",
    };

    const rootInsert: Record<string, unknown>[] = [];

    const title = state.elements.title;
    if (title.enabled) {
        json.title_control = buildTitleControl(title);
        rootInsert.push({ "title_control@hud.title_control": {} });

        if (title.hideVanilla) {
            json["hud_title_text/title_frame"] = {
                bindings: [
                    {
                        binding_type: "view",
                        source_control_name: "title",
                        source_property_name: title.prefix ? `((#text - ${quoteString(title.prefix)}) = #text)` : "false",
                        target_property_name: "#visible",
                    },
                ],
            };
        }
    }

    const subtitle = state.elements.subtitle;
    if (subtitle.enabled) {
        json.subtitle_control = buildSubtitleControl(subtitle);
        rootInsert.push({ "subtitle_control@hud.subtitle_control": {} });

        if (subtitle.hideVanilla) {
            json["hud_title_text/subtitle_frame"] = subtitle.prefix
                ? {
                    bindings: [
                        {
                            binding_type: "view",
                            source_control_name: "subtitle",
                            source_property_name: `((#text - ${quoteString(subtitle.prefix)}) = #text)`,
                            target_property_name: "#visible",
                        },
                    ],
                }
                : { visible: false };
        }
    }

    const actionbar = state.elements.actionbar;
    if (actionbar.enabled) {
        json.my_custom_actionbar = buildActionbarControl(actionbar);
        json["root_panel/hud_actionbar_text_area"] = {
            modifications: [
                {
                    array_name: "controls",
                    operation: "insert_back",
                    value: [
                        {
                            custom_actionbar_factory: {
                                type: "panel",
                                factory: {
                                    name: "hud_actionbar_text_factory",
                                    control_ids: {
                                        hud_actionbar_text: "@hud.my_custom_actionbar",
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        };

        if (actionbar.hideVanilla) {
            json["hud_actionbar_text"] = {
                $atext: "$actionbar_text",
                visible: actionbar.prefix ? `(($atext - ${quoteString(actionbar.prefix)}) = $atext)` : "false",
            };
        }
    }

    if (rootInsert.length > 0) {
        json.root_panel = {
            modifications: [
                {
                    array_name: "controls",
                    operation: "insert_back",
                    value: rootInsert,
                },
            ],
        };
    }

    return JSON.stringify(json, null, 2);
}

function updateOutput(): void {
    const output = getForm().querySelector(".hudEditorOutput") as HTMLTextAreaElement | null;
    if (output) output.value = buildHudJson();
}

function getAnchorReference(anchor: HudAnchor): { x: number; y: number } {
    switch (anchor) {
        case "top_left": return { x: 0, y: 0 };
        case "top_middle": return { x: PREVIEW_WIDTH / 2, y: 0 };
        case "top_right": return { x: PREVIEW_WIDTH, y: 0 };
        case "left_middle": return { x: 0, y: PREVIEW_HEIGHT / 2 };
        case "center": return { x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT / 2 };
        case "right_middle": return { x: PREVIEW_WIDTH, y: PREVIEW_HEIGHT / 2 };
        case "bottom_left": return { x: 0, y: PREVIEW_HEIGHT };
        case "bottom_middle": return { x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT };
        case "bottom_right": return { x: PREVIEW_WIDTH, y: PREVIEW_HEIGHT };
    }
}

function computePreviewRect(element: HudElement): { left: number; top: number } {
    const base = getAnchorReference(element.anchor);
    let left = base.x + element.x;
    let top = base.y + element.y;

    if (element.anchor === "top_middle" || element.anchor === "center" || element.anchor === "bottom_middle") {
        left -= element.width / 2;
    } else if (element.anchor === "top_right" || element.anchor === "right_middle" || element.anchor === "bottom_right") {
        left -= element.width;
    }

    if (element.anchor === "left_middle" || element.anchor === "center" || element.anchor === "right_middle") {
        top -= element.height / 2;
    } else if (element.anchor === "bottom_left" || element.anchor === "bottom_middle" || element.anchor === "bottom_right") {
        top -= element.height;
    }

    return { left, top };
}

function previewElementText(element: HudElement): string {
    if (!element.stripPrefix || !element.prefix) return element.sampleText;
    if (element.sampleText.startsWith(element.prefix)) {
        return element.sampleText.slice(element.prefix.length);
    }
    return element.sampleText;
}

function renderSidebar(): void {
    const container = getForm().querySelector(".hudEditorSidebarList") as HTMLDivElement | null;
    if (!container) return;

    container.innerHTML = Object.values(state.elements).map((element) => `
        <button type="button" class="hudEditorChannelButton${element.id === state.selectedId ? " hudEditorChannelButtonActive" : ""}" data-channel="${element.id}">
            <span>${element.label}</span>
            <span>${element.enabled ? "ON" : "OFF"}</span>
        </button>
    `).join("");

    container.querySelectorAll<HTMLButtonElement>(".hudEditorChannelButton").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedId = button.dataset.channel as HudChannel;
            renderAll();
        });
    });
}

function renderCanvas(): void {
    const preview = getForm().querySelector(".hudEditorPreview") as HTMLDivElement | null;
    if (!preview) return;

    const titleGuide = computePreviewRect({ ...state.elements.title, x: 0, y: 130, width: 440, height: 56, anchor: "top_middle" });
    const subtitleGuide = computePreviewRect({ ...state.elements.subtitle, x: 0, y: 190, width: 380, height: 42, anchor: "top_middle" });
    const actionbarGuide = computePreviewRect({ ...state.elements.actionbar, x: 0, y: -96, width: 340, height: 38, anchor: "bottom_middle" });

    preview.innerHTML = `
        ${getCanvasBackgroundHtml()}
        <div class="hudEditorSafeZone"></div>
        <div class="hudEditorGuideLabel" style="left:${titleGuide.left}px;top:${titleGuide.top}px;width:440px;height:56px;">Vanilla Title</div>
        <div class="hudEditorGuideLabel" style="left:${subtitleGuide.left}px;top:${subtitleGuide.top}px;width:380px;height:42px;">Vanilla Subtitle</div>
        <div class="hudEditorGuideLabel" style="left:${actionbarGuide.left}px;top:${actionbarGuide.top}px;width:340px;height:38px;">Vanilla Actionbar</div>
        ${Object.values(state.elements).filter((element) => element.enabled).map((element) => {
            const rect = computePreviewRect(element);
            const selectedClass = element.id === state.selectedId ? " hudEditorPreviewItemSelected" : "";
            const withBg = element.background === "none" ? "" : " hudEditorPreviewItemWithBg";
            const bgStyle = element.background === "solid" ? `background:${element.backgroundColor};opacity:${element.backgroundAlpha};` : "";
            return `
                <div class="hudEditorPreviewItem${selectedClass}${withBg}" data-element-id="${element.id}" style="left:${rect.left}px;top:${rect.top}px;width:${element.width}px;height:${element.height}px;z-index:${element.layer};">
                    <div class="hudEditorPreviewItemBg ${element.background === "vanilla" ? "hudEditorPreviewItemBgVanilla" : ""}" style="${bgStyle}"></div>
                    <div class="hudEditorPreviewText hudEditorFont-${element.fontSize}" style="color:${element.textColor};${element.shadow ? "text-shadow:0 2px 3px rgba(0,0,0,0.85);" : ""}">${escapeHtml(previewElementText(element))}</div>
                </div>
            `;
        }).join("")}
    `;

    preview.querySelectorAll<HTMLElement>(".hudEditorPreviewItem").forEach((item) => {
        item.addEventListener("mousedown", (event) => {
            const id = item.dataset.elementId as HudChannel;
            const element = state.elements[id];
            state.selectedId = id;
            state.drag = {
                id,
                startMouseX: event.clientX,
                startMouseY: event.clientY,
                startX: element.x,
                startY: element.y,
            };
            renderAll();
        });

        item.addEventListener("click", () => {
            state.selectedId = item.dataset.elementId as HudChannel;
            renderAll();
        });
    });
}

function renderInspector(): void {
    const element = getSelectedElement();
    const inspector = getForm().querySelector(".hudEditorInspector") as HTMLDivElement | null;
    if (!inspector) return;

    inspector.innerHTML = `
        <div class="hudEditorInspectorCard">
            <div class="hudEditorInspectorTitle">${element.label}</div>
            <div class="hudEditorInspectorBody">
                <label>사용</label><input data-field="enabled" type="checkbox" ${element.enabled ? "checked" : ""}>
                <label>예시 텍스트</label><input data-field="sampleText" type="text" value="${escapeHtml(element.sampleText)}">
                <label>접두사</label><input data-field="prefix" type="text" value="${escapeHtml(element.prefix)}">
                <label>접두사 제거</label><input data-field="stripPrefix" type="checkbox" ${element.stripPrefix ? "checked" : ""}>
                <label>바닐라 숨김</label><input data-field="hideVanilla" type="checkbox" ${element.hideVanilla ? "checked" : ""}>
                <label>값 보존</label><input data-field="preserve" type="checkbox" ${element.preserve ? "checked" : ""} ${element.id !== "title" ? "disabled" : ""}>
                <label>앵커</label>
                <select data-field="anchor">
                    ${["top_left", "top_middle", "top_right", "left_middle", "center", "right_middle", "bottom_left", "bottom_middle", "bottom_right"].map((anchor) => `<option value="${anchor}" ${element.anchor === anchor ? "selected" : ""}>${anchor}</option>`).join("")}
                </select>
                <label>X</label><input data-field="x" type="number" value="${element.x}">
                <label>Y</label><input data-field="y" type="number" value="${element.y}">
                <label>너비</label><input data-field="width" type="number" min="40" value="${element.width}">
                <label>높이</label><input data-field="height" type="number" min="20" value="${element.height}">
                <label>레이어</label><input data-field="layer" type="number" value="${element.layer}">
                <label>글자 크기</label>
                <select data-field="fontSize">
                    ${["normal", "large", "extra_large"].map((font) => `<option value="${font}" ${element.fontSize === font ? "selected" : ""}>${font}</option>`).join("")}
                </select>
                <label>텍스트 색상</label><input data-field="textColor" type="color" value="${element.textColor}">
                <label>그림자</label><input data-field="shadow" type="checkbox" ${element.shadow ? "checked" : ""}>
                <label>배경</label>
                <select data-field="background">
                    <option value="vanilla" ${element.background === "vanilla" ? "selected" : ""}>vanilla</option>
                    <option value="solid" ${element.background === "solid" ? "selected" : ""}>solid</option>
                    <option value="none" ${element.background === "none" ? "selected" : ""}>none</option>
                </select>
                <label>배경 알파</label><input data-field="backgroundAlpha" type="number" min="0" max="1" step="0.05" value="${element.backgroundAlpha}">
                <label>배경 색상</label><input data-field="backgroundColor" type="color" value="${element.backgroundColor}" ${element.background === "solid" ? "" : "disabled"}>
            </div>
        </div>
        <div class="hudEditorInspectorCard">
            <div class="hudEditorInspectorTitle">채널 안내</div>
            <div class="hudEditorDescription">
                <div>Title: <code>#hud_title_text_string</code></div>
                <div>Subtitle: <code>#hud_subtitle_text_string</code></div>
                <div>Actionbar: <code>$actionbar_text</code></div>
                <div>Actionbar는 바닐라처럼 factory 방식으로 export됩니다.</div>
                <div>Title만 preserve 패턴을 사용합니다.</div>
            </div>
        </div>
    `;

    inspector.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-field], select[data-field]").forEach((input) => {
        const field = input.dataset.field as keyof HudElement;
        const onChange = () => {
            const target = state.elements[state.selectedId] as Record<string, unknown>;
            if (input instanceof HTMLInputElement && input.type === "checkbox") {
                target[field] = input.checked;
            } else if (field === "x" || field === "y" || field === "width" || field === "height" || field === "layer") {
                target[field] = Number.parseInt(input.value, 10) || 0;
            } else if (field === "backgroundAlpha") {
                target[field] = clamp(Number.parseFloat(input.value) || 0, 0, 1);
            } else {
                target[field] = input.value;
            }
            renderAll();
        };

        input.addEventListener("input", onChange);
        input.addEventListener("change", onChange);
    });
}

function renderAll(): void {
    renderSidebar();
    renderCanvas();
    renderInspector();
    updateOutput();
}

function renderModalShell(): void {
    getForm().innerHTML = `
        <div class="hudEditorLayout">
            <div class="hudEditorSidebar">
                <div class="hudEditorSidebarCard">
                    <div class="hudEditorSidebarTitle">HUD 요소</div>
                    <div class="hudEditorSidebarList"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorReset">바닐라 위치로 초기화</button>
                    </div>
                </div>
            </div>
            <div class="hudEditorCenter">
                <div class="hudEditorCanvasWrap">
                    <div class="hudEditorCanvasScale">
                        <div class="hudEditorPreview"></div>
                    </div>
                </div>
                <div class="hudEditorHelp">
                    <div>가이드 상자는 바닐라 위치 기준입니다.</div>
                    <div>실제 HUD 박스를 직접 드래그해서 위치를 옮기고, 오른쪽에서 크기와 접두사 처리까지 조정할 수 있습니다.</div>
                </div>
                <div class="hudEditorJsonCard">
                    <div class="hudEditorSidebarTitle">생성되는 JSON</div>
                    <textarea class="hudEditorOutput" spellcheck="false"></textarea>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorCopyJson">JSON 복사</button>
                        <button type="button" class="propertyInputButton hudEditorDownloadJson">hud_screen.json 다운로드</button>
                    </div>
                </div>
            </div>
            <div class="hudEditorInspector"></div>
        </div>
    `;
}

function bindStaticActions(): void {
    const form = getForm();
    const resetButton = form.querySelector(".hudEditorReset") as HTMLButtonElement | null;
    const copyButton = form.querySelector(".hudEditorCopyJson") as HTMLButtonElement | null;
    const downloadButton = form.querySelector(".hudEditorDownloadJson") as HTMLButtonElement | null;

    resetButton?.addEventListener("click", () => {
        state.selectedId = "title";
        state.elements.title = {
            ...state.elements.title,
            enabled: true,
            sampleText: "info:공지입니다",
            prefix: "info:",
            stripPrefix: true,
            hideVanilla: true,
            preserve: true,
            anchor: "top_middle",
            x: 0,
            y: 130,
            width: 440,
            height: 56,
            layer: 30,
            fontSize: "extra_large",
            textColor: "#ffffff",
            shadow: true,
            background: "vanilla",
            backgroundAlpha: 0.75,
            backgroundColor: "#1f2432",
        };
        state.elements.subtitle = {
            ...state.elements.subtitle,
            enabled: true,
            sampleText: "부제목입니다",
            prefix: "",
            stripPrefix: false,
            hideVanilla: true,
            preserve: false,
            anchor: "top_middle",
            x: 0,
            y: 190,
            width: 380,
            height: 42,
            layer: 31,
            fontSize: "large",
            textColor: "#dfe9ff",
            shadow: true,
            background: "vanilla",
            backgroundAlpha: 0.75,
            backgroundColor: "#1f2432",
        };
        state.elements.actionbar = {
            ...state.elements.actionbar,
            enabled: true,
            sampleText: "info:오른쪽 표시",
            prefix: "info:",
            stripPrefix: true,
            hideVanilla: true,
            preserve: false,
            anchor: "bottom_middle",
            x: 0,
            y: -96,
            width: 340,
            height: 38,
            layer: 32,
            fontSize: "normal",
            textColor: "#ffffff",
            shadow: true,
            background: "vanilla",
            backgroundAlpha: 0.75,
            backgroundColor: "#1f2432",
        };
        renderAll();
        new Notification("HUD 기본 위치로 초기화했습니다.", 2200, "notif");
    });

    copyButton?.addEventListener("click", async () => {
        await navigator.clipboard.writeText(buildHudJson());
        new Notification("HUD JSON을 클립보드에 복사했습니다.", 2200, "notif");
    });

    downloadButton?.addEventListener("click", () => {
        const blob = new Blob([buildHudJson()], { type: "application/json" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "hud_screen.json";
        link.click();
        URL.revokeObjectURL(url);
        new Notification("hud_screen.json을 다운로드했습니다.", 2200, "notif");
    });
}

function attachDragHandlers(): void {
    const modal = getModal();
    modal.onmousemove = (event: MouseEvent) => {
        if (!state.drag) return;
        const element = state.elements[state.drag.id];
        element.x = Math.round(state.drag.startX + (event.clientX - state.drag.startMouseX));
        element.y = Math.round(state.drag.startY + (event.clientY - state.drag.startMouseY));
        renderAll();
    };

    modal.onmouseup = () => {
        state.drag = null;
    };

    modal.onmouseleave = () => {
        state.drag = null;
    };
}

export async function hudEditorModal(): Promise<void> {
    renderModalShell();
    bindStaticActions();
    attachDragHandlers();
    renderAll();

    const modal = getModal();
    modal.style.display = "block";

    return new Promise((resolve) => {
        const close = () => {
            modal.style.display = "none";
            getCloseButton().onclick = null;
            window.onclick = null;
            resolve();
        };

        getCloseButton().onclick = close;
        window.onclick = (event: MouseEvent) => {
            if (event.target === modal) close();
        };
    });
}
