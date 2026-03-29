import { Notification } from "../notifs/noficationMaker.js";

import { assetUrl } from "../../lib/assetUrl.js";
import { getPanelContainer } from "../../runtime/editorCanvasRuntime.js";
import { closeHudEditorBridge, openHudEditorBridge, subscribeHudEditorModalBridge } from "../react/hudEditorModalBridge.js";
import { createZipBlob, type ZipEntry } from "../../util/zip.js";

type HudChannel = "title" | "subtitle" | "actionbar";
type HudSourceChannel = HudChannel;
type HudBackground = "vanilla" | "solid" | "none";
export type HudFontSize = "small" | "normal" | "large" | "extra_large";
type HudTextSliceMode = "single" | "slice";
type HudTitleSliceLayout = "free" | "hud_cards";
type HudStackOrientation = "horizontal" | "vertical";
type HudTextAlign = "left" | "center" | "right";
type HudTitleGroupMode = "single" | "single_template" | "stack" | "description";
type HudDisplayMode = "text" | "progress";
type HudClipDirection = "left" | "right" | "up" | "down";
type HudAnimationPreset = "none" | "fade_out" | "fade_hold_fade";
type HudProgressMaxMode = "fixed" | "dynamic";
type HudTextureType = "" | "fixed";
type HudSliceSlot = {
    anchor: HudAnchor;
    x: number;
    y: number;
};
type HudTitleSliceGroup = {
    id: string;
    start: number;
    end: number;
    mode: HudTitleGroupMode;
    anchor: HudAnchor;
    x: number;
    y: number;
    orientation: HudStackOrientation;
    reverse: boolean;
    spacer: number;
    textAlign: HudTextAlign;
    textOffsetX: number;
    textOffsetY: number;
};
export type HudAnchor =
    | "top_left"
    | "top_middle"
    | "top_right"
    | "left_middle"
    | "center"
    | "right_middle"
    | "bottom_left"
    | "bottom_middle"
    | "bottom_right";

const HUD_ANCHORS: HudAnchor[] = [
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

export type HudElement = {
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
    backgroundTexture: string;
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
    titleMode?: HudTextSliceMode;
    titleSliceLayout?: HudTitleSliceLayout;
    titleUseSlot1Template?: boolean;
    titleUseStackForMiddleSlots?: boolean;
    titleUseSlot5Template?: boolean;
    titleCustomGroupsEnabled?: boolean;
    titleCustomGroupsText?: string;
    titleSlot1Anchor?: HudAnchor;
    titleSlot1X?: number;
    titleSlot1Y?: number;
    titleStackAnchor?: HudAnchor;
    titleStackX?: number;
    titleStackY?: number;
    titleStackOrientation?: HudStackOrientation;
    titleStackReverse?: boolean;
    titleStackSpacer?: number;
    titleSlot5Anchor?: HudAnchor;
    titleSlot5X?: number;
    titleSlot5Y?: number;
    titleSlot5TextAlign?: HudTextAlign;
    titleSlot5TextOffsetX?: number;
    titleSlot5TextOffsetY?: number;
    subtitleMode?: HudTextSliceMode;
    sliceSlotCount?: number;
    sliceSlotSize?: number;
    sliceColumns?: number;
    sliceGapX?: number;
    sliceGapY?: number;
    sliceSlots?: HudSliceSlot[];
};

export type HudProgressBar = {
    id: string;
    label: string;
    enabled: boolean;
    ignored: boolean;
    sourceChannel: HudSourceChannel;
    sampleText: string;
    prefix: string;
    hideVanilla: boolean;
    anchor: HudAnchor;
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
    fillColor: string;
    clipDirection: HudClipDirection;
    background: HudBackground;
    backgroundAlpha: number;
    backgroundColor: string;
    backgroundTexture: string;
    barTexture: string;
    trailTexture: string;
    textureType: HudTextureType;
    textColor: string;
    fontSize: HudFontSize;
    shadow: boolean;
    showText: boolean;
    maxMode: HudProgressMaxMode;
    maxValue: number;
    barInsetX: number;
    barInsetY: number;
    barAlpha: number;
    trailAlpha: number;
    duration: number;
    trailDelay: number;
    ignoreTrail: boolean;
};

export type HudCanvasItem = {
    id: string;
    kind: "channel" | "progressBar";
    label: string;
    enabled: boolean;
    ignored: boolean;
    anchor: HudAnchor;
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
};

export type HudEditorState = {
    selectedId: string;
    autoFitPreview: boolean;
    previewZoom: number;
    autoAnchorSnap: boolean;
    showAnchorGuides: boolean;
    elements: Record<HudChannel, HudElement>;
    progressBars: HudProgressBar[];
    nextProgressBarId: number;
    drag: null | {
        id: string;
        startMouseX: number;
        startMouseY: number;
        startX: number;
        startY: number;
        slotIndex?: number;
        startSliceSlots?: HudSliceSlot[];
    };
};

const PREVIEW_WIDTH = 1500;
const PREVIEW_HEIGHT = 1500 / 1.7777777;
const MAX_SLICE_SLOTS = 100;

const state: HudEditorState = {
    selectedId: "title",
    autoFitPreview: true,
    previewZoom: 1,
    autoAnchorSnap: false,
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
            backgroundTexture: "textures/ui/hud_tip_text_background",
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
            titleSliceLayout: "free",
            titleUseSlot1Template: false,
            titleUseStackForMiddleSlots: false,
            titleUseSlot5Template: false,
            titleCustomGroupsEnabled: false,
            titleCustomGroupsText: "",
            titleSlot1Anchor: "right_middle",
            titleSlot1X: 0,
            titleSlot1Y: -25,
            titleStackAnchor: "top_right",
            titleStackX: -5,
            titleStackY: 5,
            titleStackOrientation: "horizontal",
            titleStackReverse: true,
            titleStackSpacer: 6,
            titleSlot5Anchor: "bottom_middle",
            titleSlot5X: 10,
            titleSlot5Y: -50,
            titleSlot5TextAlign: "left",
            titleSlot5TextOffsetX: 5,
            titleSlot5TextOffsetY: 0,
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
            backgroundTexture: "textures/ui/hud_tip_text_background",
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
            backgroundTexture: "textures/ui/hud_tip_text_background",
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
    progressBars: [],
    nextProgressBarId: 1,
    drag: null,
};

type HudEditorHostElements = {
    modal: HTMLElement;
    closeButton: HTMLElement;
    form: HTMLDivElement;
};

let hudEditorHost: HudEditorHostElements | null = null;
let hudEditorHostWaiters: Array<(host: HudEditorHostElements) => void> = [];
let activeHudEditorPromise: Promise<void> | null = null;
let cleanupHudEditorSession: (() => void) | null = null;
const hudEditorStoreListeners = new Set<() => void>();

export function registerHudEditorHost(host: HudEditorHostElements | null): void {
    hudEditorHost = host;

    if (!host) {
        if (activeHudEditorPromise) {
            closeHudEditorBridge();
        }
        return;
    }

    hudEditorHostWaiters.forEach((resolve) => resolve(host));
    hudEditorHostWaiters = [];
}

function waitForHudEditorHost(): Promise<HudEditorHostElements> {
    if (hudEditorHost) {
        return Promise.resolve(hudEditorHost);
    }

    return new Promise((resolve) => {
        hudEditorHostWaiters.push(resolve);
    });
}

function getModal(): HTMLElement {
    if (!hudEditorHost) {
        throw new Error("HUD editor host is not registered.");
    }
    return hudEditorHost.modal;
}

function getCloseButton(): HTMLElement {
    if (!hudEditorHost) {
        throw new Error("HUD editor host is not registered.");
    }
    return hudEditorHost.closeButton;
}

function getForm(): HTMLDivElement {
    if (!hudEditorHost) {
        throw new Error("HUD editor host is not registered.");
    }
    return hudEditorHost.form;
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

function createDefaultProgressBar(id: string, label: string): HudProgressBar {
    return {
        id,
        label,
        enabled: true,
        ignored: false,
        sourceChannel: "title",
        sampleText: "bar:35,50",
        prefix: "bar:",
        hideVanilla: true,
        anchor: "top_right",
        x: -10,
        y: 20,
        width: 120,
        height: 10,
        layer: 40,
        fillColor: "#ff6b6b",
        clipDirection: "left",
        background: "none",
        backgroundAlpha: 1,
        backgroundColor: "#1f2432",
        backgroundTexture: "textures/ui/bar_bg",
        barTexture: "textures/ui/bar",
        trailTexture: "textures/ui/white_background",
        textureType: "",
        textColor: "#ffffff",
        fontSize: "normal",
        shadow: true,
        showText: true,
        maxMode: "dynamic",
        maxValue: 50,
        barInsetX: 1,
        barInsetY: 1,
        barAlpha: 1,
        trailAlpha: 0.6,
        duration: 0.2,
        trailDelay: 0.2,
        ignoreTrail: false,
    };
}

function getSelectedElement(): HudElement | HudProgressBar {
    return state.elements[state.selectedId as HudChannel] ?? state.progressBars.find((bar) => bar.id === state.selectedId) ?? state.elements.title;
}

function isProgressBarElement(element: HudElement | HudProgressBar): element is HudProgressBar {
    return "sourceChannel" in element;
}

function getCanvasItems(): HudCanvasItem[] {
    const channelItems = Object.values(state.elements).map((element) => ({
        id: element.id,
        kind: "channel" as const,
        label: element.label,
        enabled: element.enabled,
        ignored: element.ignored,
        anchor: element.anchor,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        layer: element.layer,
    }));
    const progressItems = state.progressBars.map((bar) => ({
        id: bar.id,
        kind: "progressBar" as const,
        label: bar.label,
        enabled: bar.enabled,
        ignored: bar.ignored,
        anchor: bar.anchor,
        x: bar.x,
        y: bar.y,
        width: bar.width,
        height: bar.height,
        layer: bar.layer,
    }));
    return [...channelItems, ...progressItems];
}

function getProgressBarById(id: string): HudProgressBar | undefined {
    return state.progressBars.find((bar) => bar.id === id);
}

function getBindingNameForChannel(channel: HudSourceChannel): string {
    switch (channel) {
        case "title":
            return "#hud_title_text_string";
        case "subtitle":
            return "#hud_subtitle_text_string";
        case "actionbar":
            return "#hud_actionbar_text_string";
    }
}

function getProgressBarDataControlName(bar: HudProgressBar): string {
    return `progress_bar_data_${bar.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function getProgressBarInsertName(bar: HudProgressBar): string {
    return `progress_bar_${bar.id.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function getProgressBarPrefixMatchExpression(bar: HudProgressBar, sourceName: string): string {
    return bar.prefix
        ? `(not ((${sourceName} - ${quoteString(bar.prefix)}) = ${sourceName}))`
        : `(not (${sourceName} = ''))`;
}

function getCanvasBackgroundHtml(): string {
    const bgImage = getPanelContainer().querySelector(".bg_image") as HTMLImageElement | null;
    if (bgImage?.src) {
        return `<img class="hudEditorCanvasBackgroundImage" src="${bgImage.src}" alt="HUD Background">`;
    }

    return `<img class="hudEditorCanvasBackgroundImage" src="${assetUrl("background.png")}" alt="HUD Background">`;
}

function getPreviewScale(): number {
    if (!state.autoFitPreview) {
        return clamp(state.previewZoom, 0.5, 1.5);
    }

    const wrap = getForm().querySelector(".hudEditorCanvasWrap") as HTMLDivElement | null;
    const wrapWidth = wrap?.clientWidth ?? PREVIEW_WIDTH;
    const fitScale = wrapWidth / PREVIEW_WIDTH;
    return clamp(fitScale, 0.65, 1);
}

function prefixMatchExpression(source: string, prefix: string): string {
    if (!prefix) return "true";
    return `(not ((${source} - ${quoteString(prefix)}) = ${source}))`;
}

function isTitleHudCardsLayout(element: HudElement): boolean {
    return element.id === "title"
        && element.titleMode === "slice"
        && (element.titleSliceLayout === "hud_cards");
}

function sanitizeTitleGroupId(value: string): string {
    const safe = value.replace(/[^a-zA-Z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
    return safe || "group";
}

function getTitleCustomGroups(element: HudElement): HudTitleSliceGroup[] {
    if (element.id !== "title" || element.titleMode !== "slice" || !element.titleCustomGroupsEnabled) {
        return [];
    }
    const source = (element.titleCustomGroupsText ?? "").trim();
    if (!source) {
        return [];
    }

    try {
        const raw = JSON.parse(source);
        if (!Array.isArray(raw)) {
            return [];
        }

        return raw.map((entry, index): HudTitleSliceGroup | null => {
            if (!entry || typeof entry !== "object") {
                return null;
            }
            const object = entry as Record<string, unknown>;
            const start = clamp(Number.parseInt(String(object.start ?? object.slot ?? 1), 10) || 1, 1, MAX_SLICE_SLOTS);
            const end = clamp(Number.parseInt(String(object.end ?? start), 10) || start, start, MAX_SLICE_SLOTS);
            const modeRaw = String(object.mode ?? "single");
            const mode: HudTitleGroupMode = modeRaw === "stack" || modeRaw === "description" || modeRaw === "single_template"
                ? modeRaw
                : "single";
            const anchor = HUD_ANCHORS.includes(object.anchor as HudAnchor) ? object.anchor as HudAnchor : "center";
            return {
                id: sanitizeTitleGroupId(String(object.id ?? `group_${index + 1}`)),
                start,
                end,
                mode,
                anchor,
                x: Number.parseInt(String(object.x ?? 0), 10) || 0,
                y: Number.parseInt(String(object.y ?? 0), 10) || 0,
                orientation: object.orientation === "vertical" ? "vertical" : "horizontal",
                reverse: object.reverse === undefined ? true : Boolean(object.reverse),
                spacer: Math.max(0, Number.parseInt(String(object.spacer ?? 6), 10) || 0),
                textAlign: object.textAlign === "right" ? "right" : object.textAlign === "center" ? "center" : "left",
                textOffsetX: Number.parseInt(String(object.textOffsetX ?? 5), 10) || 0,
                textOffsetY: Number.parseInt(String(object.textOffsetY ?? 0), 10) || 0,
            };
        }).filter((group): group is HudTitleSliceGroup => group !== null);
    } catch {
        return [];
    }
}

function findTitleCustomGroupForSlot(element: HudElement, rawIndex: number): HudTitleSliceGroup | null {
    const slotNumber = rawIndex + 1;
    return getTitleCustomGroups(element).find((group) => slotNumber >= group.start && slotNumber <= group.end) ?? null;
}

function usesTitleSlot1Template(element: HudElement): boolean {
    return element.id === "title"
        && element.titleMode === "slice"
        && ((element.titleUseSlot1Template ?? false) || isTitleHudCardsLayout(element));
}

function usesTitleMiddleStack(element: HudElement): boolean {
    return element.id === "title"
        && element.titleMode === "slice"
        && ((element.titleUseStackForMiddleSlots ?? false) || isTitleHudCardsLayout(element));
}

function usesTitleSlot5Template(element: HudElement): boolean {
    return element.id === "title"
        && element.titleMode === "slice"
        && ((element.titleUseSlot5Template ?? false) || isTitleHudCardsLayout(element));
}

function getCustomTitleSliceSlotLayout(element: HudElement, rawIndex: number): HudSliceSlot | null {
    const customGroup = findTitleCustomGroupForSlot(element, rawIndex);
    if (customGroup) {
        if (customGroup.mode === "stack") {
            const slotNumbers = Array.from({ length: customGroup.end - customGroup.start + 1 }, (_, offset) => customGroup.start + offset);
            const ordered = customGroup.reverse ? [...slotNumbers].reverse() : slotNumbers;
            const orderIndex = ordered.indexOf(rawIndex + 1);
            const step = customGroup.orientation === "horizontal"
                ? (element.width + customGroup.spacer)
                : (element.height + customGroup.spacer);
            return {
                anchor: customGroup.anchor,
                x: customGroup.x + (customGroup.orientation === "horizontal" ? Math.max(0, orderIndex) * step : 0),
                y: customGroup.y + (customGroup.orientation === "vertical" ? Math.max(0, orderIndex) * step : 0),
            };
        }

        return {
            anchor: customGroup.anchor,
            x: customGroup.x,
            y: customGroup.y,
        };
    }

    if (rawIndex === 0 && usesTitleSlot1Template(element)) {
        return {
            anchor: element.titleSlot1Anchor ?? "right_middle",
            x: element.titleSlot1X ?? 0,
            y: element.titleSlot1Y ?? -25,
        };
    }

    if (rawIndex >= 1 && rawIndex <= 3 && usesTitleMiddleStack(element)) {
        const orientation = element.titleStackOrientation ?? "horizontal";
        const reverse = element.titleStackReverse ?? true;
        const spacer = Math.max(0, element.titleStackSpacer ?? 6);
        const orderIndex = reverse ? (3 - rawIndex) : (rawIndex - 1);
        const step = orientation === "horizontal" ? (element.width + spacer) : (element.height + spacer);
        return {
            anchor: element.titleStackAnchor ?? "top_right",
            x: (element.titleStackX ?? -5) + (orientation === "horizontal" ? orderIndex * step : 0),
            y: (element.titleStackY ?? 5) + (orientation === "vertical" ? orderIndex * step : 0),
        };
    }

    if (rawIndex === 4 && usesTitleSlot5Template(element)) {
        return {
            anchor: element.titleSlot5Anchor ?? "bottom_middle",
            x: element.titleSlot5X ?? 10,
            y: element.titleSlot5Y ?? -50,
        };
    }

    return null;
}

function applyCustomTitleSliceSlotPosition(element: HudElement, slotIndex: number, anchor: HudAnchor, x: number, y: number): boolean {
    if (findTitleCustomGroupForSlot(element, slotIndex)) {
        return false;
    }
    if (slotIndex === 0 && usesTitleSlot1Template(element)) {
        element.titleSlot1Anchor = anchor;
        element.titleSlot1X = x;
        element.titleSlot1Y = y;
        return true;
    }
    if (slotIndex >= 1 && slotIndex <= 3 && usesTitleMiddleStack(element)) {
        element.titleStackAnchor = anchor;
        element.titleStackX = x;
        element.titleStackY = y;
        return true;
    }
    if (slotIndex === 4 && usesTitleSlot5Template(element)) {
        element.titleSlot5Anchor = anchor;
        element.titleSlot5X = x;
        element.titleSlot5Y = y;
        return true;
    }
    return false;
}

function getDefaultSliceSlotLayout(element: HudElement, rawIndex: number): HudSliceSlot {
    const customTitleLayout = getCustomTitleSliceSlotLayout(element, rawIndex);
    if (customTitleLayout) {
        return customTitleLayout;
    }
    const columns = clamp(element.sliceColumns ?? 2, 1, 4);
    const gapX = element.sliceGapX ?? 8;
    const gapY = element.sliceGapY ?? 8;
    const column = rawIndex % columns;
    const row = Math.floor(rawIndex / columns);
    const rowWidth = columns * element.width + (columns - 1) * gapX;
    const totalRows = Math.ceil(clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS) / columns);
    const totalHeight = totalRows * element.height + Math.max(0, totalRows - 1) * gapY;
    const startX = element.x - Math.round(rowWidth / 2) + Math.round(element.width / 2);
    const startY = element.y - Math.round(totalHeight / 2) + Math.round(element.height / 2);
    return {
        anchor: element.anchor,
        x: startX + column * (element.width + gapX),
        y: startY + row * (element.height + gapY),
    };
}

function ensureSliceSlots(element: HudElement): HudSliceSlot[] {
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);
    const slots = [...(element.sliceSlots ?? [])];
    for (let rawIndex = slots.length; rawIndex < slotCount; rawIndex++) {
        slots.push(getDefaultSliceSlotLayout(element, rawIndex));
    }
    slots.length = slotCount;
    element.sliceSlots = slots;
    return slots;
}

function getSliceSlotLayout(element: HudElement, rawIndex: number): HudSliceSlot {
    return ensureSliceSlots(element)[rawIndex] ?? getDefaultSliceSlotLayout(element, rawIndex);
}

function isSliceMode(element: HudElement): boolean {
    return (element.id === "title" && element.titleMode === "slice")
        || (element.id === "subtitle" && element.subtitleMode === "slice");
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
        base.texture = getElementBackgroundTexture(element);
        return base;
    }

    base.texture = "textures/ui/white_background";
    base.color = hexToRgb(element.backgroundColor);
    return base;
}

function getElementBackgroundTexture(element: HudElement): string {
    return element.backgroundTexture || "textures/ui/hud_tip_text_background";
}

function getAutoSizedTextContainer(element: HudElement, verticalPadding: number): [string, string] | [number, number] {
    if (element.background === "none" || element.displayMode === "progress") {
        return [element.width, element.height];
    }
    return ["100%c + 10px", `100%cm + ${verticalPadding}px`];
}

function getTextLabelSize(element: HudElement): [string, string] {
    if (element.background === "none" || element.displayMode === "progress") {
        return ["100%", "default"];
    }
    return ["default", "default"];
}

function withIgnored(target: Record<string, unknown>, ignored: boolean): Record<string, unknown> {
    if (ignored) {
        target.ignored = true;
    }
    return target;
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
    const bodyControls: Record<string, unknown>[] = [];

    if (element.displayMode === "progress") {
        bodyControls.push({
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
    } else {
        const label: Record<string, unknown> = {
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
        bodyControls.push({
            title_label: label,
        });
    }

    return withIgnored({
        type: "panel",
        size: [0, 0],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        controls: [
            {
                title_body: {
                    type: element.background === "none" ? "panel" : "image",
                    size: getAutoSizedTextContainer(element, 8),
                    anchor_from: element.anchor,
                    anchor_to: element.anchor,
                    controls: bodyControls,
                    ...(element.background !== "none"
                        ? {
                            texture: element.background === "vanilla" ? getElementBackgroundTexture(element) : "textures/ui/white_background",
                            alpha: element.backgroundAlpha,
                            ...(element.background === "solid" ? { color: hexToRgb(element.backgroundColor) } : {}),
                        }
                        : {}),
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

function buildSubtitleControl(element: HudElement): Record<string, unknown> {
    const bodyControls: Record<string, unknown>[] = [];
    const dataControl: Record<string, unknown> = {
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
    };
    if (element.displayMode === "progress") {
        bodyControls.push({
            subtitle_fill: buildProgressFill("subtitle_data", "#source_text", element),
        });
    } else {
        bodyControls.push({
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
        size: [0, 0],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        controls: [
            dataControl,
            {
                subtitle_body: {
                    type: element.background === "none" ? "panel" : "image",
                    size: getAutoSizedTextContainer(element, 8),
                    anchor_from: element.anchor,
                    anchor_to: element.anchor,
                    controls: bodyControls,
                    ...(element.background !== "none"
                        ? {
                            texture: element.background === "vanilla" ? getElementBackgroundTexture(element) : "textures/ui/white_background",
                            alpha: element.backgroundAlpha,
                            ...(element.background === "solid" ? { color: hexToRgb(element.backgroundColor) } : {}),
                        }
                        : {}),
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

function sliceExpression(slotSize: number, index: number): string {
    const end = slotSize * index;
    if (index === 1) {
        return `(('%.${end}s' * #text_data) - '\t')`;
    }
    const start = slotSize * (index - 1);
    return `((('%.${end}s' * #text_data) - ('%.${start}s' * #text_data)) - '\t')`;
}

function buildSliceData(element: HudElement, bindingName: string, rawTarget: string): Record<string, unknown> {
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const bindings: Record<string, unknown>[] = [
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

function buildSubtitleSliceData(element: HudElement): Record<string, unknown> {
    return buildSliceData(element, "#hud_subtitle_text_string", "#sub_raw");
}

function buildTitleSliceData(element: HudElement): Record<string, unknown> {
    return buildSliceData(element, "#hud_title_text_string", "#title_raw");
}

function buildSliceSlotTemplate(element: HudElement, sourceControlName: string, labelPrefix: string): Record<string, unknown> {
    const controls: Record<string, unknown>[] = [];

    const label: Record<string, unknown> = {
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

    const template: Record<string, unknown> = withIgnored({
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
        template.texture = element.background === "vanilla" ? getElementBackgroundTexture(element) : "textures/ui/white_background";
        template.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            template.color = hexToRgb(element.backgroundColor);
        }
    }

    return template;
}

function buildSubtitleSlotTemplate(element: HudElement): Record<string, unknown> {
    return buildSliceSlotTemplate(element, "subtitle_data", "subtitle");
}

function buildTitleSlotTemplate(element: HudElement): Record<string, unknown> {
    return buildSliceSlotTemplate(element, "title_data", "title");
}

function buildTitleDescriptionSlotTemplate(element: HudElement, options?: {
    slotBinding?: string;
    textAlign?: HudTextAlign;
    textOffsetX?: number;
    textOffsetY?: number;
}): Record<string, unknown> {
    const textAlign = options?.textAlign ?? element.titleSlot5TextAlign ?? "left";
    const textAnchor = textAlign === "left" ? "left_middle" : textAlign === "right" ? "right_middle" : "center";
    const label: Record<string, unknown> = {
        type: "label",
        text: "#text",
        size: ["default", "default"],
        anchor_from: textAnchor,
        anchor_to: textAnchor,
        offset: [options?.textOffsetX ?? element.titleSlot5TextOffsetX ?? 5, options?.textOffsetY ?? element.titleSlot5TextOffsetY ?? 0],
        color: hexToRgb(element.textColor),
        shadow: element.shadow,
        layer: 2,
        text_alignment: textAlign,
        bindings: [
            {
                binding_type: "view",
                source_control_name: "title_data",
                source_property_name: "$slot_binding",
                target_property_name: "#text",
            },
        ],
    };

    if (element.fontSize !== "extra_large") {
        label.font_size = element.fontSize;
    }

    const template: Record<string, unknown> = withIgnored({
        type: element.background === "none" ? "panel" : "image",
        size: getAutoSizedTextContainer(element, 8),
        layer: element.layer,
        $slot_binding: options?.slotBinding ?? "#text5",
        controls: [
            {
                label,
            },
        ],
        bindings: [
            {
                binding_type: "view",
                source_control_name: "title_data",
                source_property_name: "(not ($slot_binding = ''))",
                target_property_name: "#visible",
            },
        ],
    }, element.ignored);

    if (element.background !== "none") {
        template.texture = element.background === "vanilla" ? getElementBackgroundTexture(element) : "textures/ui/white_background";
        template.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            template.color = hexToRgb(element.backgroundColor);
        }
    }

    return template;
}

function buildTitleCardStack(element: HudElement): Record<string, unknown> {
    const order = element.titleStackReverse ?? true ? [4, 3, 2] : [2, 3, 4];
    const controls: Record<string, unknown>[] = [];

    order.forEach((slotNumber, orderIndex) => {
        if ((element.sliceSlotCount ?? 1) >= slotNumber) {
            controls.push({ [`title_stack_slot${slotNumber}@hud.title_slot_template`]: { $slot_binding: `#text${slotNumber}` } });
            if (orderIndex < order.length - 1 && (element.sliceSlotCount ?? 1) >= order[orderIndex + 1]!) {
                controls.push({ [`title_stack_gap${slotNumber}@hud.title_slot_spacer`]: {} });
            }
        }
    });

    return withIgnored({
        type: "stack_panel",
        orientation: element.titleStackOrientation ?? "horizontal",
        size: [0, 0],
        anchor_from: "$anchor",
        anchor_to: "$anchor",
        offset: ["$offset_x", "$offset_y"],
        "$anchor": "top_right",
        "$offset_x": 0,
        "$offset_y": 0,
        layer: element.layer,
        controls,
    }, element.ignored);
}

function buildTitleSlotSpacer(element: HudElement): Record<string, unknown> {
    const spacer = Math.max(0, element.titleStackSpacer ?? 6);
    return withIgnored({
        type: "panel",
        size: element.titleStackOrientation === "vertical" ? [0, spacer] : [spacer, 0],
    }, element.ignored);
}

function buildTitleSlotsContainer(element: HudElement): Record<string, unknown> {
    return withIgnored({
        type: "panel",
        size: [0, 0],
        anchor_from: "$anchor",
        anchor_to: "$anchor",
        offset: ["$offset_x", "$offset_y"],
        "$anchor": element.titleStackAnchor ?? "top_right",
        "$offset_x": element.titleStackX ?? -5,
        "$offset_y": element.titleStackY ?? 5,
        controls: [
            {
                "title_slots_stack@hud.title_slots_stack": {},
            },
        ],
    }, element.ignored);
}

function buildTitleRangeStackGroup(element: HudElement, group: HudTitleSliceGroup, templateRef: string, spacerRef: string): Record<string, unknown> {
    const slotNumbers = Array.from({ length: group.end - group.start + 1 }, (_, offset) => group.start + offset);
    const ordered = group.reverse ? [...slotNumbers].reverse() : slotNumbers;
    const controls: Record<string, unknown>[] = [];

    ordered.forEach((slotNumber, index) => {
        controls.push({ [`title_group_${group.id}_slot${slotNumber}@${templateRef}`]: { $slot_binding: `#text${slotNumber}` } });
        if (index < ordered.length - 1) {
            controls.push({ [`title_group_${group.id}_gap${slotNumber}@${spacerRef}`]: {} });
        }
    });

    return withIgnored({
        type: "stack_panel",
        orientation: group.orientation,
        size: ["100%c", 0],
        anchor_from: group.anchor,
        anchor_to: group.anchor,
        controls,
    }, element.ignored);
}

function buildTitleRangeStackSpacer(element: HudElement, group: HudTitleSliceGroup): Record<string, unknown> {
    return withIgnored({
        type: "panel",
        size: group.orientation === "vertical" ? [0, group.spacer] : [group.spacer, 0],
    }, element.ignored);
}

function buildTitleRangeStackContainer(element: HudElement, group: HudTitleSliceGroup, stackRef: string): Record<string, unknown> {
    return withIgnored({
        type: "panel",
        size: [0, 0],
        anchor_from: group.anchor,
        anchor_to: group.anchor,
        offset: [group.x, group.y],
        controls: [
            {
                [`title_group_${group.id}_stack@${stackRef}`]: {},
            },
        ],
    }, element.ignored);
}

function buildActionbarControl(element: HudElement): Record<string, unknown> {
    const label: Record<string, unknown> = {
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

    const content: Record<string, unknown> = {
        type: element.background === "none" ? "panel" : "image",
        size: element.background === "none" ? [element.width, element.height] : ["100%c + 10px", "100%cm + 4px"],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
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
        content.texture = element.background === "vanilla" ? getElementBackgroundTexture(element) : "textures/ui/white_background";
        content.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            content.color = hexToRgb(element.backgroundColor);
        }
    }

    return withIgnored({
        type: "panel",
        size: [0, 0],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        $atext: "$actionbar_text",
        visible: element.prefix ? prefixMatchExpression("$atext", element.prefix) : "(not ($atext = ''))",
        controls: [
            {
                actionbar_body: content,
            },
        ],
    }, element.ignored);
}

function buildPreservedActionbarDisplay(element: HudElement): Record<string, unknown> {
    const controls: Record<string, unknown>[] = [
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
    const label: Record<string, unknown> = {
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

    const displayContent: Record<string, unknown> = {
        type: element.background === "none" ? "panel" : "image",
        size: element.background === "none" ? [element.width, element.height] : ["100%c + 10px", "100%cm + 4px"],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        layer: element.layer,
        controls: controls.slice(1),
    };

    if (element.background !== "none") {
        displayContent.texture = element.background === "vanilla" ? getElementBackgroundTexture(element) : "textures/ui/white_background";
        displayContent.alpha = element.backgroundAlpha;
        if (element.background === "solid") {
            displayContent.color = hexToRgb(element.backgroundColor);
        }
    }

    return withIgnored({
        type: "panel",
        size: [0, 0],
        anchor_from: element.anchor,
        anchor_to: element.anchor,
        offset: [element.x, element.y],
        layer: element.layer,
        controls: [
            controls[0],
            {
                preserved_actionbar_body: displayContent,
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

function buildAnimatedProgressBarTemplate(): Record<string, unknown> {
    return {
        animated_progress_bar: {
            "$duration|default": 0.2,
            "$trail_delay|default": 0.2,
            "$increase_easing|default": "out_expo",
            "$decrease_easing|default": "in_expo",
            "$texture_type|default": "",
            "$fill_from|default": "left",
            "$background_size|default": [100, 10],
            "$background_texture|default": "textures/ui/bar_bg",
            "$background_alpha|default": 1,
            "$background_color|default": [1, 1, 1],
            "$bar_size|default": ["100% - 2px", "100% - 2px"],
            "$bar_texture|default": "textures/ui/bar",
            "$bar_offset|default": [1, 1],
            "$bar_alpha|default": 1,
            "$ignore_trail|default": false,
            "$trail_texture|default": "textures/ui/white_background",
            "$trail_alpha|default": 0.6,
            "$multiplier|default": 0.05,
            "$data_source|default": "<progress_bar_data>",
            "$max_value_binding|default": "",
            "$progress_binding|default": "#progress",
            "$ignore_text|default": false,
            "$text_color|default": [1, 1, 1],
            "$text_font_scale_factor|default": 1,
            "$text_shadow|default": true,
            "$text_offset|default": [0, -12],
            "$text_anchor|default": "center",
            "$text_size|default": ["default", "default"],
            "$text_format|default": "($progress_binding + '/100')",
            type: "panel",
            size: "$background_size",
            "$one": 1.0,
            "$_fixed|default": "",
            "$_direction|default": "",
            "$_anchor|default": "top_left",
            "$_size_binding|default": "#size_binding_x",
            variables: [
                {
                    requires: "($texture_type = 'fixed')",
                    "$_fixed": "__fixed",
                },
                {
                    requires: "($fill_from = 'right')",
                    "$_anchor": "top_right",
                },
                {
                    requires: "($fill_from = 'up')",
                    "$_size_binding": "#size_binding_y",
                    "$_direction": "__vertical",
                },
                {
                    requires: "($fill_from = 'down')",
                    "$_size_binding": "#size_binding_y",
                    "$_direction": "__vertical",
                    "$_anchor": "bottom_left",
                },
            ],
            controls: [
                {
                    progress_bar_text_cx0: {
                        ignored: "$ignore_text",
                        type: "label",
                        text: "#text",
                        layer: 2,
                        anchor_from: "$text_anchor",
                        anchor_to: "$text_anchor",
                        color: "$text_color",
                        font_scale_factor: "$text_font_scale_factor",
                        shadow: "$text_shadow",
                        offset: "$text_offset",
                        size: "$text_size",
                        bindings: [
                            {
                                binding_type: "view",
                                source_control_name: "$data_source",
                                source_property_name: "$text_format",
                                target_property_name: "#text",
                            },
                        ],
                    },
                },
                {
                    bar_parent_panel_cx0: {
                        type: "panel",
                        layer: 1,
                        anchor_from: "top_left",
                        anchor_to: "top_left",
                        offset: "$bar_offset",
                        size: "$bar_size",
                        controls: [
                            {
                                animated_bar_panel_cx1: {
                                    type: "panel",
                                    anchor_from: "$_anchor",
                                    anchor_to: "$_anchor",
                                    size: ["100%", "100%"],
                                    "$control_name": "('animated_bar.animated_bar_image' + $_fixed)",
                                    property_bag: {
                                        "#prev_value": 0,
                                        "#multiplier": "$multiplier",
                                    },
                                    bindings: [
                                        {
                                            ignored: "($max_value_binding = '')",
                                            binding_type: "view",
                                            source_control_name: "$data_source",
                                            source_property_name: "$max_value_binding",
                                            target_property_name: "#max_bind",
                                        },
                                        {
                                            binding_type: "view",
                                            source_control_name: "$data_source",
                                            source_property_name: "#visible",
                                            target_property_name: "#key",
                                        },
                                        {
                                            binding_type: "view",
                                            source_control_name: "$data_source",
                                            source_property_name: "$progress_binding",
                                            target_property_name: "#changed_value",
                                        },
                                        {
                                            ignored: "($max_value_binding = '')",
                                            binding_type: "view",
                                            source_property_name: "($one / #max_bind)",
                                            target_property_name: "#multiplier",
                                        },
                                        {
                                            binding_type: "view",
                                            source_property_name: "(#prev_value * (1 - #key) + #changed_value * #key)",
                                            target_property_name: "#prev_value",
                                        },
                                        {
                                            binding_type: "view",
                                            source_property_name: "(#changed_value + (#prev_value - #changed_value) * ((#prev_value - #changed_value) < 0))",
                                            target_property_name: "#min",
                                        },
                                        {
                                            binding_type: "view",
                                            source_property_name: "((#changed_value + #prev_value - #min) * #multiplier)",
                                            target_property_name: "$_size_binding",
                                        },
                                    ],
                                    controls: [
                                        {
                                            anim_increase_cx2: {
                                                type: "collection_panel",
                                                "$size_anim": "('@animated_bar.increase_anim' + $_direction + $_fixed)",
                                                "$ignore_trail": true,
                                                factory: {
                                                    name: "anim_increase",
                                                    control_name: "$control_name",
                                                },
                                                bindings: [
                                                    {
                                                        binding_type: "view",
                                                        source_control_name: "animated_bar_panel_cx1",
                                                        resolve_sibling_scope: true,
                                                        source_property_name: "((#changed_value > #prev_value) * 1)",
                                                        target_property_name: "#collection_length",
                                                    },
                                                    {
                                                        binding_type: "view",
                                                        source_property_name: "(#collection_length * 0 = 0)",
                                                        target_property_name: "#visible",
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            anim_decrease_cx2: {
                                                type: "collection_panel",
                                                "$size_anim": "('@animated_bar.decrease_anim' + $_direction + $_fixed)",
                                                factory: {
                                                    name: "anim_decrease",
                                                    control_name: "$control_name",
                                                },
                                                bindings: [
                                                    {
                                                        binding_type: "view",
                                                        source_control_name: "animated_bar_panel_cx1",
                                                        resolve_sibling_scope: true,
                                                        source_property_name: "((#prev_value > #changed_value) * 1)",
                                                        target_property_name: "#collection_length",
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                bar_panel_cx1: {
                                    type: "image",
                                    alpha: "$bar_alpha",
                                    texture: "$bar_texture",
                                    anchor_from: "$_anchor",
                                    anchor_to: "$_anchor",
                                    size: ["100%", "100%"],
                                    clip_direction: "$fill_from",
                                    clip_pixelperfect: false,
                                    bindings: [
                                        {
                                            binding_type: "view",
                                            source_control_name: "animated_bar_panel_cx1",
                                            resolve_sibling_scope: true,
                                            source_property_name: "($one - #min * #multiplier)",
                                            target_property_name: "#clip_ratio",
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
                {
                    bar_bg_cx0: {
                        type: "image",
                        alpha: "$background_alpha",
                        layer: 0,
                        texture: "$background_texture",
                        color: "$background_color",
                    },
                },
            ],
        },
        increase_anim: { anim_type: "size", from: [0, "100%"], to: ["100%", "100%"], duration: "$duration", easing: "$increase_easing" },
        increase_anim__fixed: { anim_type: "size", from: [0, "200%"], to: ["100%", "200%"], duration: "$duration", easing: "$increase_easing" },
        increase_anim__vertical: { anim_type: "size", from: ["100%", 0], to: ["100%", "100%"], duration: "$duration", easing: "$increase_easing" },
        increase_anim__vertical__fixed: { anim_type: "size", from: ["200%", 0], to: ["200%", "100%"], duration: "$duration", easing: "$increase_easing" },
        decrease_anim: { anim_type: "size", from: ["100%", "100%"], to: [0, "100%"], duration: "$duration", easing: "$decrease_easing" },
        decrease_anim__fixed: { anim_type: "size", from: ["100%", "200%"], to: [0, "200%"], duration: "$duration", easing: "$decrease_easing" },
        decrease_anim__vertical: { anim_type: "size", from: ["100%", "100%"], to: ["100%", 0], duration: "$duration", easing: "$decrease_easing" },
        decrease_anim__vertical__fixed: { anim_type: "size", from: ["200%", "100%"], to: ["200%", 0], duration: "$duration", easing: "$decrease_easing" },
        trail_anim: { anim_type: "wait", duration: "$trail_delay", next: "('@animated_bar.decrease_anim' + $_direction)" },
        animated_bar_image: {
            type: "panel",
            size: ["100%", "100%"],
            controls: [
                {
                    bar_image_cx0: {
                        type: "image",
                        alpha: "$bar_alpha",
                        texture: "$bar_texture",
                        size: "$size_anim",
                        layer: 1,
                        anchor_from: "$_anchor",
                        anchor_to: "$_anchor",
                    },
                },
                {
                    trail_image_cx0: {
                        ignored: "$ignore_trail",
                        type: "image",
                        layer: 0,
                        size: "@animated_bar.trail_anim",
                        alpha: "$trail_alpha",
                        anchor_from: "$_anchor",
                        anchor_to: "$_anchor",
                        texture: "$trail_texture",
                    },
                },
            ],
        },
        animated_bar_image__fixed: {
            type: "panel",
            size: ["100%", "100%"],
            controls: [
                {
                    bar_image_cx0: {
                        type: "panel",
                        size: "$size_anim",
                        layer: 1,
                        anchor_from: "$_anchor",
                        anchor_to: "$_anchor",
                        clips_children: true,
                        controls: [
                            {
                                image_cx1: {
                                    type: "image",
                                    size: "$bar_size",
                                    alpha: "$bar_alpha",
                                    anchor_from: "$_anchor",
                                    anchor_to: "$_anchor",
                                    texture: "$bar_texture",
                                },
                            },
                        ],
                    },
                },
                {
                    trail_image_cx0: {
                        ignored: "$ignore_trail",
                        type: "image",
                        layer: 0,
                        size: "@animated_bar.trail_anim",
                        alpha: "$trail_alpha",
                        anchor_from: "$_anchor",
                        anchor_to: "$_anchor",
                        texture: "$trail_texture",
                    },
                },
            ],
        },
    };
}

function buildProgressBarData(bar: HudProgressBar): Record<string, unknown> {
    const sourceBinding = getBindingNameForChannel(bar.sourceChannel);
    return withIgnored({
        type: "panel",
        size: [0, 0],
        "$update_string": bar.prefix,
        bindings: [
            { binding_name: sourceBinding, binding_type: "global" },
            {
                binding_name: sourceBinding,
                binding_name_override: "#preserved_text",
                binding_condition: "visibility_changed",
                binding_type: "global",
            },
            {
                binding_type: "view",
                source_property_name: `(not (${sourceBinding} = #preserved_text) and ${getProgressBarPrefixMatchExpression(bar, sourceBinding)})`,
                target_property_name: "#visible",
            },
            {
                binding_type: "view",
                source_property_name: "((#preserved_text - $update_string) + 0)",
                target_property_name: "#progress",
            },
            {
                binding_type: "view",
                source_property_name: "((#preserved_text - ($update_string + #progress + ',')) + 0)",
                target_property_name: "#max_value",
            },
        ],
    }, bar.ignored);
}

function buildProgressBarInstance(bar: HudProgressBar): Record<string, unknown> {
    const barWidth = Math.max(1, bar.width - bar.barInsetX * 2);
    const barHeight = Math.max(1, bar.height - bar.barInsetY * 2);
    const textScale = bar.fontSize === "small" ? 0.7 : bar.fontSize === "normal" ? 1 : bar.fontSize === "large" ? 1.15 : 1.3;
    return withIgnored({
        anchor_from: bar.anchor,
        anchor_to: bar.anchor,
        offset: [bar.x, bar.y],
        layer: bar.layer,
        "$background_size": [bar.width, bar.height],
        "$bar_size": [barWidth, barHeight],
        "$bar_offset": [bar.barInsetX, bar.barInsetY],
        "$fill_from": bar.clipDirection,
        "$texture_type": bar.textureType,
        "$background_texture": bar.background === "vanilla"
            ? "textures/ui/hud_tip_text_background"
            : bar.background === "solid"
                ? "textures/ui/white_background"
                : bar.backgroundTexture,
        "$background_alpha": bar.background === "none" ? 0 : bar.backgroundAlpha,
        "$background_color": hexToRgb(bar.backgroundColor),
        "$bar_texture": bar.barTexture,
        "$trail_texture": bar.trailTexture,
        "$bar_alpha": bar.barAlpha,
        "$trail_alpha": bar.trailAlpha,
        "$ignore_trail": bar.ignoreTrail,
        "$duration": bar.duration,
        "$trail_delay": bar.trailDelay,
        "$data_source": getProgressBarDataControlName(bar),
        "$progress_binding": "#progress",
        ...(bar.maxMode === "dynamic"
            ? { "$max_value_binding": "#max_value" }
            : { "$multiplier": 1 / Math.max(1, bar.maxValue) }),
        "$ignore_text": !bar.showText,
        "$text_color": hexToRgb(bar.textColor),
        "$text_shadow": bar.shadow,
        "$text_font_scale_factor": textScale,
        "$text_offset": [0, -12],
        "$text_anchor": "center",
        "$text_size": ["default", "default"],
        "$text_format": bar.maxMode === "dynamic"
            ? "($progress_binding + '/' + $max_value_binding)"
            : `($progress_binding + '/${Math.max(1, bar.maxValue)}')`,
    }, bar.ignored);
}

function mergeVanillaHidePatch(existing: unknown, channel: HudSourceChannel, prefix: string): Record<string, unknown> {
    if (channel === "actionbar") {
        return {
            $atext: "$actionbar_text",
            visible: prefix ? `(($atext - ${quoteString(prefix)}) = $atext)` : "false",
        };
    }
    const sourceControlName = channel === "title" ? "title" : "subtitle";
    const nextBinding = {
        binding_type: "view",
        source_control_name: sourceControlName,
        source_property_name: prefix ? `((#text - ${quoteString(prefix)}) = #text)` : "false",
        target_property_name: "#visible",
    };
    const existingBindings = (existing as { bindings?: unknown[] } | undefined)?.bindings;
    return {
        bindings: Array.isArray(existingBindings) ? [...existingBindings, nextBinding] : [nextBinding],
    };
}

function buildHudJson(): string {
    const json: Record<string, unknown> = {
        namespace: "hud",
    };

    const rootInsert: Record<string, unknown>[] = [];
    const vanillaHideConditions: Record<HudSourceChannel, string[]> = {
        title: [],
        subtitle: [],
        actionbar: [],
    };

    const title = state.elements.title;
    if (title.enabled) {
        if (title.titleMode === "slice") {
            const slotCount = clamp(title.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);
            const customGroups = getTitleCustomGroups(title)
                .map((group) => ({ ...group, end: Math.min(group.end, slotCount) }))
                .filter((group) => group.start <= slotCount && group.end >= group.start);
            const useSlot1Template = usesTitleSlot1Template(title);
            const useMiddleStack = usesTitleMiddleStack(title) && slotCount >= 2;
            const useSlot5Template = usesTitleSlot5Template(title) && slotCount >= 5;

            json.title_data = buildTitleSliceData(title);
            json.title_slot_template = buildTitleSlotTemplate(title);
            const titleAnimation = buildAnimationDefinitions("title_slot_template", title);
            if (titleAnimation.entryAnimation) {
                (json.title_slot_template as Record<string, unknown>).alpha = `@hud.${titleAnimation.entryAnimation}`;
            }
            Object.assign(json, titleAnimation.definitions);
            rootInsert.push({ "title_data@hud.title_data": {} });

            if (customGroups.length > 0) {
                const groupedSlots = new Set<number>();

                customGroups.forEach((group) => {
                    for (let slotNumber = group.start; slotNumber <= group.end; slotNumber++) {
                        groupedSlots.add(slotNumber);
                    }

                    const templateKey = `title_group_${group.id}_template`;
                    const spacerKey = `title_group_${group.id}_spacer`;
                    const stackKey = `title_group_${group.id}_stack`;
                    const containerKey = `title_group_${group.id}_container`;

                    if (group.mode === "description") {
                        json[templateKey] = buildTitleDescriptionSlotTemplate(title, {
                            slotBinding: `#text${group.start}`,
                            textAlign: group.textAlign,
                            textOffsetX: group.textOffsetX,
                            textOffsetY: group.textOffsetY,
                        });
                        if (titleAnimation.entryAnimation) {
                            (json[templateKey] as Record<string, unknown>).alpha = `@hud.${titleAnimation.entryAnimation}`;
                        }
                        rootInsert.push({
                            [`title_group_${group.id}@hud.${templateKey}`]: {
                                $slot_binding: `#text${group.start}`,
                                anchor_from: group.anchor,
                                anchor_to: group.anchor,
                                offset: [group.x, group.y],
                            },
                        });
                        return;
                    }

                    if (group.mode === "single_template") {
                        json[templateKey] = buildTitleSlotTemplate(title);
                        if (titleAnimation.entryAnimation) {
                            (json[templateKey] as Record<string, unknown>).alpha = `@hud.${titleAnimation.entryAnimation}`;
                        }
                        for (let slotNumber = group.start; slotNumber <= group.end; slotNumber++) {
                            rootInsert.push({
                                [`title_group_${group.id}_slot${slotNumber}@hud.${templateKey}`]: {
                                    $slot_binding: `#text${slotNumber}`,
                                    anchor_from: group.anchor,
                                    anchor_to: group.anchor,
                                    offset: [group.x, group.y],
                                },
                            });
                        }
                        return;
                    }

                    if (group.mode === "stack") {
                        json[spacerKey] = buildTitleRangeStackSpacer(title, group);
                        json[stackKey] = buildTitleRangeStackGroup(title, group, "hud.title_slot_template", `hud.${spacerKey}`);
                        json[containerKey] = buildTitleRangeStackContainer(title, group, `hud.${stackKey}`);
                        rootInsert.push({
                            [`title_group_${group.id}@hud.${containerKey}`]: {},
                        });
                        return;
                    }

                    for (let slotNumber = group.start; slotNumber <= group.end; slotNumber++) {
                        rootInsert.push({
                            [`title_slot${slotNumber}@hud.title_slot_template`]: {
                                $slot_binding: `#text${slotNumber}`,
                                anchor_from: group.anchor,
                                anchor_to: group.anchor,
                                offset: [group.x, group.y],
                            },
                        });
                    }
                });

                for (let index = 1; index <= slotCount; index++) {
                    if (groupedSlots.has(index)) {
                        continue;
                    }
                    const slotLayout = getSliceSlotLayout(title, index - 1);
                    rootInsert.push({
                        [`title_slot${index}@hud.title_slot_template`]: {
                            $slot_binding: `#text${index}`,
                            anchor_from: slotLayout.anchor,
                            anchor_to: slotLayout.anchor,
                            offset: [slotLayout.x, slotLayout.y],
                        },
                    });
                }
            } else {
                if (useSlot5Template) {
                    json.title_slot5_template = buildTitleDescriptionSlotTemplate(title);
                }
                if (useSlot1Template) {
                    json.title_slot1_template = buildTitleSlotTemplate(title);
                }
                if (useMiddleStack) {
                    json.title_slot_spacer = buildTitleSlotSpacer(title);
                    json.title_slots_stack = buildTitleCardStack(title);
                    json.title_slots_container = buildTitleSlotsContainer(title);
                }
                if (useSlot5Template && titleAnimation.entryAnimation) {
                    (json.title_slot5_template as Record<string, unknown>).alpha = `@hud.${titleAnimation.entryAnimation}`;
                }

                for (let index = 1; index <= slotCount; index++) {
                    if (index === 1 && useSlot1Template) {
                        const slotLayout = getSliceSlotLayout(title, 0);
                        rootInsert.push({
                            "title_slot1@hud.title_slot1_template": {
                                anchor_from: slotLayout.anchor,
                                anchor_to: slotLayout.anchor,
                                offset: [slotLayout.x, slotLayout.y],
                            },
                        });
                        continue;
                    }

                    if (index >= 2 && index <= 4 && useMiddleStack) {
                        if (index === 2) {
                            rootInsert.push({
                                "title_slots_container@hud.title_slots_container": {},
                            });
                        }
                        continue;
                    }

                    if (index === 5 && useSlot5Template) {
                        const descriptionLayout = getSliceSlotLayout(title, 4);
                        rootInsert.push({
                            "title_slot5@hud.title_slot5_template": {
                                $slot_binding: "#text5",
                                anchor_from: descriptionLayout.anchor,
                                anchor_to: descriptionLayout.anchor,
                                offset: [descriptionLayout.x, descriptionLayout.y],
                            },
                        });
                        continue;
                    }

                    const slotLayout = getSliceSlotLayout(title, index - 1);
                    rootInsert.push({
                        [`title_slot${index}@hud.title_slot_template`]: {
                            $slot_binding: `#text${index}`,
                            anchor_from: slotLayout.anchor,
                            anchor_to: slotLayout.anchor,
                            offset: [slotLayout.x, slotLayout.y],
                        },
                    });
                }
            }
        } else {
            json.title_control = buildTitleControl(title);
            const titleAnimation = buildAnimationDefinitions("title_control", title);
            if (titleAnimation.entryAnimation) {
                (json.title_control as Record<string, unknown>).alpha = `@hud.${titleAnimation.entryAnimation}`;
            }
            Object.assign(json, titleAnimation.definitions);
            rootInsert.push({ "title_ctrl@hud.title_control": {} });
        }

        if (title.hideVanilla) {
            vanillaHideConditions.title.push(title.prefix ? `((#text - ${quoteString(title.prefix)}) = #text)` : "false");
        }
    }

    const subtitle = state.elements.subtitle;
    if (subtitle.enabled) {
        if (subtitle.subtitleMode === "slice") {
            const slotCount = clamp(subtitle.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);

            json.subtitle_data = buildSubtitleSliceData(subtitle);
            json.subtitle_slot_template = buildSubtitleSlotTemplate(subtitle);
            const subtitleAnimation = buildAnimationDefinitions("subtitle_slot_template", subtitle);
            if (subtitleAnimation.entryAnimation) {
                (json.subtitle_slot_template as Record<string, unknown>).alpha = `@hud.${subtitleAnimation.entryAnimation}`;
            }
            Object.assign(json, subtitleAnimation.definitions);
            rootInsert.push({ "subtitle_data@hud.subtitle_data": {} });

            for (let index = 1; index <= slotCount; index++) {
                const slotLayout = getSliceSlotLayout(subtitle, index - 1);
                rootInsert.push({
                    [`sub_slot${index}@hud.subtitle_slot_template`]: {
                        $slot_binding: `#text${index}`,
                        anchor_from: slotLayout.anchor,
                        anchor_to: slotLayout.anchor,
                        offset: [slotLayout.x, slotLayout.y],
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
            vanillaHideConditions.subtitle.push(subtitle.prefix ? `((#text - ${quoteString(subtitle.prefix)}) = #text)` : "false");
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

        if (actionbar.preserve) {
            json.preserved_actionbar_display = buildPreservedActionbarDisplay(actionbar);
            rootInsert.unshift({ "preserved_actionbar@hud.preserved_actionbar_display": {} });
        }

        if (actionbar.hideVanilla) {
            vanillaHideConditions.actionbar.push(actionbar.prefix ? `(($atext - ${quoteString(actionbar.prefix)}) = $atext)` : "false");
        }
    }

    const progressBars = state.progressBars.filter((bar) => bar.enabled);
    if (progressBars.length > 0) {
        for (const bar of progressBars) {
            const dataKey = getProgressBarDataControlName(bar);
            const insertKey = getProgressBarInsertName(bar);
            rootInsert.push({ [`${dataKey}@animated_bar.${dataKey}`]: {} });
            rootInsert.push({
                [`${insertKey}@animated_bar.animated_progress_bar`]: buildProgressBarInstance(bar),
            });
            if (bar.hideVanilla) {
                if (bar.sourceChannel === "actionbar") {
                    vanillaHideConditions.actionbar.push(bar.prefix ? `(($atext - ${quoteString(bar.prefix)}) = $atext)` : "false");
                } else {
                    vanillaHideConditions[bar.sourceChannel].push(bar.prefix ? `((#text - ${quoteString(bar.prefix)}) = #text)` : "false");
                }
            }
        }
    }

    if (vanillaHideConditions.title.length > 0) {
        json["hud_title_text/title_frame"] = {
            bindings: [
                {
                    binding_type: "view",
                    source_control_name: "title",
                    source_property_name: vanillaHideConditions.title.map((expression) => `(${expression})`).join(" and "),
                    target_property_name: "#visible",
                },
            ],
        };
    }

    if (vanillaHideConditions.subtitle.length > 0) {
        json["hud_title_text/subtitle_frame"] = {
            bindings: [
                {
                    binding_type: "view",
                    source_control_name: "subtitle",
                    source_property_name: vanillaHideConditions.subtitle.map((expression) => `(${expression})`).join(" and "),
                    target_property_name: "#visible",
                },
            ],
        };
    }

    if (vanillaHideConditions.actionbar.length > 0) {
        json["hud_actionbar_text"] = {
            $atext: "$actionbar_text",
            visible: vanillaHideConditions.actionbar.map((expression) => `(${expression})`).join(" and "),
        };
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

function buildAnimatedBarJson(): string {
    const json: Record<string, unknown> = {
        namespace: "animated_bar",
        ...buildAnimatedProgressBarTemplate(),
    };

    for (const bar of state.progressBars.filter((entry) => entry.enabled)) {
        json[getProgressBarDataControlName(bar)] = buildProgressBarData(bar);
    }

    return JSON.stringify(json, null, 2);
}

function buildUiDefsJson(): string {
    return JSON.stringify({
        ui_defs: [
            "ui/animated_bar.json",
        ],
    }, null, 2);
}

function hasEnabledProgressBars(): boolean {
    return state.progressBars.some((bar) => bar.enabled);
}

export type HudEditorPreviewGuide = {
    id: "title" | "subtitle" | "actionbar";
    label: string;
    left: number;
    top: number;
    width: number;
    height: number;
};

export type HudEditorPreviewItem = {
    id: string;
    kind: "channel" | "progressBar" | "slice";
    slotIndex?: number;
    left: number;
    top: number;
    width: number;
    height: number;
    layer: number;
    selected: boolean;
    withBg: boolean;
    ignored: boolean;
    background: HudBackground;
    backgroundColor: string;
    backgroundAlpha: number;
    text: string;
    textAlign?: "left" | "center" | "right";
    textColor: string;
    shadow: boolean;
    fontSize: HudFontSize;
    animationPreset?: HudAnimationPreset;
    fill?: {
        left: string;
        top: string;
        width: string;
        height: string;
        color: string;
    };
};

export type HudEditorScriptHelper = {
    key: string;
    title: string;
    content: string;
    copyText: string;
    notice: string;
};

export type HudEditorSnapshot = {
    state: HudEditorState;
    selectedElement: HudElement | HudProgressBar;
    previewScale: number;
    canvasBackgroundUrl: string;
    activeGuideAnchor: HudAnchor;
    guides: HudEditorPreviewGuide[];
    previewItems: HudEditorPreviewItem[];
    hudJson: string;
    animatedBarJson: string;
    uiDefsJson: string;
    hasEnabledProgressBars: boolean;
    scriptHelpers: HudEditorScriptHelper[];
};

function notifyHudEditorStore(): void {
    hudEditorStoreListeners.forEach((listener) => listener());
}

export function subscribeHudEditorStore(listener: () => void): () => void {
    hudEditorStoreListeners.add(listener);
    return () => hudEditorStoreListeners.delete(listener);
}

export function getHudEditorCanvasBackgroundUrl(): string {
    const mainWindow = document.getElementById("main_window");
    const bgImage = mainWindow?.querySelector(".bg_image") as HTMLImageElement | null;
    return bgImage?.src || assetUrl("background.png");
}

export function getHudEditorSnapshot(): HudEditorSnapshot {
    const selectedElement = getSelectedElement();
    const titleGuide = computePreviewRect({ ...state.elements.title, x: 0, y: 130, width: 440, height: 56, anchor: "top_middle" });
    const subtitleGuide = computePreviewRect({ ...state.elements.subtitle, x: 0, y: 190, width: 380, height: 42, anchor: "top_middle" });
    const actionbarGuide = computePreviewRect({ ...state.elements.actionbar, x: 0, y: -96, width: 340, height: 38, anchor: "bottom_middle" });
    const activeGuideAnchor = !isProgressBarElement(selectedElement) && isSliceMode(selectedElement) && typeof state.drag?.slotIndex === "number" && state.drag.id === selectedElement.id
        ? (getCustomTitleSliceSlotLayout(selectedElement, state.drag.slotIndex)
            ? getCustomTitleSliceSlotLayout(selectedElement, state.drag.slotIndex)!.anchor
            : ensureSliceSlots(selectedElement)[state.drag.slotIndex]?.anchor ?? selectedElement.anchor)
        : selectedElement.anchor;

    const previewItems = [
        ...Object.values(state.elements),
        ...state.progressBars,
    ].filter((element) => element.enabled).flatMap((element): HudEditorPreviewItem[] => {
        if (!isProgressBarElement(element) && isSliceMode(element)) {
            const slotCount = clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);
            const slotTexts = previewSliceSlotTexts(element);
            return Array.from({ length: slotCount }, (_, rawIndex) => {
                const slotLayout = getSliceSlotLayout(element, rawIndex);
                const rect = computePreviewRect({
                    ...element,
                    anchor: slotLayout.anchor,
                    x: slotLayout.x,
                    y: slotLayout.y,
                });
                const customGroup = element.id === "title" ? findTitleCustomGroupForSlot(element, rawIndex) : null;
                const textAlign = customGroup?.mode === "description"
                    ? customGroup.textAlign
                    : (element.id === "title" && usesTitleSlot5Template(element) && rawIndex === 4
                        ? (element.titleSlot5TextAlign ?? "left")
                        : "center");
                return {
                    id: element.id,
                    kind: "slice",
                    slotIndex: rawIndex,
                    left: rect.left,
                    top: rect.top,
                    width: element.width,
                    height: element.height,
                    layer: element.layer,
                    selected: element.id === state.selectedId,
                    withBg: element.background !== "none",
                    ignored: element.ignored,
                    background: element.background,
                    backgroundColor: element.backgroundColor,
                    backgroundAlpha: element.backgroundAlpha,
                    text: slotTexts[rawIndex] || `슬롯 ${rawIndex + 1}`,
                    textAlign,
                    textColor: element.textColor,
                    shadow: element.shadow,
                    fontSize: element.fontSize,
                };
            });
        }

        const rect = computePreviewRect(element);
        const progressValues = isProgressBarElement(element)
            ? previewProgressBarValues(element)
            : { current: previewNumericValue(element), max: Math.max(1, element.maxValue || 1) };
        const fillRatio = clamp(progressValues.current / Math.max(1, progressValues.max), 0, 1);
        const fillWidth = element.clipDirection === "up" || element.clipDirection === "down"
            ? "100%"
            : `${fillRatio * 100}%`;
        const fillHeight = element.clipDirection === "up" || element.clipDirection === "down"
            ? `${fillRatio * 100}%`
            : "100%";
        const fillLeft = element.clipDirection === "right" ? `${(1 - fillRatio) * 100}%` : "0";
        const fillTop = element.clipDirection === "up" ? `${(1 - fillRatio) * 100}%` : "0";

        return [{
            id: element.id,
            kind: isProgressBarElement(element) ? "progressBar" : "channel",
            left: rect.left,
            top: rect.top,
            width: element.width,
            height: element.height,
            layer: element.layer,
            selected: element.id === state.selectedId,
            withBg: element.background !== "none",
            ignored: element.ignored,
            background: element.background,
            backgroundColor: element.backgroundColor,
            backgroundAlpha: element.backgroundAlpha,
            text: isProgressBarElement(element)
                ? (element.showText ? `${progressValues.current} / ${progressValues.max}` : element.label)
                : (element.displayMode === "progress" && element.id !== "actionbar"
                    ? `${progressValues.current} / ${progressValues.max}`
                    : previewElementText(element)),
            textAlign: "center",
            textColor: element.textColor,
            shadow: element.shadow,
            fontSize: element.fontSize,
            animationPreset: !isProgressBarElement(element) ? element.animationPreset : undefined,
            fill: isProgressBarElement(element) || (element.displayMode === "progress" && element.id !== "actionbar")
                ? {
                    left: fillLeft,
                    top: fillTop,
                    width: fillWidth,
                    height: fillHeight,
                    color: element.fillColor,
                }
                : undefined,
        }];
    });

    const scriptHelpers: HudEditorScriptHelper[] = [];
    if (state.elements.title.enabled && state.elements.title.titleMode === "slice") {
        scriptHelpers.push({
            key: "title-slice",
            title: "Title Script Helper",
            content: buildTitleSliceScriptHelper(state.elements.title),
            copyText: buildTitleSliceScriptHelper(state.elements.title),
            notice: "Title Script helper를 클립보드에 복사했습니다.",
        });
    }
    if (state.elements.subtitle.enabled && state.elements.subtitle.subtitleMode === "slice") {
        scriptHelpers.push({
            key: "subtitle-slice",
            title: "Subtitle Script Helper",
            content: buildSubtitleSliceScriptHelper(state.elements.subtitle),
            copyText: buildSubtitleSliceScriptHelper(state.elements.subtitle),
            notice: "Subtitle Script helper를 클립보드에 복사했습니다.",
        });
    }
    for (const bar of state.progressBars.filter((entry) => entry.enabled)) {
        const helper = buildProgressBarScriptHelper(bar);
        scriptHelpers.push({
            key: `progress-${bar.id}`,
            title: `${bar.label} Script Helper`,
            content: helper,
            copyText: helper,
            notice: `${bar.label} Script helper를 클립보드에 복사했습니다.`,
        });
    }

    return {
        state,
        selectedElement,
        previewScale: getPreviewScale(),
        canvasBackgroundUrl: getHudEditorCanvasBackgroundUrl(),
        activeGuideAnchor,
        guides: [
            { id: "title", label: "바닐라 타이틀", left: titleGuide.left, top: titleGuide.top, width: 440, height: 56 },
            { id: "subtitle", label: "바닐라 서브타이틀", left: subtitleGuide.left, top: subtitleGuide.top, width: 380, height: 42 },
            { id: "actionbar", label: "바닐라 액션바", left: actionbarGuide.left, top: actionbarGuide.top, width: 340, height: 38 },
        ],
        previewItems,
        hudJson: buildHudJson(),
        animatedBarJson: buildAnimatedBarJson(),
        uiDefsJson: buildUiDefsJson(),
        hasEnabledProgressBars: hasEnabledProgressBars(),
        scriptHelpers,
    };
}

function setSelectedElementValue(field: string, value: string | number | boolean): void {
    const element = getSelectedElement();
    if (isProgressBarElement(element)) {
        const target = element as Record<string, unknown>;
        target[field] = value;
        return;
    }

    const target = element as Record<string, unknown>;
    const previousX = element.x;
    const previousY = element.y;
    target[field] = value;

    if (isSliceMode(element)) {
        const slots = ensureSliceSlots(element);
        if (field === "x") {
            const delta = element.x - previousX;
            element.sliceSlots = slots.map((slot) => ({ ...slot, x: slot.x + delta }));
        } else if (field === "y") {
            const delta = element.y - previousY;
            element.sliceSlots = slots.map((slot) => ({ ...slot, y: slot.y + delta }));
        } else if (field === "anchor") {
            element.sliceSlots = slots.map((slot) => ({ ...slot, anchor: element.anchor }));
        }
    }
}

export function selectHudEditorItem(id: string): void {
    state.selectedId = id;
    notifyHudEditorStore();
}

export function addHudEditorProgressBar(): void {
    const id = `progress_bar_${state.nextProgressBarId}`;
    state.nextProgressBarId += 1;
    const bar = createDefaultProgressBar(id, `Progress ${state.progressBars.length + 1}`);
    state.progressBars.push(bar);
    state.selectedId = bar.id;
    notifyHudEditorStore();
}

export function deleteHudEditorProgressBar(id: string): void {
    state.progressBars = state.progressBars.filter((bar) => bar.id !== id);
    if (state.selectedId === id) {
        state.selectedId = "title";
    }
    notifyHudEditorStore();
}

export function updateSelectedHudEditorField(field: string, value: string | number | boolean): void {
    setSelectedElementValue(field, value);
    notifyHudEditorStore();
}

export function updateHudEditorSliceSlot(slotIndex: number, field: keyof HudSliceSlot, value: number | HudAnchor): void {
    const element = getSelectedElement();
    if (isProgressBarElement(element)) {
        return;
    }
    const slots = ensureSliceSlots(element);
    const slot = slots[slotIndex];
    if (!slot) {
        return;
    }
    slot[field] = value as never;
    notifyHudEditorStore();
}

export function addHudEditorSliceSlot(targetId: HudChannel): void {
    const target = state.elements[targetId];
    target.sliceSlotCount = clamp((target.sliceSlotCount ?? 1) + 1, 1, MAX_SLICE_SLOTS);
    ensureSliceSlots(target);
    notifyHudEditorStore();
}

export function removeHudEditorSliceSlot(targetId: HudChannel): void {
    const target = state.elements[targetId];
    target.sliceSlotCount = clamp((target.sliceSlotCount ?? 1) - 1, 1, MAX_SLICE_SLOTS);
    ensureSliceSlots(target);
    notifyHudEditorStore();
}

export function setHudEditorAutoFitPreview(enabled: boolean): void {
    state.autoFitPreview = enabled;
    notifyHudEditorStore();
}

export function setHudEditorPreviewZoom(zoom: number): void {
    state.autoFitPreview = false;
    state.previewZoom = zoom;
    notifyHudEditorStore();
}

export function toggleHudEditorGuides(): void {
    state.showAnchorGuides = !state.showAnchorGuides;
    notifyHudEditorStore();
}

export function toggleHudEditorAutoAnchorSnap(): void {
    state.autoAnchorSnap = !state.autoAnchorSnap;
    notifyHudEditorStore();
}

export function startHudEditorDrag(id: string, clientX: number, clientY: number, slotIndex?: number): void {
    const element = state.elements[id as HudChannel] ?? getProgressBarById(id);
    if (!element) {
        return;
    }
    if (!isProgressBarElement(element) && isSliceMode(element) && !Number.isFinite(slotIndex as number)) {
        return;
    }
    state.selectedId = id;
    state.drag = {
        id,
        startMouseX: clientX,
        startMouseY: clientY,
        startX: element.x,
        startY: element.y,
        slotIndex: Number.isFinite(slotIndex as number) ? slotIndex : undefined,
        startSliceSlots: !isProgressBarElement(element) && isSliceMode(element)
            ? Array.from({ length: clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS) }, (_, rawIndex) => ({ ...getSliceSlotLayout(element, rawIndex) }))
            : undefined,
    };
    notifyHudEditorStore();
}

export function copyHudEditorText(content: string, notice: string): Promise<void> {
    return navigator.clipboard.writeText(content).then(() => {
        new Notification(notice, 2200, "notif");
    });
}

export function downloadHudEditorJsonFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    new Notification(`${filename}을 다운로드했습니다.`, 2200, "notif");
}

export function downloadHudEditorPackageZip(hudJson: string, animatedBarJson: string, uiDefsJson: string, includeProgressFiles: boolean): void {
    const encoder = new TextEncoder();
    const entries: ZipEntry[] = [
        {
            name: "ui/hud_screen.json",
            data: encoder.encode(hudJson),
        },
    ];

    if (includeProgressFiles) {
        entries.push(
            {
                name: "ui/animated_bar.json",
                data: encoder.encode(animatedBarJson),
            },
            {
                name: "ui/_ui_defs.json",
                data: encoder.encode(uiDefsJson),
            },
        );
    }

    const blob = createZipBlob(entries);
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = includeProgressFiles ? "hud_with_progress_bar.zip" : "hud_screen_package.zip";
    link.click();
    URL.revokeObjectURL(url);
    new Notification(includeProgressFiles ? "HUD + Progress Bar 패키지를 다운로드했습니다." : "HUD 패키지를 다운로드했습니다.", 2400, "notif");
}

export function resetHudEditorState(): void {
    state.selectedId = "title";
    state.autoFitPreview = true;
    state.previewZoom = 1;
    state.progressBars = [];
    state.nextProgressBarId = 1;
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
        backgroundTexture: "textures/ui/hud_tip_text_background",
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
        titleSliceLayout: "free",
        titleUseSlot1Template: false,
        titleUseStackForMiddleSlots: false,
        titleUseSlot5Template: false,
        titleCustomGroupsEnabled: false,
        titleCustomGroupsText: "",
        titleSlot1Anchor: "right_middle",
        titleSlot1X: 0,
        titleSlot1Y: -25,
        titleStackAnchor: "top_right",
        titleStackX: -5,
        titleStackY: 5,
        titleStackOrientation: "horizontal",
        titleStackReverse: true,
        titleStackSpacer: 6,
        titleSlot5Anchor: "bottom_middle",
        titleSlot5X: 10,
        titleSlot5Y: -50,
        titleSlot5TextAlign: "left",
        titleSlot5TextOffsetX: 5,
        titleSlot5TextOffsetY: 0,
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
        backgroundTexture: "textures/ui/hud_tip_text_background",
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
        backgroundTexture: "textures/ui/hud_tip_text_background",
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
    notifyHudEditorStore();
    new Notification("HUD를 바닐라 기본 위치로 초기화했습니다.", 2200, "notif");
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

function getAnchorOffset(anchor: HudAnchor, width: number, height: number): { x: number; y: number } {
    const horizontal = anchor.endsWith("left") ? 0 : anchor.endsWith("right") ? width : width / 2;
    const vertical = anchor.startsWith("top") ? 0 : anchor.startsWith("bottom") ? height : height / 2;
    return { x: horizontal, y: vertical };
}

function getAnchorForPoint(x: number, y: number): HudAnchor {
    const col = x < PREVIEW_WIDTH / 3 ? "left" : x < (PREVIEW_WIDTH * 2) / 3 ? "middle" : "right";
    const row = y < PREVIEW_HEIGHT / 3 ? "top" : y < (PREVIEW_HEIGHT * 2) / 3 ? "middle" : "bottom";
    return `${row}_${col}`.replace("middle_left", "left_middle").replace("middle_middle", "center").replace("middle_right", "right_middle") as HudAnchor;
}

function getOffsetFromTopLeft(anchor: HudAnchor, left: number, top: number, width: number, height: number): { x: number; y: number } {
    const base = getAnchorReference(anchor);
    const anchorOffset = getAnchorOffset(anchor, width, height);
    return {
        x: Math.round(left + anchorOffset.x - base.x),
        y: Math.round(top + anchorOffset.y - base.y),
    };
}

function snapElementAnchor(element: HudElement | HudProgressBar): void {
    const rect = computePreviewRect(element);
    const centerX = rect.left + element.width / 2;
    const centerY = rect.top + element.height / 2;
    const nextAnchor = getAnchorForPoint(centerX, centerY);
    const nextOffset = getOffsetFromTopLeft(nextAnchor, rect.left, rect.top, element.width, element.height);
    element.anchor = nextAnchor;
    element.x = nextOffset.x;
    element.y = nextOffset.y;
}

function snapSliceSlotAnchor(element: HudElement, slotIndex: number): void {
    const slot = getCustomTitleSliceSlotLayout(element, slotIndex)
        ?? ensureSliceSlots(element)[slotIndex];
    if (!slot) return;
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
    if (applyCustomTitleSliceSlotPosition(element, slotIndex, nextAnchor, nextOffset.x, nextOffset.y)) {
        return;
    } else {
        slot.anchor = nextAnchor;
        slot.x = nextOffset.x;
        slot.y = nextOffset.y;
    }
}

function computePreviewRect(element: HudCanvasItem | HudElement | HudProgressBar): { left: number; top: number } {
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
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);
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

function previewProgressBarValues(bar: HudProgressBar): { current: number; max: number } {
    const source = bar.sampleText.startsWith(bar.prefix) ? bar.sampleText.slice(bar.prefix.length) : bar.sampleText;
    const [currentRaw, maxRaw] = source.split(",", 2);
    const current = Number.parseFloat((currentRaw ?? "").trim());
    const dynamicMax = Number.parseFloat((maxRaw ?? "").trim());
    return {
        current: Number.isFinite(current) ? current : 0,
        max: bar.maxMode === "dynamic" && Number.isFinite(dynamicMax) ? dynamicMax : Math.max(1, bar.maxValue),
    };
}

function buildSubtitleSliceScriptHelper(element: HudElement): string {
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);
    const args = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");
    const slotArray = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");

    return `function pad(text, size = ${slotSize}) {
  const safe = String(text ?? "");
  return safe + "\\t".repeat(Math.max(0, size - safe.length));
}

function sendSubtitleSlots(player, ${args}) {
  const data = [${slotArray}].map((slot) => pad(slot, ${slotSize})).join("");
  const clearPayload = JSON.stringify({ rawtext: [{ text: "" }] });
  const subtitlePayload = JSON.stringify({ rawtext: [{ text: data }] });
  player.runCommand(\`titleraw @s title \${clearPayload}\`);
  player.runCommand(\`titleraw @s subtitle \${subtitlePayload}\`);
}`;
}

function buildTitleSliceScriptHelper(element: HudElement): string {
    const slotSize = clamp(element.sliceSlotSize ?? 20, 1, 200);
    const slotCount = clamp(element.sliceSlotCount ?? 1, 1, MAX_SLICE_SLOTS);
    const args = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");
    const slotArray = Array.from({ length: slotCount }, (_, index) => `slot${index + 1}`).join(", ");
    const prefix = element.prefix ? JSON.stringify(element.prefix) : '""';

    return `function pad(text, size = ${slotSize}) {
  const safe = String(text ?? "");
  return safe + "\\t".repeat(Math.max(0, size - safe.length));
}

function sendTitleSlots(player, ${args}) {
  const data = ${prefix} + [${slotArray}].map((slot) => pad(slot, ${slotSize})).join("");
  const payload = JSON.stringify({ rawtext: [{ text: data }] });
  player.runCommand(\`titleraw @s title \${payload}\`);
}`;
}

function buildProgressBarScriptHelper(bar: HudProgressBar): string {
    const fixedTail = bar.maxMode === "dynamic" ? ", maxValue" : "";
    const maxExpression = bar.maxMode === "dynamic" ? ",${maxValue}" : "";
    return `function send${bar.id.replace(/[^a-zA-Z0-9]/g, "")}Bar(player, currentValue${fixedTail}) {
  const value = ${quoteString(bar.prefix)} + currentValue${maxExpression};
  const payload = JSON.stringify({ rawtext: [{ text: value }] });
  player.runCommand(\`titleraw @s ${bar.sourceChannel} \${payload}\`);
}`;
}

function renderAll(): void {
    notifyHudEditorStore();
}

function attachDragHandlers(): () => void {
    const modal = getModal();
    const previousOnMouseMove = modal.onmousemove;
    const previousOnMouseUp = modal.onmouseup;
    const previousOnMouseLeave = modal.onmouseleave;
    const previousWindowOnMouseUp = window.onmouseup;
    const finishDrag = () => {
        if (!state.drag) return;
        const element = state.elements[state.drag.id as HudChannel] ?? getProgressBarById(state.drag.id);
        if (!element) return;
        if (state.autoAnchorSnap) {
            if (!isProgressBarElement(element) && isSliceMode(element) && typeof state.drag.slotIndex === "number") {
                snapSliceSlotAnchor(element, state.drag.slotIndex);
            } else {
                snapElementAnchor(element);
            }
        }
        state.drag = null;
        renderAll();
    };

    modal.onmousemove = (event: MouseEvent) => {
        if (!state.drag) return;
        const element = state.elements[state.drag.id as HudChannel] ?? getProgressBarById(state.drag.id);
        if (!element) return;
        const deltaX = Math.round(event.clientX - state.drag.startMouseX);
        const deltaY = Math.round(event.clientY - state.drag.startMouseY);
        if (!isProgressBarElement(element) && isSliceMode(element) && state.drag.startSliceSlots) {
            if (typeof state.drag.slotIndex !== "number") {
                return;
            }
            const baseSlot = state.drag.startSliceSlots[state.drag.slotIndex];
            if (!baseSlot) {
                return;
            }
            if (applyCustomTitleSliceSlotPosition(
                element,
                state.drag.slotIndex,
                baseSlot.anchor,
                baseSlot.x + deltaX,
                baseSlot.y + deltaY,
            )) {
                // handled by custom title slice layout controls
            } else {
                element.sliceSlots = state.drag.startSliceSlots.map((slot, index) => index === state.drag?.slotIndex
                    ? {
                        ...slot,
                        x: slot.x + deltaX,
                        y: slot.y + deltaY,
                    }
                    : { ...slot });
            }
        } else {
            element.x = Math.round(state.drag.startX + deltaX);
            element.y = Math.round(state.drag.startY + deltaY);
        }
        renderAll();
    };

    modal.onmouseup = finishDrag;
    window.onmouseup = finishDrag;

    modal.onmouseleave = finishDrag;

    return () => {
        modal.onmousemove = previousOnMouseMove;
        modal.onmouseup = previousOnMouseUp;
        modal.onmouseleave = previousOnMouseLeave;
        window.onmouseup = previousWindowOnMouseUp;
    };
}

function mountHudEditor(): void {
    cleanupHudEditorSession?.();
    const detachDragHandlers = attachDragHandlers();
    renderAll();
    cleanupHudEditorSession = () => {
        state.drag = null;
        detachDragHandlers();
    };
}

export async function hudEditorModal(): Promise<void> {
    if (activeHudEditorPromise) {
        return activeHudEditorPromise;
    }

    await waitForHudEditorHost();
    mountHudEditor();
    document.body.style.overflow = "hidden";

    activeHudEditorPromise = new Promise((resolve) => {
        const handleResize = () => renderAll();
        const previousCleanup = cleanupHudEditorSession;
        const closeButton = getCloseButton();
        const previousCloseHandler = closeButton.onclick;
        const unsubscribe = subscribeHudEditorModalBridge((event) => {
            if (event.type !== "close") {
                return;
            }

            unsubscribe();
            cleanupHudEditorSession?.();
            cleanupHudEditorSession = null;
            document.body.style.overflow = "";
            activeHudEditorPromise = null;
            resolve();
        });

        window.addEventListener("resize", handleResize);
        closeButton.onclick = () => closeHudEditorBridge();
        cleanupHudEditorSession = () => {
            previousCleanup?.();
            closeButton.onclick = previousCloseHandler;
            window.removeEventListener("resize", handleResize);
        };
    });

    openHudEditorBridge();

    return activeHudEditorPromise;
}
