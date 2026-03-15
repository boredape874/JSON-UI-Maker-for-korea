import { Notification } from "../notifs/noficationMaker.js";

type HudOverlayId = "title" | "subtitle" | "actionbar";
type HudSourceType = "title" | "subtitle" | "actionbar";
type HudParseMode = "trigger" | "slice" | "split_pair";
type HudOutputType = "label" | "progress_bar";
type HudSplitPart = "first" | "second";
type HudTemplateName = "info" | "coin" | "hp_text" | "hp_clip" | "t1_preserve" | "t2_preserve" | "split_t1" | "split_t2";

type HudOverlay = {
    id: HudOverlayId;
    label: string;
    sourceType: HudSourceType;
    bindingKey: string;
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
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
    visible: boolean;
    background: boolean;
    color: string;
};

const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = Math.round(1500 / 1.7777777);

const BINDING_KEYS: Record<HudSourceType, string> = {
    title: "#hud_title_text_string",
    subtitle: "#hud_subtitle_text_string",
    actionbar: "#hud_actionbar_text_string",
};

const TEMPLATE_PATCHES: Record<HudTemplateName, Partial<HudOverlay>> = {
    info: { label: "정보 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "info:", sampleText: "info: 안내 문구", preserveValue: true, stripTriggerText: true, background: true, color: "#ffffff" },
    coin: { label: "코인 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "slice", outputType: "label", triggerText: "coin:", sampleText: "coin:1200", preserveValue: true, stripTriggerText: true, sliceStart: 200, sliceEnd: 400, background: true, color: "#f6d96b" },
    hp_text: { label: "체력 텍스트", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "slice", outputType: "label", triggerText: "hp_text:", sampleText: "hp_text:84/100", preserveValue: true, stripTriggerText: true, sliceStart: 400, sliceEnd: 600, background: false, color: "#ffffff" },
    hp_clip: { label: "체력 바", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "slice", outputType: "progress_bar", triggerText: "hp_clip:", sampleText: "hp_clip:84", preserveValue: true, stripTriggerText: true, sliceStart: 600, sliceEnd: 800, maxValue: 100, background: true, color: "#ffffff" },
    t1_preserve: { label: "t1 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "t1:", sampleText: "t1:안녕하세요", preserveValue: true, stripTriggerText: true, background: true, color: "#ffffff" },
    t2_preserve: { label: "t2 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "t2:", sampleText: "t2:반갑습니다", preserveValue: true, stripTriggerText: true, background: true, color: "#ffffff" },
    split_t1: { label: "분리 t1 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "split_pair", outputType: "label", sampleText: "t1:안녕하세요 :/: t2:반갑습니다", preserveValue: true, stripTriggerText: true, splitDelimiter: ":/:", splitPart: "first", splitPrefix: "t1:", background: true, color: "#ffffff" },
    split_t2: { label: "분리 t2 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "split_pair", outputType: "label", sampleText: "t1:안녕하세요 :/: t2:반갑습니다", preserveValue: true, stripTriggerText: true, splitDelimiter: ":/:", splitPart: "second", splitPrefix: "t2:", background: true, color: "#ffffff" },
};

function createDefaultOverlays(): HudOverlay[] {
    return [
        { id: "title", label: "타이틀 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "info:", sampleText: "info: Main Title", preserveValue: true, stripTriggerText: true, sliceStart: 0, sliceEnd: 200, splitDelimiter: ":/:", splitPart: "first", splitPrefix: "t1:", maxValue: 100, x: 500, y: 120, width: 500, height: 64, layer: 30, visible: true, background: true, color: "#ffffff" },
        { id: "subtitle", label: "서브타이틀 패널", sourceType: "subtitle", bindingKey: BINDING_KEYS.subtitle, parseMode: "trigger", outputType: "label", triggerText: "", sampleText: "Subtitle", preserveValue: true, stripTriggerText: false, sliceStart: 0, sliceEnd: 200, splitDelimiter: ":/:", splitPart: "second", splitPrefix: "t2:", maxValue: 100, x: 540, y: 200, width: 420, height: 46, layer: 31, visible: true, background: false, color: "#dfe9ff" },
        { id: "actionbar", label: "액션바 패널", sourceType: "actionbar", bindingKey: BINDING_KEYS.actionbar, parseMode: "trigger", outputType: "label", triggerText: "", sampleText: "Actionbar Text", preserveValue: true, stripTriggerText: false, sliceStart: 0, sliceEnd: 200, splitDelimiter: ":/:", splitPart: "first", splitPrefix: "", maxValue: 100, x: 560, y: 640, width: 380, height: 42, layer: 32, visible: true, background: true, color: "#ffffff" },
    ];
}

const state: { overlays: HudOverlay[]; selectedId: HudOverlayId; draggingId: HudOverlayId | null; dragOffsetX: number; dragOffsetY: number } = {
    overlays: createDefaultOverlays(),
    selectedId: "title",
    draggingId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
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

function getSelectedOverlay(): HudOverlay {
    return state.overlays.find((overlay) => overlay.id === state.selectedId) ?? state.overlays[0]!;
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeBindingText(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function resetLayout(): void {
    state.overlays = createDefaultOverlays();
    state.selectedId = "title";
}

function applyTemplate(name: HudTemplateName): void {
    const overlay = getSelectedOverlay();
    Object.assign(overlay, TEMPLATE_PATCHES[name]);
    overlay.bindingKey = BINDING_KEYS[overlay.sourceType];
    renderHudEditor();
    new Notification(`${name} 템플릿을 적용했습니다.`, 2200, "notif");
}

function buildHudEditor(): void {
    const form = getForm();
    if (form.dataset.initialized === "true") return;

    form.dataset.initialized = "true";
    form.innerHTML = `
        <div class="hudEditorLayout">
            <div class="hudEditorSidebar">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">HUD 요소</div>
                    <div class="hudEditorOverlayList"></div>
                    <div class="hudEditorSectionTitle hudEditorSectionSpacer">예시 템플릿</div>
                    <div class="hudEditorTemplateButtons">
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="info">정보</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="coin">코인</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="hp_text">체력 텍스트</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="hp_clip">체력 바</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="t1_preserve">t1 보존</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="t2_preserve">t2 보존</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="split_t1">분리 t1</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="split_t2">분리 t2</button>
                    </div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorResetBtn">기본 배치로 초기화</button>
                    </div>
                </div>
            </div>

            <div class="hudEditorCanvasPanel">
                <div class="glyphEditorCanvasHeader">
                    미리보기에서 패널을 직접 드래그하고, 오른쪽에서 Trigger / Slice / 문자열 분리 / 진행바 설정을 바꾼 뒤 HUD JSON으로 내보낼 수 있습니다.
                </div>
                <div class="hudEditorPreviewFrame">
                    <div class="hudEditorPreview" id="hudEditorPreview"></div>
                </div>
            </div>

            <div class="hudEditorSidebar hudEditorInspector">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">속성</div>
                    <div class="hudEditorInspectorFields"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorCopyBtn">HUD JSON 복사</button>
                        <button type="button" class="propertyInputButton hudEditorDownloadBtn">HUD JSON 다운로드</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    (form.querySelector(".hudEditorResetBtn") as HTMLButtonElement).onclick = () => {
        resetLayout();
        renderHudEditor();
        new Notification("HUD 배치를 초기화했습니다.", 2200, "notif");
    };

    form.querySelectorAll<HTMLButtonElement>(".hudTemplateBtn").forEach((button) => {
        button.onclick = () => applyTemplate(button.dataset.template as HudTemplateName);
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
        link.download = "hud_text_editor.json";
        link.click();
        URL.revokeObjectURL(url);
    };
}

function getOverlaySummary(overlay: HudOverlay): string {
    const parseLabel =
        overlay.parseMode === "slice"
            ? `${overlay.sliceStart}-${overlay.sliceEnd}`
            : overlay.parseMode === "split_pair"
              ? `${overlay.splitPart === "first" ? "앞값" : "뒷값"}`
              : overlay.triggerText
                ? `포함:${overlay.triggerText}`
                : "텍스트 존재";

    const outputLabel = overlay.outputType === "progress_bar" ? "바" : overlay.preserveValue ? "보존" : "직접";
    return `${parseLabel} / ${outputLabel}`;
}

function renderOverlayList(): void {
    const container = getForm().querySelector(".hudEditorOverlayList") as HTMLDivElement | null;
    if (!container) return;

    container.innerHTML = state.overlays
        .map((overlay) => {
            const activeClass = overlay.id === state.selectedId ? " hudEditorOverlayListItemActive" : "";
            return `
                <button type="button" class="hudEditorOverlayListItem${activeClass}" data-overlay-id="${overlay.id}">
                    <span>${escapeHtml(overlay.label)}</span>
                    <span>${escapeHtml(getOverlaySummary(overlay))}</span>
                </button>
            `;
        })
        .join("");

    container.querySelectorAll<HTMLButtonElement>(".hudEditorOverlayListItem").forEach((button) => {
        button.onclick = () => {
            state.selectedId = button.dataset.overlayId as HudOverlayId;
            renderHudEditor();
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
        ${state.overlays
            .filter((overlay) => overlay.visible)
            .map((overlay) => {
                const activeClass = overlay.id === state.selectedId ? " hudEditorOverlayActive" : "";
                const bgClass = overlay.background || overlay.outputType === "progress_bar" ? " hudEditorOverlayWithBg" : "";
                const content =
                    overlay.outputType === "progress_bar"
                        ? `<div class="hudEditorProgressShell"><div class="hudEditorProgressFill" style="width:70%"></div></div>`
                        : `<div class="hudEditorOverlayLabel">${escapeHtml(overlay.sampleText)}</div>`;

                return `
                    <div
                        class="hudEditorOverlay${activeClass}${bgClass}"
                        data-overlay-id="${overlay.id}"
                        style="
                            left:${(overlay.x / PREVIEW_WIDTH) * 100}%;
                            top:${(overlay.y / PREVIEW_HEIGHT) * 100}%;
                            width:${(overlay.width / PREVIEW_WIDTH) * 100}%;
                            height:${(overlay.height / PREVIEW_HEIGHT) * 100}%;
                            z-index:${overlay.layer};
                            color:${overlay.color};
                        "
                    >
                        ${content}
                    </div>
                `;
            })
            .join("")}
    `;

    preview.querySelectorAll<HTMLDivElement>(".hudEditorOverlay").forEach((element) => {
        element.onmousedown = (event) => {
            const overlayId = element.dataset.overlayId as HudOverlayId;
            const overlay = state.overlays.find((entry) => entry.id === overlayId);
            if (!overlay) return;

            state.selectedId = overlayId;
            state.draggingId = overlayId;
            state.dragOffsetX = event.offsetX;
            state.dragOffsetY = event.offsetY;
            renderHudEditor();
            event.preventDefault();
        };
    });

    preview.onmousemove = (event) => {
        if (!state.draggingId) return;

        const previewRect = preview.getBoundingClientRect();
        const overlay = state.overlays.find((entry) => entry.id === state.draggingId);
        if (!overlay) return;

        const nextX = ((event.clientX - previewRect.left - state.dragOffsetX) / previewRect.width) * PREVIEW_WIDTH;
        const nextY = ((event.clientY - previewRect.top - state.dragOffsetY) / previewRect.height) * PREVIEW_HEIGHT;

        overlay.x = Math.max(0, Math.min(PREVIEW_WIDTH - overlay.width, Math.round(nextX)));
        overlay.y = Math.max(0, Math.min(PREVIEW_HEIGHT - overlay.height, Math.round(nextY)));

        renderPreview();
        renderInspector();
    };

    preview.onmouseup = () => {
        state.draggingId = null;
    };

    preview.onmouseleave = () => {
        state.draggingId = null;
    };
}

function renderInspector(): void {
    const container = getForm().querySelector(".hudEditorInspectorFields") as HTMLDivElement | null;
    if (!container) return;

    const overlay = getSelectedOverlay();
    const triggerDisabled = overlay.parseMode !== "trigger" ? "disabled" : "";
    const sliceDisabled = overlay.parseMode !== "slice" ? "disabled" : "";
    const splitDisabled = overlay.parseMode !== "split_pair" ? "disabled" : "";
    const progressDisabled = overlay.outputType !== "progress_bar" ? "disabled" : "";

    container.innerHTML = `
        <label class="hudEditorFieldLabel">이름</label>
        <input class="hudEditorFieldInput" type="text" data-field="label" value="${escapeHtml(overlay.label)}">
        <label class="hudEditorFieldLabel">소스</label>
        <select class="hudEditorFieldInput" data-field="sourceType">
            <option value="title" ${overlay.sourceType === "title" ? "selected" : ""}>Title</option>
            <option value="subtitle" ${overlay.sourceType === "subtitle" ? "selected" : ""}>Subtitle</option>
            <option value="actionbar" ${overlay.sourceType === "actionbar" ? "selected" : ""}>Actionbar</option>
        </select>
        <label class="hudEditorFieldLabel">바인딩 키</label>
        <input class="hudEditorFieldInput" type="text" data-field="bindingKey" value="${escapeHtml(overlay.bindingKey)}">
        <label class="hudEditorFieldLabel">파싱 방식</label>
        <select class="hudEditorFieldInput" data-field="parseMode">
            <option value="trigger" ${overlay.parseMode === "trigger" ? "selected" : ""}>키워드 감지</option>
            <option value="slice" ${overlay.parseMode === "slice" ? "selected" : ""}>문자 구간 추출</option>
            <option value="split_pair" ${overlay.parseMode === "split_pair" ? "selected" : ""}>문자열 분리</option>
        </select>
        <label class="hudEditorFieldLabel">출력</label>
        <select class="hudEditorFieldInput" data-field="outputType">
            <option value="label" ${overlay.outputType === "label" ? "selected" : ""}>라벨</option>
            <option value="progress_bar" ${overlay.outputType === "progress_bar" ? "selected" : ""}>진행바</option>
        </select>
        <label class="hudEditorFieldLabel">키워드</label>
        <input class="hudEditorFieldInput" type="text" data-field="triggerText" value="${escapeHtml(overlay.triggerText)}" placeholder="예: info:" ${triggerDisabled}>
        <label class="hudEditorFieldLabel">구간 시작</label>
        <input class="hudEditorFieldInput" type="number" data-field="sliceStart" value="${overlay.sliceStart}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">구간 끝</label>
        <input class="hudEditorFieldInput" type="number" data-field="sliceEnd" value="${overlay.sliceEnd}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">분리 구분자</label>
        <input class="hudEditorFieldInput" type="text" data-field="splitDelimiter" value="${escapeHtml(overlay.splitDelimiter)}" placeholder="예: :/:" ${splitDisabled}>
        <label class="hudEditorFieldLabel">분리 쪽</label>
        <select class="hudEditorFieldInput" data-field="splitPart" ${splitDisabled}>
            <option value="first" ${overlay.splitPart === "first" ? "selected" : ""}>앞값</option>
            <option value="second" ${overlay.splitPart === "second" ? "selected" : ""}>뒷값</option>
        </select>
        <label class="hudEditorFieldLabel">제거할 접두어</label>
        <input class="hudEditorFieldInput" type="text" data-field="splitPrefix" value="${escapeHtml(overlay.splitPrefix)}" placeholder="예: t1:" ${splitDisabled}>
        <label class="hudEditorFieldLabel">미리보기 텍스트</label>
        <input class="hudEditorFieldInput" type="text" data-field="sampleText" value="${escapeHtml(overlay.sampleText)}">
        <label class="hudEditorFieldLabel">값 보존</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="preserveValue" ${overlay.preserveValue ? "checked" : ""}>
        <label class="hudEditorFieldLabel">접두어 제거</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="stripTriggerText" ${overlay.stripTriggerText ? "checked" : ""}>
        <label class="hudEditorFieldLabel">최대값</label>
        <input class="hudEditorFieldInput" type="number" data-field="maxValue" value="${overlay.maxValue}" ${progressDisabled}>
        <label class="hudEditorFieldLabel">Left</label>
        <input class="hudEditorFieldInput" type="number" data-field="x" value="${overlay.x}">
        <label class="hudEditorFieldLabel">Top</label>
        <input class="hudEditorFieldInput" type="number" data-field="y" value="${overlay.y}">
        <label class="hudEditorFieldLabel">Width</label>
        <input class="hudEditorFieldInput" type="number" data-field="width" value="${overlay.width}">
        <label class="hudEditorFieldLabel">Height</label>
        <input class="hudEditorFieldInput" type="number" data-field="height" value="${overlay.height}">
        <label class="hudEditorFieldLabel">Layer</label>
        <input class="hudEditorFieldInput" type="number" data-field="layer" value="${overlay.layer}">
        <label class="hudEditorFieldLabel">글자 색</label>
        <input class="hudEditorFieldInput" type="color" data-field="color" value="${overlay.color}">
        <label class="hudEditorFieldLabel">표시</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="visible" ${overlay.visible ? "checked" : ""}>
        <label class="hudEditorFieldLabel">배경</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="background" ${overlay.background ? "checked" : ""}>
    `;

    container.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]").forEach((input) => {
        const field = input.dataset.field as keyof HudOverlay;
        const handler = () => {
            const selected = getSelectedOverlay();
            if (field === "sourceType") {
                selected.sourceType = input.value as HudSourceType;
                selected.bindingKey = BINDING_KEYS[selected.sourceType];
            } else if (field === "parseMode") {
                selected.parseMode = input.value as HudParseMode;
            } else if (field === "outputType") {
                selected.outputType = input.value as HudOutputType;
                if (selected.outputType === "progress_bar") selected.background = true;
            } else if (field === "splitPart") {
                selected.splitPart = input.value as HudSplitPart;
            } else if (input instanceof HTMLInputElement && input.type === "checkbox") {
                (selected as any)[field] = input.checked;
            } else if (input instanceof HTMLInputElement && input.type === "number") {
                (selected as any)[field] = Math.max(0, Number(input.value) || 0);
            } else {
                (selected as any)[field] = input.value;
            }
            renderHudEditor();
        };
        input.oninput = handler;
        input.onchange = handler;
    });
}

function colorHexToRgb(color: string): [number, number, number] {
    const normalized = color.replace("#", "");
    const bigint = Number.parseInt(normalized, 16);
    return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}

function createTriggerVisibilityExpression(bindingKey: string, triggerText: string): string {
    if (!triggerText.trim()) return `(not (${bindingKey} = ''))`;
    const escaped = escapeBindingText(triggerText);
    return `(not ((${bindingKey} - '${escaped}') = ${bindingKey}))`;
}

function createSplitLengthExpression(): string {
    return "(#length + 1 * (not (('%.'+#length+'s') * #string = #string)))";
}

function createSplitSearchExpression(delimiter: string): string {
    const escaped = escapeBindingText(delimiter);
    return `(#search + 1 * (#search < #length and (('%.'+#search+'s') * #string = (('%.'+#search+'s') * #string - '${escaped}'))))`;
}

function createSliceExpression(sourceValue: string, start: number, end: number): string {
    const safeStart = Math.max(0, start);
    const safeEnd = Math.max(safeStart, end);
    if (safeStart === 0) return `('%.${safeEnd}s' * ${sourceValue})`;
    return `(('%.${safeEnd}s' * ${sourceValue}) - ('%.${safeStart}s' * ${sourceValue}))`;
}

function createSplitValueExpression(overlay: HudOverlay, sourceValue: string): string {
    const delimiter = escapeBindingText(overlay.splitDelimiter);
    const prefix = overlay.stripTriggerText ? escapeBindingText(overlay.splitPrefix) : "";

    if (overlay.splitPart === "first") {
        let expression = `(('%.'+#search+'s') * ${sourceValue})`;
        if (prefix) expression = `(${expression} - '${prefix}')`;
        if (delimiter) expression = `(${expression} - '${delimiter}')`;
        return expression;
    }

    let expression = `(${sourceValue} - (('%.'+#search+'s') * ${sourceValue}))`;
    if (delimiter) expression = `(${expression} - '${delimiter}')`;
    if (prefix) expression = `(${expression} - '${prefix}')`;
    return expression;
}

function createDataStringExpression(overlay: HudOverlay): string {
    const sourceValue = overlay.preserveValue ? "#preserved_text" : "#string";
    if (overlay.parseMode === "slice") {
        let expression = createSliceExpression(sourceValue, overlay.sliceStart, overlay.sliceEnd);
        if (overlay.stripTriggerText && overlay.triggerText.trim()) expression = `(${expression} - '${escapeBindingText(overlay.triggerText)}')`;
        return expression;
    }
    if (overlay.parseMode === "split_pair") {
        return createSplitValueExpression(overlay, sourceValue);
    }
    if (overlay.stripTriggerText && overlay.triggerText.trim()) {
        return `(${sourceValue} - '${escapeBindingText(overlay.triggerText)}')`;
    }
    return sourceValue;
}

function createParserBindings(overlay: HudOverlay) {
    const bindings: Record<string, any>[] = [];
    const visibleExpression = overlay.parseMode === "trigger" ? createTriggerVisibilityExpression(overlay.bindingKey, overlay.triggerText) : `(not (${overlay.bindingKey} = ''))`;

    if (overlay.preserveValue) {
        bindings.push({ binding_name: overlay.bindingKey });
        bindings.push({ binding_name: overlay.bindingKey, binding_name_override: "#preserved_text", binding_condition: "visibility_changed" });
        bindings.push({
            binding_type: "view",
            source_property_name: overlay.parseMode === "trigger" ? `(not (${overlay.bindingKey} = #preserved_text) and ${visibleExpression})` : `(not (${overlay.bindingKey} = #preserved_text) and not (${overlay.bindingKey} = ''))`,
            target_property_name: "#visible",
        });
    } else {
        bindings.push({ binding_name: overlay.bindingKey, binding_name_override: "#string" });
        bindings.push({ binding_type: "view", source_property_name: visibleExpression, target_property_name: "#visible" });
    }

    if (overlay.parseMode === "split_pair") {
        if (overlay.preserveValue) {
            bindings.push({ binding_type: "view", source_property_name: "#preserved_text", target_property_name: "#string" });
        }
        bindings.push({ binding_condition: "always", binding_type: "view", source_property_name: createSplitLengthExpression(), target_property_name: "#length" });
        bindings.push({ binding_condition: "always", binding_type: "view", source_property_name: createSplitSearchExpression(overlay.splitDelimiter), target_property_name: "#search" });
    }

    return bindings;
}

function createTextBindings(overlay: HudOverlay, dataControlName: string) {
    return [
        { binding_type: "view", source_control_name: dataControlName, source_property_name: createDataStringExpression(overlay), target_property_name: "#text" },
        { binding_type: "view", source_control_name: dataControlName, source_property_name: "#visible", target_property_name: "#visible" },
    ];
}

function createProgressBindings(overlay: HudOverlay, dataControlName: string) {
    return [
        { binding_type: "view", source_control_name: dataControlName, source_property_name: createDataStringExpression(overlay), target_property_name: "#raw_value" },
        { binding_type: "view", source_property_name: "(#raw_value * 1)", target_property_name: "#health" },
        { binding_type: "view", source_property_name: `(((${overlay.maxValue} - #health) / ${overlay.maxValue}))`, target_property_name: "#clip_ratio" },
        { binding_type: "view", source_control_name: dataControlName, source_property_name: "#visible", target_property_name: "#visible" },
    ];
}

function createOverlayControl(overlay: HudOverlay) {
    const [r, g, b] = colorHexToRgb(overlay.color);
    const controlName = `${overlay.id}_control`;
    const backgroundControlName = `${overlay.id}_background`;
    const labelControlName = `${overlay.id}_label`;
    const progressControlName = `${overlay.id}_progress`;
    const dataControlName = `${overlay.id}_data_control`;

    const dataControl = {
        [dataControlName]: {
            type: "panel",
            size: [0, 0],
            property_bag: { "#preserved_text": "", "#string": "", "#length": 0, "#search": 0 },
            bindings: createParserBindings(overlay),
        },
    };

    const contentControl =
        overlay.outputType === "progress_bar"
            ? {
                  [progressControlName]: {
                      type: "image",
                      size: ["100%", "100%"],
                      texture: "textures/ui/hp_bar/hp_bar_full",
                      clip_ratio: 0,
                      clip_direction: "left",
                      clip_pixelperfect: false,
                      controls: [dataControl],
                      bindings: createProgressBindings(overlay, dataControlName),
                  },
              }
            : {
                  [labelControlName]: {
                      type: "label",
                      text: "#text",
                      size: ["100%", "default"],
                      offset: [0, Math.max(0, Math.round((overlay.height - 20) / 2))],
                      color: [r, g, b],
                      text_alignment: "center",
                      shadow: true,
                      controls: [dataControl],
                      bindings: createTextBindings(overlay, dataControlName),
                  },
              };

    return {
        [controlName]: {
            type: "panel",
            size: [overlay.width, overlay.height],
            anchor_from: "top_left",
            anchor_to: "top_left",
            offset: [overlay.x, overlay.y],
            layer: overlay.layer,
            controls: [
                ...(overlay.background || overlay.outputType === "progress_bar"
                    ? [{ [backgroundControlName]: { type: "image", size: ["100%", "100%"], texture: overlay.outputType === "progress_bar" ? "textures/ui/hp_bar/hp_bar_bg" : "textures/ui/hud_tip_text_background", alpha: 0.75 } }]
                    : []),
                contentControl,
            ],
        },
    };
}

function generateHudJson(): string {
    const rootControls = state.overlays.filter((overlay) => overlay.visible).map((overlay) => ({ [`${overlay.id}_control@hud_text_editor.${overlay.id}_control`]: {} }));
    const payload: Record<string, any> = {
        namespace: "hud_text_editor",
        hud_text_editor: { type: "panel", size: ["100%", "100%"], controls: rootControls },
    };
    for (const overlay of state.overlays) Object.assign(payload, createOverlayControl(overlay));
    return JSON.stringify(payload, null, 2);
}

function renderHudEditor(): void {
    renderOverlayList();
    renderPreview();
    renderInspector();
}

function closeHudEditor(): void {
    getModal().style.display = "none";
    state.draggingId = null;
}

export async function hudEditorModal(): Promise<void> {
    buildHudEditor();
    renderHudEditor();
    const modal = getModal();
    modal.style.display = "block";
    getCloseButton().onclick = () => closeHudEditor();
}

window.addEventListener("mouseup", () => {
    state.draggingId = null;
});

window.addEventListener("click", (event) => {
    if (event.target === getModal()) closeHudEditor();
});
