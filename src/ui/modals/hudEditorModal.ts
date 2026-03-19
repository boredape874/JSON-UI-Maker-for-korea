import { Notification } from "../notifs/noficationMaker.js";

type HudChannel = "title" | "subtitle" | "actionbar";
type HudBackground = "vanilla" | "solid" | "none";
type HudFontSize = "small" | "normal" | "large" | "extra_large";
type HudSubtitleMode = "single" | "slice";
type HudDisplayMode = "text" | "progress";
type HudClipDirection = "left" | "right" | "up" | "down";
type HudAnimationPreset = "none" | "fade_out" | "fade_hold_fade";
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
    ignored: boolean;
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
    displayMode: HudDisplayMode;
    maxValue: number;
    fillColor: string;
    clipDirection: HudClipDirection;
    animationPreset: HudAnimationPreset;
    animInDuration: number;
    animHoldDuration: number;
    animOutDuration: number;
    subtitleMode?: HudSubtitleMode;
    sliceSlotCount?: number;
    sliceSlotSize?: number;
    sliceColumns?: number;
    sliceGapX?: number;
    sliceGapY?: number;
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
            label: "\uD0C0\uC774\uD2C0",
            enabled: true,
            ignored: false,
            sampleText: "info:\uACF5\uC9C0\uC785\uB2C8\uB2E4",
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
            displayMode: "text",
            maxValue: 100,
            fillColor: "#5be37a",
            clipDirection: "left",
            animationPreset: "fade_hold_fade",
            animInDuration: 0.25,
            animHoldDuration: 2,
            animOutDuration: 0.25,
        },
        subtitle: {
            id: "subtitle",
            label: "\uC11C\uBE0C\uD0C0\uC774\uD2C0",
            enabled: true,
            ignored: false,
            sampleText: "\uBD80\uC81C\uBAA9\uC785\uB2C8\uB2E4",
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
            displayMode: "text",
            maxValue: 100,
            fillColor: "#6fc3ff",
            clipDirection: "left",
            animationPreset: "fade_hold_fade",
            animInDuration: 0.2,
            animHoldDuration: 2,
            animOutDuration: 0.2,
            subtitleMode: "single",
            sliceSlotCount: 5,
            sliceSlotSize: 20,
            sliceColumns: 2,
            sliceGapX: 8,
            sliceGapY: 8,
        },
        actionbar: {
            id: "actionbar",
            label: "\uC561\uC158\uBC14",
            enabled: true,
            ignored: false,
            sampleText: "info:\uC624\uB978\uCABD \uD45C\uC2DC",
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
            displayMode: "text",
            maxValue: 100,
            fillColor: "#5be37a",
            clipDirection: "left",
            animationPreset: "fade_out",
            animInDuration: 0.15,
            animHoldDuration: 2.7,
            animOutDuration: 3,
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

    return `<img class="hudEditorCanvasBackgroundImage" src="background.png" alt="HUD Background">`;
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

function progressValueExpression(source: string, element: HudElement): string {
    const numericSource = element.prefix
        ? `(${source} - ${quoteString(element.prefix)})`
        : source;
    return `(${numericSource} + 0)`;
}

function progressClipExpression(source: string, element: HudElement): string {
    const maxValue = Math.max(1, element.maxValue || 1);
    return `((${maxValue} - ${progressValueExpression(source, element)}) / ${maxValue})`;
}

function buildProgressFill(sourceControlName: string, sourcePropertyName: string, element: HudElement): Record<string, unknown> {
    return {
        type: "image",
        texture: "textures/ui/white_background",
        color: hexToRgb(element.fillColor),
        size: ["100%", "100%"],
        clip_direction: element.clipDirection,
        clip_pixelperfect: false,
        layer: 32,
        bindings: [
            {
                binding_type: "view",
                source_control_name: sourceControlName,
                source_property_name: progressClipExpression(sourcePropertyName, element),
                target_property_name: "#clip_ratio",
            },
        ],
    };
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

    if (element.displayMode === "progress") {
        controls.push({
            title_fill: buildProgressFill("title_data", element.preserve ? "#preserved_text" : "#source_text", element),
        });
    } else {
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
    }

    return {
        type: "panel",
        ignored: element.ignored,
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
    controls.push({
        subtitle_data: {
            type: "panel",
            size: [0, 0],
            bindings: [
                {
                    binding_name: "#hud_subtitle_text_string",
                    binding_name_override: "#source_text",
                    binding_type: "global",
                },
                {
                    binding_type: "view",
                    source_property_name: element.prefix
                        ? prefixMatchExpression("#source_text", element.prefix)
                        : "(not (#source_text = ''))",
                    target_property_name: "#visible",
                },
            ],
        },
    });

    const background = backgroundDefinition(element);
    if (background) {
        controls.push({
            subtitle_background: background,
        });
    }

    if (element.displayMode === "progress") {
        controls.push({
            subtitle_fill: buildProgressFill("subtitle_data", "#source_text", element),
        });
    } else {
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
                        binding_type: "view",
                        source_control_name: "subtitle_data",
                        source_property_name: removePrefixExpression("#source_text", element.prefix, element.stripPrefix),
                        target_property_name: "#text",
                    },
                ],
            },
        });
    }

    return {
        type: "panel",
        ignored: element.ignored,
        size: [element.width, element.height],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        controls,
        bindings: [
            {
                binding_type: "view",
                source_control_name: "subtitle_data",
                source_property_name: "#visible",
                target_property_name: "#visible",
            },
        ],
    };
}

function sliceExpression(slotSize: number, index: number): string {
    const end = slotSize * index;
    if (index === 1) {
        return `(('%.${end}s' * #text_data) - '\t')`;
    }
    const start = slotSize * (index - 1);
    return `((('%.${end}s' * #text_data) - ('%.${start}s' * #text_data)) - '\t')`;
}

function buildSubtitleSliceData(element: HudElement): Record<string, unknown> {
    const slotCount = clamp(element.sliceSlotCount ?? 5, 1, 12);
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const bindings: Record<string, unknown>[] = [
        {
            binding_name: "#hud_subtitle_text_string",
            binding_name_override: "#sub_raw",
            binding_type: "global",
        },
        {
            binding_type: "view",
            source_property_name: element.prefix
                ? prefixMatchExpression("#sub_raw", element.prefix)
                : "(not (#sub_raw = ''))",
            target_property_name: "#visible",
        },
        {
            binding_type: "view",
            source_property_name: removePrefixExpression("#sub_raw", element.prefix, element.stripPrefix),
            target_property_name: "#text_data",
        },
    ];

    for (let index = 1; index <= slotCount; index++) {
        bindings.push({
            binding_type: "view",
            source_property_name: sliceExpression(slotSize, index),
            target_property_name: `#text${index}`,
        });
    }

    return {
        type: "panel",
        ignored: element.ignored,
        size: [0, 0],
        bindings,
    };
}

function buildSubtitleSlotTemplate(element: HudElement): Record<string, unknown> {
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
                    binding_type: "view",
                    source_control_name: "subtitle_data",
                    source_property_name: "$slot_binding",
                    target_property_name: "#text",
                },
            ],
        },
    });

    const template: Record<string, unknown> = {
        type: "panel",
        ignored: element.ignored,
        size: [element.width, element.height],
        layer: element.layer,
        $slot_binding: "#text1",
        controls,
        bindings: [
            {
                binding_type: "view",
                source_control_name: "subtitle_data",
                source_property_name: "(not ($slot_binding = ''))",
                target_property_name: "#visible",
            },
        ],
    };

    return template;
}

function buildActionbarControl(element: HudElement): Record<string, unknown> {
    const control: Record<string, unknown> = {
        type: element.background === "none" ? "panel" : "image",
        ignored: element.ignored,
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

function buildAnimationDefinitions(
    elementKey: string,
    element: HudElement,
    destroyTarget?: string,
): { entryAnimation?: string; definitions: Record<string, unknown> } {
    if (element.animationPreset === "none") {
        return { definitions: {} };
    }

    const safeIn = Math.max(0.05, element.animInDuration || 0.2);
    const safeHold = Math.max(0, element.animHoldDuration || 0);
    const safeOut = Math.max(0.05, element.animOutDuration || 0.2);
    const definitions: Record<string, unknown> = {};

    if (element.animationPreset === "fade_out") {
        const outName = `${elementKey}_anim_fade_out`;
        definitions[outName] = {
            anim_type: "alpha",
            easing: "in_expo",
            duration: safeOut,
            from: 1,
            to: 0,
            ...(destroyTarget ? { destroy_at_end: destroyTarget } : {}),
        };
        return {
            entryAnimation: outName,
            definitions,
        };
    }

    const inName = `${elementKey}_anim_fade_in`;
    const waitName = `${elementKey}_anim_wait`;
    const outName = `${elementKey}_anim_fade_out`;

    definitions[inName] = {
        anim_type: "alpha",
        easing: "out_expo",
        duration: safeIn,
        from: 0,
        to: 1,
        next: `@hud.${waitName}`,
    };
    definitions[waitName] = {
        anim_type: "wait",
        duration: safeHold,
        next: `@hud.${outName}`,
    };
    definitions[outName] = {
        anim_type: "alpha",
        easing: "in_expo",
        duration: safeOut,
        from: 1,
        to: 0,
        ...(destroyTarget ? { destroy_at_end: destroyTarget } : {}),
    };

    return {
        entryAnimation: inName,
        definitions,
    };
}

function buildHudJson(): string {
    const json: Record<string, unknown> = {
        namespace: "hud",
    };

    const rootInsert: Record<string, unknown>[] = [];

    const title = state.elements.title;
    if (title.enabled) {
        json.title_control = buildTitleControl(title);
        const titleAnimation = buildAnimationDefinitions("title_control", title);
        if (titleAnimation.entryAnimation) {
            (json.title_control as Record<string, unknown>).alpha = `@hud.${titleAnimation.entryAnimation}`;
        }
        Object.assign(json, titleAnimation.definitions);
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
        if (subtitle.subtitleMode === "slice") {
            const slotCount = clamp(subtitle.sliceSlotCount ?? 5, 1, 12);
            const columns = clamp(subtitle.sliceColumns ?? 2, 1, 4);
            const gapX = subtitle.sliceGapX ?? 8;
            const gapY = subtitle.sliceGapY ?? 8;

            json.subtitle_data = buildSubtitleSliceData(subtitle);
            json.subtitle_slot_template = buildSubtitleSlotTemplate(subtitle);
            const subtitleAnimation = buildAnimationDefinitions("subtitle_slot_template", subtitle);
            if (subtitleAnimation.entryAnimation) {
                (json.subtitle_slot_template as Record<string, unknown>).alpha = `@hud.${subtitleAnimation.entryAnimation}`;
            }
            Object.assign(json, subtitleAnimation.definitions);
            rootInsert.push({ "subtitle_data@hud.subtitle_data": {} });

            for (let index = 1; index <= slotCount; index++) {
                const column = (index - 1) % columns;
                const row = Math.floor((index - 1) / columns);
                rootInsert.push({
                    [`sub_slot${index}@hud.subtitle_slot_template`]: {
                        $slot_binding: `#text${index}`,
                        anchor_from: subtitle.anchor,
                        anchor_to: subtitle.anchor,
                        offset: [
                            subtitle.x + column * (subtitle.width + gapX),
                            subtitle.y + row * (subtitle.height + gapY),
                        ],
                    },
                });
            }
        } else {
            json.subtitle_control = buildSubtitleControl(subtitle);
            const subtitleAnimation = buildAnimationDefinitions("subtitle_control", subtitle);
            if (subtitleAnimation.entryAnimation) {
                (json.subtitle_control as Record<string, unknown>).alpha = `@hud.${subtitleAnimation.entryAnimation}`;
            }
            Object.assign(json, subtitleAnimation.definitions);
            rootInsert.push({ "subtitle_control@hud.subtitle_control": {} });
        }

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
        const actionbarAnimation = buildAnimationDefinitions("my_custom_actionbar", actionbar, "hud_actionbar_text");
        if (actionbarAnimation.entryAnimation) {
            (json.my_custom_actionbar as Record<string, unknown>).alpha = `@hud.${actionbarAnimation.entryAnimation}`;
        }
        Object.assign(json, actionbarAnimation.definitions);
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

function previewSliceSlotTexts(element: HudElement): string[] {
    const slotCount = clamp(element.sliceSlotCount ?? 5, 1, 12);
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const source = previewElementText(element).replace(/\t/g, "");
    const slots: string[] = [];

    for (let index = 0; index < slotCount; index++) {
        const start = index * slotSize;
        const end = start + slotSize;
        slots.push(source.slice(start, end));
    }

    return slots;
}

function previewProgressSource(element: HudElement): string {
    if (!element.prefix) return element.sampleText;
    if (element.sampleText.startsWith(element.prefix)) {
        return element.sampleText.slice(element.prefix.length);
    }
    return element.sampleText;
}

function previewNumericValue(element: HudElement): number {
    const raw = previewProgressSource(element).trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : 0;
}

function buildSubtitleSliceScriptHelper(element: HudElement): string {
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const slotCount = clamp(element.sliceSlotCount ?? 5, 1, 12);
    const args = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");
    const slotArray = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");

    return `function pad(text, size = ${slotSize}) {
  const safe = String(text ?? "");
  return safe + "\\t".repeat(Math.max(0, size - safe.length));
}

function sendSubtitleSlots(player, ${args}) {
  const data = [${slotArray}].map((slot) => pad(slot, ${slotSize})).join("");
  player.runCommand('titleraw @s title {"rawtext":[{"text":""}]}');
  player.runCommand(\`titleraw @s subtitle {"rawtext":[{"text":"\${data}"}]}\`);
}`;
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
        <div class="hudEditorGuideLabel" style="left:${titleGuide.left}px;top:${titleGuide.top}px;width:440px;height:56px;">\uBC14\uB2D0\uB77C \uD0C0\uC774\uD2C0</div>
        <div class="hudEditorGuideLabel" style="left:${subtitleGuide.left}px;top:${subtitleGuide.top}px;width:380px;height:42px;">\uBC14\uB2D0\uB77C \uC11C\uBE0C\uD0C0\uC774\uD2C0</div>
        <div class="hudEditorGuideLabel" style="left:${actionbarGuide.left}px;top:${actionbarGuide.top}px;width:340px;height:38px;">\uBC14\uB2D0\uB77C \uC561\uC158\uBC14</div>
        ${Object.values(state.elements).filter((element) => element.enabled).map((element) => {
            const selectedClass = element.id === state.selectedId ? " hudEditorPreviewItemSelected" : "";
            const withBg = element.background === "none" ? "" : " hudEditorPreviewItemWithBg";
            const ignoredStyle = element.ignored ? "opacity:0.35;" : "";
            const bgStyle = `${element.background === "solid" ? `background:${element.backgroundColor};opacity:${element.backgroundAlpha};` : ""}${ignoredStyle}`;

            if (element.id === "subtitle" && element.subtitleMode === "slice") {
                const slotCount = clamp(element.sliceSlotCount ?? 5, 1, 12);
                const columns = clamp(element.sliceColumns ?? 2, 1, 4);
                const gapX = element.sliceGapX ?? 8;
                const gapY = element.sliceGapY ?? 8;
                const slotTexts = previewSliceSlotTexts(element);

                return Array.from({ length: slotCount }, (_, rawIndex) => {
                    const column = rawIndex % columns;
                    const row = Math.floor(rawIndex / columns);
                    const rect = computePreviewRect({
                        ...element,
                        x: element.x + column * (element.width + gapX),
                        y: element.y + row * (element.height + gapY),
                    });
                    return `
                        <div class="hudEditorPreviewItem${selectedClass}${withBg}" data-element-id="${element.id}" style="left:${rect.left}px;top:${rect.top}px;width:${element.width}px;height:${element.height}px;z-index:${element.layer};${ignoredStyle}">
                            <div class="hudEditorPreviewItemBg ${element.background === "vanilla" ? "hudEditorPreviewItemBgVanilla" : ""}" style="${bgStyle}"></div>
                            <div class="hudEditorPreviewText hudEditorFont-${element.fontSize}" style="color:${element.textColor};${element.shadow ? "text-shadow:0 2px 3px rgba(0,0,0,0.85);" : ""}">${escapeHtml(slotTexts[rawIndex] || `슬롯 ${rawIndex + 1}`)}</div>
                        </div>
                    `;
                }).join("");
            }

            const rect = computePreviewRect(element);
            const fillRatio = clamp(previewNumericValue(element) / Math.max(1, element.maxValue || 1), 0, 1);
            const fillWidth = element.clipDirection === "up" || element.clipDirection === "down"
                ? "100%"
                : `${fillRatio * 100}%`;
            const fillHeight = element.clipDirection === "up" || element.clipDirection === "down"
                ? `${fillRatio * 100}%`
                : "100%";
            const fillLeft = element.clipDirection === "right" ? `${(1 - fillRatio) * 100}%` : "0";
            const fillTop = element.clipDirection === "up" ? `${(1 - fillRatio) * 100}%` : "0";
            return `
                <div class="hudEditorPreviewItem${selectedClass}${withBg}" data-element-id="${element.id}" style="left:${rect.left}px;top:${rect.top}px;width:${element.width}px;height:${element.height}px;z-index:${element.layer};${ignoredStyle}">
                    <div class="hudEditorPreviewItemBg ${element.background === "vanilla" ? "hudEditorPreviewItemBgVanilla" : ""}" style="${bgStyle}"></div>
                    ${element.animationPreset !== "none" ? `<div style="position:absolute;left:8px;top:6px;padding:2px 6px;border-radius:999px;background:rgba(8,12,20,0.72);border:1px solid rgba(255,255,255,0.12);color:#d7e4f6;font-size:10px;line-height:1;z-index:2;">${element.animationPreset}</div>` : ""}
                    ${element.displayMode === "progress" && element.id !== "actionbar" ? `<div style="position:absolute;left:${fillLeft};top:${fillTop};width:${fillWidth};height:${fillHeight};background:${element.fillColor};opacity:0.9;"></div>` : ""}
                    <div class="hudEditorPreviewText hudEditorFont-${element.fontSize}" style="color:${element.textColor};${element.shadow ? "text-shadow:0 2px 3px rgba(0,0,0,0.85);" : ""}">${escapeHtml(element.displayMode === "progress" && element.id !== "actionbar" ? `${previewNumericValue(element)} / ${element.maxValue}` : previewElementText(element))}</div>
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
                <label>\uC0AC\uC6A9</label><input data-field="enabled" type="checkbox" ${element.enabled ? "checked" : ""}>
                <label>ignored</label><input data-field="ignored" type="checkbox" ${element.ignored ? "checked" : ""}>
                <label>\uC608\uC2DC \uD14D\uC2A4\uD2B8</label><input data-field="sampleText" type="text" value="${escapeHtml(element.sampleText)}">
                <label>\uC811\uB450\uC5B4</label><input data-field="prefix" type="text" value="${escapeHtml(element.prefix)}">
                <label>\uC811\uB450\uC5B4 \uC81C\uAC70</label><input data-field="stripPrefix" type="checkbox" ${element.stripPrefix ? "checked" : ""}>
                <label>\uBC14\uB2D0\uB77C \uC228\uAE40</label><input data-field="hideVanilla" type="checkbox" ${element.hideVanilla ? "checked" : ""}>
                <label>\uAC12 \uBCF4\uC874</label><input data-field="preserve" type="checkbox" ${element.preserve ? "checked" : ""} ${element.id !== "title" ? "disabled" : ""}>
                <label>\uC575\uCEE4</label>
                <select data-field="anchor">
                    ${["top_left", "top_middle", "top_right", "left_middle", "center", "right_middle", "bottom_left", "bottom_middle", "bottom_right"].map((anchor) => `<option value="${anchor}" ${element.anchor === anchor ? "selected" : ""}>${anchor}</option>`).join("")}
                </select>
                <label>X</label><input data-field="x" type="number" value="${element.x}">
                <label>Y</label><input data-field="y" type="number" value="${element.y}">
                <label>\uB108\uBE44</label><input data-field="width" type="number" min="40" value="${element.width}">
                <label>\uB192\uC774</label><input data-field="height" type="number" min="20" value="${element.height}">
                <label>\uB808\uC774\uC5B4</label><input data-field="layer" type="number" value="${element.layer}">
                <label>\uAE00\uC790 \uD06C\uAE30</label>
                <select data-field="fontSize">
                    ${["small", "normal", "large", "extra_large"].map((font) => `<option value="${font}" ${element.fontSize === font ? "selected" : ""}>${font}</option>`).join("")}
                </select>
                <label>\uD14D\uC2A4\uD2B8 \uC0C9\uC0C1</label><input data-field="textColor" type="color" value="${element.textColor}">
                <label>\uADF8\uB9BC\uC790</label><input data-field="shadow" type="checkbox" ${element.shadow ? "checked" : ""}>
                <label>\uBC30\uACBD</label>
                <select data-field="background">
                    <option value="vanilla" ${element.background === "vanilla" ? "selected" : ""}>\uBC14\uB2D0\uB77C</option>
                    <option value="solid" ${element.background === "solid" ? "selected" : ""}>\uB2E8\uC0C9</option>
                    <option value="none" ${element.background === "none" ? "selected" : ""}>\uC5C6\uC74C</option>
                </select>
                <label>\uBC30\uACBD \uD22C\uBA85\uB3C4</label><input data-field="backgroundAlpha" type="number" min="0" max="1" step="0.05" value="${element.backgroundAlpha}">
                <label>\uBC30\uACBD \uC0C9\uC0C1</label><input data-field="backgroundColor" type="color" value="${element.backgroundColor}" ${element.background === "solid" ? "" : "disabled"}>
                ${element.id !== "actionbar" ? `
                    <label>\uD45C\uC2DC \uD615\uC2DD</label>
                    <select data-field="displayMode" ${element.id === "subtitle" && element.subtitleMode === "slice" ? "disabled" : ""}>
                        <option value="text" ${element.displayMode !== "progress" ? "selected" : ""}>\uD14D\uC2A4\uD2B8</option>
                        <option value="progress" ${element.displayMode === "progress" ? "selected" : ""}>\uD504\uB85C\uADF8\uB808\uC2A4 \uBC14</option>
                    </select>
                    <label>\uCD5C\uB300\uAC12</label><input data-field="maxValue" type="number" min="1" value="${element.maxValue}" ${element.displayMode === "progress" && !(element.id === "subtitle" && element.subtitleMode === "slice") ? "" : "disabled"}>
                    <label>\uCC44\uC6C0 \uC0C9\uC0C1</label><input data-field="fillColor" type="color" value="${element.fillColor}" ${element.displayMode === "progress" && !(element.id === "subtitle" && element.subtitleMode === "slice") ? "" : "disabled"}>
                    <label>\uCC44\uC6C0 \uBC29\uD5A5</label>
                    <select data-field="clipDirection" ${element.displayMode === "progress" && !(element.id === "subtitle" && element.subtitleMode === "slice") ? "" : "disabled"}>
                        ${["left", "right", "up", "down"].map((direction) => `<option value="${direction}" ${element.clipDirection === direction ? "selected" : ""}>${direction}</option>`).join("")}
                    </select>
                ` : ""}
                <label>\uC560\uB2C8\uBA54\uC774\uC158</label>
                <select data-field="animationPreset">
                    <option value="none" ${element.animationPreset === "none" ? "selected" : ""}>\uC5C6\uC74C</option>
                    <option value="fade_out" ${element.animationPreset === "fade_out" ? "selected" : ""}>fade out</option>
                    <option value="fade_hold_fade" ${element.animationPreset === "fade_hold_fade" ? "selected" : ""}>fade in + wait + fade out</option>
                </select>
                <label>\uB4E4\uC5B4\uC624\uB294 \uC2DC\uAC04</label><input data-field="animInDuration" type="number" min="0" step="0.05" value="${element.animInDuration}" ${element.animationPreset === "fade_hold_fade" ? "" : "disabled"}>
                <label>\uC720\uC9C0 \uC2DC\uAC04</label><input data-field="animHoldDuration" type="number" min="0" step="0.05" value="${element.animHoldDuration}" ${element.animationPreset === "fade_hold_fade" ? "" : "disabled"}>
                <label>\uC0AC\uB77C\uC9C0\uB294 \uC2DC\uAC04</label><input data-field="animOutDuration" type="number" min="0.05" step="0.05" value="${element.animOutDuration}" ${element.animationPreset !== "none" ? "" : "disabled"}>
                ${element.id === "subtitle" ? `
                    <label>\uD45C\uC2DC \uBAA8\uB4DC</label>
                    <select data-field="subtitleMode">
                        <option value="single" ${element.subtitleMode !== "slice" ? "selected" : ""}>\uB2E8\uC77C</option>
                        <option value="slice" ${element.subtitleMode === "slice" ? "selected" : ""}>\uC2AC\uB77C\uC774\uC2F1</option>
                    </select>
                    <label>\uC2AC\uB86F \uC218</label><input data-field="sliceSlotCount" type="number" min="1" max="12" value="${element.sliceSlotCount ?? 5}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                    <label>\uC2AC\uB86F \uD06C\uAE30</label><input data-field="sliceSlotSize" type="number" min="1" max="200" value="${element.sliceSlotSize ?? 20}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                    <label>\uC5F4 \uC218</label><input data-field="sliceColumns" type="number" min="1" max="4" value="${element.sliceColumns ?? 2}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                    <label>\uAC00\uB85C \uAC04\uACA9</label><input data-field="sliceGapX" type="number" value="${element.sliceGapX ?? 8}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                    <label>\uC138\uB85C \uAC04\uACA9</label><input data-field="sliceGapY" type="number" value="${element.sliceGapY ?? 8}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                ` : ""}
            </div>
        </div>
        <div class="hudEditorInspectorCard">
            <div class="hudEditorInspectorTitle">\uCC44\uB110 \uC548\uB0B4</div>
            <div class="hudEditorDescription">
                <div>Title: <code>#hud_title_text_string</code></div>
                <div>Subtitle: <code>#hud_subtitle_text_string</code></div>
                <div>Actionbar: <code>$actionbar_text</code></div>
                <div>\uC561\uC158\uBC14\uB294 \uBC14\uB2D0\uB77C \uADDC\uCE59\uC5D0 \uB9DE\uAC8C factory \uBC29\uC2DD\uC73C\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.</div>
                <div>preserve \uD328\uD134\uC740 \uD0C0\uC774\uD2C0\uC5D0\uB9CC \uC801\uC6A9\uB429\uB2C8\uB2E4.</div>
                <div>\uC11C\uBE0C\uD0C0\uC774\uD2C0 \uC2AC\uB77C\uC774\uC2F1 \uBAA8\uB4DC\uB97C \uCF1C\uBA74 <code>subtitle_data</code>\uC640 <code>sub_slotN</code> \uAD6C\uC870\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.</div>
                <div>\uC560\uB2C8\uBA54\uC774\uC158\uC740 <code>alpha</code> \uCCB4\uC774\uB2DD\uC73C\uB85C \uB0B4\uBCF4\uB0B4\uBA70, actionbar\uC5D0\uC11C\uB294 \uD31D\ud1a0\ub9ac \uD750\uB984\uC5D0 \uB9DE\uCD94\uAE30 \uC704\uD574 fade out \uD504\uB9AC\uC14B\uC774 \uC798 \uB9DE\uC2B5\uB2C8\uB2E4.</div>
                ${element.id === "subtitle" && element.subtitleMode === "slice" ? `<div><code>pad(text, size)</code> \uD615\uC2DD\uC73C\uB85C \uAC01 \uC2AC\uB86F\uC744 \\t \uD328\uB529\uD55C \uB4A4 subtitle\uB85C \uC774\uC5B4\uBD99\uC5EC \uBCF4\uB0B4\uC57C \uD569\uB2C8\uB2E4.</div>` : ""}
                <div><code>ignored: true</code>\uB97C \uCF1C\uBA74 \uB80C\uB354\uB9C1\uACFC \uBC14\uC778\uB529 \uD3C9\uAC00\uAC00 \uD568\uAED8 \uBE44\uD65C\uC131\uD654\uB429\uB2C8\uB2E4.</div>
                <div>\uD504\uB85C\uADF8\uB808\uC2A4 \uBC14\uB294 title/subtitle\uC5D0\uC11C clip_ratio \uAE30\uBC18\uC73C\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.</div>
            </div>
        </div>
    `;

    inspector.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-field], select[data-field]").forEach((input) => {
        const field = input.dataset.field as keyof HudElement;
        const onChange = () => {
            const target = state.elements[state.selectedId] as Record<string, unknown>;
            if (input instanceof HTMLInputElement && input.type === "checkbox") {
                target[field] = input.checked;
            } else if (field === "x" || field === "y" || field === "width" || field === "height" || field === "layer" || field === "sliceSlotCount" || field === "sliceSlotSize" || field === "sliceColumns" || field === "sliceGapX" || field === "sliceGapY" || field === "maxValue") {
                target[field] = Number.parseInt(input.value, 10) || 0;
            } else if (field === "animInDuration" || field === "animHoldDuration" || field === "animOutDuration") {
                target[field] = Math.max(0, Number.parseFloat(input.value) || 0);
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

function renderScriptHelper(): void {
    const container = getForm().querySelector(".hudEditorScriptCard") as HTMLDivElement | null;
    if (!container) return;

    const subtitle = state.elements.subtitle;
    if (!subtitle.enabled || subtitle.subtitleMode !== "slice") {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div class="hudEditorSidebarTitle">Subtitle Script Helper</div>
        <textarea class="hudEditorOutput hudEditorScriptOutput" spellcheck="false">${escapeHtml(buildSubtitleSliceScriptHelper(subtitle))}</textarea>
        <div class="hudEditorSidebarActions">
            <button type="button" class="propertyInputButton hudEditorCopyScript">Script \uBCF5\uC0AC</button>
        </div>
    `;

    const copyButton = container.querySelector(".hudEditorCopyScript") as HTMLButtonElement | null;
    copyButton?.addEventListener("click", async () => {
        await navigator.clipboard.writeText(buildSubtitleSliceScriptHelper(subtitle));
        new Notification("Subtitle Script helper\uB97C \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uD588\uC2B5\uB2C8\uB2E4.", 2200, "notif");
    });
}

function renderAll(): void {
    renderSidebar();
    renderCanvas();
    renderInspector();
    renderScriptHelper();
    updateOutput();
}

function renderModalShell(): void {
    getForm().innerHTML = `
        <div class="hudEditorLayout">
            <div class="hudEditorSidebar">
                <div class="hudEditorSidebarCard">
                    <div class="hudEditorSidebarTitle">HUD \uC694\uC18C</div>
                    <div class="hudEditorSidebarList"></div>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorReset">\uBC14\uB2D0\uB77C \uC704\uCE58\uB85C \uCD08\uAE30\uD654</button>
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
                    <div>\uAC00\uC774\uB4DC \uC0C1\uC790\uB294 \uBC14\uB2D0\uB77C \uAE30\uC900 \uC704\uCE58\uC785\uB2C8\uB2E4.</div>
                    <div>HUD \uBC15\uC2A4\uB97C \uC9C1\uC811 \uB4DC\uB798\uADF8\uD574\uC11C \uC704\uCE58\uB97C \uC62E\uAE30\uACE0, \uC624\uB978\uCABD\uC5D0\uC11C \uD06C\uAE30\uC640 \uC811\uB450\uC5B4 \uCC98\uB9AC\uAE4C\uC9C0 \uC870\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>
                </div>
                <div class="hudEditorJsonCard">
                    <div class="hudEditorSidebarTitle">\uC0DD\uC131\uB418\uB294 JSON</div>
                    <textarea class="hudEditorOutput" spellcheck="false"></textarea>
                    <div class="hudEditorSidebarActions">
                        <button type="button" class="propertyInputButton hudEditorCopyJson">JSON \uBCF5\uC0AC</button>
                        <button type="button" class="propertyInputButton hudEditorDownloadJson">hud_screen.json \uB2E4\uC6B4\uB85C\uB4DC</button>
                    </div>
                </div>
                <div class="hudEditorJsonCard hudEditorScriptCard"></div>
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
            ignored: false,
            sampleText: "info:\uACF5\uC9C0\uC785\uB2C8\uB2E4",
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
            displayMode: "text",
            maxValue: 100,
            fillColor: "#5be37a",
            clipDirection: "left",
            animationPreset: "fade_hold_fade",
            animInDuration: 0.25,
            animHoldDuration: 2,
            animOutDuration: 0.25,
        };
        state.elements.subtitle = {
            ...state.elements.subtitle,
            enabled: true,
            ignored: false,
            sampleText: "\uBD80\uC81C\uBAA9\uC785\uB2C8\uB2E4",
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
            displayMode: "text",
            maxValue: 100,
            fillColor: "#6fc3ff",
            clipDirection: "left",
            animationPreset: "fade_hold_fade",
            animInDuration: 0.2,
            animHoldDuration: 2,
            animOutDuration: 0.2,
            subtitleMode: "single",
            sliceSlotCount: 5,
            sliceSlotSize: 20,
            sliceColumns: 2,
            sliceGapX: 8,
            sliceGapY: 8,
        };
        state.elements.actionbar = {
            ...state.elements.actionbar,
            enabled: true,
            ignored: false,
            sampleText: "info:\uC624\uB978\uCABD \uD45C\uC2DC",
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
            displayMode: "text",
            maxValue: 100,
            fillColor: "#5be37a",
            clipDirection: "left",
            animationPreset: "fade_out",
            animInDuration: 0.15,
            animHoldDuration: 2.7,
            animOutDuration: 3,
        };
        renderAll();
        new Notification("HUD\uB97C \uBC14\uB2D0\uB77C \uAE30\uBCF8 \uC704\uCE58\uB85C \uCD08\uAE30\uD654\uD588\uC2B5\uB2C8\uB2E4.", 2200, "notif");
    });

    copyButton?.addEventListener("click", async () => {
        await navigator.clipboard.writeText(buildHudJson());
        new Notification("HUD JSON\uC744 \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uD588\uC2B5\uB2C8\uB2E4.", 2200, "notif");
    });

    downloadButton?.addEventListener("click", () => {
        const blob = new Blob([buildHudJson()], { type: "application/json" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "hud_screen.json";
        link.click();
        URL.revokeObjectURL(url);
        new Notification("hud_screen.json\uC744 \uB2E4\uC6B4\uB85C\uB4DC\uD588\uC2B5\uB2C8\uB2E4.", 2200, "notif");
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

function mountHudEditor(): void {
    renderModalShell();
    bindStaticActions();
    attachDragHandlers();
    renderAll();
}

export async function hudEditorModal(): Promise<void> {
    mountHudEditor();
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
