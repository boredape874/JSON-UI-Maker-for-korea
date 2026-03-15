import { Notification } from "../notifs/noficationMaker.js";

type HudOverlayId = "title" | "subtitle" | "actionbar";
type HudSourceType = "title" | "subtitle" | "actionbar";
type HudParseMode = "trigger" | "slice";
type HudOutputType = "label" | "progress_bar";

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

const OVERLAY_TEMPLATES: Record<string, Partial<HudOverlay>> = {
    info: {
        label: "Info Panel",
        sourceType: "title",
        bindingKey: BINDING_KEYS.title,
        parseMode: "trigger",
        outputType: "label",
        triggerText: "info:",
        sampleText: "info: Notice",
        preserveValue: true,
        stripTriggerText: true,
        background: true,
        color: "#ffffff",
    },
    coin: {
        label: "Coin Panel",
        sourceType: "title",
        bindingKey: BINDING_KEYS.title,
        parseMode: "slice",
        outputType: "label",
        triggerText: "coin:",
        sampleText: "coin:1200",
        preserveValue: true,
        stripTriggerText: true,
        sliceStart: 200,
        sliceEnd: 400,
        background: true,
        color: "#f6d96b",
    },
    hp_text: {
        label: "HP Text Panel",
        sourceType: "title",
        bindingKey: BINDING_KEYS.title,
        parseMode: "slice",
        outputType: "label",
        triggerText: "hp_text:",
        sampleText: "hp_text:84/100",
        preserveValue: true,
        stripTriggerText: true,
        sliceStart: 400,
        sliceEnd: 600,
        background: false,
        color: "#ffffff",
    },
    hp_clip: {
        label: "HP Bar Panel",
        sourceType: "title",
        bindingKey: BINDING_KEYS.title,
        parseMode: "slice",
        outputType: "progress_bar",
        triggerText: "hp_clip:",
        sampleText: "hp_clip:84",
        preserveValue: true,
        stripTriggerText: true,
        sliceStart: 600,
        sliceEnd: 800,
        background: true,
        color: "#ffffff",
        maxValue: 100,
    },
};

function createDefaultOverlays(): HudOverlay[] {
    return [
        {
            id: "title",
            label: "Title Panel",
            sourceType: "title",
            bindingKey: BINDING_KEYS.title,
            parseMode: "trigger",
            outputType: "label",
            triggerText: "info:",
            sampleText: "info: Main Title",
            preserveValue: true,
            stripTriggerText: true,
            sliceStart: 0,
            sliceEnd: 200,
            maxValue: 100,
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
            parseMode: "trigger",
            outputType: "label",
            triggerText: "",
            sampleText: "Subtitle",
            preserveValue: true,
            stripTriggerText: false,
            sliceStart: 0,
            sliceEnd: 200,
            maxValue: 100,
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
            parseMode: "trigger",
            outputType: "label",
            triggerText: "",
            sampleText: "Actionbar Text",
            preserveValue: true,
            stripTriggerText: false,
            sliceStart: 0,
            sliceEnd: 200,
            maxValue: 100,
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

const state: {
    overlays: HudOverlay[];
    selectedId: HudOverlayId;
    draggingId: HudOverlayId | null;
    dragOffsetX: number;
    dragOffsetY: number;
} = {
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
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function cloneDefaults(): void {
    state.overlays = createDefaultOverlays();
    state.selectedId = "title";
}

function applyTemplate(name: keyof typeof OVERLAY_TEMPLATES): void {
    const overlay = getSelectedOverlay();
    Object.assign(overlay, OVERLAY_TEMPLATES[name]);
    overlay.bindingKey = BINDING_KEYS[overlay.sourceType];
    renderHudEditor();
    new Notification(`Applied ${name} template.`, 2200, "notif");
}

function buildHudEditor(): void {
    const form = getForm();
    if (form.dataset.initialized === "true") return;

    form.dataset.initialized = "true";
    form.innerHTML = `
        <div class="hudEditorLayout">
            <div class="hudEditorSidebar">
                <div class="glyphEditorMetaCard">
                    <div class="hudEditorSectionTitle">HUD Elements</div>
                    <div class="hudEditorOverlayList"></div>
                    <div class="hudEditorSectionTitle hudEditorSectionSpacer">Templates</div>
                    <div class="hudEditorTemplateButtons">
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="info">Info</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="coin">Coin</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="hp_text">HP Text</button>
                        <button type="button" class="propertyInputButton hudTemplateBtn" data-template="hp_clip">HP Bar</button>
                    </div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorResetBtn">Reset Layout</button>
                    </div>
                </div>
            </div>

            <div class="hudEditorCanvasPanel">
                <div class="glyphEditorCanvasHeader">
                    Drag the title, subtitle, and actionbar panels in the preview. Use Trigger or Slice mode on the right, then export a HUD JSON snippet.
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

    (form.querySelector(".hudEditorResetBtn") as HTMLButtonElement).onclick = () => {
        cloneDefaults();
        renderHudEditor();
        new Notification("Reset HUD layout.", 2200, "notif");
    };

    form.querySelectorAll<HTMLButtonElement>(".hudTemplateBtn").forEach((button) => {
        button.onclick = () => applyTemplate(button.dataset.template as keyof typeof OVERLAY_TEMPLATES);
    });

    (form.querySelector(".hudEditorCopyBtn") as HTMLButtonElement).onclick = async () => {
        try {
            await navigator.clipboard.writeText(generateHudJson());
            new Notification("Copied HUD JSON.", 2200, "notif");
        } catch (error) {
            console.error(error);
            new Notification("Could not copy HUD JSON.", 2800, "error");
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

function renderHudEditor(): void {
    renderOverlayList();
    renderPreview();
    renderInspector();
}

function getOverlaySummary(overlay: HudOverlay): string {
    const modeLabel = overlay.parseMode === "slice" ? `${overlay.sliceStart}-${overlay.sliceEnd}` : (overlay.triggerText ? `contains "${overlay.triggerText}"` : "when text exists");
    const outputLabel = overlay.outputType === "progress_bar" ? "bar" : overlay.preserveValue ? "preserve" : "direct";
    return `${modeLabel} · ${outputLabel}`;
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
                const content = overlay.outputType === "progress_bar"
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
    const sliceDisabled = overlay.parseMode !== "slice" ? "disabled" : "";
    const triggerDisabled = overlay.parseMode !== "trigger" ? "disabled" : "";

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

        <label class="hudEditorFieldLabel">Parse Mode</label>
        <select class="hudEditorFieldInput" data-field="parseMode">
            <option value="trigger" ${overlay.parseMode === "trigger" ? "selected" : ""}>Trigger</option>
            <option value="slice" ${overlay.parseMode === "slice" ? "selected" : ""}>Slice</option>
        </select>

        <label class="hudEditorFieldLabel">Output</label>
        <select class="hudEditorFieldInput" data-field="outputType">
            <option value="label" ${overlay.outputType === "label" ? "selected" : ""}>Label</option>
            <option value="progress_bar" ${overlay.outputType === "progress_bar" ? "selected" : ""}>Progress Bar</option>
        </select>

        <label class="hudEditorFieldLabel">Trigger Text</label>
        <input class="hudEditorFieldInput" type="text" data-field="triggerText" value="${escapeHtml(overlay.triggerText)}" placeholder="example: info:" ${triggerDisabled}>

        <label class="hudEditorFieldLabel">Slice Start</label>
        <input class="hudEditorFieldInput" type="number" data-field="sliceStart" value="${overlay.sliceStart}" ${sliceDisabled}>

        <label class="hudEditorFieldLabel">Slice End</label>
        <input class="hudEditorFieldInput" type="number" data-field="sliceEnd" value="${overlay.sliceEnd}" ${sliceDisabled}>

        <label class="hudEditorFieldLabel">Preview Text</label>
        <input class="hudEditorFieldInput" type="text" data-field="sampleText" value="${escapeHtml(overlay.sampleText)}">

        <label class="hudEditorFieldLabel">Preserve</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="preserveValue" ${overlay.preserveValue ? "checked" : ""}>

        <label class="hudEditorFieldLabel">Strip Trigger</label>
        <input class="hudEditorFieldCheckbox" type="checkbox" data-field="stripTriggerText" ${overlay.stripTriggerText ? "checked" : ""}>

        <label class="hudEditorFieldLabel">Max Value</label>
        <input class="hudEditorFieldInput" type="number" data-field="maxValue" value="${overlay.maxValue}" ${overlay.outputType !== "progress_bar" ? "disabled" : ""}>

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
                if (selected.outputType === "progress_bar") {
                    selected.background = true;
                }
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

function escapeBindingText(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function createVisibilityExpression(bindingKey: string, triggerText: string): string {
    if (!triggerText.trim()) {
        return `(not (${bindingKey} = ''))`;
    }

    const escaped = escapeBindingText(triggerText);
    return `(not ((${bindingKey} - '${escaped}') = ${bindingKey}))`;
}

function createPreserveVisibilityExpression(bindingKey: string, triggerText: string): string {
    const containsExpression = createVisibilityExpression(bindingKey, triggerText);
    return `(not (${bindingKey} = #preserved_text) and ${containsExpression})`;
}

function buildSliceExpression(sourceValue: string, start: number, end: number): string {
    const safeEnd = Math.max(start, end);
    const safeStart = Math.max(0, start);

    if (safeStart <= 0) {
        return `('%.${safeEnd}s' * ${sourceValue})`;
    }

    return `(('%.${safeEnd}s' * ${sourceValue}) - ('%.${safeStart}s' * ${sourceValue}))`;
}

function createLabelTextExpression(overlay: HudOverlay): string {
    const sourceValue = overlay.preserveValue ? "#preserved_text" : overlay.bindingKey;
    const baseExpression = overlay.parseMode === "slice" ? buildSliceExpression(sourceValue, overlay.sliceStart, overlay.sliceEnd) : sourceValue;

    if (!overlay.stripTriggerText || !overlay.triggerText.trim()) {
        return baseExpression;
    }

    const escaped = escapeBindingText(overlay.triggerText);
    return `(${baseExpression} - '${escaped}')`;
}

function createDataControlBindings(overlay: HudOverlay) {
    if (!overlay.preserveValue) return [];

    const visibilityExpression =
        overlay.parseMode === "slice"
            ? `(not (${overlay.bindingKey} = #preserved_text) and (not (${overlay.bindingKey} = ''))) `
            : createPreserveVisibilityExpression(overlay.bindingKey, overlay.triggerText);

    return [
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
            source_property_name: visibilityExpression.trim(),
            target_property_name: "#visible",
        },
    ];
}

function createLabelBindings(overlay: HudOverlay, dataControlName: string) {
    if (overlay.preserveValue) {
        return [
            {
                binding_type: "view",
                source_control_name: dataControlName,
                source_property_name: createLabelTextExpression(overlay),
                target_property_name: "#text",
            },
        ];
    }

    return [
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
            source_property_name:
                overlay.parseMode === "slice" ? `(not (${overlay.bindingKey} = ''))` : createVisibilityExpression(overlay.bindingKey, overlay.triggerText),
            target_property_name: "#visible",
        },
    ];
}

function createProgressBindings(overlay: HudOverlay, dataControlName: string) {
    const sourceTextExpression = createLabelTextExpression(overlay);
    const healthSource = `(${sourceTextExpression} * 1)`;

    const bindings: Record<string, any>[] = [
        {
            binding_type: "view",
            source_property_name: healthSource,
            target_property_name: "#health",
        },
        {
            binding_type: "view",
            source_property_name: `(((${overlay.maxValue} - #health) / ${overlay.maxValue}))`,
            target_property_name: "#clip_ratio",
        },
    ];

    if (overlay.preserveValue) {
        bindings.unshift({
            binding_type: "view",
            source_control_name: dataControlName,
            source_property_name: sourceTextExpression,
            target_property_name: "#raw_value",
        });
    } else {
        bindings.unshift({
            binding_type: "view",
            source_property_name: sourceTextExpression,
            target_property_name: "#raw_value",
        });
        bindings.unshift({
            binding_name: overlay.bindingKey,
        });
        bindings.push({
            binding_type: "view",
            source_property_name: overlay.parseMode === "slice" ? `(not (${overlay.bindingKey} = ''))` : createVisibilityExpression(overlay.bindingKey, overlay.triggerText),
            target_property_name: "#visible",
        });
    }

    return bindings;
}

function createOverlayControl(overlay: HudOverlay) {
    const [r, g, b] = colorHexToRgb(overlay.color);
    const controlName = `${overlay.id}_control`;
    const backgroundControlName = `${overlay.id}_background`;
    const labelControlName = `${overlay.id}_label`;
    const dataControlName = `${overlay.id}_data_control`;
    const fillControlName = `${overlay.id}_fill`;

    const dataControl = overlay.preserveValue
        ? [
              {
                  [dataControlName]: {
                      type: "panel",
                      size: [0, 0],
                      property_bag: {
                          "#preserved_text": "",
                      },
                      bindings: createDataControlBindings(overlay),
                  },
              },
          ]
        : [];

    const mainControl =
        overlay.outputType === "progress_bar"
            ? {
                  [fillControlName]: {
                      type: "image",
                      size: ["100%", "100%"],
                      texture: "textures/ui/hp_bar/hp_bar_full",
                      clip_ratio: 0,
                      clip_direction: "left",
                      clip_pixelperfect: false,
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
                      controls: dataControl,
                      bindings: createLabelBindings(overlay, dataControlName),
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
                    ? [
                          {
                              [backgroundControlName]: {
                                  type: "image",
                                  size: ["100%", "100%"],
                                  texture: overlay.outputType === "progress_bar" ? "textures/ui/hp_bar/hp_bar_bg" : "textures/ui/hud_tip_text_background",
                                  alpha: 0.75,
                              },
                          },
                      ]
                    : []),
                mainControl,
            ],
        },
    };
}

function generateHudJson(): string {
    const rootControls = state.overlays
        .filter((overlay) => overlay.visible)
        .map((overlay) => ({ [`${overlay.id}_control@hud_text_editor.${overlay.id}_control`]: {} }));

    const payload: Record<string, any> = {
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
    if (event.target === getModal()) {
        closeHudEditor();
    }
});
