import { Notification } from "../notifs/noficationMaker.js";
const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = 1500 / 1.7777777;
const state = {
    selectedId: "title",
    autoFitPreview: true,
    previewZoom: 1,
    autoAnchorSnap: true,
    showAnchorGuides: true,
    elements: {
        title: {
            id: "title",
            label: "\uD0C0\uC774\uD2C0",
            enabled: true,
            ignored: false,
            sampleText: "Title",
            prefix: "",
            stripPrefix: false,
            hideVanilla: false,
            preserve: false,
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
            titleMode: "single",
            sliceSlotCount: 1,
            sliceSlotSize: 20,
            sliceColumns: 2,
            sliceGapX: 8,
            sliceGapY: 8,
        },
        subtitle: {
            id: "subtitle",
            label: "\uC11C\uBE0C\uD0C0\uC774\uD2C0",
            enabled: true,
            ignored: false,
            sampleText: "Subtitle",
            prefix: "",
            stripPrefix: false,
            hideVanilla: false,
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
            sliceSlotCount: 1,
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
            sampleText: "Actionbar",
            prefix: "",
            stripPrefix: false,
            hideVanilla: false,
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
function getModal() {
    return document.getElementById("hudEditorScreen");
}
function getCloseButton() {
    return document.getElementById("hudEditorScreenClose");
}
function getForm() {
    return document.getElementsByClassName("modalHudEditorForm")[0];
}
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function quoteString(value) {
    return JSON.stringify(value);
}
function hexToRgb(color) {
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
function getSelectedElement() {
    return state.elements[state.selectedId];
}
function getCanvasBackgroundHtml() {
    const mainWindow = document.getElementById("main_window");
    const bgImage = mainWindow?.querySelector(".bg_image");
    if (bgImage?.src) {
        return `<img class="hudEditorCanvasBackgroundImage" src="${bgImage.src}" alt="HUD Background">`;
    }
    return `<img class="hudEditorCanvasBackgroundImage" src="background.png" alt="HUD Background">`;
}
function getPreviewScale() {
    if (!state.autoFitPreview) {
        return clamp(state.previewZoom, 0.5, 1.5);
    }
    const wrap = getForm().querySelector(".hudEditorCanvasWrap");
    const wrapWidth = wrap?.clientWidth ?? PREVIEW_WIDTH;
    const fitScale = wrapWidth / PREVIEW_WIDTH;
    return clamp(fitScale, 0.65, 1);
}
function prefixMatchExpression(source, prefix) {
    if (!prefix)
        return "true";
    return `(not ((${source} - ${quoteString(prefix)}) = ${source}))`;
}
function getDefaultSliceSlotLayout(element, rawIndex) {
    const columns = clamp(element.sliceColumns ?? 2, 1, 4);
    const gapX = element.sliceGapX ?? 8;
    const gapY = element.sliceGapY ?? 8;
    const column = rawIndex % columns;
    const row = Math.floor(rawIndex / columns);
    return {
        anchor: element.anchor,
        x: element.x + column * (element.width + gapX),
        y: element.y + row * (element.height + gapY),
    };
}
function ensureSliceSlots(element) {
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, 30);
    const slots = [...(element.sliceSlots ?? [])];
    for (let rawIndex = slots.length; rawIndex < slotCount; rawIndex++) {
        slots.push(getDefaultSliceSlotLayout(element, rawIndex));
    }
    slots.length = slotCount;
    element.sliceSlots = slots;
    return slots;
}
function getSliceSlotLayout(element, rawIndex) {
    return ensureSliceSlots(element)[rawIndex] ?? getDefaultSliceSlotLayout(element, rawIndex);
}
function isSliceMode(element) {
    return (element.id === "title" && element.titleMode === "slice")
        || (element.id === "subtitle" && element.subtitleMode === "slice");
}
function removePrefixExpression(source, prefix, stripPrefix) {
    if (!prefix || !stripPrefix)
        return source;
    return `(${source} - ${quoteString(prefix)})`;
}
function backgroundDefinition(element) {
    if (element.background === "none")
        return null;
    const base = {
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
function getAutoSizedTextContainer(element, verticalPadding) {
    if (element.background === "none" || element.displayMode === "progress") {
        return [element.width, element.height];
    }
    return ["100%c + 10px", `100%cm + ${verticalPadding}px`];
}
function getTextLabelSize(element) {
    if (element.background === "none" || element.displayMode === "progress") {
        return ["100%", "default"];
    }
    return ["default", "default"];
}
function withIgnored(target, ignored) {
    if (ignored) {
        target.ignored = true;
    }
    return target;
}
function progressValueExpression(source, element) {
    const numericSource = element.prefix
        ? `(${source} - ${quoteString(element.prefix)})`
        : source;
    return `(${numericSource} + 0)`;
}
function progressClipExpression(source, element) {
    const maxValue = Math.max(1, element.maxValue || 1);
    return `((${maxValue} - ${progressValueExpression(source, element)}) / ${maxValue})`;
}
function buildProgressFill(sourceControlName, sourcePropertyName, element) {
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
function buildTitleControl(element) {
    const controls = [];
    const background = backgroundDefinition(element);
    if (background) {
        controls.push({
            title_background: background,
        });
    }
    if (element.displayMode === "progress") {
        controls.push({
            title_fill: {
                type: "image",
                texture: "textures/ui/white_background",
                color: hexToRgb(element.fillColor),
                size: ["100%", "100%"],
                clip_direction: element.clipDirection,
                clip_pixelperfect: false,
                layer: 32,
                bindings: [
                    {
                        binding_name: "#hud_title_text_string",
                        binding_type: "global",
                    },
                    {
                        binding_type: "view",
                        source_property_name: progressClipExpression("#hud_title_text_string", element),
                        target_property_name: "#clip_ratio",
                    },
                ],
            },
        });
    }
    else {
        const label = {
            type: "label",
            text: "#text",
            size: getTextLabelSize(element),
            anchor_from: "center",
            anchor_to: "center",
            color: hexToRgb(element.textColor),
            shadow: element.shadow,
            layer: 2,
            bindings: [
                {
                    binding_name: "#hud_title_text_string",
                },
                {
                    binding_type: "view",
                    source_property_name: removePrefixExpression("#hud_title_text_string", element.prefix, element.stripPrefix),
                    target_property_name: "#text",
                },
                {
                    binding_type: "view",
                    source_property_name: element.prefix
                        ? prefixMatchExpression("#hud_title_text_string", element.prefix)
                        : "(not (#hud_title_text_string = ''))",
                    target_property_name: "#visible",
                },
            ],
        };
        if (element.fontSize !== "extra_large") {
            label.font_size = element.fontSize;
        }
        if (element.textColor !== "#ffffff") {
            label.color = hexToRgb(element.textColor);
        }
        controls.push({
            title_label: label,
        });
    }
    return withIgnored({
        type: "panel",
        size: ["100%", "100%"],
        controls: [
            {
                title_positioned: {
                    type: "panel",
                    size: getAutoSizedTextContainer(element, 8),
                    anchor_from: element.anchor,
                    anchor_to: element.anchor,
                    offset: [element.x, element.y],
                    layer: element.layer,
                    controls,
                },
            },
        ],
        bindings: [
            {
                binding_name: "#hud_title_text_string",
            },
            {
                binding_type: "view",
                source_property_name: element.prefix
                    ? prefixMatchExpression("#hud_title_text_string", element.prefix)
                    : "(not (#hud_title_text_string = ''))",
                target_property_name: "#visible",
            },
        ],
    }, element.ignored);
}
function buildSubtitleControl(element) {
    const controls = [];
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
    }
    else {
        controls.push({
            subtitle_label: {
                type: "label",
                text: "#text",
                localize: false,
                size: getTextLabelSize(element),
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
    return withIgnored({
        type: "panel",
        size: ["100%", "100%"],
        controls: [
            controls[0],
            {
                subtitle_positioned: {
                    type: "panel",
                    size: getAutoSizedTextContainer(element, 8),
                    anchor_from: element.anchor,
                    anchor_to: element.anchor,
                    offset: [element.x, element.y],
                    layer: element.layer,
                    controls: controls.slice(1),
                },
            },
        ],
        bindings: [
            {
                binding_type: "view",
                source_control_name: "subtitle_data",
                source_property_name: "#visible",
                target_property_name: "#visible",
            },
        ],
    }, element.ignored);
}
function sliceExpression(slotSize, index) {
    const end = slotSize * index;
    if (index === 1) {
        return `(('%.${end}s' * #text_data) - '\t')`;
    }
    const start = slotSize * (index - 1);
    return `((('%.${end}s' * #text_data) - ('%.${start}s' * #text_data)) - '\t')`;
}
function buildSliceData(element, bindingName, rawTarget) {
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, 30);
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const bindings = [
        {
            binding_name: bindingName,
            binding_name_override: rawTarget,
            binding_type: "global",
        },
        {
            binding_type: "view",
            source_property_name: element.prefix
                ? prefixMatchExpression(rawTarget, element.prefix)
                : `(not (${rawTarget} = ''))`,
            target_property_name: "#visible",
        },
        {
            binding_type: "view",
            source_property_name: removePrefixExpression(rawTarget, element.prefix, element.stripPrefix),
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
    return withIgnored({
        type: "panel",
        size: [0, 0],
        bindings,
    }, element.ignored);
}
function buildSubtitleSliceData(element) {
    return buildSliceData(element, "#hud_subtitle_text_string", "#sub_raw");
}
function buildTitleSliceData(element) {
    return buildSliceData(element, "#hud_title_text_string", "#title_raw");
}
function buildSliceSlotTemplate(element, sourceControlName, labelPrefix) {
    const controls = [];
    const background = backgroundDefinition(element);
    if (background) {
        controls.push({
            [`${labelPrefix}_background`]: background,
        });
    }
    const label = {
        type: "label",
        text: "#text",
        size: getTextLabelSize(element),
        anchor_from: "center",
        anchor_to: "center",
        color: hexToRgb(element.textColor),
        shadow: element.shadow,
        layer: 2,
        bindings: [
            {
                binding_type: "view",
                source_control_name: sourceControlName,
                source_property_name: "$slot_binding",
                target_property_name: "#text",
            },
        ],
    };
    if (element.fontSize !== "large") {
        label.font_size = element.fontSize;
    }
    if (element.textColor !== "#dfe9ff") {
        label.color = hexToRgb(element.textColor);
    }
    controls.push({
        label,
    });
    const template = withIgnored({
        type: element.background === "none" ? "panel" : "image",
        size: getAutoSizedTextContainer(element, 8),
        layer: element.layer,
        $slot_binding: "#text1",
        controls,
        bindings: [
            {
                binding_type: "view",
                source_control_name: sourceControlName,
                source_property_name: "(not ($slot_binding = ''))",
                target_property_name: "#visible",
            },
        ],
    }, element.ignored);
    if (element.background !== "none") {
        template.texture = element.background === "vanilla" ? "textures/ui/hud_tip_text_background" : "textures/ui/white_background";
        template.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            template.color = hexToRgb(element.backgroundColor);
        }
    }
    return template;
}
function buildSubtitleSlotTemplate(element) {
    return buildSliceSlotTemplate(element, "subtitle_data", "subtitle");
}
function buildTitleSlotTemplate(element) {
    return buildSliceSlotTemplate(element, "title_data", "title");
}
function buildActionbarControl(element) {
    const label = {
        type: "label",
        text: "$display_text",
        size: getTextLabelSize(element),
        anchor_from: "right_middle",
        anchor_to: "right_middle",
        offset: [-5, 0],
        shadow: element.shadow,
        layer: 2,
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
    };
    if (element.textColor !== "#ffffff") {
        label.color = hexToRgb(element.textColor);
    }
    if (element.fontSize !== "normal") {
        label.font_size = element.fontSize;
    }
    if (element.background === "none") {
        label.size = ["100%", "default"];
    }
    const content = {
        type: element.background === "none" ? "panel" : "image",
        size: element.background === "none" ? [element.width, element.height] : ["100%c + 10px", "100%cm + 4px"],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        controls: [
            {
                actionbar_label: label,
            },
        ],
    };
    if (element.layer !== 32) {
        content.layer = element.layer;
    }
    if (element.background !== "none") {
        content.texture = element.background === "vanilla" ? "textures/ui/hud_tip_text_background" : "textures/ui/white_background";
        content.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            content.color = hexToRgb(element.backgroundColor);
        }
    }
    return withIgnored({
        type: "panel",
        size: ["100%", "100%"],
        $atext: "$actionbar_text",
        visible: element.prefix ? prefixMatchExpression("$atext", element.prefix) : "(not ($atext = ''))",
        controls: [
            {
                actionbar_positioned: content,
            },
        ],
    }, element.ignored);
}
function buildPreservedActionbarDisplay(element) {
    const controls = [
        {
            data_control: {
                type: "panel",
                size: [0, 0],
                property_bag: {
                    "#preserved_text": "",
                },
                bindings: [
                    {
                        binding_name: "#hud_actionbar_text_string",
                        binding_type: "global",
                    },
                    {
                        binding_name: "#hud_actionbar_text_string",
                        binding_name_override: "#preserved_text",
                        binding_condition: "visibility_changed",
                        binding_type: "global",
                    },
                    {
                        binding_type: "view",
                        source_property_name: element.prefix
                            ? `(not (#hud_actionbar_text_string = #preserved_text) and ${prefixMatchExpression("#hud_actionbar_text_string", element.prefix)})`
                            : "(not (#hud_actionbar_text_string = #preserved_text) and (not (#hud_actionbar_text_string = '')))",
                        target_property_name: "#visible",
                    },
                ],
            },
        },
    ];
    const label = {
        type: "label",
        text: "#text",
        size: getTextLabelSize(element),
        anchor_from: "right_middle",
        anchor_to: "right_middle",
        offset: [-5, 0],
        shadow: element.shadow,
        layer: 2,
        bindings: [
            {
                binding_type: "view",
                source_control_name: "data_control",
                source_property_name: removePrefixExpression("#preserved_text", element.prefix, element.stripPrefix),
                target_property_name: "#text",
            },
        ],
    };
    if (element.textColor !== "#ffffff") {
        label.color = hexToRgb(element.textColor);
    }
    if (element.fontSize !== "normal") {
        label.font_size = element.fontSize;
    }
    if (element.background === "none") {
        label.size = ["100%", "default"];
    }
    controls.push({
        actionbar_label: label,
    });
    const displayContent = {
        type: element.background === "none" ? "panel" : "image",
        size: element.background === "none" ? [element.width, element.height] : ["100%c + 10px", "100%cm + 4px"],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        controls: controls.slice(1),
    };
    if (element.background !== "none") {
        displayContent.texture = element.background === "vanilla" ? "textures/ui/hud_tip_text_background" : "textures/ui/white_background";
        displayContent.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            displayContent.color = hexToRgb(element.backgroundColor);
        }
    }
    return withIgnored({
        type: "panel",
        size: ["100%", "100%"],
        controls: [
            controls[0],
            {
                preserved_actionbar_positioned: displayContent,
            },
        ],
        bindings: [
            {
                binding_type: "view",
                source_control_name: "data_control",
                source_property_name: "(not (#preserved_text = ''))",
                target_property_name: "#visible",
            },
        ],
    }, element.ignored);
}
function buildAnimationDefinitions(elementKey, element, destroyTarget) {
    if (element.animationPreset === "none") {
        return { definitions: {} };
    }
    const safeIn = Math.max(0.05, element.animInDuration || 0.2);
    const safeHold = Math.max(0, element.animHoldDuration || 0);
    const safeOut = Math.max(0.05, element.animOutDuration || 0.2);
    const definitions = {};
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
function buildHudJson() {
    const json = {
        namespace: "hud",
    };
    const wrapperControls = [];
    const title = state.elements.title;
    if (title.enabled) {
        if (title.titleMode === "slice") {
            const slotCount = clamp(title.sliceSlotCount ?? 1, 1, 30);
            json.title_data = buildTitleSliceData(title);
            json.title_slot_template = buildTitleSlotTemplate(title);
            const titleAnimation = buildAnimationDefinitions("title_slot_template", title);
            if (titleAnimation.entryAnimation) {
                json.title_slot_template.alpha = `@hud.${titleAnimation.entryAnimation}`;
            }
            Object.assign(json, titleAnimation.definitions);
            wrapperControls.push({ "title_data@hud.title_data": {} });
            for (let index = 1; index <= slotCount; index++) {
                const slotLayout = getSliceSlotLayout(title, index - 1);
                wrapperControls.push({
                    [`title_slot${index}@hud.title_slot_template`]: {
                        $slot_binding: `#text${index}`,
                        anchor_from: slotLayout.anchor,
                        anchor_to: slotLayout.anchor,
                        offset: [
                            slotLayout.x,
                            slotLayout.y,
                        ],
                    },
                });
            }
        }
        else {
            json.title_control = buildTitleControl(title);
            const titleAnimation = buildAnimationDefinitions("title_control", title);
            if (titleAnimation.entryAnimation) {
                json.title_control.alpha = `@hud.${titleAnimation.entryAnimation}`;
            }
            Object.assign(json, titleAnimation.definitions);
            wrapperControls.push({ "title_ctrl@hud.title_control": {} });
        }
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
            const slotCount = clamp(subtitle.sliceSlotCount ?? 1, 1, 30);
            json.subtitle_data = buildSubtitleSliceData(subtitle);
            json.subtitle_slot_template = buildSubtitleSlotTemplate(subtitle);
            const subtitleAnimation = buildAnimationDefinitions("subtitle_slot_template", subtitle);
            if (subtitleAnimation.entryAnimation) {
                json.subtitle_slot_template.alpha = `@hud.${subtitleAnimation.entryAnimation}`;
            }
            Object.assign(json, subtitleAnimation.definitions);
            wrapperControls.push({ "subtitle_data@hud.subtitle_data": {} });
            for (let index = 1; index <= slotCount; index++) {
                const slotLayout = getSliceSlotLayout(subtitle, index - 1);
                wrapperControls.push({
                    [`sub_slot${index}@hud.subtitle_slot_template`]: {
                        $slot_binding: `#text${index}`,
                        anchor_from: slotLayout.anchor,
                        anchor_to: slotLayout.anchor,
                        offset: [
                            slotLayout.x,
                            slotLayout.y,
                        ],
                    },
                });
            }
        }
        else {
            json.subtitle_control = buildSubtitleControl(subtitle);
            const subtitleAnimation = buildAnimationDefinitions("subtitle_control", subtitle);
            if (subtitleAnimation.entryAnimation) {
                json.subtitle_control.alpha = `@hud.${subtitleAnimation.entryAnimation}`;
            }
            Object.assign(json, subtitleAnimation.definitions);
            wrapperControls.push({ "subtitle_control@hud.subtitle_control": {} });
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
            json.my_custom_actionbar.alpha = `@hud.${actionbarAnimation.entryAnimation}`;
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
        if (actionbar.preserve) {
            json.preserved_actionbar_display = buildPreservedActionbarDisplay(actionbar);
            wrapperControls.unshift({ "preserved_actionbar@hud.preserved_actionbar_display": {} });
        }
        if (actionbar.hideVanilla) {
            json["hud_actionbar_text"] = {
                $atext: "$actionbar_text",
                visible: actionbar.prefix ? `(($atext - ${quoteString(actionbar.prefix)}) = $atext)` : "false",
            };
        }
    }
    if (wrapperControls.length > 0) {
        json.hud_editor_root = {
            type: "panel",
            size: ["100%", "100%"],
            controls: wrapperControls,
        };
        json.root_panel = {
            modifications: [
                {
                    array_name: "controls",
                    operation: "insert_back",
                    value: [
                        {
                            "hud_editor_root@hud.hud_editor_root": {},
                        },
                    ],
                },
            ],
        };
    }
    return JSON.stringify(json, null, 2);
}
function updateOutput() {
    const output = getForm().querySelector(".hudEditorOutput");
    if (output)
        output.value = buildHudJson();
}
function getAnchorReference(anchor) {
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
function getAnchorOffset(anchor, width, height) {
    const horizontal = anchor.endsWith("left") ? 0 : anchor.endsWith("right") ? width : width / 2;
    const vertical = anchor.startsWith("top") ? 0 : anchor.startsWith("bottom") ? height : height / 2;
    return { x: horizontal, y: vertical };
}
function getAnchorForPoint(x, y) {
    const col = x < PREVIEW_WIDTH / 3 ? "left" : x < (PREVIEW_WIDTH * 2) / 3 ? "middle" : "right";
    const row = y < PREVIEW_HEIGHT / 3 ? "top" : y < (PREVIEW_HEIGHT * 2) / 3 ? "middle" : "bottom";
    return `${row}_${col}`.replace("middle_left", "left_middle").replace("middle_middle", "center").replace("middle_right", "right_middle");
}
function getOffsetFromTopLeft(anchor, left, top, width, height) {
    const base = getAnchorReference(anchor);
    const anchorOffset = getAnchorOffset(anchor, width, height);
    return {
        x: Math.round(left + anchorOffset.x - base.x),
        y: Math.round(top + anchorOffset.y - base.y),
    };
}
function snapElementAnchor(element) {
    const rect = computePreviewRect(element);
    const centerX = rect.left + element.width / 2;
    const centerY = rect.top + element.height / 2;
    const nextAnchor = getAnchorForPoint(centerX, centerY);
    const nextOffset = getOffsetFromTopLeft(nextAnchor, rect.left, rect.top, element.width, element.height);
    element.anchor = nextAnchor;
    element.x = nextOffset.x;
    element.y = nextOffset.y;
}
function snapSliceSlotAnchor(element, slotIndex) {
    const slots = ensureSliceSlots(element);
    const slot = slots[slotIndex];
    if (!slot)
        return;
    const rect = computePreviewRect({
        ...element,
        anchor: slot.anchor,
        x: slot.x,
        y: slot.y,
    });
    const centerX = rect.left + element.width / 2;
    const centerY = rect.top + element.height / 2;
    const nextAnchor = getAnchorForPoint(centerX, centerY);
    const nextOffset = getOffsetFromTopLeft(nextAnchor, rect.left, rect.top, element.width, element.height);
    slot.anchor = nextAnchor;
    slot.x = nextOffset.x;
    slot.y = nextOffset.y;
}
function computePreviewRect(element) {
    const base = getAnchorReference(element.anchor);
    let left = base.x + element.x;
    let top = base.y + element.y;
    if (element.anchor === "top_middle" || element.anchor === "center" || element.anchor === "bottom_middle") {
        left -= element.width / 2;
    }
    else if (element.anchor === "top_right" || element.anchor === "right_middle" || element.anchor === "bottom_right") {
        left -= element.width;
    }
    if (element.anchor === "left_middle" || element.anchor === "center" || element.anchor === "right_middle") {
        top -= element.height / 2;
    }
    else if (element.anchor === "bottom_left" || element.anchor === "bottom_middle" || element.anchor === "bottom_right") {
        top -= element.height;
    }
    return { left, top };
}
function previewElementText(element) {
    if (!element.stripPrefix || !element.prefix)
        return element.sampleText;
    if (element.sampleText.startsWith(element.prefix)) {
        return element.sampleText.slice(element.prefix.length);
    }
    return element.sampleText;
}
function previewSliceSlotTexts(element) {
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, 30);
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const source = previewElementText(element).replace(/\t/g, "");
    const slots = [];
    for (let index = 0; index < slotCount; index++) {
        const start = index * slotSize;
        const end = start + slotSize;
        slots.push(source.slice(start, end));
    }
    return slots;
}
function previewProgressSource(element) {
    if (!element.prefix)
        return element.sampleText;
    if (element.sampleText.startsWith(element.prefix)) {
        return element.sampleText.slice(element.prefix.length);
    }
    return element.sampleText;
}
function previewNumericValue(element) {
    const raw = previewProgressSource(element).trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : 0;
}
function buildSubtitleSliceScriptHelper(element) {
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, 30);
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
function buildTitleSliceScriptHelper(element) {
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, 30);
    const args = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");
    const slotArray = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");
    return `function pad(text, size = ${slotSize}) {
  const safe = String(text ?? "");
  return safe + "\\t".repeat(Math.max(0, size - safe.length));
}

function sendTitleSlots(player, ${args}) {
  const data = [${slotArray}].map((slot) => pad(slot, ${slotSize})).join("");
  player.runCommand(\`titleraw @s title {"rawtext":[{"text":"\${data}"}]}\`);
}`;
}
function renderSidebar() {
    const container = getForm().querySelector(".hudEditorSidebarList");
    if (!container)
        return;
    container.innerHTML = Object.values(state.elements).map((element) => `
        <button type="button" class="hudEditorChannelButton${element.id === state.selectedId ? " hudEditorChannelButtonActive" : ""}" data-channel="${element.id}">
            <span>${element.label}</span>
            <span>${element.enabled ? "ON" : "OFF"}</span>
        </button>
    `).join("");
    container.querySelectorAll(".hudEditorChannelButton").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedId = button.dataset.channel;
            renderAll();
        });
    });
}
function renderPreviewToolbar() {
    const container = getForm().querySelector(".hudEditorPreviewToolbar");
    if (!container)
        return;
    const scale = Math.round(getPreviewScale() * 100);
    container.innerHTML = `
        <div class="hudEditorPreviewToolbarLeft">
            <button type="button" class="propertyInputButton hudEditorZoomFit ${state.autoFitPreview ? "hudEditorZoomActive" : ""}">\uB9DE\uCDA4</button>
            <button type="button" class="propertyInputButton hudEditorZoomPreset ${!state.autoFitPreview && state.previewZoom === 0.75 ? "hudEditorZoomActive" : ""}" data-zoom="0.75">75%</button>
            <button type="button" class="propertyInputButton hudEditorZoomPreset ${!state.autoFitPreview && state.previewZoom === 1 ? "hudEditorZoomActive" : ""}" data-zoom="1">100%</button>
            <button type="button" class="propertyInputButton hudEditorZoomPreset ${!state.autoFitPreview && state.previewZoom === 1.25 ? "hudEditorZoomActive" : ""}" data-zoom="1.25">125%</button>
            <button type="button" class="propertyInputButton hudEditorGuideToggle ${state.showAnchorGuides ? "hudEditorZoomActive" : ""}">\uC575\uCEE4 \uAC00\uC774\uB4DC</button>
            <button type="button" class="propertyInputButton hudEditorSnapToggle ${state.autoAnchorSnap ? "hudEditorZoomActive" : ""}">\uC790\uB3D9 \uC575\uCEE4</button>
        </div>
        <div class="hudEditorPreviewToolbarRight">\uD604\uC7AC \uBC30\uC728 ${scale}%</div>
    `;
    container.querySelector(".hudEditorZoomFit")?.addEventListener("click", () => {
        state.autoFitPreview = true;
        renderAll();
    });
    container.querySelectorAll(".hudEditorZoomPreset").forEach((button) => {
        button.addEventListener("click", () => {
            state.autoFitPreview = false;
            state.previewZoom = Number.parseFloat(button.dataset.zoom || "1") || 1;
            renderAll();
        });
    });
    container.querySelector(".hudEditorGuideToggle")?.addEventListener("click", () => {
        state.showAnchorGuides = !state.showAnchorGuides;
        renderAll();
    });
    container.querySelector(".hudEditorSnapToggle")?.addEventListener("click", () => {
        state.autoAnchorSnap = !state.autoAnchorSnap;
        renderAll();
    });
}
function renderCanvas() {
    const preview = getForm().querySelector(".hudEditorPreview");
    if (!preview)
        return;
    const scale = getPreviewScale();
    const canvasScale = getForm().querySelector(".hudEditorCanvasScale");
    if (canvasScale) {
        canvasScale.style.width = `${PREVIEW_WIDTH * scale}px`;
        canvasScale.style.height = `${PREVIEW_HEIGHT * scale}px`;
    }
    preview.style.width = `${PREVIEW_WIDTH}px`;
    preview.style.height = `${PREVIEW_HEIGHT}px`;
    preview.style.transform = `scale(${scale})`;
    const titleGuide = computePreviewRect({ ...state.elements.title, x: 0, y: 130, width: 440, height: 56, anchor: "top_middle" });
    const subtitleGuide = computePreviewRect({ ...state.elements.subtitle, x: 0, y: 190, width: 380, height: 42, anchor: "top_middle" });
    const actionbarGuide = computePreviewRect({ ...state.elements.actionbar, x: 0, y: -96, width: 340, height: 38, anchor: "bottom_middle" });
    const selectedElement = getSelectedElement();
    const activeGuideAnchor = (() => {
        if (isSliceMode(selectedElement) && typeof state.drag?.slotIndex === "number" && state.drag.id === selectedElement.id) {
            return ensureSliceSlots(selectedElement)[state.drag.slotIndex]?.anchor ?? selectedElement.anchor;
        }
        return selectedElement.anchor;
    })();
    preview.innerHTML = `
        ${getCanvasBackgroundHtml()}
        <div class="hudEditorSafeZone"></div>
        ${state.showAnchorGuides ? `
            <div class="hudEditorAnchorGrid">
                <div class="hudEditorAnchorZone hudEditorAnchorZoneTopLeft ${activeGuideAnchor === "top_left" ? "hudEditorAnchorZoneActive" : ""}">top_left</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneTopMiddle ${activeGuideAnchor === "top_middle" ? "hudEditorAnchorZoneActive" : ""}">top_middle</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneTopRight ${activeGuideAnchor === "top_right" ? "hudEditorAnchorZoneActive" : ""}">top_right</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneLeftMiddle ${activeGuideAnchor === "left_middle" ? "hudEditorAnchorZoneActive" : ""}">left_middle</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneCenter ${activeGuideAnchor === "center" ? "hudEditorAnchorZoneActive" : ""}">center</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneRightMiddle ${activeGuideAnchor === "right_middle" ? "hudEditorAnchorZoneActive" : ""}">right_middle</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneBottomLeft ${activeGuideAnchor === "bottom_left" ? "hudEditorAnchorZoneActive" : ""}">bottom_left</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneBottomMiddle ${activeGuideAnchor === "bottom_middle" ? "hudEditorAnchorZoneActive" : ""}">bottom_middle</div>
                <div class="hudEditorAnchorZone hudEditorAnchorZoneBottomRight ${activeGuideAnchor === "bottom_right" ? "hudEditorAnchorZoneActive" : ""}">bottom_right</div>
            </div>
            <div class="hudEditorAnchorLine hudEditorAnchorLineVertical1"></div>
            <div class="hudEditorAnchorLine hudEditorAnchorLineVertical2"></div>
            <div class="hudEditorAnchorLine hudEditorAnchorLineHorizontal1"></div>
            <div class="hudEditorAnchorLine hudEditorAnchorLineHorizontal2"></div>
        ` : ""}
        <div class="hudEditorGuideLabel" style="left:${titleGuide.left}px;top:${titleGuide.top}px;width:440px;height:56px;">\uBC14\uB2D0\uB77C \uD0C0\uC774\uD2C0</div>
        <div class="hudEditorGuideLabel" style="left:${subtitleGuide.left}px;top:${subtitleGuide.top}px;width:380px;height:42px;">\uBC14\uB2D0\uB77C \uC11C\uBE0C\uD0C0\uC774\uD2C0</div>
        <div class="hudEditorGuideLabel" style="left:${actionbarGuide.left}px;top:${actionbarGuide.top}px;width:340px;height:38px;">\uBC14\uB2D0\uB77C \uC561\uC158\uBC14</div>
        ${Object.values(state.elements).filter((element) => element.enabled).map((element) => {
        const selectedClass = element.id === state.selectedId ? " hudEditorPreviewItemSelected" : "";
        const withBg = element.background === "none" ? "" : " hudEditorPreviewItemWithBg";
        const ignoredStyle = element.ignored ? "opacity:0.35;" : "";
        const bgStyle = `${element.background === "solid" ? `background:${element.backgroundColor};opacity:${element.backgroundAlpha};` : ""}${ignoredStyle}`;
        if ((element.id === "title" && element.titleMode === "slice") || (element.id === "subtitle" && element.subtitleMode === "slice")) {
            const slotCount = clamp(element.sliceSlotCount ?? 1, 1, 30);
            const slotTexts = previewSliceSlotTexts(element);
            return Array.from({ length: slotCount }, (_, rawIndex) => {
                const slotLayout = getSliceSlotLayout(element, rawIndex);
                const rect = computePreviewRect({
                    ...element,
                    anchor: slotLayout.anchor,
                    x: slotLayout.x,
                    y: slotLayout.y,
                });
                return `
                        <div class="hudEditorPreviewItem hudEditorPreviewSliceItem${selectedClass}${withBg}" data-element-id="${element.id}" data-slot-index="${rawIndex}" style="left:${rect.left}px;top:${rect.top}px;width:${element.width}px;height:${element.height}px;z-index:${element.layer};${ignoredStyle}">
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
    preview.querySelectorAll(".hudEditorPreviewItem").forEach((item) => {
        item.addEventListener("mousedown", (event) => {
            const id = item.dataset.elementId;
            const element = state.elements[id];
            const rawSlotIndex = item.dataset.slotIndex;
            const slotIndex = rawSlotIndex != null ? Number.parseInt(rawSlotIndex, 10) : undefined;
            if (isSliceMode(element) && !Number.isFinite(slotIndex)) {
                return;
            }
            state.selectedId = id;
            state.drag = {
                id,
                startMouseX: event.clientX,
                startMouseY: event.clientY,
                startX: element.x,
                startY: element.y,
                slotIndex: Number.isFinite(slotIndex) ? slotIndex : undefined,
                startSliceSlots: isSliceMode(element) ? ensureSliceSlots(element).map((slot) => ({ ...slot })) : undefined,
            };
            renderAll();
        });
        item.addEventListener("click", () => {
            state.selectedId = item.dataset.elementId;
            renderAll();
        });
    });
}
function renderInspector() {
    const element = getSelectedElement();
    const isTitleSlice = element.id === "title" && element.titleMode === "slice";
    const isSubtitleSlice = element.id === "subtitle" && element.subtitleMode === "slice";
    const sliceSlots = isTitleSlice || isSubtitleSlice ? ensureSliceSlots(element) : [];
    const inspector = getForm().querySelector(".hudEditorInspector");
    if (!inspector)
        return;
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
                ${element.id === "actionbar" ? `<label>preserve</label><input data-field="preserve" type="checkbox" ${element.preserve ? "checked" : ""}>` : ""}
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
                    <select data-field="displayMode" ${(element.id === "subtitle" && element.subtitleMode === "slice") || (element.id === "title" && element.titleMode === "slice") ? "disabled" : ""}>
                        <option value="text" ${element.displayMode !== "progress" ? "selected" : ""}>\uD14D\uC2A4\uD2B8</option>
                        <option value="progress" ${element.displayMode === "progress" ? "selected" : ""}>\uD504\uB85C\uADF8\uB808\uC2A4 \uBC14</option>
                    </select>
                    <label>\uCD5C\uB300\uAC12</label><input data-field="maxValue" type="number" min="1" value="${element.maxValue}" ${element.displayMode === "progress" && !(element.id === "subtitle" && element.subtitleMode === "slice") && !(element.id === "title" && element.titleMode === "slice") ? "" : "disabled"}>
                    <label>\uCC44\uC6C0 \uC0C9\uC0C1</label><input data-field="fillColor" type="color" value="${element.fillColor}" ${element.displayMode === "progress" && !(element.id === "subtitle" && element.subtitleMode === "slice") && !(element.id === "title" && element.titleMode === "slice") ? "" : "disabled"}>
                    <label>\uCC44\uC6C0 \uBC29\uD5A5</label>
                    <select data-field="clipDirection" ${element.displayMode === "progress" && !(element.id === "subtitle" && element.subtitleMode === "slice") && !(element.id === "title" && element.titleMode === "slice") ? "" : "disabled"}>
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
                ${element.id === "title" ? `
                    <label>\uD45C\uC2DC \uBAA8\uB4DC</label>
                    <select data-field="titleMode">
                        <option value="single" ${element.titleMode !== "slice" ? "selected" : ""}>\uB2E8\uC77C</option>
                        <option value="slice" ${element.titleMode === "slice" ? "selected" : ""}>\uC2AC\uB77C\uC774\uC2F1</option>
                    </select>
                    ${element.titleMode === "slice" ? `
                        <label>\uC2AC\uB86F</label>
                        <div class="hudEditorSidebarActions">
                            <button type="button" class="propertyInputButton hudEditorAddSliceSlot" data-slice-target="title">\uC2AC\uB86F \uCD94\uAC00</button>
                            <button type="button" class="propertyInputButton hudEditorRemoveSliceSlot" data-slice-target="title" ${(element.sliceSlotCount ?? 1) <= 1 ? "disabled" : ""}>\uC2AC\uB86F \uC0AD\uC81C</button>
                        </div>
                        <div class="hudEditorHelp">\uD604\uC7AC \uC2AC\uB86F \uC218: ${element.sliceSlotCount ?? 1}</div>
                    ` : ""}
                    <label>\uC2AC\uB86F \uD06C\uAE30</label><input data-field="sliceSlotSize" type="number" min="1" max="200" value="${element.sliceSlotSize ?? 20}" ${element.titleMode === "slice" ? "" : "disabled"}>
                    <label>\uC5F4 \uC218</label><input data-field="sliceColumns" type="number" min="1" max="4" value="${element.sliceColumns ?? 2}" ${element.titleMode === "slice" ? "" : "disabled"}>
                    <label>\uAC00\uB85C \uAC04\uACA9</label><input data-field="sliceGapX" type="number" value="${element.sliceGapX ?? 8}" ${element.titleMode === "slice" ? "" : "disabled"}>
                    <label>\uC138\uB85C \uAC04\uACA9</label><input data-field="sliceGapY" type="number" value="${element.sliceGapY ?? 8}" ${element.titleMode === "slice" ? "" : "disabled"}>
                ` : ""}
                ${element.id === "subtitle" ? `
                    <label>\uD45C\uC2DC \uBAA8\uB4DC</label>
                    <select data-field="subtitleMode">
                        <option value="single" ${element.subtitleMode !== "slice" ? "selected" : ""}>\uB2E8\uC77C</option>
                        <option value="slice" ${element.subtitleMode === "slice" ? "selected" : ""}>\uC2AC\uB77C\uC774\uC2F1</option>
                    </select>
                    ${element.subtitleMode === "slice" ? `
                        <label>\uC2AC\uB86F</label>
                        <div class="hudEditorSidebarActions">
                            <button type="button" class="propertyInputButton hudEditorAddSliceSlot" data-slice-target="subtitle">\uC2AC\uB86F \uCD94\uAC00</button>
                            <button type="button" class="propertyInputButton hudEditorRemoveSliceSlot" data-slice-target="subtitle" ${(element.sliceSlotCount ?? 1) <= 1 ? "disabled" : ""}>\uC2AC\uB86F \uC0AD\uC81C</button>
                        </div>
                        <div class="hudEditorHelp">\uD604\uC7AC \uC2AC\uB86F \uC218: ${element.sliceSlotCount ?? 1}</div>
                    ` : ""}
                    <label>\uC2AC\uB86F \uD06C\uAE30</label><input data-field="sliceSlotSize" type="number" min="1" max="200" value="${element.sliceSlotSize ?? 20}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                    <label>\uC5F4 \uC218</label><input data-field="sliceColumns" type="number" min="1" max="4" value="${element.sliceColumns ?? 2}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                    <label>\uAC00\uB85C \uAC04\uACA9</label><input data-field="sliceGapX" type="number" value="${element.sliceGapX ?? 8}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                    <label>\uC138\uB85C \uAC04\uACA9</label><input data-field="sliceGapY" type="number" value="${element.sliceGapY ?? 8}" ${element.subtitleMode === "slice" ? "" : "disabled"}>
                ` : ""}
            </div>
        </div>
        ${(isTitleSlice || isSubtitleSlice) ? `
            <div class="hudEditorInspectorCard">
                <div class="hudEditorInspectorTitle">\uC2AC\uB86F \uBC30\uCE58</div>
                <div class="hudEditorInspectorBody">
                    ${sliceSlots.map((slot, rawIndex) => `
                        <label>\uC2AC\uB86F ${rawIndex + 1} \uC575\uCEE4</label>
                        <select data-slot-index="${rawIndex}" data-slot-field="anchor">
                            ${["top_left", "top_middle", "top_right", "left_middle", "center", "right_middle", "bottom_left", "bottom_middle", "bottom_right"].map((anchor) => `<option value="${anchor}" ${slot.anchor === anchor ? "selected" : ""}>${anchor}</option>`).join("")}
                        </select>
                        <label>\uC2AC\uB86F ${rawIndex + 1} X</label><input data-slot-index="${rawIndex}" data-slot-field="x" type="number" value="${slot.x}">
                        <label>\uC2AC\uB86F ${rawIndex + 1} Y</label><input data-slot-index="${rawIndex}" data-slot-field="y" type="number" value="${slot.y}">
                    `).join("")}
                </div>
            </div>
        ` : ""}
        <div class="hudEditorInspectorCard">
            <div class="hudEditorInspectorTitle">\uCC44\uB110 \uC548\uB0B4</div>
            <div class="hudEditorDescription">
                <div>Title: <code>#hud_title_text_string</code></div>
                <div>Subtitle: <code>#hud_subtitle_text_string</code></div>
                <div>Actionbar: <code>$actionbar_text</code></div>
                <div>Actionbar preserve\uB97C \uCF1C\uBA74 <code>#hud_actionbar_text_string</code> \uAE30\uBC18 \uBCF4\uC874 \uD328\uB110\uB3C4 \uD568\uAED8 \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.</div>
                <div>\uC561\uC158\uBC14\uB294 \uBC14\uB2D0\uB77C \uADDC\uCE59\uC5D0 \uB9DE\uAC8C factory \uBC29\uC2DD\uC73C\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.</div>
                <div>title \uB2E8\uC77C \uBAA8\uB4DC\uB294 \uD604\uC7AC <code>#hud_title_text_string</code>\uC744 \uC9C1\uC811 \uAC00\uB85C\uCC44 \uB80C\uB354\uD569\uB2C8\uB2E4.</div>
                <div>\uD0C0\uC774\uD2C0\uB3C4 \uC2AC\uB77C\uC774\uC2F1\uC744 \uC9C0\uC6D0\uD558\uC9C0\uB9CC, \uC774 \uBAA8\uB4DC\uC5D0\uC11C\uB3C4 \uD604\uC7AC title \uBB38\uC790\uC5F4 \uAE30\uC900\uC73C\uB85C \uBC14\uB85C \uACC4\uC0B0\uD569\uB2C8\uB2E4.</div>
                <div>\uC11C\uBE0C\uD0C0\uC774\uD2C0 \uC2AC\uB77C\uC774\uC2F1 \uBAA8\uB4DC\uB97C \uCF1C\uBA74 <code>subtitle_data</code>\uC640 <code>sub_slotN</code> \uAD6C\uC870\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.</div>
                <div>\uC2AC\uB77C\uC774\uC2F1 \uBAA8\uB4DC\uC5D0\uC11C\uB294 \uC2AC\uB86F\uBCC4 \uC575\uCEE4/X/Y\uB97C \uAC1C\uBCC4 \uD3B8\uC9D1\uD574 \uC6D0\uD558\uB294 \uBC30\uCE58\uB97C \uC9C1\uC811 \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>
                ${element.id === "title" && element.titleMode === "slice" ? `<div><code>pad(text, size)</code> \uD615\uC2DD\uC73C\uB85C \uAC01 \uC2AC\uB86F\uC744 \\t \uD328\uB529\uD55C \uB4A4 title\uB85C \uC774\uC5B4\uBD99\uC5EC \uBCF4\uB0B4\uC57C \uD569\uB2C8\uB2E4.</div>` : ""}
                <div>\uC560\uB2C8\uBA54\uC774\uC158\uC740 <code>alpha</code> \uCCB4\uC774\uB2DD\uC73C\uB85C \uB0B4\uBCF4\uB0B4\uBA70, actionbar\uC5D0\uC11C\uB294 \uD31D\ud1a0\ub9ac \uD750\uB984\uC5D0 \uB9DE\uCD94\uAE30 \uC704\uD574 fade out \uD504\uB9AC\uC14B\uC774 \uC798 \uB9DE\uC2B5\uB2C8\uB2E4.</div>
                ${element.id === "subtitle" && element.subtitleMode === "slice" ? `<div><code>pad(text, size)</code> \uD615\uC2DD\uC73C\uB85C \uAC01 \uC2AC\uB86F\uC744 \\t \uD328\uB529\uD55C \uB4A4 subtitle\uB85C \uC774\uC5B4\uBD99\uC5EC \uBCF4\uB0B4\uC57C \uD569\uB2C8\uB2E4.</div>` : ""}
                <div><code>ignored: true</code>\uB97C \uCF1C\uBA74 \uB80C\uB354\uB9C1\uACFC \uBC14\uC778\uB529 \uD3C9\uAC00\uAC00 \uD568\uAED8 \uBE44\uD65C\uC131\uD654\uB429\uB2C8\uB2E4.</div>
                <div>\uD504\uB85C\uADF8\uB808\uC2A4 \uBC14\uB294 title/subtitle\uC5D0\uC11C clip_ratio \uAE30\uBC18\uC73C\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.</div>
            </div>
        </div>
    `;
    inspector.querySelectorAll("input[data-field], select[data-field]").forEach((input) => {
        const field = input.dataset.field;
        const onChange = () => {
            const element = state.elements[state.selectedId];
            const target = element;
            const previousX = element.x;
            const previousY = element.y;
            const previousAnchor = element.anchor;
            if (input instanceof HTMLInputElement && input.type === "checkbox") {
                target[field] = input.checked;
            }
            else if (field === "x" || field === "y" || field === "width" || field === "height" || field === "layer" || field === "sliceSlotSize" || field === "sliceColumns" || field === "sliceGapX" || field === "sliceGapY" || field === "maxValue") {
                target[field] = Number.parseInt(input.value, 10) || 0;
            }
            else if (field === "animInDuration" || field === "animHoldDuration" || field === "animOutDuration") {
                target[field] = Math.max(0, Number.parseFloat(input.value) || 0);
            }
            else if (field === "backgroundAlpha") {
                target[field] = clamp(Number.parseFloat(input.value) || 0, 0, 1);
            }
            else {
                target[field] = input.value;
            }
            if (isSliceMode(element)) {
                const slots = ensureSliceSlots(element);
                if (field === "x") {
                    const delta = element.x - previousX;
                    element.sliceSlots = slots.map((slot) => ({ ...slot, x: slot.x + delta }));
                }
                else if (field === "y") {
                    const delta = element.y - previousY;
                    element.sliceSlots = slots.map((slot) => ({ ...slot, y: slot.y + delta }));
                }
                else if (field === "anchor") {
                    element.sliceSlots = slots.map((slot) => ({ ...slot, anchor: element.anchor }));
                }
            }
            renderAll();
        };
        input.addEventListener("input", onChange);
        input.addEventListener("change", onChange);
    });
    inspector.querySelectorAll(".hudEditorAddSliceSlot").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.sliceTarget;
            const target = state.elements[targetId];
            target.sliceSlotCount = clamp((target.sliceSlotCount ?? 1) + 1, 1, 30);
            ensureSliceSlots(target);
            renderAll();
        });
    });
    inspector.querySelectorAll(".hudEditorRemoveSliceSlot").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.sliceTarget;
            const target = state.elements[targetId];
            target.sliceSlotCount = clamp((target.sliceSlotCount ?? 1) - 1, 1, 30);
            ensureSliceSlots(target);
            renderAll();
        });
    });
    inspector.querySelectorAll("input[data-slot-field], select[data-slot-field]").forEach((input) => {
        const field = input.dataset.slotField;
        const rawIndex = Number.parseInt(input.dataset.slotIndex || "0", 10) || 0;
        const onChange = () => {
            const target = state.elements[state.selectedId];
            const slots = ensureSliceSlots(target);
            const slot = slots[rawIndex];
            if (!slot) {
                return;
            }
            if (field === "x" || field === "y") {
                slot[field] = Number.parseInt(input.value, 10) || 0;
            }
            else {
                slot[field] = input.value;
            }
            renderAll();
        };
        input.addEventListener("input", onChange);
        input.addEventListener("change", onChange);
    });
}
function renderScriptHelper() {
    const container = getForm().querySelector(".hudEditorScriptCard");
    if (!container)
        return;
    const title = state.elements.title;
    const subtitle = state.elements.subtitle;
    const sections = [];
    if (title.enabled && title.titleMode === "slice") {
        sections.push(`
            <div class="hudEditorSidebarTitle">Title Script Helper</div>
            <textarea class="hudEditorOutput hudEditorScriptOutput hudEditorTitleScriptOutput" spellcheck="false">${escapeHtml(buildTitleSliceScriptHelper(title))}</textarea>
            <div class="hudEditorSidebarActions">
                <button type="button" class="propertyInputButton hudEditorCopyTitleScript">Script \uBCF5\uC0AC</button>
            </div>
        `);
    }
    if (subtitle.enabled && subtitle.subtitleMode === "slice") {
        sections.push(`
            <div class="hudEditorSidebarTitle">Subtitle Script Helper</div>
            <textarea class="hudEditorOutput hudEditorScriptOutput hudEditorSubtitleScriptOutput" spellcheck="false">${escapeHtml(buildSubtitleSliceScriptHelper(subtitle))}</textarea>
            <div class="hudEditorSidebarActions">
                <button type="button" class="propertyInputButton hudEditorCopySubtitleScript">Script \uBCF5\uC0AC</button>
            </div>
        `);
    }
    if (sections.length === 0) {
        container.innerHTML = "";
        return;
    }
    container.innerHTML = sections.join("");
    const copyTitleButton = container.querySelector(".hudEditorCopyTitleScript");
    copyTitleButton?.addEventListener("click", async () => {
        await navigator.clipboard.writeText(buildTitleSliceScriptHelper(title));
        new Notification("Title Script helper\uB97C \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uD588\uC2B5\uB2C8\uB2E4.", 2200, "notif");
    });
    const copySubtitleButton = container.querySelector(".hudEditorCopySubtitleScript");
    copySubtitleButton?.addEventListener("click", async () => {
        await navigator.clipboard.writeText(buildSubtitleSliceScriptHelper(subtitle));
        new Notification("Subtitle Script helper\uB97C \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uD588\uC2B5\uB2C8\uB2E4.", 2200, "notif");
    });
}
function renderAll() {
    renderSidebar();
    renderPreviewToolbar();
    renderCanvas();
    renderInspector();
    renderScriptHelper();
    updateOutput();
}
function renderModalShell() {
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
                <div class="hudEditorSidebarCard hudEditorPreviewToolbar"></div>
                <div class="hudEditorCanvasWrap">
                    <div class="hudEditorCanvasScale">
                        <div class="hudEditorPreview"></div>
                    </div>
                </div>
                <div class="hudEditorHelp">
                <div>\uAC00\uC774\uB4DC \uC0C1\uC790\uB294 \uBC14\uB2D0\uB77C \uAE30\uC900 \uC704\uCE58\uC785\uB2C8\uB2E4.</div>
                <div>HUD \uBC15\uC2A4\uB97C \uC9C1\uC811 \uB4DC\uB798\uADF8\uD574\uC11C \uC704\uCE58\uB97C \uC62E\uAE30\uACE0, \uC624\uB978\uCABD\uC5D0\uC11C \uD06C\uAE30\uC640 \uC811\uB450\uC5B4 \uCC98\uB9AC\uAE4C\uC9C0 \uC870\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>
                <div>\uC790\uB3D9 \uC575\uCEE4\uB97C \uCF1C\uBA74 \uB4DC\uB798\uADF8 \uC885\uB8CC \uC2DC \uAC00\uC7A5 \uAC00\uAE4C\uC6B4 9\uBD84\uD560 \uAD6C\uC5ED \uAE30\uC900\uC73C\uB85C anchor\uAC00 \uBC14\uB00C\uACE0, offset\uB3C4 \uADF8 anchor \uAE30\uC900\uC73C\uB85C \uB2E4\uC2DC \uACC4\uC0B0\uB429\uB2C8\uB2E4.</div>
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
function bindStaticActions() {
    const form = getForm();
    const resetButton = form.querySelector(".hudEditorReset");
    const copyButton = form.querySelector(".hudEditorCopyJson");
    const downloadButton = form.querySelector(".hudEditorDownloadJson");
    resetButton?.addEventListener("click", () => {
        state.selectedId = "title";
        state.autoFitPreview = true;
        state.previewZoom = 1;
        state.elements.title = {
            ...state.elements.title,
            enabled: true,
            ignored: false,
            sampleText: "Title",
            prefix: "",
            stripPrefix: false,
            hideVanilla: false,
            preserve: false,
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
            titleMode: "single",
            sliceSlotCount: 1,
            sliceSlotSize: 20,
            sliceColumns: 2,
            sliceGapX: 8,
            sliceGapY: 8,
            sliceSlots: undefined,
        };
        state.elements.subtitle = {
            ...state.elements.subtitle,
            enabled: true,
            ignored: false,
            sampleText: "Subtitle",
            prefix: "",
            stripPrefix: false,
            hideVanilla: false,
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
            sliceSlotCount: 1,
            sliceSlotSize: 20,
            sliceColumns: 2,
            sliceGapX: 8,
            sliceGapY: 8,
            sliceSlots: undefined,
        };
        state.elements.actionbar = {
            ...state.elements.actionbar,
            enabled: true,
            ignored: false,
            sampleText: "Actionbar",
            prefix: "",
            stripPrefix: false,
            hideVanilla: false,
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
function attachDragHandlers() {
    const modal = getModal();
    const finishDrag = () => {
        if (!state.drag)
            return;
        const element = state.elements[state.drag.id];
        if (state.autoAnchorSnap) {
            if (isSliceMode(element) && typeof state.drag.slotIndex === "number") {
                snapSliceSlotAnchor(element, state.drag.slotIndex);
            }
            else if (!isSliceMode(element)) {
                snapElementAnchor(element);
            }
        }
        state.drag = null;
        renderAll();
    };
    modal.onmousemove = (event) => {
        if (!state.drag)
            return;
        const element = state.elements[state.drag.id];
        const deltaX = Math.round(event.clientX - state.drag.startMouseX);
        const deltaY = Math.round(event.clientY - state.drag.startMouseY);
        if (isSliceMode(element) && state.drag.startSliceSlots) {
            if (typeof state.drag.slotIndex !== "number") {
                return;
            }
            element.sliceSlots = state.drag.startSliceSlots.map((slot, index) => index === state.drag?.slotIndex
                ? {
                    ...slot,
                    x: slot.x + deltaX,
                    y: slot.y + deltaY,
                }
                : { ...slot });
        }
        else {
            element.x = Math.round(state.drag.startX + deltaX);
            element.y = Math.round(state.drag.startY + deltaY);
        }
        renderAll();
    };
    modal.onmouseup = finishDrag;
    window.onmouseup = finishDrag;
    modal.onmouseleave = finishDrag;
}
function mountHudEditor() {
    renderModalShell();
    bindStaticActions();
    attachDragHandlers();
    renderAll();
}
export async function hudEditorModal() {
    mountHudEditor();
    const modal = getModal();
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    return new Promise((resolve) => {
        const handleResize = () => renderAll();
        const close = () => {
            modal.style.display = "none";
            document.body.style.overflow = "";
            getCloseButton().onclick = null;
            window.removeEventListener("resize", handleResize);
            resolve();
        };
        window.addEventListener("resize", handleResize);
        getCloseButton().onclick = close;
    });
}
//# sourceMappingURL=hudEditorModal.js.map