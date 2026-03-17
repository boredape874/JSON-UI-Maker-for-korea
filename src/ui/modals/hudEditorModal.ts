import { Notification } from "../notifs/noficationMaker.js";

type HudChannel = "title" | "subtitle_slot" | "actionbar" | "actionbar_preserve";
type HudParseMode = "trigger" | "slice";
type HudOutputMode = "label" | "progress_bar";
type HudBackgroundType = "none" | "vanilla" | "solid" | "custom";
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
type HudTemplateName =
    | "title_info"
    | "title_coin"
    | "title_hp_text"
    | "title_hp_bar"
    | "subtitle_slots_5"
    | "actionbar_info"
    | "actionbar_preserve";

type HudPanel = {
    id: string;
    name: string;
    channel: HudChannel;
    parseMode: HudParseMode;
    outputMode: HudOutputMode;
    triggerText: string;
    stripTriggerText: boolean;
    preserveValue: boolean;
    sliceStart: number;
    sliceEnd: number;
    maxValue: number;
    anchor: HudAnchor;
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
    hideVanilla: boolean;
    enabled: boolean;
    backgroundType: HudBackgroundType;
    backgroundTexture: string;
    backgroundAlpha: number;
    backgroundColor: string;
    ninesliceSize: number;
    textColor: string;
    sampleText: string;
};

type DragState = {
    panelId: string | null;
    pointerOffsetX: number;
    pointerOffsetY: number;
};

const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = Math.round(1500 / 1.7777777);
const TITLE_BINDING = "#hud_title_text_string";
const SUBTITLE_BINDING = "#hud_subtitle_text_string";
const ACTIONBAR_VARIABLE = "$actionbar_text";
const BACKGROUND_TEXTURES = {
    vanilla: "textures/ui/hud_tip_text_background",
    solid: "textures/ui/white_background",
    hpBarBackground: "textures/ui/hp_bar/hp_bar_bg",
    hpBarFill: "textures/ui/hp_bar/hp_bar_full",
};

const state: {
    panels: HudPanel[];
    selectedId: string;
    nextId: number;
    drag: DragState;
} = {
    panels: [],
    selectedId: "",
    nextId: 1,
    drag: { panelId: null, pointerOffsetX: 0, pointerOffsetY: 0 },
};

const getModal = () => document.getElementById("modalHudEditor") as HTMLElement;
const getCloseButton = () => document.getElementById("modalHudEditorClose") as HTMLElement;
const getForm = () => document.getElementsByClassName("modalHudEditorForm")[0] as HTMLDivElement;
const selectedPanel = () => state.panels.find((panel) => panel.id === state.selectedId) ?? state.panels[0]!;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const escapeHtml = (text: string) => text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const escapeBindingText = (text: string) => text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

function colorHexToRgb(color: string): [number, number, number] {
    const value = Number.parseInt(color.replace("#", ""), 16);
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function anchorBase(anchor: HudAnchor): { x: number; y: number } {
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

function selfAnchorOffset(anchor: HudAnchor, width: number, height: number): { x: number; y: number } {
    switch (anchor) {
        case "top_left": return { x: 0, y: 0 };
        case "top_middle": return { x: width / 2, y: 0 };
        case "top_right": return { x: width, y: 0 };
        case "left_middle": return { x: 0, y: height / 2 };
        case "center": return { x: width / 2, y: height / 2 };
        case "right_middle": return { x: width, y: height / 2 };
        case "bottom_left": return { x: 0, y: height };
        case "bottom_middle": return { x: width / 2, y: height };
        case "bottom_right": return { x: width, y: height };
    }
}

function actualPosition(panel: HudPanel): { left: number; top: number } {
    const base = anchorBase(panel.anchor);
    const self = selfAnchorOffset(panel.anchor, panel.width, panel.height);
    return { left: base.x + panel.x - self.x, top: base.y + panel.y - self.y };
}

function applyActualPosition(panel: HudPanel, left: number, top: number): void {
    const base = anchorBase(panel.anchor);
    const self = selfAnchorOffset(panel.anchor, panel.width, panel.height);
    panel.x = Math.round(left + self.x - base.x);
    panel.y = Math.round(top + self.y - base.y);
}

function normalizePanel(panel: HudPanel): HudPanel {
    panel.name = panel.name.trim() || "HUD 패널";
    panel.sliceStart = Math.max(0, Math.round(panel.sliceStart || 0));
    panel.sliceEnd = Math.max(panel.sliceStart, Math.round(panel.sliceEnd || 0));
    panel.maxValue = Math.max(1, Math.round(panel.maxValue || 1));
    panel.width = clamp(Math.round(panel.width || 0), 40, PREVIEW_WIDTH);
    panel.height = clamp(Math.round(panel.height || 0), 20, PREVIEW_HEIGHT);
    panel.layer = Math.round(panel.layer || 0);
    panel.backgroundAlpha = clamp(panel.backgroundAlpha, 0, 1);
    panel.ninesliceSize = Math.max(0, Math.round(panel.ninesliceSize || 0));
    if (panel.channel === "subtitle_slot") {
        panel.parseMode = "slice";
        panel.preserveValue = false;
    }
    if (panel.channel === "actionbar") {
        panel.parseMode = "trigger";
        panel.outputMode = "label";
        panel.preserveValue = false;
    }
    if (panel.channel === "actionbar_preserve") {
        panel.parseMode = "trigger";
        panel.outputMode = "label";
        panel.preserveValue = true;
    }
    if (panel.outputMode === "progress_bar" && panel.backgroundType === "none") {
        panel.backgroundType = "vanilla";
    }
    return panel;
}

function createPanel(channel: HudChannel, overrides: Partial<HudPanel> = {}): HudPanel {
    const id = `hud_panel_${state.nextId++}`;
    const base: Record<HudChannel, Partial<HudPanel>> = {
        title: { name: "타이틀 패널", channel, parseMode: "trigger", outputMode: "label", triggerText: "info:", stripTriggerText: true, preserveValue: false, sliceStart: 0, sliceEnd: 200, maxValue: 100, anchor: "top_right", x: -4, y: 50, width: 500, height: 64, layer: 30, hideVanilla: true, enabled: true, backgroundType: "vanilla", backgroundTexture: "", backgroundAlpha: 0.75, backgroundColor: "#253a82", ninesliceSize: 0, textColor: "#ffffff", sampleText: "info: 공지입니다" },
        subtitle_slot: { name: "서브타이틀 슬롯", channel, parseMode: "slice", outputMode: "label", triggerText: "", stripTriggerText: false, preserveValue: false, sliceStart: 0, sliceEnd: 20, maxValue: 100, anchor: "top_left", x: 4, y: 28, width: 210, height: 34, layer: 31, hideVanilla: true, enabled: true, backgroundType: "vanilla", backgroundTexture: "", backgroundAlpha: 0.75, backgroundColor: "#253a82", ninesliceSize: 0, textColor: "#dfe9ff", sampleText: "slot1\t\t\t\t\t\t\t\t\t\t\t\tslot2\t\t\t\t\t\t\t\t\t\t\t\tslot3\t\t\t\t\t\t\t\t\t\t\t\tslot4\t\t\t\t\t\t\t\t\t\t\t\tslot5" },
        actionbar: { name: "액션바 패널", channel, parseMode: "trigger", outputMode: "label", triggerText: "info:", stripTriggerText: true, preserveValue: false, sliceStart: 0, sliceEnd: 0, maxValue: 100, anchor: "top_right", x: -4, y: 4, width: 280, height: 36, layer: 30, hideVanilla: true, enabled: true, backgroundType: "vanilla", backgroundTexture: "", backgroundAlpha: 0.75, backgroundColor: "#253a82", ninesliceSize: 0, textColor: "#ffffff", sampleText: "info: 오른쪽 표시" },
        actionbar_preserve: { name: "액션바 보존 패널", channel, parseMode: "trigger", outputMode: "label", triggerText: "info:", stripTriggerText: true, preserveValue: true, sliceStart: 0, sliceEnd: 0, maxValue: 100, anchor: "top_right", x: -4, y: 4, width: 280, height: 36, layer: 30, hideVanilla: true, enabled: true, backgroundType: "vanilla", backgroundTexture: "", backgroundAlpha: 0.75, backgroundColor: "#253a82", ninesliceSize: 0, textColor: "#ffffff", sampleText: "info: 오른쪽 표시" },
    };
    return normalizePanel({
        id,
        name: "",
        channel,
        parseMode: "trigger",
        outputMode: "label",
        triggerText: "",
        stripTriggerText: false,
        preserveValue: false,
        sliceStart: 0,
        sliceEnd: 0,
        maxValue: 100,
        anchor: "top_left",
        x: 0,
        y: 0,
        width: 200,
        height: 40,
        layer: 10,
        hideVanilla: true,
        enabled: true,
        backgroundType: "none",
        backgroundTexture: "",
        backgroundAlpha: 0.75,
        backgroundColor: "#253a82",
        ninesliceSize: 0,
        textColor: "#ffffff",
        sampleText: "",
        ...base[channel],
        ...overrides,
    });
}

function createTemplate(template: HudTemplateName): HudPanel[] {
    if (template === "subtitle_slots_5") {
        const positions: Array<Pick<HudPanel, "anchor" | "x" | "y">> = [
            { anchor: "top_left", x: 4, y: 28 },
            { anchor: "top_right", x: -4, y: 28 },
            { anchor: "top_left", x: 4, y: 48 },
            { anchor: "top_right", x: -4, y: 48 },
            { anchor: "top_middle", x: 0, y: 68 },
        ];
        return positions.map((position, index) => createPanel("subtitle_slot", { name: `서브타이틀 슬롯 ${index + 1}`, sliceStart: index * 20, sliceEnd: (index + 1) * 20, ...position }));
    }
    if (template === "title_coin") return [createPanel("title", { name: "코인 타이틀", parseMode: "slice", preserveValue: true, triggerText: "coin:", sliceStart: 200, sliceEnd: 400, width: 280, height: 48, sampleText: "coin:1200\t\t\t\t\t", textColor: "#f6d96b" })];
    if (template === "title_hp_text") return [createPanel("title", { name: "체력 텍스트", parseMode: "slice", preserveValue: true, triggerText: "hp_text:", sliceStart: 400, sliceEnd: 600, anchor: "bottom_middle", x: -85, y: -86, width: 170, height: 32, backgroundType: "none", sampleText: "hp_text:84/100\t\t\t" })];
    if (template === "title_hp_bar") return [createPanel("title", { name: "체력 바", parseMode: "slice", outputMode: "progress_bar", preserveValue: true, triggerText: "hp_clip:", sliceStart: 600, sliceEnd: 800, anchor: "bottom_middle", x: -50, y: -48, width: 180, height: 28, sampleText: "hp_clip:84\t\t\t\t" })];
    if (template === "actionbar_info") return [createPanel("actionbar")];
    if (template === "actionbar_preserve") return [createPanel("actionbar_preserve")];
    return [createPanel("title")];
}

function resetState(): void {
    state.nextId = 1;
    state.panels = [...createTemplate("title_info"), ...createTemplate("subtitle_slots_5"), ...createTemplate("actionbar_info")];
    state.selectedId = state.panels[0]!.id;
    state.drag = { panelId: null, pointerOffsetX: 0, pointerOffsetY: 0 };
}

function panelSummary(panel: HudPanel): string {
    const channel = panel.channel === "title" ? "타이틀" : panel.channel === "subtitle_slot" ? "서브슬롯" : panel.channel === "actionbar" ? "액션바" : "보존액션바";
    const parse = panel.parseMode === "trigger" ? (panel.triggerText || "문자 감지") : `${panel.sliceStart}-${panel.sliceEnd}`;
    const output = panel.outputMode === "progress_bar" ? "바" : "라벨";
    return `${channel} / ${parse} / ${output}`;
}

function previewText(panel: HudPanel): string {
    if (panel.outputMode === "progress_bar") return "70%";
    if (panel.channel === "subtitle_slot") return `슬롯 ${Math.floor(panel.sliceStart / 20) + 1}`;
    return panel.stripTriggerText ? panel.sampleText.replace(panel.triggerText, "") : panel.sampleText;
}

function previewStyle(panel: HudPanel): string {
    const position = actualPosition(panel);
    return [
        `left:${(position.left / PREVIEW_WIDTH) * 100}%`,
        `top:${(position.top / PREVIEW_HEIGHT) * 100}%`,
        `width:${(panel.width / PREVIEW_WIDTH) * 100}%`,
        `height:${(panel.height / PREVIEW_HEIGHT) * 100}%`,
        `z-index:${panel.layer}`,
        `color:${panel.textColor}`,
    ].join(";");
}

function bindingLabel(channel: HudChannel): string {
    if (channel === "title") return TITLE_BINDING;
    if (channel === "subtitle_slot") return SUBTITLE_BINDING;
    if (channel === "actionbar") return ACTIONBAR_VARIABLE;
    return "#hud_actionbar_text_string";
}

function buildEditor(): void {
    const form = getForm();
    if (form.dataset.initialized === "true") return;
    form.dataset.initialized = "true";
    form.innerHTML = `
        <div class="hudEditorLayout">
            <div class="hudEditorSidebar">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">HUD 패널 목록</div>
                    <div class="hudEditorOverlayList"></div>
                    <div class="hudEditorSectionTitle hudEditorSectionSpacer">패널 추가</div>
                    <div class="hudEditorTemplateButtons">
                        <button type="button" class="propertyInputButton hudAddPanelBtn" data-channel="title">타이틀</button>
                        <button type="button" class="propertyInputButton hudAddPanelBtn" data-channel="subtitle_slot">서브슬롯</button>
                        <button type="button" class="propertyInputButton hudAddPanelBtn" data-channel="actionbar">액션바</button>
                        <button type="button" class="propertyInputButton hudAddPanelBtn" data-channel="actionbar_preserve">보존 액션바</button>
                    </div>
                    <div class="hudEditorSectionTitle hudEditorSectionSpacer">예시 템플릿</div>
                    <div class="hudEditorTemplateButtons">
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="title_info">타이틀 info</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="title_coin">코인</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="title_hp_text">체력 텍스트</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="title_hp_bar">체력 바</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="subtitle_slots_5">서브타이틀 5슬롯</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="actionbar_info">액션바 info</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="actionbar_preserve">보존 액션바</button>
                    </div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudDeleteBtn">선택 패널 삭제</button>
                        <button type="button" class="propertyInputButton hudResetBtn">처음 상태로 초기화</button>
                    </div>
                </div>
            </div>
            <div class="hudEditorCanvasPanel">
                <div class="glyphEditorCanvasHeader">이 에디터는 title / subtitle slot / actionbar 구조만 정확하게 뽑는 새 HUD 메이커입니다.</div>
                <div class="hudEditorPreviewFrame"><div class="hudEditorPreview" id="hudEditorPreview"></div></div>
                <div class="hudEditorHelpCard">
                    <div class="hudEditorSectionTitle">생성 기준</div>
                    <div class="hudEditorHelpList">
                        <div><strong>타이틀</strong>: <code>title_control</code> 계열로 생성</div>
                        <div><strong>서브타이틀</strong>: <code>subtitle_data</code> + <code>subtitle_slot_template</code> 구조</div>
                        <div><strong>액션바</strong>: <code>custom_actionbar_factory</code>와 <code>my_custom_actionbar</code> 구조</div>
                        <div><strong>보존 액션바</strong>: <code>preserved_actionbar_display</code> 구조</div>
                    </div>
                </div>
            </div>
            <div class="hudEditorSidebar hudEditorInspector">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">선택 패널 속성</div>
                    <div class="hudEditorInspectorSummary"></div>
                    <div class="hudEditorInspectorFields"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudCopyBtn">HUD JSON 복사</button>
                        <button type="button" class="propertyInputButton hudDownloadBtn">HUD JSON 다운로드</button>
                    </div>
                </div>
            </div>
        </div>`;

    (form.querySelector(".hudResetBtn") as HTMLButtonElement).onclick = () => {
        resetState();
        render();
        new Notification("HUD 에디터를 처음 상태로 되돌렸습니다.", 2200, "notif");
    };

    (form.querySelector(".hudDeleteBtn") as HTMLButtonElement).onclick = () => {
        if (state.panels.length <= 1) {
            new Notification("패널은 최소 1개 이상 남아 있어야 합니다.", 2200, "error");
            return;
        }
        state.panels = state.panels.filter((panel) => panel.id !== state.selectedId);
        state.selectedId = state.panels[0]!.id;
        render();
    };

    form.querySelectorAll<HTMLButtonElement>(".hudAddPanelBtn").forEach((button) => {
        button.onclick = () => {
            const panel = createPanel(button.dataset.channel as HudChannel);
            state.panels.push(panel);
            state.selectedId = panel.id;
            render();
        };
    });

    form.querySelectorAll<HTMLButtonElement>(".hudTemplateBtn").forEach((button) => {
        button.onclick = () => {
            const panels = createTemplate(button.dataset.template as HudTemplateName);
            state.panels.push(...panels);
            state.selectedId = panels[panels.length - 1]!.id;
            render();
        };
    });
}

function renderList(): void {
    const container = getForm().querySelector(".hudEditorOverlayList") as HTMLDivElement | null;
    if (!container) return;
    container.innerHTML = state.panels.map((panel) => `
        <button type="button" class="hudEditorOverlayListItem${panel.id === state.selectedId ? " hudEditorOverlayListItemActive" : ""}" data-panel-id="${panel.id}">
            <span>${escapeHtml(panel.name)}</span>
            <span>${escapeHtml(panelSummary(panel))}</span>
        </button>
    `).join("");
    container.querySelectorAll<HTMLButtonElement>(".hudEditorOverlayListItem").forEach((button) => {
        button.onclick = () => {
            state.selectedId = button.dataset.panelId!;
            render();
        };
    });
}

function renderPreview(): void {
    const preview = getForm().querySelector("#hudEditorPreview") as HTMLDivElement | null;
    if (!preview) return;
    preview.innerHTML = `
        <div class="hudEditorPreviewSafezone"></div>
        <div class="hudEditorHotbarGuide"></div>
        <div class="hudEditorHealthGuide"></div>
        <div class="hudEditorHungerGuide"></div>
        ${state.panels.filter((panel) => panel.enabled).map((panel) => `
            <div class="hudEditorOverlay${panel.id === state.selectedId ? " hudEditorOverlayActive" : ""}${panel.backgroundType !== "none" || panel.outputMode === "progress_bar" ? " hudEditorOverlayWithBg" : ""}" data-panel-id="${panel.id}" style="${previewStyle(panel)}">
                ${panel.outputMode === "progress_bar"
                    ? `<div class="hudEditorProgressShell"><div class="hudEditorProgressFill" style="width:70%"></div></div>`
                    : `<div class="hudEditorOverlayLabel">${escapeHtml(previewText(panel))}</div>`}
            </div>
        `).join("")}
    `;

    preview.querySelectorAll<HTMLDivElement>(".hudEditorOverlay").forEach((element) => {
        element.onmousedown = (event) => {
            const panel = state.panels.find((entry) => entry.id === element.dataset.panelId);
            if (!panel) return;
            const rect = element.getBoundingClientRect();
            state.selectedId = panel.id;
            state.drag = { panelId: panel.id, pointerOffsetX: event.clientX - rect.left, pointerOffsetY: event.clientY - rect.top };
            render();
            event.preventDefault();
        };
    });

    preview.onmousemove = (event) => {
        if (!state.drag.panelId) return;
        const panel = state.panels.find((entry) => entry.id === state.drag.panelId);
        if (!panel) return;
        const previewRect = preview.getBoundingClientRect();
        const widthPx = (panel.width / PREVIEW_WIDTH) * previewRect.width;
        const heightPx = (panel.height / PREVIEW_HEIGHT) * previewRect.height;
        const leftPx = clamp(event.clientX - previewRect.left - state.drag.pointerOffsetX, 0, previewRect.width - widthPx);
        const topPx = clamp(event.clientY - previewRect.top - state.drag.pointerOffsetY, 0, previewRect.height - heightPx);
        applyActualPosition(panel, (leftPx / previewRect.width) * PREVIEW_WIDTH, (topPx / previewRect.height) * PREVIEW_HEIGHT);
        renderPreview();
        renderInspector();
    };

    preview.onmouseup = () => { state.drag.panelId = null; };
    preview.onmouseleave = () => { state.drag.panelId = null; };
}

function renderInspector(): void {
    const summary = getForm().querySelector(".hudEditorInspectorSummary") as HTMLDivElement | null;
    const container = getForm().querySelector(".hudEditorInspectorFields") as HTMLDivElement | null;
    if (!summary || !container) return;

    const panel = selectedPanel();
    const parseDisabled = panel.channel === "subtitle_slot" || panel.channel === "actionbar" || panel.channel === "actionbar_preserve" ? "disabled" : "";
    const sliceDisabled = panel.parseMode !== "slice" ? "disabled" : "";
    const triggerDisabled = panel.parseMode !== "trigger" ? "disabled" : "";
    const preserveDisabled = panel.channel === "subtitle_slot" || panel.channel === "actionbar" ? "disabled" : "";
    const progressDisabled = panel.outputMode !== "progress_bar" || panel.channel === "actionbar" || panel.channel === "actionbar_preserve" ? "disabled" : "";
    const colorDisabled = panel.backgroundType !== "solid" ? "disabled" : "";
    const textureDisabled = panel.backgroundType !== "custom" ? "disabled" : "";
    const ninesliceDisabled = panel.backgroundType !== "custom" ? "disabled" : "";

    summary.innerHTML = `
        <div class="hudEditorHelpCard hudEditorInspectorCard">
            <div class="hudEditorHelpText"><strong>${escapeHtml(panel.name)}</strong>는 <strong>${escapeHtml(bindingLabel(panel.channel))}</strong>를 사용합니다.</div>
            <div class="hudEditorHelpText">${escapeHtml(panelSummary(panel))}</div>
            <div class="hudEditorHelpExample">예시 문자열: <code>${escapeHtml(panel.sampleText || "(빈 문자열)")}</code></div>
        </div>
    `;

    container.innerHTML = `
        <label class="hudEditorFieldLabel">이름</label><input class="hudEditorFieldInput" type="text" data-field="name" value="${escapeHtml(panel.name)}">
        <label class="hudEditorFieldLabel">채널</label>
        <select class="hudEditorFieldInput" data-field="channel">
            <option value="title" ${panel.channel === "title" ? "selected" : ""}>title</option>
            <option value="subtitle_slot" ${panel.channel === "subtitle_slot" ? "selected" : ""}>subtitle slot</option>
            <option value="actionbar" ${panel.channel === "actionbar" ? "selected" : ""}>actionbar</option>
            <option value="actionbar_preserve" ${panel.channel === "actionbar_preserve" ? "selected" : ""}>actionbar preserve</option>
        </select>
        <label class="hudEditorFieldLabel">파싱</label>
        <select class="hudEditorFieldInput" data-field="parseMode" ${parseDisabled}>
            <option value="trigger" ${panel.parseMode === "trigger" ? "selected" : ""}>trigger</option>
            <option value="slice" ${panel.parseMode === "slice" ? "selected" : ""}>slice</option>
        </select>
        <label class="hudEditorFieldLabel">출력</label>
        <select class="hudEditorFieldInput" data-field="outputMode">
            <option value="label" ${panel.outputMode === "label" ? "selected" : ""}>label</option>
            <option value="progress_bar" ${panel.outputMode === "progress_bar" ? "selected" : ""} ${panel.channel === "actionbar" || panel.channel === "actionbar_preserve" ? "disabled" : ""}>progress</option>
        </select>
        <label class="hudEditorFieldLabel">접두사</label><input class="hudEditorFieldInput" type="text" data-field="triggerText" value="${escapeHtml(panel.triggerText)}" ${triggerDisabled}>
        <label class="hudEditorFieldLabel">슬라이스 시작</label><input class="hudEditorFieldInput" type="number" data-field="sliceStart" value="${panel.sliceStart}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">슬라이스 끝</label><input class="hudEditorFieldInput" type="number" data-field="sliceEnd" value="${panel.sliceEnd}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">최대값</label><input class="hudEditorFieldInput" type="number" data-field="maxValue" value="${panel.maxValue}" ${progressDisabled}>
        <label class="hudEditorFieldLabel">예시 문자열</label><input class="hudEditorFieldInput" type="text" data-field="sampleText" value="${escapeHtml(panel.sampleText)}">
        <label class="hudEditorFieldLabel">접두사 제거</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="stripTriggerText" ${panel.stripTriggerText ? "checked" : ""}>
        <label class="hudEditorFieldLabel">값 보존</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="preserveValue" ${panel.preserveValue ? "checked" : ""} ${preserveDisabled}>
        <label class="hudEditorFieldLabel">바닐라 숨김</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="hideVanilla" ${panel.hideVanilla ? "checked" : ""}>
        <label class="hudEditorFieldLabel">앵커</label>
        <select class="hudEditorFieldInput" data-field="anchor">
            <option value="top_left" ${panel.anchor === "top_left" ? "selected" : ""}>top_left</option>
            <option value="top_middle" ${panel.anchor === "top_middle" ? "selected" : ""}>top_middle</option>
            <option value="top_right" ${panel.anchor === "top_right" ? "selected" : ""}>top_right</option>
            <option value="left_middle" ${panel.anchor === "left_middle" ? "selected" : ""}>left_middle</option>
            <option value="center" ${panel.anchor === "center" ? "selected" : ""}>center</option>
            <option value="right_middle" ${panel.anchor === "right_middle" ? "selected" : ""}>right_middle</option>
            <option value="bottom_left" ${panel.anchor === "bottom_left" ? "selected" : ""}>bottom_left</option>
            <option value="bottom_middle" ${panel.anchor === "bottom_middle" ? "selected" : ""}>bottom_middle</option>
            <option value="bottom_right" ${panel.anchor === "bottom_right" ? "selected" : ""}>bottom_right</option>
        </select>
        <label class="hudEditorFieldLabel">Offset X</label><input class="hudEditorFieldInput" type="number" data-field="x" value="${panel.x}">
        <label class="hudEditorFieldLabel">Offset Y</label><input class="hudEditorFieldInput" type="number" data-field="y" value="${panel.y}">
        <label class="hudEditorFieldLabel">너비</label><input class="hudEditorFieldInput" type="number" data-field="width" value="${panel.width}">
        <label class="hudEditorFieldLabel">높이</label><input class="hudEditorFieldInput" type="number" data-field="height" value="${panel.height}">
        <label class="hudEditorFieldLabel">레이어</label><input class="hudEditorFieldInput" type="number" data-field="layer" value="${panel.layer}">
        <label class="hudEditorFieldLabel">배경 타입</label>
        <select class="hudEditorFieldInput" data-field="backgroundType">
            <option value="none" ${panel.backgroundType === "none" ? "selected" : ""}>none</option>
            <option value="vanilla" ${panel.backgroundType === "vanilla" ? "selected" : ""}>vanilla</option>
            <option value="solid" ${panel.backgroundType === "solid" ? "selected" : ""}>solid</option>
            <option value="custom" ${panel.backgroundType === "custom" ? "selected" : ""}>custom</option>
        </select>
        <label class="hudEditorFieldLabel">배경 알파</label><input class="hudEditorFieldInput" type="number" min="0" max="1" step="0.05" data-field="backgroundAlpha" value="${panel.backgroundAlpha}">
        <label class="hudEditorFieldLabel">배경 색상</label><input class="hudEditorFieldInput" type="color" data-field="backgroundColor" value="${panel.backgroundColor}" ${colorDisabled}>
        <label class="hudEditorFieldLabel">배경 텍스처</label><input class="hudEditorFieldInput" type="text" data-field="backgroundTexture" value="${escapeHtml(panel.backgroundTexture)}" ${textureDisabled}>
        <label class="hudEditorFieldLabel">나인슬라이스</label><input class="hudEditorFieldInput" type="number" data-field="ninesliceSize" value="${panel.ninesliceSize}" ${ninesliceDisabled}>
        <label class="hudEditorFieldLabel">텍스트 색상</label><input class="hudEditorFieldInput" type="color" data-field="textColor" value="${panel.textColor}">
        <label class="hudEditorFieldLabel">활성</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="enabled" ${panel.enabled ? "checked" : ""}>
    `;

    container.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]").forEach((input) => {
        const field = input.dataset.field as keyof HudPanel;
        const handler = () => {
            const current = selectedPanel();
            const before = actualPosition(current);
            if (field === "channel") current.channel = input.value as HudChannel;
            else if (field === "parseMode") current.parseMode = input.value as HudParseMode;
            else if (field === "outputMode") current.outputMode = input.value as HudOutputMode;
            else if (field === "anchor") current.anchor = input.value as HudAnchor;
            else if (input instanceof HTMLInputElement && input.type === "checkbox") (current as unknown as Record<string, unknown>)[field] = input.checked;
            else if (input instanceof HTMLInputElement && input.type === "number") (current as unknown as Record<string, unknown>)[field] = Number(input.value);
            else (current as unknown as Record<string, unknown>)[field] = input.value;
            normalizePanel(current);
            if (field === "anchor") applyActualPosition(current, before.left, before.top);
            render();
        };
        input.oninput = handler;
        input.onchange = handler;
    });
}

function render(): void {
    renderList();
    renderPreview();
    renderInspector();
}

function containsTextExpr(source: string, text: string): string {
    const value = text.trim();
    if (!value) return `(not (${source} = ''))`;
    return `(not ((${source} - '${escapeBindingText(value)}') = ${source}))`;
}

function missingTextExpr(source: string, text: string): string {
    const value = text.trim();
    if (!value) return `(${source} = '')`;
    return `((${source} - '${escapeBindingText(value)}') = ${source})`;
}

function stripTextExpr(source: string, text: string): string {
    const value = text.trim();
    if (!value) return source;
    return `(${source} - '${escapeBindingText(value)}')`;
}

function sliceExpr(source: string, start: number, end: number): string {
    if (start <= 0) return `(('%.${end}s' * ${source}) - '\\t')`;
    return `((('%.${end}s' * ${source}) - ('%.${start}s' * ${source})) - '\\t')`;
}

function finalTextExpr(panel: HudPanel, source: string): string {
    const raw = panel.parseMode === "slice" ? sliceExpr(source, panel.sliceStart, panel.sliceEnd) : source;
    return panel.stripTriggerText && panel.triggerText.trim() ? stripTextExpr(raw, panel.triggerText) : raw;
}

function panelVisibleExpr(panel: HudPanel, source: string): string {
    if (panel.parseMode === "slice") {
        const raw = sliceExpr(source, panel.sliceStart, panel.sliceEnd);
        return panel.triggerText.trim() ? containsTextExpr(raw, panel.triggerText) : `(not (${raw} = ''))`;
    }
    return containsTextExpr(source, panel.triggerText);
}

function applyRootBackground(control: Record<string, any>, panel: HudPanel, defaultTexture = BACKGROUND_TEXTURES.vanilla): void {
    if (panel.backgroundType === "none") {
        control.type = "panel";
        return;
    }
    control.type = "image";
    control.texture = panel.backgroundType === "custom" ? (panel.backgroundTexture || defaultTexture) : panel.backgroundType === "solid" ? BACKGROUND_TEXTURES.solid : defaultTexture;
    control.alpha = panel.backgroundAlpha;
    if (panel.backgroundType === "solid") control.color = colorHexToRgb(panel.backgroundColor);
    if (panel.backgroundType === "custom" && panel.ninesliceSize > 0) control.nineslice_size = panel.ninesliceSize;
}

function buildTitlePanel(panel: HudPanel, name: string): Record<string, any> {
    const root: Record<string, any> = { size: [panel.width, panel.height], anchor_from: panel.anchor, anchor_to: panel.anchor, offset: [panel.x, panel.y], layer: panel.layer };
    applyRootBackground(root, panel, panel.outputMode === "progress_bar" ? BACKGROUND_TEXTURES.hpBarBackground : BACKGROUND_TEXTURES.vanilla);
    const sourceExpr = panel.preserveValue ? "#preserved_text" : "#source_text";
    root.controls = [{
        title_data_control: {
            type: "panel",
            size: [0, 0],
            property_bag: { "#source_text": "", "#preserved_text": "" },
            bindings: [
                { binding_name: TITLE_BINDING, binding_name_override: "#source_text" },
                ...(panel.preserveValue ? [{ binding_name: TITLE_BINDING, binding_name_override: "#preserved_text", binding_condition: "visibility_changed" }] : []),
                { binding_type: "view", source_property_name: panel.preserveValue ? `(not (#source_text = #preserved_text) and ${panelVisibleExpr(panel, "#source_text")})` : panelVisibleExpr(panel, "#source_text"), target_property_name: "#visible" },
            ],
        },
    }];
    if (panel.outputMode === "progress_bar") {
        root.controls.push({
            title_fill: {
                type: "image",
                size: ["100%", "100%"],
                texture: BACKGROUND_TEXTURES.hpBarFill,
                clip_ratio: 0,
                clip_direction: "left",
                clip_pixelperfect: false,
                bindings: [
                    { binding_type: "view", source_control_name: "title_data_control", source_property_name: `(${finalTextExpr(panel, sourceExpr)} + 0)`, target_property_name: "#health" },
                    { binding_type: "view", source_property_name: `(((${panel.maxValue} - #health) / ${panel.maxValue}))`, target_property_name: "#clip_ratio" },
                ],
            },
        });
    } else {
        root.controls.push({
            title_label: {
                type: "label",
                text: "#text",
                localize: false,
                size: ["default", "default"],
                anchor_from: "center",
                anchor_to: "center",
                color: colorHexToRgb(panel.textColor),
                shadow: true,
                layer: 2,
                bindings: [{ binding_type: "view", source_control_name: "title_data_control", source_property_name: finalTextExpr(panel, sourceExpr), target_property_name: "#text" }],
            },
        });
    }
    root.bindings = [{ binding_type: "view", source_control_name: "title_data_control", source_property_name: panel.preserveValue ? "(not (#preserved_text = ''))" : "#visible", target_property_name: "#visible" }];
    return { [name]: root };
}

function subtitleTextBindingName(index: number): string {
    return `#text${index + 1}`;
}

function buildSubtitleData(panels: HudPanel[]): Record<string, any> {
    const bindings: Record<string, any>[] = [
        { binding_name: SUBTITLE_BINDING, binding_name_override: "#sub_raw", binding_type: "global" },
        { binding_type: "view", source_property_name: "(not (#sub_raw = ''))", target_property_name: "#visible" },
        { binding_type: "view", source_property_name: "#sub_raw", target_property_name: "#text_data" },
    ];
    panels.forEach((panel, index) => bindings.push({ binding_type: "view", source_property_name: finalTextExpr(panel, "#text_data"), target_property_name: subtitleTextBindingName(index) }));
    return { subtitle_data: { type: "panel", size: [0, 0], bindings } };
}

function buildSubtitleSlotTemplate(panel: HudPanel): Record<string, any> {
    const root: Record<string, any> = { size: [panel.width, panel.height], layer: panel.layer, "$slot_binding": "#text1", controls: [], bindings: [{ binding_type: "view", source_control_name: "subtitle_data", resolve_sibling_scope: true, source_property_name: "(not ($slot_binding = ''))", target_property_name: "#visible" }] };
    applyRootBackground(root, panel);
    if (panel.outputMode === "progress_bar") {
        root.controls.push({ slot_fill: { type: "image", size: ["100%", "100%"], texture: BACKGROUND_TEXTURES.hpBarFill, clip_ratio: 0, clip_direction: "left", clip_pixelperfect: false, bindings: [{ binding_type: "view", source_control_name: "subtitle_data", resolve_sibling_scope: true, source_property_name: "($slot_binding + 0)", target_property_name: "#health" }, { binding_type: "view", source_property_name: `(((${panel.maxValue} - #health) / ${panel.maxValue}))`, target_property_name: "#clip_ratio" }] } });
    } else {
        root.controls.push({ label: { type: "label", text: "#text", localize: false, size: ["default", "default"], anchor_from: "center", anchor_to: "center", color: colorHexToRgb(panel.textColor), shadow: true, layer: 2, bindings: [{ binding_type: "view", source_control_name: "subtitle_data", resolve_sibling_scope: true, source_property_name: "$slot_binding", target_property_name: "#text" }] } });
    }
    return { subtitle_slot_template: root };
}

function buildActionbarPanel(panel: HudPanel, name: string): Record<string, any> {
    const root: Record<string, any> = { size: [panel.width, panel.height], anchor_from: panel.anchor, anchor_to: panel.anchor, offset: [panel.x, panel.y], layer: panel.layer, "$atext": ACTIONBAR_VARIABLE, visible: panelVisibleExpr(panel, "$atext") };
    applyRootBackground(root, panel);
    root.controls = [{ actionbar_label: { type: "label", size: ["default", "default"], anchor_from: "right_middle", anchor_to: "right_middle", offset: [-5, 0], shadow: true, layer: 2, "$atext": ACTIONBAR_VARIABLE, "$display_text|default": "$atext", text: "$display_text", color: colorHexToRgb(panel.textColor), variables: [{ requires: panelVisibleExpr(panel, "$atext"), "$display_text": finalTextExpr(panel, "$atext") }] } }];
    return { [name]: root };
}

function buildPreservedActionbarPanel(panel: HudPanel, name: string): Record<string, any> {
    const root: Record<string, any> = { size: [panel.width, panel.height], anchor_from: panel.anchor, anchor_to: panel.anchor, offset: [panel.x, panel.y], layer: panel.layer };
    applyRootBackground(root, panel);
    root.controls = [
        { data_control: { type: "panel", size: [0, 0], property_bag: { "#source_text": "", "#preserved_text": "" }, bindings: [{ binding_name: "#hud_actionbar_text_string", binding_name_override: "#source_text", binding_type: "global" }, { binding_name: "#hud_actionbar_text_string", binding_name_override: "#preserved_text", binding_condition: "visibility_changed", binding_type: "global" }, { binding_type: "view", source_property_name: `(not (#source_text = #preserved_text) and ${panelVisibleExpr(panel, "#source_text")})`, target_property_name: "#visible" }] } },
        { actionbar_label: { type: "label", text: "#text", localize: false, size: ["default", "default"], anchor_from: "right_middle", anchor_to: "right_middle", offset: [-5, 0], shadow: true, layer: 2, color: colorHexToRgb(panel.textColor), bindings: [{ binding_type: "view", source_control_name: "data_control", source_property_name: finalTextExpr(panel, "#preserved_text"), target_property_name: "#text" }] } },
    ];
    root.bindings = [{ binding_type: "view", source_control_name: "data_control", source_property_name: "(not (#preserved_text = ''))", target_property_name: "#visible" }];
    return { [name]: root };
}

function generateHudJson(): string {
    const panels = state.panels.filter((panel) => panel.enabled).map((panel) => normalizePanel({ ...panel }));
    const payload: Record<string, any> = { namespace: "hud" };
    const rootInsertions: Record<string, any>[] = [];
    const titlePanels = panels.filter((panel) => panel.channel === "title");
    titlePanels.forEach((panel, index) => {
        const def = index === 0 ? "title_control" : `title_control_${index + 1}`;
        const inst = index === 0 ? "title_ctrl" : `title_ctrl_${index + 1}`;
        rootInsertions.push({ [`${inst}@hud.${def}`]: {} });
        Object.assign(payload, buildTitlePanel(panel, def));
    });
    const subtitlePanels = panels.filter((panel) => panel.channel === "subtitle_slot");
    if (subtitlePanels.length) {
        rootInsertions.push({ "subtitle_data@hud.subtitle_data": {} });
        Object.assign(payload, buildSubtitleData(subtitlePanels));
        Object.assign(payload, buildSubtitleSlotTemplate(subtitlePanels[0]!));
        subtitlePanels.forEach((panel, index) => {
            rootInsertions.push({ [`sub_slot${index + 1}@hud.subtitle_slot_template`]: { "$slot_binding": subtitleTextBindingName(index), anchor_from: panel.anchor, anchor_to: panel.anchor, offset: [panel.x, panel.y], size: [panel.width, panel.height], layer: panel.layer } });
        });
    }
    const preservePanels = panels.filter((panel) => panel.channel === "actionbar_preserve");
    preservePanels.forEach((panel, index) => {
        const def = index === 0 ? "preserved_actionbar_display" : `preserved_actionbar_display_${index + 1}`;
        const inst = index === 0 ? "preserved_actionbar" : `preserved_actionbar_${index + 1}`;
        rootInsertions.push({ [`${inst}@hud.${def}`]: {} });
        Object.assign(payload, buildPreservedActionbarPanel(panel, def));
    });
    if (rootInsertions.length) payload.root_panel = { modifications: [{ array_name: "controls", operation: "insert_back", value: rootInsertions }] };
    const actionbars = panels.filter((panel) => panel.channel === "actionbar");
    if (actionbars.length) {
        const single = actionbars.length === 1 ? actionbars[0]! : null;
        payload["root_panel/hud_actionbar_text_area"] = { modifications: [{ array_name: "controls", operation: "insert_back", value: [{ custom_actionbar_factory: { type: "panel", factory: { name: "hud_actionbar_text_factory", control_ids: { hud_actionbar_text: single ? "@hud.my_custom_actionbar" : "@hud.hud_actionbar_factory_root" } } } }] }] };
        if (single) Object.assign(payload, buildActionbarPanel(single, "my_custom_actionbar"));
        else payload.hud_actionbar_factory_root = { type: "panel", size: ["100%", "100%"], controls: actionbars.map((panel, index) => { const def = index === 0 ? "my_custom_actionbar" : `my_custom_actionbar_${index + 1}`; Object.assign(payload, buildActionbarPanel(panel, def)); return { [`${def}@hud.${def}`]: {} }; }) };
    }
    if (titlePanels.some((panel) => panel.hideVanilla)) payload["hud_title_text/title_frame"] = { bindings: [{ binding_type: "view", source_control_name: "title", source_property_name: `(${titlePanels.filter((panel) => panel.hideVanilla).map((panel) => missingTextExpr("#text", panel.triggerText)).join(" and ")})`, target_property_name: "#visible" }] };
    if (subtitlePanels.some((panel) => panel.hideVanilla)) payload["hud_title_text/subtitle_frame"] = { visible: false };
    const hiddenActionbars = panels.filter((panel) => (panel.channel === "actionbar" || panel.channel === "actionbar_preserve") && panel.hideVanilla);
    if (hiddenActionbars.length) payload.hud_actionbar_text = { "$atext": ACTIONBAR_VARIABLE, visible: `(${hiddenActionbars.map((panel) => missingTextExpr("$atext", panel.triggerText)).join(" and ")})` };
    return JSON.stringify(payload, null, 2);
}

function closeHudEditor(): void {
    getModal().style.display = "none";
    state.drag.panelId = null;
}

export async function hudEditorModal(): Promise<void> {
    buildEditor();
    if (!state.panels.length) resetState();
    render();
    getModal().style.display = "block";
    getCloseButton().onclick = () => closeHudEditor();
    (getForm().querySelector(".hudCopyBtn") as HTMLButtonElement).onclick = async () => {
        await navigator.clipboard.writeText(generateHudJson());
        new Notification("HUD JSON을 복사했습니다.", 2200, "notif");
    };
    (getForm().querySelector(".hudDownloadBtn") as HTMLButtonElement).onclick = () => {
        const blob = new Blob([generateHudJson()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "hud_screen.json";
        link.click();
        URL.revokeObjectURL(url);
    };
}

window.addEventListener("mouseup", () => { state.drag.panelId = null; });
window.addEventListener("click", (event) => { if (event.target === getModal()) closeHudEditor(); });

resetState();
