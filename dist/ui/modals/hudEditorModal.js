import { Notification } from "../notifs/noficationMaker.js";
const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = Math.round(1500 / 1.7777777);
const BINDING_KEYS = {
    title: "#hud_title_text_string",
    subtitle: "#hud_subtitle_text_string",
    actionbar: "#hud_actionbar_text_string",
};
function createDefaultOverlays() {
    return [
        {
            id: "title",
            label: "Title Panel",
            sourceType: "title",
            bindingKey: BINDING_KEYS.title,
            triggerText: "info:",
            sampleText: "info: Main Title",
            preserveValue: true,
            stripTriggerText: true,
            x: 500,
            y: 120,
            width: 500,
            height: 64,
            layer: 30,
            visible: true,
            background: true,
            color: "#ffffff",
        },
        {
            id: "subtitle",
            label: "Subtitle Panel",
            sourceType: "subtitle",
            bindingKey: BINDING_KEYS.subtitle,
            triggerText: "",
            sampleText: "Subtitle",
            preserveValue: true,
            stripTriggerText: false,
            x: 540,
            y: 200,
            width: 420,
            height: 46,
            layer: 31,
            visible: true,
            background: false,
            color: "#dfe9ff",
        },
        {
            id: "actionbar",
            label: "Actionbar Panel",
            sourceType: "actionbar",
            bindingKey: BINDING_KEYS.actionbar,
            triggerText: "",
            sampleText: "Actionbar Text",
            preserveValue: true,
            stripTriggerText: false,
            x: 560,
            y: 640,
            width: 380,
            height: 42,
            layer: 32,
            visible: true,
            background: true,
            color: "#ffffff",
        },
    ];
}
const state = {
    overlays: createDefaultOverlays(),
    selectedId: "title",
    draggingId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
};
function getModal() {
    return document.getElementById("modalHudEditor");
}
function getCloseButton() {
    return document.getElementById("modalHudEditorClose");
}
function getForm() {
    return document.getElementsByClassName("modalHudEditorForm")[0];
}
function getSelectedOverlay() {
    return state.overlays.find((overlay) => overlay.id === state.selectedId) ?? state.overlays[0];
}
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
                    <div class="hudEditorSectionTitle">HUD Elements</div>
                    <div class="hudEditorOverlayList"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorResetBtn">Reset Layout</button>
                    </div>
                </div>
            </div>

            <div class="hudEditorCanvasPanel">
                <div class="glyphEditorCanvasHeader">
                    Move the title, subtitle, and actionbar panels directly in the preview. Use Trigger Text, Preserve, and Strip Trigger on the right to control how each HUD panel reacts.
                </div>
                <div class="hudEditorPreviewFrame">
                    <div class="hudEditorPreview" id="hudEditorPreview"></div>
                </div>
            </div>

            <div class="hudEditorSidebar hudEditorInspector">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">Properties</div>
                    <div class="hudEditorInspectorFields"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorCopyBtn">Copy HUD JSON</button>
                        <button type="button" class="propertyInputButton hudEditorDownloadBtn">Download HUD JSON</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    form.querySelector(".hudEditorResetBtn").onclick = () => {
        state.overlays = createDefaultOverlays();
        state.selectedId = "title";
        renderHudEditor();
        new Notification("Reset HUD layout.", 2200, "notif");
    };
    form.querySelector(".hudEditorCopyBtn").onclick = async () => {
        try {
            await navigator.clipboard.writeText(generateHudJson());
            new Notification("Copied HUD JSON.", 2200, "notif");
        }
        catch (error) {
            console.error(error);
            new Notification("Could not copy HUD JSON.", 2800, "error");
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
function renderHudEditor() {
    renderOverlayList();
    renderPreview();
    renderInspector();
}
function renderOverlayList() {
    const container = getForm().querySelector(".hudEditorOverlayList");
    if (!container)
        return;
    container.innerHTML = state.overlays
        .map((overlay) => {
        const activeClass = overlay.id === state.selectedId ? " hudEditorOverlayListItemActive" : "";
        const triggerLabel = overlay.triggerText ? `contains "${escapeHtml(overlay.triggerText)}"` : "when text exists";
        const preserveLabel = overlay.preserveValue ? "preserve" : "direct";
        return `
                <button type="button" class="hudEditorOverlayListItem${activeClass}" data-overlay-id="${overlay.id}">
                    <span>${escapeHtml(overlay.label)}</span>
                    <span>${triggerLabel} · ${preserveLabel}</span>
                </button>
            `;
    })
        .join("");
    container.querySelectorAll(".hudEditorOverlayListItem").forEach((button) => {
        button.onclick = () => {
            state.selectedId = button.dataset.overlayId;
            renderHudEditor();
        };
    });
}
function renderPreview() {
    const preview = getForm().querySelector("#hudEditorPreview");
    if (!preview)
        return;
    preview.innerHTML = `
        <div class="hudEditorPreviewSafezone"></div>
        <div class="hudEditorHotbarGuide"></div>
        <div class="hudEditorHealthGuide"></div>
        <div class="hudEditorHungerGuide"></div>
        ${state.overlays
        .filter((overlay) => overlay.visible)
        .map((overlay) => {
        const activeClass = overlay.id === state.selectedId ? " hudEditorOverlayActive" : "";
        const bgClass = overlay.background ? " hudEditorOverlayWithBg" : "";
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
                        <div class="hudEditorOverlayLabel">${escapeHtml(overlay.sampleText)}</div>
                    </div>
                `;
    })
        .join("")}
    `;
    preview.querySelectorAll(".hudEditorOverlay").forEach((element) => {
        element.onmousedown = (event) => {
            const overlayId = element.dataset.overlayId;
            const overlay = state.overlays.find((entry) => entry.id === overlayId);
            if (!overlay)
                return;
            state.selectedId = overlayId;
            state.draggingId = overlayId;
            state.dragOffsetX = event.offsetX;
            state.dragOffsetY = event.offsetY;
            renderHudEditor();
            event.preventDefault();
        };
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
    preview.onmouseup = () => {
        state.draggingId = null;
    };
    preview.onmouseleave = () => {
        state.draggingId = null;
    };
}
function renderInspector() {
    const container = getForm().querySelector(".hudEditorInspectorFields");
    if (!container)
        return;
    const overlay = getSelectedOverlay();
    container.innerHTML = `
        <label class="hudEditorFieldLabel">Name</label>
        <input class="hudEditorFieldInput" type="text" data-field="label" value="${escapeHtml(overlay.label)}">

        <label class="hudEditorFieldLabel">Source</label>
        <select class="hudEditorFieldInput" data-field="sourceType">
            <option value="title" ${overlay.sourceType === "title" ? "selected" : ""}>Title</option>
            <option value="subtitle" ${overlay.sourceType === "subtitle" ? "selected" : ""}>Subtitle</option>
            <option value="actionbar" ${overlay.sourceType === "actionbar" ? "selected" : ""}>Actionbar</option>
        </select>

        <label class="hudEditorFieldLabel">Binding Key</label>
        <input class="hudEditorFieldInput" type="text" data-field="bindingKey" value="${escapeHtml(overlay.bindingKey)}">

        <label class="hudEditorFieldLabel">Trigger Text</label>
        <input class="hudEditorFieldInput" type="text" data-field="triggerText" value="${escapeHtml(overlay.triggerText)}" placeholder="example: info:">

        <label class="hudEditorFieldLabel">Preview Text</label>
        <input class="hudEditorFieldInput" type="text" data-field="sampleText" value="${escapeHtml(overlay.sampleText)}">

        <label class="hudEditorFieldLabel">Preserve</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="preserveValue" ${overlay.preserveValue ? "checked" : ""}>

        <label class="hudEditorFieldLabel">Strip Trigger</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="stripTriggerText" ${overlay.stripTriggerText ? "checked" : ""}>

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

        <label class="hudEditorFieldLabel">Text Color</label>
        <input class="hudEditorFieldInput" type="color" data-field="color" value="${overlay.color}">

        <label class="hudEditorFieldLabel">Visible</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="visible" ${overlay.visible ? "checked" : ""}>

        <label class="hudEditorFieldLabel">Background</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="background" ${overlay.background ? "checked" : ""}>
    `;
    container.querySelectorAll("[data-field]").forEach((input) => {
        const field = input.dataset.field;
        const handler = () => {
            const selected = getSelectedOverlay();
            if (field === "sourceType") {
                selected.sourceType = input.value;
                selected.bindingKey = BINDING_KEYS[selected.sourceType];
            }
            else if (input instanceof HTMLInputElement && input.type === "checkbox") {
                selected[field] = input.checked;
            }
            else if (input instanceof HTMLInputElement && input.type === "number") {
                selected[field] = Math.max(0, Number(input.value) || 0);
            }
            else {
                selected[field] = input.value;
            }
            renderHudEditor();
        };
        input.oninput = handler;
        input.onchange = handler;
    });
}
function colorHexToRgb(color) {
    const normalized = color.replace("#", "");
    const bigint = Number.parseInt(normalized, 16);
    return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
}
function createVisibilityExpression(bindingKey, triggerText) {
    if (!triggerText.trim()) {
        return `(not (${bindingKey} = ''))`;
    }
    const escaped = triggerText.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `(not ((${bindingKey} - '${escaped}') = ${bindingKey}))`;
}
function createPreserveVisibilityExpression(bindingKey, triggerText) {
    const containsExpression = createVisibilityExpression(bindingKey, triggerText);
    return `(not (${bindingKey} = #preserved_text) and ${containsExpression})`;
}
function createLabelTextExpression(overlay) {
    const sourceValue = overlay.preserveValue ? "#preserved_text" : overlay.bindingKey;
    if (!overlay.stripTriggerText || !overlay.triggerText.trim()) {
        return sourceValue;
    }
    const escaped = overlay.triggerText.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `(${sourceValue} - '${escaped}')`;
}
function createOverlayControl(overlay) {
    const [r, g, b] = colorHexToRgb(overlay.color);
    const controlName = `${overlay.id}_control`;
    const backgroundControlName = `${overlay.id}_background`;
    const labelControlName = `${overlay.id}_label`;
    const dataControlName = `${overlay.id}_data_control`;
    const labelBindings = overlay.preserveValue
        ? [
            {
                binding_type: "view",
                source_control_name: dataControlName,
                source_property_name: createLabelTextExpression(overlay),
                target_property_name: "#text",
            },
        ]
        : [
            {
                binding_name: overlay.bindingKey,
            },
            {
                binding_type: "view",
                source_property_name: createLabelTextExpression(overlay),
                target_property_name: "#text",
            },
            {
                binding_type: "view",
                source_property_name: createVisibilityExpression(overlay.bindingKey, overlay.triggerText),
                target_property_name: "#visible",
            },
        ];
    const labelControls = overlay.preserveValue
        ? [
            {
                [dataControlName]: {
                    type: "panel",
                    size: [0, 0],
                    property_bag: {
                        "#preserved_text": "",
                    },
                    bindings: [
                        {
                            binding_name: overlay.bindingKey,
                        },
                        {
                            binding_name: overlay.bindingKey,
                            binding_name_override: "#preserved_text",
                            binding_condition: "visibility_changed",
                        },
                        {
                            binding_type: "view",
                            source_property_name: createPreserveVisibilityExpression(overlay.bindingKey, overlay.triggerText),
                            target_property_name: "#visible",
                        },
                    ],
                },
            },
        ]
        : [];
    return {
        [controlName]: {
            type: "panel",
            size: [overlay.width, overlay.height],
            anchor_from: "top_left",
            anchor_to: "top_left",
            offset: [overlay.x, overlay.y],
            layer: overlay.layer,
            controls: [
                ...(overlay.background
                    ? [
                        {
                            [backgroundControlName]: {
                                type: "image",
                                size: ["100%", "100%"],
                                texture: "textures/ui/hud_tip_text_background",
                                alpha: 0.75,
                            },
                        },
                    ]
                    : []),
                {
                    [labelControlName]: {
                        type: "label",
                        text: "#text",
                        size: ["100%", "default"],
                        offset: [0, Math.max(0, Math.round((overlay.height - 20) / 2))],
                        color: [r, g, b],
                        text_alignment: "center",
                        shadow: true,
                        controls: labelControls,
                        bindings: labelBindings,
                    },
                },
            ],
        },
    };
}
function generateHudJson() {
    const rootControls = state.overlays
        .filter((overlay) => overlay.visible)
        .map((overlay) => ({ [`${overlay.id}_control@hud_text_editor.${overlay.id}_control`]: {} }));
    const payload = {
        namespace: "hud_text_editor",
        hud_text_editor: {
            type: "panel",
            size: ["100%", "100%"],
            controls: rootControls,
        },
    };
    for (const overlay of state.overlays) {
        Object.assign(payload, createOverlayControl(overlay));
    }
    return JSON.stringify(payload, null, 2);
}
function closeHudEditor() {
    getModal().style.display = "none";
    state.draggingId = null;
}
export async function hudEditorModal() {
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
    if (event.target === getModal()) {
        closeHudEditor();
    }
});
//# sourceMappingURL=hudEditorModal.js.map