import { Notification } from "../notifs/noficationMaker.js";
const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = Math.round(1500 / 1.7777777);
const BINDING_KEYS = { title: "#hud_title_text_string", subtitle: "#hud_subtitle_text_string", actionbar: "#hud_actionbar_text_string" };
const TEMPLATE_PATCHES = {
    info: { label: "정보 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "info:", sampleText: "info: 안내 문구", preserveValue: true, stripTriggerText: true, background: true, color: "#ffffff" },
    coin: { label: "코인 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "slice", outputType: "label", triggerText: "coin:", sampleText: "coin:1200", preserveValue: true, stripTriggerText: true, sliceStart: 200, sliceEnd: 400, background: true, color: "#f6d96b" },
    hp_text: { label: "체력 텍스트", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "slice", outputType: "label", triggerText: "hp_text:", sampleText: "hp_text:84/100", preserveValue: true, stripTriggerText: true, sliceStart: 400, sliceEnd: 600, background: false, color: "#ffffff" },
    hp_clip: { label: "체력 바", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "slice", outputType: "progress_bar", triggerText: "hp_clip:", sampleText: "hp_clip:84", preserveValue: true, stripTriggerText: true, sliceStart: 600, sliceEnd: 800, maxValue: 100, background: true, color: "#ffffff" },
    t1_preserve: { label: "t1 보존 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "t1:", sampleText: "t1:안녕하세요", preserveValue: true, stripTriggerText: true, background: true, color: "#ffffff" },
    t2_preserve: { label: "t2 보존 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "t2:", sampleText: "t2:반갑습니다", preserveValue: true, stripTriggerText: true, background: true, color: "#ffffff" },
    split_t1: { label: "분리 t1 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "split_pair", outputType: "label", sampleText: "t1:안녕하세요:/: t2:반갑습니다", preserveValue: true, stripTriggerText: true, splitDelimiter: ":/:", splitPart: "first", splitPrefix: "t1:", background: true, color: "#ffffff" },
    split_t2: { label: "분리 t2 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "split_pair", outputType: "label", sampleText: "t1:안녕하세요:/: t2:반갑습니다", preserveValue: true, stripTriggerText: true, splitDelimiter: ":/:", splitPart: "second", splitPrefix: "t2:", background: true, color: "#ffffff" },
};
function defaults() {
    return [
        { id: "title", label: "타이틀 패널", sourceType: "title", bindingKey: BINDING_KEYS.title, parseMode: "trigger", outputType: "label", triggerText: "info:", sampleText: "info: Main Title", preserveValue: true, stripTriggerText: true, sliceStart: 0, sliceEnd: 200, splitDelimiter: ":/:", splitPart: "first", splitPrefix: "t1:", maxValue: 100, x: 500, y: 120, width: 500, height: 64, layer: 30, visible: true, background: true, color: "#ffffff" },
        { id: "subtitle", label: "서브타이틀 패널", sourceType: "subtitle", bindingKey: BINDING_KEYS.subtitle, parseMode: "trigger", outputType: "label", triggerText: "", sampleText: "Subtitle", preserveValue: true, stripTriggerText: false, sliceStart: 0, sliceEnd: 200, splitDelimiter: ":/:", splitPart: "second", splitPrefix: "t2:", maxValue: 100, x: 540, y: 200, width: 420, height: 46, layer: 31, visible: true, background: false, color: "#dfe9ff" },
        { id: "actionbar", label: "액션바 패널", sourceType: "actionbar", bindingKey: BINDING_KEYS.actionbar, parseMode: "trigger", outputType: "label", triggerText: "", sampleText: "Actionbar Text", preserveValue: true, stripTriggerText: false, sliceStart: 0, sliceEnd: 200, splitDelimiter: ":/:", splitPart: "first", splitPrefix: "", maxValue: 100, x: 560, y: 640, width: 380, height: 42, layer: 32, visible: true, background: true, color: "#ffffff" },
    ];
}
const state = { overlays: defaults(), selectedId: "title", draggingId: null, dragOffsetX: 0, dragOffsetY: 0 };
const getModal = () => document.getElementById("modalHudEditor");
const getCloseButton = () => document.getElementById("modalHudEditorClose");
const getForm = () => document.getElementsByClassName("modalHudEditorForm")[0];
const selected = () => state.overlays.find((overlay) => overlay.id === state.selectedId) ?? state.overlays[0];
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const escapeBindingText = (value) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
function parseDescription(mode) {
    if (mode === "trigger")
        return "키워드가 포함될 때만 보이거나 값을 갱신합니다. 예: info:, t1:, hp_text:";
    if (mode === "slice")
        return "고정 길이 슬롯에서 문자열 구간을 잘라 씁니다. 예: 400~600 = hp_text, 600~800 = hp_clip";
    return "한 번의 title 안에서 구분자를 기준으로 앞값과 뒷값을 분리합니다. 예: t1:안녕:/: t2:반가워";
}
function buildHudEditor() {
    const form = getForm();
    if (form.dataset.initialized === "true")
        return;
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
                    <div class="hudEditorSidebarActions"><button type="button" class="propertyInputButton hudEditorResetBtn">기본 배치로 초기화</button></div>
                </div>
            </div>
            <div class="hudEditorCanvasPanel">
                <div class="glyphEditorCanvasHeader">미리보기에서 패널을 드래그해 배치하고, 오른쪽에서 Title / Subtitle / Actionbar 파싱 방식을 설정한 뒤 HUD JSON으로 복사하거나 다운로드할 수 있습니다.</div>
                <div class="hudEditorPreviewFrame"><div class="hudEditorPreview" id="hudEditorPreview"></div></div>
                <div class="hudEditorHelpCard">
                    <div class="hudEditorSectionTitle">사용 방법</div>
                    <div class="hudEditorHelpText">왼쪽에서 패널을 고르고 가운데 미리보기에서 드래그로 위치를 잡은 뒤, 오른쪽에서 파싱 방식과 출력 형식을 설정하면 됩니다.</div>
                    <div class="hudEditorHelpList">
                        <div><strong>키워드 감지</strong>: title/subtitle/actionbar 안에 특정 문자열이 포함될 때만 반응합니다.</div>
                        <div><strong>문자 구간 추출</strong>: 고정 길이 슬롯을 잘라 씁니다. HP 텍스트, 코인, HP 바에 적합합니다.</div>
                        <div><strong>문자열 분리</strong>: <code>:/:</code> 같은 구분자로 한 번의 title을 두 값으로 나눕니다.</div>
                        <div><strong>Preserve</strong>: 마지막으로 잡힌 값을 계속 유지합니다. 두 번 title 보내기 방식에 적합합니다.</div>
                        <div><strong>접두어 제거</strong>: <code>info:</code>, <code>t1:</code> 같은 앞부분을 화면 표시에서만 빼줍니다.</div>
                    </div>
                    <div class="hudEditorHelpExamples">
                        <div class="hudEditorHelpExample"><strong>예시 1</strong> <code>/title @a title "info:안내 문구"</code></div>
                        <div class="hudEditorHelpExample"><strong>예시 2</strong> <code>/title @a title "t1:안녕하세요"</code> 후 <code>/title @a title "t2:반갑습니다"</code></div>
                        <div class="hudEditorHelpExample"><strong>예시 3</strong> <code>/title @a title "t1:안녕하세요:/: t2:반갑습니다"</code></div>
                        <div class="hudEditorHelpExample"><strong>예시 4</strong> <code>0~200 info / 200~400 coin / 400~600 hp_text / 600~800 hp_clip</code></div>
                    </div>
                </div>
            </div>
            <div class="hudEditorSidebar hudEditorInspector">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">속성</div>
                    <div class="hudEditorInspectorSummary"></div>
                    <div class="hudEditorInspectorFields"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorCopyBtn">HUD JSON 복사</button>
                        <button type="button" class="propertyInputButton hudEditorDownloadBtn">HUD JSON 다운로드</button>
                    </div>
                </div>
            </div>
        </div>`;
    form.querySelector(".hudEditorResetBtn").onclick = () => { state.overlays = defaults(); state.selectedId = "title"; renderHudEditor(); new Notification("HUD 배치를 초기화했습니다.", 2200, "notif"); };
    form.querySelectorAll(".hudTemplateBtn").forEach((button) => button.onclick = () => {
        Object.assign(selected(), TEMPLATE_PATCHES[button.dataset.template]);
        selected().bindingKey = BINDING_KEYS[selected().sourceType];
        renderHudEditor();
        new Notification(`${button.textContent} 템플릿을 적용했습니다.`, 2200, "notif");
    });
    form.querySelector(".hudEditorCopyBtn").onclick = async () => {
        try {
            await navigator.clipboard.writeText(generateHudJson());
            new Notification("HUD JSON을 복사했습니다.", 2200, "notif");
        }
        catch (error) {
            console.error(error);
            new Notification("HUD JSON을 복사하지 못했습니다.", 2800, "error");
        }
    };
    form.querySelector(".hudEditorDownloadBtn").onclick = () => {
        const blob = new Blob([generateHudJson()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "hud_text_editor.json";
        link.click();
        URL.revokeObjectURL(url);
    };
}
function overlaySummary(overlay) {
    const parseLabel = overlay.parseMode === "slice" ? `${overlay.sliceStart}-${overlay.sliceEnd}` : overlay.parseMode === "split_pair" ? (overlay.splitPart === "first" ? "앞값" : "뒷값") : (overlay.triggerText ? `포함:${overlay.triggerText}` : "텍스트 존재");
    return `${parseLabel} / ${overlay.outputType === "progress_bar" ? "바" : overlay.preserveValue ? "보존" : "직접"}`;
}
function renderOverlayList() {
    const container = getForm().querySelector(".hudEditorOverlayList");
    if (!container)
        return;
    container.innerHTML = state.overlays.map((overlay) => `<button type="button" class="hudEditorOverlayListItem${overlay.id === state.selectedId ? " hudEditorOverlayListItemActive" : ""}" data-overlay-id="${overlay.id}"><span>${escapeHtml(overlay.label)}</span><span>${escapeHtml(overlaySummary(overlay))}</span></button>`).join("");
    container.querySelectorAll(".hudEditorOverlayListItem").forEach((button) => button.onclick = () => { state.selectedId = button.dataset.overlayId; renderHudEditor(); });
}
function renderPreview() {
    const preview = getForm().querySelector("#hudEditorPreview");
    if (!preview)
        return;
    preview.innerHTML = `<div class="hudEditorPreviewSafezone"></div><div class="hudEditorHotbarGuide"></div><div class="hudEditorHealthGuide"></div><div class="hudEditorHungerGuide"></div>${state.overlays.filter((overlay) => overlay.visible).map((overlay) => `<div class="hudEditorOverlay${overlay.id === state.selectedId ? " hudEditorOverlayActive" : ""}${overlay.background || overlay.outputType === "progress_bar" ? " hudEditorOverlayWithBg" : ""}" data-overlay-id="${overlay.id}" style="left:${overlay.x / PREVIEW_WIDTH * 100}%;top:${overlay.y / PREVIEW_HEIGHT * 100}%;width:${overlay.width / PREVIEW_WIDTH * 100}%;height:${overlay.height / PREVIEW_HEIGHT * 100}%;z-index:${overlay.layer};color:${overlay.color};">${overlay.outputType === "progress_bar" ? `<div class="hudEditorProgressShell"><div class="hudEditorProgressFill" style="width:70%"></div></div>` : `<div class="hudEditorOverlayLabel">${escapeHtml(overlay.sampleText)}</div>`}</div>`).join("")}`;
    preview.querySelectorAll(".hudEditorOverlay").forEach((element) => element.onmousedown = (event) => {
        const overlay = state.overlays.find((entry) => entry.id === element.dataset.overlayId);
        if (!overlay)
            return;
        state.selectedId = overlay.id;
        state.draggingId = overlay.id;
        state.dragOffsetX = event.offsetX;
        state.dragOffsetY = event.offsetY;
        renderHudEditor();
        event.preventDefault();
    });
    preview.onmousemove = (event) => {
        if (!state.draggingId)
            return;
        const previewRect = preview.getBoundingClientRect();
        const overlay = state.overlays.find((entry) => entry.id === state.draggingId);
        if (!overlay)
            return;
        const nextX = ((event.clientX - previewRect.left - state.dragOffsetX) / previewRect.width) * PREVIEW_WIDTH;
        const nextY = ((event.clientY - previewRect.top - state.dragOffsetY) / previewRect.height) * PREVIEW_HEIGHT;
        overlay.x = Math.max(0, Math.min(PREVIEW_WIDTH - overlay.width, Math.round(nextX)));
        overlay.y = Math.max(0, Math.min(PREVIEW_HEIGHT - overlay.height, Math.round(nextY)));
        renderPreview();
        renderInspector();
    };
    preview.onmouseup = () => { state.draggingId = null; };
    preview.onmouseleave = () => { state.draggingId = null; };
}
function renderInspector() {
    const summary = getForm().querySelector(".hudEditorInspectorSummary");
    const container = getForm().querySelector(".hudEditorInspectorFields");
    if (!summary || !container)
        return;
    const overlay = selected();
    const sourceLabel = overlay.sourceType === "title" ? "Title" : overlay.sourceType === "subtitle" ? "Subtitle" : "Actionbar";
    summary.innerHTML = `<div class="hudEditorHelpCard hudEditorInspectorCard"><div class="hudEditorHelpText"><strong>${escapeHtml(overlay.label)}</strong>은(는) <strong>${sourceLabel}</strong> 문자열을 기준으로 동작합니다.</div><div class="hudEditorHelpText">${escapeHtml(parseDescription(overlay.parseMode))}</div><div class="hudEditorHelpExample">현재 미리보기 예시: <code>${escapeHtml(overlay.sampleText)}</code></div></div>`;
    const triggerDisabled = overlay.parseMode !== "trigger" ? "disabled" : "";
    const sliceDisabled = overlay.parseMode !== "slice" ? "disabled" : "";
    const splitDisabled = overlay.parseMode !== "split_pair" ? "disabled" : "";
    const progressDisabled = overlay.outputType !== "progress_bar" ? "disabled" : "";
    container.innerHTML = `
        <label class="hudEditorFieldLabel">이름</label><input class="hudEditorFieldInput" type="text" data-field="label" value="${escapeHtml(overlay.label)}">
        <label class="hudEditorFieldLabel">소스</label><select class="hudEditorFieldInput" data-field="sourceType"><option value="title" ${overlay.sourceType === "title" ? "selected" : ""}>Title</option><option value="subtitle" ${overlay.sourceType === "subtitle" ? "selected" : ""}>Subtitle</option><option value="actionbar" ${overlay.sourceType === "actionbar" ? "selected" : ""}>Actionbar</option></select>
        <label class="hudEditorFieldLabel">바인딩 키</label><input class="hudEditorFieldInput" type="text" data-field="bindingKey" value="${escapeHtml(overlay.bindingKey)}">
        <label class="hudEditorFieldLabel">파싱 방식</label><select class="hudEditorFieldInput" data-field="parseMode"><option value="trigger" ${overlay.parseMode === "trigger" ? "selected" : ""}>키워드 감지</option><option value="slice" ${overlay.parseMode === "slice" ? "selected" : ""}>문자 구간 추출</option><option value="split_pair" ${overlay.parseMode === "split_pair" ? "selected" : ""}>문자열 분리</option></select>
        <label class="hudEditorFieldLabel">출력</label><select class="hudEditorFieldInput" data-field="outputType"><option value="label" ${overlay.outputType === "label" ? "selected" : ""}>라벨</option><option value="progress_bar" ${overlay.outputType === "progress_bar" ? "selected" : ""}>진행 바</option></select>
        <label class="hudEditorFieldLabel">키워드</label><input class="hudEditorFieldInput" type="text" data-field="triggerText" value="${escapeHtml(overlay.triggerText)}" placeholder="예: info:" ${triggerDisabled}>
        <label class="hudEditorFieldLabel">구간 시작</label><input class="hudEditorFieldInput" type="number" data-field="sliceStart" value="${overlay.sliceStart}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">구간 끝</label><input class="hudEditorFieldInput" type="number" data-field="sliceEnd" value="${overlay.sliceEnd}" ${sliceDisabled}>
        <label class="hudEditorFieldLabel">구분자</label><input class="hudEditorFieldInput" type="text" data-field="splitDelimiter" value="${escapeHtml(overlay.splitDelimiter)}" placeholder="예: :/:" ${splitDisabled}>
        <label class="hudEditorFieldLabel">분리 쪽</label><select class="hudEditorFieldInput" data-field="splitPart" ${splitDisabled}><option value="first" ${overlay.splitPart === "first" ? "selected" : ""}>앞값</option><option value="second" ${overlay.splitPart === "second" ? "selected" : ""}>뒷값</option></select>
        <label class="hudEditorFieldLabel">제거할 접두어</label><input class="hudEditorFieldInput" type="text" data-field="splitPrefix" value="${escapeHtml(overlay.splitPrefix)}" placeholder="예: t1:" ${splitDisabled}>
        <label class="hudEditorFieldLabel">미리보기 텍스트</label><input class="hudEditorFieldInput" type="text" data-field="sampleText" value="${escapeHtml(overlay.sampleText)}">
        <label class="hudEditorFieldLabel">값 보존</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="preserveValue" ${overlay.preserveValue ? "checked" : ""}>
        <label class="hudEditorFieldLabel">접두어 제거</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="stripTriggerText" ${overlay.stripTriggerText ? "checked" : ""}>
        <label class="hudEditorFieldLabel">최대값</label><input class="hudEditorFieldInput" type="number" data-field="maxValue" value="${overlay.maxValue}" ${progressDisabled}>
        <label class="hudEditorFieldLabel">Left</label><input class="hudEditorFieldInput" type="number" data-field="x" value="${overlay.x}">
        <label class="hudEditorFieldLabel">Top</label><input class="hudEditorFieldInput" type="number" data-field="y" value="${overlay.y}">
        <label class="hudEditorFieldLabel">Width</label><input class="hudEditorFieldInput" type="number" data-field="width" value="${overlay.width}">
        <label class="hudEditorFieldLabel">Height</label><input class="hudEditorFieldInput" type="number" data-field="height" value="${overlay.height}">
        <label class="hudEditorFieldLabel">Layer</label><input class="hudEditorFieldInput" type="number" data-field="layer" value="${overlay.layer}">
        <label class="hudEditorFieldLabel">글자 색</label><input class="hudEditorFieldInput" type="color" data-field="color" value="${overlay.color}">
        <label class="hudEditorFieldLabel">표시</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="visible" ${overlay.visible ? "checked" : ""}>
        <label class="hudEditorFieldLabel">배경</label><input class="hudEditorFieldCheckbox" type="checkbox" data-field="background" ${overlay.background ? "checked" : ""}>`;
    container.querySelectorAll("[data-field]").forEach((input) => {
        const field = input.dataset.field;
        const handler = () => {
            const current = selected();
            if (field === "sourceType") {
                current.sourceType = input.value;
                current.bindingKey = BINDING_KEYS[current.sourceType];
            }
            else if (field === "parseMode")
                current.parseMode = input.value;
            else if (field === "outputType") {
                current.outputType = input.value;
                if (current.outputType === "progress_bar")
                    current.background = true;
            }
            else if (field === "splitPart")
                current.splitPart = input.value;
            else if (input instanceof HTMLInputElement && input.type === "checkbox")
                current[field] = input.checked;
            else if (input instanceof HTMLInputElement && input.type === "number")
                current[field] = Math.max(0, Number(input.value) || 0);
            else
                current[field] = input.value;
            renderHudEditor();
        };
        input.oninput = handler;
        input.onchange = handler;
    });
}
const colorHexToRgb = (color) => {
    const normalized = color.replace("#", "");
    const bigint = Number.parseInt(normalized, 16);
    return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
};
const triggerVisibility = (bindingKey, triggerText) => !triggerText.trim() ? `(not (${bindingKey} = ''))` : `(not ((${bindingKey} - '${escapeBindingText(triggerText)}') = ${bindingKey}))`;
const splitLengthExpr = () => "(#length + 1 * (not (('%.'+#length+'s') * #string = #string)))";
const splitSearchExpr = (delimiter) => `(#search + 1 * (#search < #length and (('%.'+#search+'s') * #string = (('%.'+#search+'s') * #string - '${escapeBindingText(delimiter)}'))))`;
function sliceExpr(sourceValue, start, end) {
    const safeStart = Math.max(0, start);
    const safeEnd = Math.max(safeStart, end);
    return safeStart === 0 ? `('%.${safeEnd}s' * ${sourceValue})` : `(('%.${safeEnd}s' * ${sourceValue}) - ('%.${safeStart}s' * ${sourceValue}))`;
}
function splitValueExpr(overlay, sourceValue) {
    const delimiter = escapeBindingText(overlay.splitDelimiter);
    const prefix = overlay.stripTriggerText ? escapeBindingText(overlay.splitPrefix) : "";
    if (overlay.splitPart === "first") {
        let expression = `(('%.'+#search+'s') * ${sourceValue})`;
        if (prefix)
            expression = `(${expression} - '${prefix}')`;
        if (delimiter)
            expression = `(${expression} - '${delimiter}')`;
        return expression;
    }
    let expression = `(${sourceValue} - (('%.'+#search+'s') * ${sourceValue}))`;
    if (delimiter)
        expression = `(${expression} - '${delimiter}')`;
    if (prefix)
        expression = `(${expression} - '${prefix}')`;
    return expression;
}
function dataStringExpr(overlay) {
    const sourceValue = overlay.preserveValue ? "#preserved_text" : "#string";
    if (overlay.parseMode === "slice") {
        let expression = sliceExpr(sourceValue, overlay.sliceStart, overlay.sliceEnd);
        if (overlay.stripTriggerText && overlay.triggerText.trim())
            expression = `(${expression} - '${escapeBindingText(overlay.triggerText)}')`;
        return expression;
    }
    if (overlay.parseMode === "split_pair")
        return splitValueExpr(overlay, sourceValue);
    return overlay.stripTriggerText && overlay.triggerText.trim() ? `(${sourceValue} - '${escapeBindingText(overlay.triggerText)}')` : sourceValue;
}
function parserBindings(overlay) {
    const bindings = [];
    const visibleExpression = overlay.parseMode === "trigger" ? triggerVisibility(overlay.bindingKey, overlay.triggerText) : `(not (${overlay.bindingKey} = ''))`;
    if (overlay.preserveValue) {
        bindings.push({ binding_name: overlay.bindingKey });
        bindings.push({ binding_name: overlay.bindingKey, binding_name_override: "#preserved_text", binding_condition: "visibility_changed" });
        bindings.push({ binding_type: "view", source_property_name: overlay.parseMode === "trigger" ? `(not (${overlay.bindingKey} = #preserved_text) and ${visibleExpression})` : `(not (${overlay.bindingKey} = #preserved_text) and not (${overlay.bindingKey} = ''))`, target_property_name: "#visible" });
    }
    else {
        bindings.push({ binding_name: overlay.bindingKey, binding_name_override: "#string" });
        bindings.push({ binding_type: "view", source_property_name: visibleExpression, target_property_name: "#visible" });
    }
    if (overlay.parseMode === "split_pair") {
        if (overlay.preserveValue)
            bindings.push({ binding_type: "view", source_property_name: "#preserved_text", target_property_name: "#string" });
        bindings.push({ binding_condition: "always", binding_type: "view", source_property_name: splitLengthExpr(), target_property_name: "#length" });
        bindings.push({ binding_condition: "always", binding_type: "view", source_property_name: splitSearchExpr(overlay.splitDelimiter), target_property_name: "#search" });
    }
    return bindings;
}
const textBindings = (overlay, dataControlName) => [{ binding_type: "view", source_control_name: dataControlName, source_property_name: dataStringExpr(overlay), target_property_name: "#text" }, { binding_type: "view", source_control_name: dataControlName, source_property_name: "#visible", target_property_name: "#visible" }];
const progressBindings = (overlay, dataControlName) => [{ binding_type: "view", source_control_name: dataControlName, source_property_name: dataStringExpr(overlay), target_property_name: "#raw_value" }, { binding_type: "view", source_property_name: "(#raw_value * 1)", target_property_name: "#health" }, { binding_type: "view", source_property_name: `(((${overlay.maxValue} - #health) / ${overlay.maxValue}))`, target_property_name: "#clip_ratio" }, { binding_type: "view", source_control_name: dataControlName, source_property_name: "#visible", target_property_name: "#visible" }];
function overlayControl(overlay) {
    const [r, g, b] = colorHexToRgb(overlay.color);
    const controlName = `${overlay.id}_control`;
    const dataControlName = `${overlay.id}_data_control`;
    const dataControl = { [dataControlName]: { type: "panel", size: [0, 0], property_bag: { "#preserved_text": "", "#string": "", "#length": 0, "#search": 0 }, bindings: parserBindings(overlay) } };
    const contentControl = overlay.outputType === "progress_bar"
        ? { [`${overlay.id}_progress`]: { type: "image", size: ["100%", "100%"], texture: "textures/ui/hp_bar/hp_bar_full", clip_ratio: 0, clip_direction: "left", clip_pixelperfect: false, controls: [dataControl], bindings: progressBindings(overlay, dataControlName) } }
        : { [`${overlay.id}_label`]: { type: "label", text: "#text", size: ["100%", "default"], offset: [0, Math.max(0, Math.round((overlay.height - 20) / 2))], color: [r, g, b], text_alignment: "center", shadow: true, controls: [dataControl], bindings: textBindings(overlay, dataControlName) } };
    return { [controlName]: { type: "panel", size: [overlay.width, overlay.height], anchor_from: "top_left", anchor_to: "top_left", offset: [overlay.x, overlay.y], layer: overlay.layer, controls: [...(overlay.background || overlay.outputType === "progress_bar" ? [{ [`${overlay.id}_background`]: { type: "image", size: ["100%", "100%"], texture: overlay.outputType === "progress_bar" ? "textures/ui/hp_bar/hp_bar_bg" : "textures/ui/hud_tip_text_background", alpha: 0.75 } }] : []), contentControl] } };
}
function generateHudJson() {
    const payload = {
        namespace: "hud",
        root_panel: {
            modifications: [{
                    array_name: "controls",
                    operation: "insert_back",
                    value: [{ "hud_text_editor@hud.hud_text_editor_panel": {} }],
                }],
        },
        hud_text_editor_panel: {
            type: "panel",
            size: ["100%", "100%"],
            controls: state.overlays
                .filter((overlay) => overlay.visible)
                .map((overlay) => ({ [`${overlay.id}_control@hud.${overlay.id}_control`]: {} })),
        },
    };
    for (const overlay of state.overlays)
        Object.assign(payload, overlayControl(overlay));
    return JSON.stringify(payload, null, 2);
}
function renderHudEditor() { renderOverlayList(); renderPreview(); renderInspector(); }
function closeHudEditor() { getModal().style.display = "none"; state.draggingId = null; }
export async function hudEditorModal() { buildHudEditor(); renderHudEditor(); getModal().style.display = "block"; getCloseButton().onclick = () => closeHudEditor(); }
window.addEventListener("mouseup", () => { state.draggingId = null; });
window.addEventListener("click", (event) => { if (event.target === getModal())
    closeHudEditor(); });
//# sourceMappingURL=hudEditorModal.js.map