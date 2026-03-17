import { Notification } from "../notifs/noficationMaker.js";

type HudSourceType = "title" | "subtitle" | "actionbar";
type HudParseMode = "trigger" | "slice" | "split_pair";
type HudOutputType = "label" | "progress_bar";
type HudSplitPart = "first" | "second";
type HudBackgroundType = "none" | "vanilla" | "solid" | "custom";
type HudTemplateName = "info" | "coin" | "hp_text" | "hp_clip" | "t1_preserve" | "t2_preserve" | "split_t1" | "split_t2";
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

type HudOverlay = {
    id: string;
    label: string;
    sourceType: HudSourceType;
    parseMode: HudParseMode;
    outputType: HudOutputType;
    triggerText: string;
    sampleText: string;
    preserveValue: boolean;
    stripTriggerText: boolean;
    sliceStart: number;
    sliceEnd: number;
    splitDelimiter: string;
    splitPart: HudSplitPart;
    splitPrefix: string;
    maxValue: number;
    anchor: HudAnchor;
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
    visible: boolean;
    hideVanilla: boolean;
    backgroundType: HudBackgroundType;
    backgroundTexture: string;
    backgroundAlpha: number;
    backgroundColor: string;
    ninesliceSize: number;
    color: string;
};

type DragState = {
    overlayId: string | null;
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
    overlays: HudOverlay[];
    selectedId: string;
    nextId: number;
    drag: DragState;
} = {
    overlays: [],
    selectedId: "",
    nextId: 1,
    drag: { overlayId: null, pointerOffsetX: 0, pointerOffsetY: 0 },
};

const getModal = () => document.getElementById("modalHudEditor") as HTMLElement;
const getCloseButton = () => document.getElementById("modalHudEditorClose") as HTMLElement;
const getForm = () => document.getElementsByClassName("modalHudEditorForm")[0] as HTMLDivElement;
const selected = () => state.overlays.find((overlay) => overlay.id === state.selectedId) ?? state.overlays[0]!;
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const escapeBindingText = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const TEMPLATE_PATCHES: Record<HudTemplateName, Partial<HudOverlay>> = {
    info: {
        label: "정보 패널",
        sourceType: "title",
        parseMode: "trigger",
        outputType: "label",
        triggerText: "info:",
        sampleText: "info: 공지입니다",
        preserveValue: true,
        stripTriggerText: true,
        hideVanilla: true,
        backgroundType: "vanilla",
        color: "#ffffff",
        anchor: "top_middle",
        x: 0,
        y: 120,
        width: 500,
        height: 64,
    },
    coin: {
        label: "코인 패널",
        sourceType: "title",
        parseMode: "slice",
        outputType: "label",
        triggerText: "coin:",
        sampleText: "coin:1200\t\t\t\t\t",
        preserveValue: true,
        stripTriggerText: true,
        sliceStart: 200,
        sliceEnd: 400,
        hideVanilla: true,
        backgroundType: "vanilla",
        color: "#f6d96b",
        anchor: "top_right",
        x: -40,
        y: 50,
        width: 280,
        height: 48,
    },
    hp_text: {
        label: "체력 텍스트",
        sourceType: "title",
        parseMode: "slice",
        outputType: "label",
        triggerText: "hp_text:",
        sampleText: "hp_text:84/100\t\t\t",
        preserveValue: true,
        stripTriggerText: true,
        sliceStart: 400,
        sliceEnd: 600,
        hideVanilla: true,
        backgroundType: "none",
        color: "#ffffff",
        anchor: "bottom_middle",
        x: -85,
        y: -86,
        width: 170,
        height: 32,
    },
    hp_clip: {
        label: "체력 바",
        sourceType: "title",
        parseMode: "slice",
        outputType: "progress_bar",
        triggerText: "hp_clip:",
        sampleText: "hp_clip:84\t\t\t\t",
        preserveValue: true,
        stripTriggerText: true,
        sliceStart: 600,
        sliceEnd: 800,
        maxValue: 100,
        hideVanilla: true,
        backgroundType: "vanilla",
        color: "#ffffff",
        anchor: "bottom_middle",
        x: -50,
        y: -48,
        width: 180,
        height: 28,
    },
    t1_preserve: {
        label: "t1 보존 패널",
        sourceType: "title",
        parseMode: "trigger",
        outputType: "label",
        triggerText: "t1:",
        sampleText: "t1:안녕하세요",
        preserveValue: true,
        stripTriggerText: true,
        hideVanilla: true,
        backgroundType: "vanilla",
        color: "#ffffff",
        anchor: "top_left",
        x: 24,
        y: 24,
        width: 320,
        height: 48,
    },
    t2_preserve: {
        label: "t2 보존 패널",
        sourceType: "title",
        parseMode: "trigger",
        outputType: "label",
        triggerText: "t2:",
        sampleText: "t2:반갑습니다",
        preserveValue: true,
        stripTriggerText: true,
        hideVanilla: true,
        backgroundType: "vanilla",
        color: "#ffffff",
        anchor: "bottom_right",
        x: -24,
        y: -24,
        width: 320,
        height: 48,
    },
    split_t1: {
        label: "분리 t1 패널",
        sourceType: "title",
        parseMode: "split_pair",
        outputType: "label",
        triggerText: "",
        sampleText: "t1:안녕하세요:/: t2:반갑습니다",
        preserveValue: true,
        stripTriggerText: true,
        splitDelimiter: ":/: ",
        splitPart: "first",
        splitPrefix: "t1:",
        hideVanilla: true,
        backgroundType: "vanilla",
        color: "#ffffff",
        anchor: "top_left",
        x: 24,
        y: 24,
        width: 320,
        height: 48,
    },
    split_t2: {
        label: "분리 t2 패널",
        sourceType: "title",
        parseMode: "split_pair",
        outputType: "label",
        triggerText: "",
        sampleText: "t1:안녕하세요:/: t2:반갑습니다",
        preserveValue: true,
        stripTriggerText: true,
        splitDelimiter: ":/: ",
        splitPart: "second",
        splitPrefix: "t2:",
        hideVanilla: true,
        backgroundType: "vanilla",
        color: "#ffffff",
        anchor: "bottom_right",
        x: -24,
        y: -24,
        width: 320,
        height: 48,
    },
};

function baseOverlay(sourceType: HudSourceType): HudOverlay {
    const id = `overlay_${state.nextId++}`;
    const defaults: Record<HudSourceType, Partial<HudOverlay>> = {
        title: {
            label: "타이틀 패널",
            sourceType: "title",
            parseMode: "trigger",
            outputType: "label",
            triggerText: "info:",
            sampleText: "info: 안내 문구",
            preserveValue: true,
            stripTriggerText: true,
            anchor: "top_middle",
            x: 0,
            y: 120,
            width: 500,
            height: 64,
            layer: 30,
            hideVanilla: true,
            backgroundType: "vanilla",
            backgroundTexture: "",
            backgroundAlpha: 0.75,
            backgroundColor: "#253a82",
            ninesliceSize: 0,
            color: "#ffffff",
        },
        subtitle: {
            label: "서브타이틀 패널",
            sourceType: "subtitle",
            parseMode: "trigger",
            outputType: "label",
            triggerText: "",
            sampleText: "서브타이틀 문구",
            preserveValue: false,
            stripTriggerText: false,
            anchor: "top_middle",
            x: 0,
            y: 190,
            width: 420,
            height: 46,
            layer: 31,
            hideVanilla: true,
            backgroundType: "none",
            backgroundTexture: "",
            backgroundAlpha: 0.75,
            backgroundColor: "#253a82",
            ninesliceSize: 0,
            color: "#dfe9ff",
        },
        actionbar: {
            label: "액션바 패널",
            sourceType: "actionbar",
            parseMode: "trigger",
            outputType: "label",
            triggerText: "info:",
            sampleText: "info: 액션바 안내",
            preserveValue: false,
            stripTriggerText: true,
            anchor: "bottom_middle",
            x: 0,
            y: -96,
            width: 380,
            height: 42,
            layer: 32,
            hideVanilla: true,
            backgroundType: "vanilla",
            backgroundTexture: "",
            backgroundAlpha: 0.75,
            backgroundColor: "#253a82",
            ninesliceSize: 0,
            color: "#ffffff",
        },
    };

    return normalizeOverlay({
        id,
        label: "",
        sourceType,
        parseMode: "trigger",
        outputType: "label",
        triggerText: "",
        sampleText: "",
        preserveValue: false,
        stripTriggerText: false,
        sliceStart: 0,
        sliceEnd: 200,
        splitDelimiter: ":/: ",
        splitPart: "first",
        splitPrefix: "t1:",
        maxValue: 100,
        anchor: "top_left",
        x: 0,
        y: 0,
        width: 320,
        height: 48,
        layer: 10,
        visible: true,
        hideVanilla: true,
        backgroundType: "none",
        backgroundTexture: "",
        backgroundAlpha: 0.75,
        backgroundColor: "#253a82",
        ninesliceSize: 0,
        color: "#ffffff",
        ...defaults[sourceType],
    });
}

function createTemplateOverlay(template: HudTemplateName): HudOverlay {
    return normalizeOverlay({
        ...baseOverlay(TEMPLATE_PATCHES[template].sourceType ?? "title"),
        ...TEMPLATE_PATCHES[template],
    });
}

function normalizeOverlay(overlay: HudOverlay): HudOverlay {
    overlay.label = overlay.label.trim() || "HUD 패널";
    overlay.triggerText = overlay.triggerText ?? "";
    overlay.sampleText = overlay.sampleText ?? "";
    overlay.splitDelimiter = overlay.splitDelimiter || ":/: ";
    overlay.splitPrefix = overlay.splitPrefix ?? "";
    overlay.width = clamp(Math.round(overlay.width || 0), 40, PREVIEW_WIDTH);
    overlay.height = clamp(Math.round(overlay.height || 0), 20, PREVIEW_HEIGHT);
    overlay.layer = Math.round(overlay.layer || 0);
    overlay.sliceStart = Math.max(0, Math.round(overlay.sliceStart || 0));
    overlay.sliceEnd = Math.max(overlay.sliceStart, Math.round(overlay.sliceEnd || 0));
    overlay.maxValue = Math.max(1, Math.round(overlay.maxValue || 1));
    overlay.backgroundAlpha = clamp(Number.isFinite(overlay.backgroundAlpha) ? overlay.backgroundAlpha : 0.75, 0, 1);
    overlay.ninesliceSize = Math.max(0, Math.round(overlay.ninesliceSize || 0));
    if (overlay.sourceType !== "title") overlay.preserveValue = false;
    if (overlay.sourceType === "actionbar") {
        overlay.parseMode = "trigger";
        overlay.outputType = "label";
    }
    if (overlay.outputType === "progress_bar") {
        overlay.backgroundType = overlay.backgroundType === "none" ? "vanilla" : overlay.backgroundType;
    }
    return overlay;
}

function resetHudEditorState(): void {
    state.nextId = 1;
    state.overlays = [baseOverlay("title"), baseOverlay("subtitle"), baseOverlay("actionbar")];
    state.selectedId = state.overlays[0]!.id;
    state.drag = { overlayId: null, pointerOffsetX: 0, pointerOffsetY: 0 };
}

function bindingName(sourceType: HudSourceType): string {
    if (sourceType === "title") return TITLE_BINDING;
    if (sourceType === "subtitle") return SUBTITLE_BINDING;
    return ACTIONBAR_VARIABLE;
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

function actualPosition(overlay: HudOverlay): { left: number; top: number } {
    const base = anchorBase(overlay.anchor);
    const self = selfAnchorOffset(overlay.anchor, overlay.width, overlay.height);
    return {
        left: base.x + overlay.x - self.x,
        top: base.y + overlay.y - self.y,
    };
}

function applyActualPosition(overlay: HudOverlay, left: number, top: number): void {
    const base = anchorBase(overlay.anchor);
    const self = selfAnchorOffset(overlay.anchor, overlay.width, overlay.height);
    overlay.x = Math.round(left + self.x - base.x);
    overlay.y = Math.round(top + self.y - base.y);
}

function overlayJsonName(overlay: HudOverlay): string {
    return `hud_${overlay.id}`;
}

function parseDescription(overlay: HudOverlay): string {
    if (overlay.sourceType === "actionbar") {
        return "액션바는 `$actionbar_text` 변수와 factory control_ids를 사용합니다. 그래서 현재 편집기는 액션바를 접두사 기반 라벨 패널로 안정적으로 생성하는 쪽에 맞춰져 있습니다.";
    }
    if (overlay.parseMode === "trigger") {
        return "접두사 또는 특정 문자열이 들어왔을 때만 패널을 표시합니다. 타이틀은 preserve와 함께 쓰면 마지막 값을 계속 유지할 수 있습니다.";
    }
    if (overlay.parseMode === "slice") {
        return "긴 문자열의 고정 구간을 잘라서 표시합니다. `\\t` 패딩 기반 슬롯이나 HP/코인 같은 고정 영역에 적합합니다.";
    }
    return "하나의 문자열을 구분자 기준으로 둘로 나누어 서로 다른 패널에 띄웁니다. 예: `t1:안녕하세요:/: t2:반갑습니다`";
}

function channelDescription(overlay: HudOverlay): string {
    if (overlay.sourceType === "title") return "`#hud_title_text_string` 바인딩을 사용합니다. preserve 가능.";
    if (overlay.sourceType === "subtitle") return "`#hud_subtitle_text_string` 글로벌 바인딩을 사용합니다. subtitle만 단독 전송하면 게임에서 안 뜰 수 있어서 빈 title과 같이 보내는 편이 안전합니다.";
    return "`$actionbar_text` 변수는 factory 내부에서만 접근 가능합니다. 일반 바인딩처럼 쓰지 않고 전용 actionbar factory를 생성합니다.";
}

function overlaySummary(overlay: HudOverlay): string {
    const channel = overlay.sourceType === "title" ? "타이틀" : overlay.sourceType === "subtitle" ? "서브타이틀" : "액션바";
    const parse = overlay.parseMode === "trigger"
        ? (overlay.triggerText ? `접두사:${overlay.triggerText}` : "문자열 표시")
        : overlay.parseMode === "slice"
            ? `${overlay.sliceStart}-${overlay.sliceEnd}`
            : `${overlay.splitPart === "first" ? "앞부분" : "뒷부분"} / ${overlay.splitDelimiter}`;
    const preserve = overlay.preserveValue ? "보존" : "실시간";
    return `${channel} / ${parse} / ${overlay.outputType === "progress_bar" ? "바" : "라벨"} / ${preserve}`;
}

function previewText(overlay: HudOverlay): string {
    if (overlay.outputType === "progress_bar") return overlay.sampleText || "hp_clip:84";
    if (overlay.parseMode === "trigger" && overlay.stripTriggerText && overlay.triggerText) {
        return overlay.sampleText.replace(overlay.triggerText, "") || "표시 텍스트";
    }
    if (overlay.parseMode === "split_pair" && overlay.stripTriggerText && overlay.splitPrefix) {
        return overlay.splitPart === "first" ? "안녕하세요" : "반갑습니다";
    }
    return overlay.sampleText || "표시 텍스트";
}

function buildHudEditor(): void {
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
                        <button type="button" class="propertyInputButton hudAddOverlayBtn" data-source="title">타이틀 추가</button>
                        <button type="button" class="propertyInputButton hudAddOverlayBtn" data-source="subtitle">서브타이틀 추가</button>
                        <button type="button" class="propertyInputButton hudAddOverlayBtn" data-source="actionbar">액션바 추가</button>
                    </div>
                    <div class="hudEditorSectionTitle hudEditorSectionSpacer">예시 템플릿</div>
                    <div class="hudEditorTemplateButtons">
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="info">정보 패널</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="coin">코인</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="hp_text">체력 텍스트</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="hp_clip">체력 바</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="t1_preserve">t1 보존</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="t2_preserve">t2 보존</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="split_t1">분리 t1</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="split_t2">분리 t2</button>
                    </div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorDeleteBtn">선택 패널 삭제</button>
                        <button type="button" class="propertyInputButton hudEditorResetBtn">기본 상태로 초기화</button>
                    </div>
                </div>
            </div>
            <div class="hudEditorCanvasPanel">
                <div class="glyphEditorCanvasHeader">가운데 미리보기에서 패널을 드래그해 위치를 잡고, 오른쪽에서 채널/파싱/배경/앵커를 조정하세요.</div>
                <div class="hudEditorPreviewFrame"><div class="hudEditorPreview" id="hudEditorPreview"></div></div>
                <div class="hudEditorHelpCard">
                    <div class="hudEditorSectionTitle">HUD 에디터 핵심 규칙</div>
                    <div class="hudEditorHelpList">
                        <div><strong>타이틀</strong>: <code>#hud_title_text_string</code> 바인딩. preserve 가능.</div>
                        <div><strong>서브타이틀</strong>: <code>#hud_subtitle_text_string</code> 글로벌 바인딩. subtitle만 단독 전송하면 안 뜰 수 있습니다.</div>
                        <div><strong>액션바</strong>: <code>$actionbar_text</code> 변수. factory 내부에서만 접근하므로 전용 actionbar factory JSON으로 생성합니다.</div>
                        <div><strong>슬라이스</strong>: <code>'%.Ns' * 문자열</code> 방식으로 구간을 잘라 씁니다. 한글은 바이트 길이 주의가 필요합니다.</div>
                        <div><strong>분리</strong>: <code>t1:안녕하세요:/: t2:반갑습니다</code> 같은 문자열을 둘로 쪼개서 다른 위치에 띄울 수 있습니다.</div>
                    </div>
                    <div class="hudEditorHelpExamples">
                        <div class="hudEditorHelpExample"><strong>예시 1</strong> <code>/title @a title "info:공지입니다"</code></div>
                        <div class="hudEditorHelpExample"><strong>예시 2</strong> <code>/title @a title "t1:안녕하세요"</code> 뒤에 <code>/title @a title "t2:반갑습니다"</code></div>
                        <div class="hudEditorHelpExample"><strong>예시 3</strong> <code>/title @a title "t1:안녕하세요:/: t2:반갑습니다"</code></div>
                        <div class="hudEditorHelpExample"><strong>예시 4</strong> <code>0~200 info / 200~400 coin / 400~600 hp_text / 600~800 hp_clip</code></div>
                    </div>
                </div>
            </div>
            <div class="hudEditorSidebar hudEditorInspector">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">선택 패널 속성</div>
                    <div class="hudEditorInspectorSummary"></div>
                    <div class="hudEditorInspectorFields"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorCopyBtn">HUD JSON 복사</button>
                        <button type="button" class="propertyInputButton hudEditorDownloadBtn">HUD JSON 다운로드</button>
                    </div>
                </div>
            </div>
        </div>`;

    (form.querySelector(".hudEditorResetBtn") as HTMLButtonElement).onclick = () => {
        resetHudEditorState();
        renderHudEditor();
        new Notification("HUD 편집기를 기본 상태로 되돌렸습니다.", 2200, "notif");
    };

    (form.querySelector(".hudEditorDeleteBtn") as HTMLButtonElement).onclick = () => {
        if (state.overlays.length <= 1) {
            new Notification("패널은 최소 1개 이상 남아 있어야 합니다.", 2500, "error");
            return;
        }
        state.overlays = state.overlays.filter((overlay) => overlay.id !== state.selectedId);
        state.selectedId = state.overlays[0]!.id;
        renderHudEditor();
        new Notification("선택한 HUD 패널을 삭제했습니다.", 2200, "notif");
    };

    form.querySelectorAll<HTMLButtonElement>(".hudAddOverlayBtn").forEach((button) => {
        button.onclick = () => {
            const overlay = baseOverlay(button.dataset.source as HudSourceType);
            state.overlays.push(overlay);
            state.selectedId = overlay.id;
            renderHudEditor();
            new Notification(`${button.textContent} 패널을 추가했습니다.`, 2200, "notif");
        };
    });

    form.querySelectorAll<HTMLButtonElement>(".hudTemplateBtn").forEach((button) => {
        button.onclick = () => {
            const overlay = createTemplateOverlay(button.dataset.template as HudTemplateName);
            state.overlays.push(overlay);
            state.selectedId = overlay.id;
            renderHudEditor();
            new Notification(`${button.textContent} 템플릿을 추가했습니다.`, 2200, "notif");
        };
    });

    (form.querySelector(".hudEditorCopyBtn") as HTMLButtonElement).onclick = async () => {
        try {
            await navigator.clipboard.writeText(generateHudJson());
            new Notification("HUD JSON을 복사했습니다.", 2200, "notif");
        } catch (error) {
            console.error(error);
            new Notification("HUD JSON을 복사하지 못했습니다.", 2800, "error");
        }
    };

    (form.querySelector(".hudEditorDownloadBtn") as HTMLButtonElement).onclick = () => {
        const blob = new Blob([generateHudJson()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "hud_screen.json";
        link.click();
        URL.revokeObjectURL(url);
    };
}

function renderOverlayList(): void {
    const container = getForm().querySelector(".hudEditorOverlayList") as HTMLDivElement | null;
    if (!container) return;
    container.innerHTML = state.overlays.map((overlay) => `
        <button type="button" class="hudEditorOverlayListItem${overlay.id === state.selectedId ? " hudEditorOverlayListItemActive" : ""}" data-overlay-id="${overlay.id}">
            <span>${escapeHtml(overlay.label)}</span>
            <span>${escapeHtml(overlaySummary(overlay))}</span>
        </button>`).join("");
    container.querySelectorAll<HTMLButtonElement>(".hudEditorOverlayListItem").forEach((button) => {
        button.onclick = () => {
            state.selectedId = button.dataset.overlayId!;
            renderHudEditor();
        };
    });
}

function previewStyle(overlay: HudOverlay): string {
    const position = actualPosition(overlay);
    return [
        `left:${position.left / PREVIEW_WIDTH * 100}%`,
        `top:${position.top / PREVIEW_HEIGHT * 100}%`,
        `width:${overlay.width / PREVIEW_WIDTH * 100}%`,
        `height:${overlay.height / PREVIEW_HEIGHT * 100}%`,
        `z-index:${overlay.layer}`,
        `color:${overlay.color}`,
    ].join(";");
}

function renderPreview(): void {
    const preview = getForm().querySelector("#hudEditorPreview") as HTMLDivElement | null;
    if (!preview) return;
    preview.innerHTML = `
        <div class="hudEditorPreviewSafezone"></div>
        <div class="hudEditorHotbarGuide"></div>
        <div class="hudEditorHealthGuide"></div>
        <div class="hudEditorHungerGuide"></div>
        ${state.overlays.filter((overlay) => overlay.visible).map((overlay) => `
            <div class="hudEditorOverlay${overlay.id === state.selectedId ? " hudEditorOverlayActive" : ""}${overlay.backgroundType !== "none" || overlay.outputType === "progress_bar" ? " hudEditorOverlayWithBg" : ""}"
                data-overlay-id="${overlay.id}"
                style="${previewStyle(overlay)}">
                ${overlay.outputType === "progress_bar"
                    ? `<div class="hudEditorProgressShell"><div class="hudEditorProgressFill" style="width:70%"></div></div>`
                    : `<div class="hudEditorOverlayLabel">${escapeHtml(previewText(overlay))}</div>`}
            </div>`).join("")}`;

    preview.querySelectorAll<HTMLDivElement>(".hudEditorOverlay").forEach((element) => {
        element.onmousedown = (event) => {
            const overlay = state.overlays.find((entry) => entry.id === element.dataset.overlayId);
            if (!overlay) return;
            const elementRect = element.getBoundingClientRect();
            state.selectedId = overlay.id;
            state.drag = {
                overlayId: overlay.id,
                pointerOffsetX: event.clientX - elementRect.left,
                pointerOffsetY: event.clientY - elementRect.top,
            };
            renderHudEditor();
            event.preventDefault();
        };
    });

    preview.onmousemove = (event) => {
        if (!state.drag.overlayId) return;
        const overlay = state.overlays.find((entry) => entry.id === state.drag.overlayId);
        if (!overlay) return;
        const previewRect = preview.getBoundingClientRect();
        const widthPx = (overlay.width / PREVIEW_WIDTH) * previewRect.width;
        const heightPx = (overlay.height / PREVIEW_HEIGHT) * previewRect.height;
        const leftPx = clamp(event.clientX - previewRect.left - state.drag.pointerOffsetX, 0, previewRect.width - widthPx);
        const topPx = clamp(event.clientY - previewRect.top - state.drag.pointerOffsetY, 0, previewRect.height - heightPx);
        const left = (leftPx / previewRect.width) * PREVIEW_WIDTH;
        const top = (topPx / previewRect.height) * PREVIEW_HEIGHT;
        applyActualPosition(overlay, left, top);
        renderPreview();
        renderInspector();
    };
    preview.onmouseup = () => { state.drag.overlayId = null; };
    preview.onmouseleave = () => { state.drag.overlayId = null; };
}

function renderInspector(): void {
    const summary = getForm().querySelector(".hudEditorInspectorSummary") as HTMLDivElement | null;
    const container = getForm().querySelector(".hudEditorInspectorFields") as HTMLDivElement | null;
    if (!summary || !container) return;

    const overlay = selected();
    const preserveDisabled = overlay.sourceType !== "title" ? "disabled" : "";
    const splitDisabled = overlay.sourceType === "actionbar" || overlay.parseMode !== "split_pair" ? "disabled" : "";
    const sliceDisabled = overlay.sourceType === "actionbar" || overlay.parseMode !== "slice" ? "disabled" : "";
    const triggerDisabled = overlay.parseMode !== "trigger" ? "disabled" : "";
    const progressDisabled = overlay.outputType !== "progress_bar" || overlay.sourceType === "actionbar" ? "disabled" : "";
    const backgroundTextureDisabled = overlay.backgroundType !== "custom" ? "disabled" : "";
    const backgroundColorDisabled = overlay.backgroundType !== "solid" ? "disabled" : "";
    const ninesliceDisabled = overlay.backgroundType !== "custom" ? "disabled" : "";

    summary.innerHTML = `
        <div class="hudEditorHelpCard hudEditorInspectorCard">
            <div class="hudEditorHelpText"><strong>${escapeHtml(overlay.label)}</strong>는 <strong>${escapeHtml(bindingName(overlay.sourceType))}</strong> 채널을 사용합니다.</div>
            <div class="hudEditorHelpText">${escapeHtml(channelDescription(overlay))}</div>
            <div class="hudEditorHelpText">${escapeHtml(parseDescription(overlay))}</div>
            <div class="hudEditorHelpExample">현재 미리보기 예시: <code>${escapeHtml(overlay.sampleText || "(빈 문자열)")}</code></div>
        </div>`;

    container.innerHTML = `
        <label class="hudEditorFieldLabel">이름</label><input class="hudEditorFieldInput" type="text" data-field="label" value="${escapeHtml(overlay.label)}">
        <label class="hudEditorFieldLabel">채널</label>
        <select class="hudEditorFieldInput" data-field="sourceType">
            <option value="title" ${overlay.sourceType === "title" ? "selected" : ""}>타이틀</option>
            <option value="subtitle" ${overlay.sourceType === "subtitle" ? "selected" : ""}>서브타이틀</option>
            <option value="actionbar" ${overlay.sourceType === "actionbar" ? "selected" : ""}>액션바</option>
        </select>
        <label class="hudEditorFieldLabel">파싱 방식</label>
        <select class="hudEditorFieldInput" data-field="parseMode">
            <option value="trigger" ${overlay.parseMode === "trigger" ? "selected" : ""}>접두사 감지</option>
            <option value="slice" ${overlay.parseMode === "slice" ? "selected" : ""} ${overlay.sourceType === "actionbar" ? "disabled" : ""}>슬라이스</option>
            <option value="split_pair" ${overlay.parseMode === "split_pair" ? "selected" : ""} ${overlay.sourceType === "actionbar" ? "disabled" : ""}>문자열 분리</option>
        </select>
        <label class="hudEditorFieldLabel">출력</label>
        <select class="hudEditorFieldInput" data-field="outputType">
            <option value="label" ${overlay.outputType === "label" ? "selected" : ""}>라벨</option>
            <option value="progress_bar" ${overlay.outputType === "progress_bar" ? "selected" : ""} ${overlay.sourceType === "actionbar" ? "disabled" : ""}>프로그레스 바</option>
        </select>
        <label class="hudEditorFieldLabel">접두사</label><input class="hudEditorFieldInput" type="text" data-field="triggerText" value="${escapeHtml(overlay.triggerText)}" placeholder="예: info:" ${triggerDisabled}>
        <label class="hudEditorFieldLabel">슬라이스 시작</label><input class="hudEditorFieldInput" type="number" data-field="sliceStart" value="${overlay.sliceStart}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">슬라이스 끝</label><input class="hudEditorFieldInput" type="number" data-field="sliceEnd" value="${overlay.sliceEnd}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">구분자</label><input class="hudEditorFieldInput" type="text" data-field="splitDelimiter" value="${escapeHtml(overlay.splitDelimiter)}" placeholder="예: :/: " ${splitDisabled}>
        <label class="hudEditorFieldLabel">분리 방향</label>
        <select class="hudEditorFieldInput" data-field="splitPart" ${splitDisabled}>
            <option value="first" ${overlay.splitPart === "first" ? "selected" : ""}>앞부분</option>
            <option value="second" ${overlay.splitPart === "second" ? "selected" : ""}>뒷부분</option>
        </select>
        <label class="hudEditorFieldLabel">분리 접두사</label><input class="hudEditorFieldInput" type="text" data-field="splitPrefix" value="${escapeHtml(overlay.splitPrefix)}" placeholder="예: t1:" ${splitDisabled}>
        <label class="hudEditorFieldLabel">예시 문자열</label><input class="hudEditorFieldInput" type="text" data-field="sampleText" value="${escapeHtml(overlay.sampleText)}">
        <label class="hudEditorFieldLabel">값 보존</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="preserveValue" ${overlay.preserveValue ? "checked" : ""} ${preserveDisabled}>
        <label class="hudEditorFieldLabel">접두사 제거</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="stripTriggerText" ${overlay.stripTriggerText ? "checked" : ""}>
        <label class="hudEditorFieldLabel">바닐라 숨김</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="hideVanilla" ${overlay.hideVanilla ? "checked" : ""}>
        <label class="hudEditorFieldLabel">최대값</label><input class="hudEditorFieldInput" type="number" data-field="maxValue" value="${overlay.maxValue}" ${progressDisabled}>
        <label class="hudEditorFieldLabel">앵커</label>
        <select class="hudEditorFieldInput" data-field="anchor">
            <option value="top_left" ${overlay.anchor === "top_left" ? "selected" : ""}>top_left</option>
            <option value="top_middle" ${overlay.anchor === "top_middle" ? "selected" : ""}>top_middle</option>
            <option value="top_right" ${overlay.anchor === "top_right" ? "selected" : ""}>top_right</option>
            <option value="left_middle" ${overlay.anchor === "left_middle" ? "selected" : ""}>left_middle</option>
            <option value="center" ${overlay.anchor === "center" ? "selected" : ""}>center</option>
            <option value="right_middle" ${overlay.anchor === "right_middle" ? "selected" : ""}>right_middle</option>
            <option value="bottom_left" ${overlay.anchor === "bottom_left" ? "selected" : ""}>bottom_left</option>
            <option value="bottom_middle" ${overlay.anchor === "bottom_middle" ? "selected" : ""}>bottom_middle</option>
            <option value="bottom_right" ${overlay.anchor === "bottom_right" ? "selected" : ""}>bottom_right</option>
        </select>
        <label class="hudEditorFieldLabel">Offset X</label><input class="hudEditorFieldInput" type="number" data-field="x" value="${overlay.x}">
        <label class="hudEditorFieldLabel">Offset Y</label><input class="hudEditorFieldInput" type="number" data-field="y" value="${overlay.y}">
        <label class="hudEditorFieldLabel">너비</label><input class="hudEditorFieldInput" type="number" data-field="width" value="${overlay.width}">
        <label class="hudEditorFieldLabel">높이</label><input class="hudEditorFieldInput" type="number" data-field="height" value="${overlay.height}">
        <label class="hudEditorFieldLabel">레이어</label><input class="hudEditorFieldInput" type="number" data-field="layer" value="${overlay.layer}">
        <label class="hudEditorFieldLabel">배경 타입</label>
        <select class="hudEditorFieldInput" data-field="backgroundType">
            <option value="none" ${overlay.backgroundType === "none" ? "selected" : ""}>없음</option>
            <option value="vanilla" ${overlay.backgroundType === "vanilla" ? "selected" : ""}>바닐라</option>
            <option value="solid" ${overlay.backgroundType === "solid" ? "selected" : ""}>단색</option>
            <option value="custom" ${overlay.backgroundType === "custom" ? "selected" : ""}>커스텀</option>
        </select>
        <label class="hudEditorFieldLabel">배경 알파</label><input class="hudEditorFieldInput" type="number" step="0.05" min="0" max="1" data-field="backgroundAlpha" value="${overlay.backgroundAlpha}">
        <label class="hudEditorFieldLabel">배경 색상</label><input class="hudEditorFieldInput" type="color" data-field="backgroundColor" value="${overlay.backgroundColor}" ${backgroundColorDisabled}>
        <label class="hudEditorFieldLabel">배경 텍스처</label><input class="hudEditorFieldInput" type="text" data-field="backgroundTexture" value="${escapeHtml(overlay.backgroundTexture)}" placeholder="textures/ui/my_bg" ${backgroundTextureDisabled}>
        <label class="hudEditorFieldLabel">나인슬라이스</label><input class="hudEditorFieldInput" type="number" min="0" data-field="ninesliceSize" value="${overlay.ninesliceSize}" ${ninesliceDisabled}>
        <label class="hudEditorFieldLabel">텍스트 색상</label><input class="hudEditorFieldInput" type="color" data-field="color" value="${overlay.color}">
        <label class="hudEditorFieldLabel">사용 여부</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="visible" ${overlay.visible ? "checked" : ""}>`;

    container.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]").forEach((input) => {
        const field = input.dataset.field as keyof HudOverlay;
        const handler = () => {
            const current = selected();
            const beforePosition = actualPosition(current);
            if (field === "sourceType") current.sourceType = input.value as HudSourceType;
            else if (field === "parseMode") current.parseMode = input.value as HudParseMode;
            else if (field === "outputType") current.outputType = input.value as HudOutputType;
            else if (field === "splitPart") current.splitPart = input.value as HudSplitPart;
            else if (field === "backgroundType") current.backgroundType = input.value as HudBackgroundType;
            else if (field === "anchor") current.anchor = input.value as HudAnchor;
            else if (input instanceof HTMLInputElement && input.type === "checkbox") (current as unknown as Record<string, unknown>)[field] = input.checked;
            else if (input instanceof HTMLInputElement && input.type === "number") (current as unknown as Record<string, unknown>)[field] = Number(input.value);
            else (current as unknown as Record<string, unknown>)[field] = input.value;

            normalizeOverlay(current);
            if (field === "anchor") applyActualPosition(current, beforePosition.left, beforePosition.top);
            renderHudEditor();
        };
        input.oninput = handler;
        input.onchange = handler;
    });
}

const colorHexToRgb = (color: string): [number, number, number] => {
    const normalized = color.replace("#", "");
    const bigint = Number.parseInt(normalized, 16);
    return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
};

function prefixMatchExpr(source: string, prefix: string): string {
    const trimmed = prefix.trim();
    if (!trimmed) return `(not (${source} = ''))`;
    return `(('%.${trimmed.length}s' * ${source}) = '${escapeBindingText(trimmed)}')`;
}

function missingPrefixExpr(source: string, prefix: string): string {
    return `(not ${prefixMatchExpr(source, prefix)})`;
}

function stripPrefixExpr(source: string, prefix: string): string {
    const trimmed = prefix.trim();
    if (!trimmed) return source;
    return `(${source} - ('%.${trimmed.length}s' * ${source}))`;
}

function sliceExpr(source: string, start: number, end: number): string {
    if (start <= 0) return `(('%.${end}s' * ${source}) - '\\t')`;
    return `((('%.${end}s' * ${source}) - ('%.${start}s' * ${source})) - '\\t')`;
}

function splitLengthExpr(): string {
    return "(#length + 1 * (not (('%.'+#length+'s') * #string = #string)))";
}

function splitSearchExpr(delimiter: string): string {
    return `(#search + 1 * (#search < #length and (('%.'+#search+'s') * #string = (('%.'+#search+'s') * #string - '${escapeBindingText(delimiter)}'))))`;
}

function rawValueExpr(overlay: HudOverlay, source: string): string {
    if (overlay.parseMode === "slice") return sliceExpr(source, overlay.sliceStart, overlay.sliceEnd);
    if (overlay.parseMode === "split_pair") {
        if (overlay.splitPart === "first") return `(('%.'+#search+'s') * #string)`;
        return `(#string - (('%.'+#search+'s') * #string) - '${escapeBindingText(overlay.splitDelimiter)}')`;
    }
    return source;
}

function finalValueExpr(overlay: HudOverlay, source: string): string {
    let expression = rawValueExpr(overlay, source);
    if (overlay.parseMode === "trigger" && overlay.stripTriggerText && overlay.triggerText.trim()) {
        expression = stripPrefixExpr(expression, overlay.triggerText);
    }
    if (overlay.parseMode === "slice" && overlay.stripTriggerText && overlay.triggerText.trim()) {
        expression = `(${expression} - '${escapeBindingText(overlay.triggerText)}')`;
    }
    if (overlay.parseMode === "split_pair" && overlay.stripTriggerText && overlay.splitPrefix.trim()) {
        expression = `(${expression} - '${escapeBindingText(overlay.splitPrefix)}')`;
    }
    return expression;
}

function visibleExpr(overlay: HudOverlay, source: string): string {
    if (overlay.parseMode === "trigger") return prefixMatchExpr(source, overlay.triggerText);
    if (overlay.parseMode === "slice") {
        const raw = rawValueExpr(overlay, source);
        if (overlay.triggerText.trim()) return prefixMatchExpr(raw, overlay.triggerText);
        return `(not (${raw} = ''))`;
    }
    return `(not (${finalValueExpr(overlay, source)} = ''))`;
}

function buildSourceBinding(overlay: HudOverlay, targetPropertyName: string, condition?: string): Record<string, any> {
    const binding: Record<string, any> = {
        binding_name: bindingName(overlay.sourceType),
        binding_name_override: targetPropertyName,
    };
    if (overlay.sourceType === "subtitle") binding.binding_type = "global";
    if (condition) binding.binding_condition = condition;
    return binding;
}

function buildDataControlBindings(overlay: HudOverlay): Record<string, any>[] {
    const bindings: Record<string, any>[] = [buildSourceBinding(overlay, "#source_text")];
    if (overlay.sourceType === "title" && overlay.preserveValue) {
        bindings.push(buildSourceBinding(overlay, "#preserved_text", "visibility_changed"));
        bindings.push({
            binding_type: "view",
            source_property_name: `(not (#source_text = #preserved_text) and ${visibleExpr(overlay, "#source_text")})`,
            target_property_name: "#visible",
        });
    } else {
        bindings.push({
            binding_type: "view",
            source_property_name: visibleExpr(overlay, "#source_text"),
            target_property_name: "#visible",
        });
    }

    if (overlay.parseMode === "split_pair") {
        bindings.push({
            binding_type: "view",
            source_property_name: overlay.sourceType === "title" && overlay.preserveValue ? "#preserved_text" : "#source_text",
            target_property_name: "#string",
        });
        bindings.push({
            binding_condition: "always",
            binding_type: "view",
            source_property_name: splitLengthExpr(),
            target_property_name: "#length",
        });
        bindings.push({
            binding_condition: "always",
            binding_type: "view",
            source_property_name: splitSearchExpr(overlay.splitDelimiter),
            target_property_name: "#search",
        });
    }
    return bindings;
}

function backgroundControl(overlay: HudOverlay, name: string): Record<string, any> | null {
    if (overlay.backgroundType === "none") return null;
    const background: Record<string, any> = {
        type: "image",
        size: ["100%", "100%"],
        alpha: overlay.backgroundAlpha,
    };
    if (overlay.backgroundType === "vanilla") {
        background.texture = overlay.outputType === "progress_bar" ? BACKGROUND_TEXTURES.hpBarBackground : BACKGROUND_TEXTURES.vanilla;
    } else if (overlay.backgroundType === "solid") {
        background.texture = BACKGROUND_TEXTURES.solid;
        background.color = colorHexToRgb(overlay.backgroundColor);
    } else {
        background.texture = overlay.backgroundTexture || BACKGROUND_TEXTURES.vanilla;
        if (overlay.ninesliceSize > 0) background.nineslice_size = overlay.ninesliceSize;
    }
    return { [name]: background };
}

function buildTitleOrSubtitleControl(overlay: HudOverlay): Record<string, any> {
    const controlName = overlayJsonName(overlay);
    const dataControlName = `${controlName}_data`;
    const sourceValue = overlay.sourceType === "title" && overlay.preserveValue ? "#preserved_text" : "#source_text";
    const controls: Record<string, any>[] = [{
        [dataControlName]: {
            type: "panel",
            size: [0, 0],
            property_bag: { "#preserved_text": "", "#source_text": "", "#string": "", "#length": 0, "#search": 0 },
            bindings: buildDataControlBindings(overlay),
        },
    }];
    const background = backgroundControl(overlay, `${controlName}_background`);
    if (background) controls.push(background);

    if (overlay.outputType === "progress_bar") {
        controls.push({
            [`${controlName}_fill`]: {
                type: "image",
                size: ["100%", "100%"],
                texture: BACKGROUND_TEXTURES.hpBarFill,
                clip_ratio: 0,
                clip_direction: "left",
                clip_pixelperfect: false,
                bindings: [
                    {
                        binding_type: "view",
                        source_control_name: dataControlName,
                        source_property_name: `(${finalValueExpr(overlay, sourceValue)} + 0)`,
                        target_property_name: "#health",
                    },
                    {
                        binding_type: "view",
                        source_property_name: `(((${overlay.maxValue} - #health) / ${overlay.maxValue}))`,
                        target_property_name: "#clip_ratio",
                    },
                ],
            },
        });
    } else {
        controls.push({
            [`${controlName}_label`]: {
                type: "label",
                text: "#text",
                localize: false,
                size: ["100%", "default"],
                max_size: ["100%", "default"],
                offset: [0, Math.max(0, Math.round((overlay.height - 20) / 2))],
                color: colorHexToRgb(overlay.color),
                text_alignment: "center",
                shadow: true,
                bindings: [{
                    binding_type: "view",
                    source_control_name: dataControlName,
                    source_property_name: finalValueExpr(overlay, sourceValue),
                    target_property_name: "#text",
                }],
            },
        });
    }

    return {
        [controlName]: {
            type: "panel",
            size: [overlay.width, overlay.height],
            anchor_from: overlay.anchor,
            anchor_to: overlay.anchor,
            offset: [overlay.x, overlay.y],
            layer: overlay.layer,
            controls,
            bindings: [{
                binding_type: "view",
                source_control_name: dataControlName,
                source_property_name: overlay.sourceType === "title" && overlay.preserveValue ? "(not (#preserved_text = ''))" : "#visible",
                target_property_name: "#visible",
            }],
        },
    };
}

function actionbarVisibleExpr(overlay: HudOverlay): string {
    return visibleExpr(overlay, "$atext");
}

function actionbarTextExpr(overlay: HudOverlay): string {
    return finalValueExpr(overlay, "$atext");
}

function buildActionbarControl(overlay: HudOverlay): Record<string, any> {
    const controlName = overlayJsonName(overlay);
    const controls: Record<string, any>[] = [];
    const background = backgroundControl(overlay, `${controlName}_background`);
    if (background) controls.push(background);
    controls.push({
        [`${controlName}_label`]: {
            type: "label",
            text: "$display_text",
            localize: false,
            "$atext": ACTIONBAR_VARIABLE,
            "$display_text|default": "$atext",
            size: ["100%", "default"],
            max_size: ["100%", "default"],
            offset: [0, Math.max(0, Math.round((overlay.height - 20) / 2))],
            color: colorHexToRgb(overlay.color),
            text_alignment: "center",
            shadow: true,
            variables: [{
                requires: actionbarVisibleExpr(overlay),
                "$display_text": actionbarTextExpr(overlay),
            }],
        },
    });

    return {
        [controlName]: {
            type: "panel",
            size: [overlay.width, overlay.height],
            anchor_from: overlay.anchor,
            anchor_to: overlay.anchor,
            offset: [overlay.x, overlay.y],
            layer: overlay.layer,
            "$atext": ACTIONBAR_VARIABLE,
            visible: actionbarVisibleExpr(overlay),
            controls,
        },
    };
}

function buildTitleHideOverride(overlays: HudOverlay[]): Record<string, any> | null {
    const targets = overlays.filter((overlay) => overlay.visible && overlay.sourceType === "title" && overlay.hideVanilla);
    if (!targets.length) return null;
    if (targets.some((overlay) => overlay.parseMode !== "trigger" || !overlay.triggerText.trim())) return { visible: false };
    const source = targets.map((overlay) => missingPrefixExpr("#text", overlay.triggerText)).join(" and ");
    return {
        bindings: [{
            binding_type: "view",
            source_control_name: "title",
            source_property_name: `(${source})`,
            target_property_name: "#visible",
        }],
    };
}

function buildSubtitleHideOverride(overlays: HudOverlay[]): Record<string, any> | null {
    const targets = overlays.filter((overlay) => overlay.visible && overlay.sourceType === "subtitle" && overlay.hideVanilla);
    if (!targets.length) return null;
    return { visible: false };
}

function buildActionbarHideOverride(overlays: HudOverlay[]): Record<string, any> | null {
    const targets = overlays.filter((overlay) => overlay.visible && overlay.sourceType === "actionbar" && overlay.hideVanilla);
    if (!targets.length) return null;
    if (targets.some((overlay) => !overlay.triggerText.trim())) return { "$atext": ACTIONBAR_VARIABLE, visible: false };
    const source = targets.map((overlay) => missingPrefixExpr("$atext", overlay.triggerText)).join(" and ");
    return { "$atext": ACTIONBAR_VARIABLE, visible: `(${source})` };
}

function generateHudJson(): string {
    const overlays = state.overlays.filter((overlay) => overlay.visible).map((overlay) => normalizeOverlay({ ...overlay }));
    const payload: Record<string, any> = { namespace: "hud" };
    const titleAndSubtitle = overlays.filter((overlay) => overlay.sourceType !== "actionbar");
    if (titleAndSubtitle.length) {
        payload.root_panel = {
            modifications: [{
                array_name: "controls",
                operation: "insert_back",
                value: [{ "hud_text_editor_panel@hud.hud_text_editor_panel": {} }],
            }],
        };
        payload.hud_text_editor_panel = {
            type: "panel",
            size: ["100%", "100%"],
            controls: titleAndSubtitle.map((overlay) => ({ [`${overlayJsonName(overlay)}@hud.${overlayJsonName(overlay)}`]: {} })),
        };
        for (const overlay of titleAndSubtitle) Object.assign(payload, buildTitleOrSubtitleControl(overlay));
    }

    const actionbars = overlays.filter((overlay) => overlay.sourceType === "actionbar");
    if (actionbars.length) {
        payload["root_panel/hud_actionbar_text_area"] = {
            modifications: [{
                array_name: "controls",
                operation: "insert_back",
                value: [{
                    hud_text_editor_actionbar_factory: {
                        type: "panel",
                        factory: {
                            name: "hud_actionbar_text_factory",
                            control_ids: { hud_actionbar_text: "@hud.hud_actionbar_factory_root" },
                        },
                    },
                }],
            }],
        };
        payload.hud_actionbar_factory_root = {
            type: "panel",
            size: ["100%", "100%"],
            controls: actionbars.map((overlay) => ({ [`${overlayJsonName(overlay)}@hud.${overlayJsonName(overlay)}`]: {} })),
        };
        for (const overlay of actionbars) Object.assign(payload, buildActionbarControl(overlay));
    }

    const titleOverride = buildTitleHideOverride(overlays);
    if (titleOverride) payload["hud_title_text/title_frame"] = titleOverride;
    const subtitleOverride = buildSubtitleHideOverride(overlays);
    if (subtitleOverride) payload["hud_title_text/subtitle_frame"] = subtitleOverride;
    const actionbarOverride = buildActionbarHideOverride(overlays);
    if (actionbarOverride) payload.hud_actionbar_text = actionbarOverride;

    return JSON.stringify(payload, null, 2);
}

function renderHudEditor(): void {
    renderOverlayList();
    renderPreview();
    renderInspector();
}

function closeHudEditor(): void {
    getModal().style.display = "none";
    state.drag.overlayId = null;
}

export async function hudEditorModal(): Promise<void> {
    buildHudEditor();
    if (!state.overlays.length) resetHudEditorState();
    renderHudEditor();
    getModal().style.display = "block";
    getCloseButton().onclick = () => closeHudEditor();
}

window.addEventListener("mouseup", () => { state.drag.overlayId = null; });
window.addEventListener("click", (event) => { if (event.target === getModal()) closeHudEditor(); });

resetHudEditorState();
