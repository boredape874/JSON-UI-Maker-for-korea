import { config } from "./CONFIG.js";
import { SavedConfig, StringObjectMap } from "./converter.js";
import { syncJsonTypeNamespaces } from "./converterTypes/jsonUITypes.js";
import { DraggableButton } from "./elements/button.js";
import { DraggableCanvas } from "./elements/canvas.js";
import { DraggableCollectionPanel } from "./elements/collectionPanel.js";
import { DraggableLabel } from "./elements/label.js";
import { DraggablePanel } from "./elements/panel.js";
import { DraggableScrollingPanel } from "./elements/scrollingPanel.js";
import { DraggableStackPanel } from "./elements/stackPanel.js";
import { ElementSharedFuncs } from "./elements/sharedElement.js";
import { FileUploader } from "./files/openFiles.js";
import { Builder, GLOBAL_ELEMENT_MAP, GlobalElementMapValue, ImageDataState, images } from "./index.js";
import { Notification } from "./ui/notifs/noficationMaker.js";
import { GeneralUtil } from "./util/generalUtil.js";
import { StringUtil } from "./util/stringUtil.js";

interface UploadTreeInstructions {
    ContinuePath: boolean;
    SkipToNextJsonNode?: boolean;
    FollowPath?: string;
}

export interface WorkspaceDefinition {
    id: string;
    namespace: string;
    key: string;
    rawKey: string;
    control: StringObjectMap;
    sourceFile: string;
}

export class FormUploader {
    public static workspaceDefinitions: Map<string, WorkspaceDefinition> = new Map();

    public static parseJsonWithComments(raw: string) {
        const noComments = raw
            // Remove block comments first so we don't break URLs
            .replace(/\/\*[\s\S]*?\*\//gm, "")
            // Then remove single-line comments
            .replace(/\/\/.*$/gm, "")
            // Clean up whitespace
            .trim();

        return JSON.parse(noComments);
    }

    public static parseControlKey(childKey: string): { baseKey: string; type: string; reference?: string } {
        const [leftSide, reference] = childKey.split("@");
        const baseKey = leftSide?.split("-").at(-1) ?? childKey;
        return {
            baseKey,
            type: baseKey,
            reference,
        };
    }

    public static deepMerge(base: any, override: any): any {
        if (Array.isArray(override)) return structuredClone(override);
        if (override === null || typeof override !== "object") return override;
        if (base === null || typeof base !== "object" || Array.isArray(base)) return structuredClone(override);

        const merged: Record<string, any> = { ...structuredClone(base) };

        for (const [key, value] of Object.entries(override)) {
            merged[key] = key in merged ? this.deepMerge(merged[key], value) : structuredClone(value);
        }

        return merged;
    }

    public static resolveReferencedControl(reference: string | undefined, override: StringObjectMap): StringObjectMap {
        if (!reference) return override;

        const definition = this.workspaceDefinitions.get(reference);
        if (!definition) return override;

        return this.deepMerge(definition.control, override);
    }

    public static resolveDimension(value: string | number | undefined, scalar: number, fallback: string): string {
        if (typeof value === "number") return `${value / scalar}px`;
        if (typeof value === "string" && value.trim() !== "") return value;
        return fallback;
    }

    public static resolveVector2(
        value: [string | number, string | number] | undefined,
        scalar: number,
        fallback: [string, string]
    ): [string, string] {
        return [
            this.resolveDimension(value?.[0], scalar, fallback[0]),
            this.resolveDimension(value?.[1], scalar, fallback[1]),
        ];
    }

    public static resolveControlPath(path: string | undefined, args?: any): string | undefined {
        if (!path) return undefined;

        if (this.workspaceDefinitions.has(path)) return path;

        const namespace = args?.[1]?.namespace as string | undefined;
        if (namespace && this.workspaceDefinitions.has(`${namespace}.${path}`)) {
            return `${namespace}.${path}`;
        }

        return path;
    }

    public static isValid(form: string) {
        try {
            const parsed = FormUploader.parseJsonWithComments(form);
            return FormUploader.isValidParsed(parsed);
        } catch (e) {
            console.log(3, e);
            new Notification("Could not parse the form JSON. Check commas, quotes, and comments.", 5000, "error");

            return false;
        }
    }

    public static isValidParsed(parsed: StringObjectMap): boolean {
        if (!parsed.namespace) {
            new Notification("Invalid namespace, please upload a valid form", 5000, "error");
            return false;
        }

        if (!parsed[parsed.namespace as string]) {
            new Notification("Cant find root element, please upload a valid form", 5000, "error");
            return false;
        }

        return true;
    }

    public static getJsonControlsAndType(json: StringObjectMap) {
        const controls = (json.controls as ControlNode[]) || [];

        const jsonControls: { control: StringObjectMap; type: string }[] = [];
        for (const child of controls) {
            const childKey = Object.keys(child)[0]!;
            const childJson = child[childKey];
            const parsedKey = this.parseControlKey(childKey);
            const resolvedChildJson = this.resolveReferencedControl(parsedKey.reference, childJson!);
            const resolvedType =
                typeof resolvedChildJson?.type === "string" && resolvedChildJson.type.trim() !== ""
                    ? (resolvedChildJson.type as string)
                    : parsedKey.type;

            jsonControls.push({ control: resolvedChildJson, type: resolvedType });
        }

        return jsonControls;
    }

    public static uploadParsedForm(
        parsed: StringObjectMap,
        uploadedFileName?: string,
        workspaceDefinitions?: Map<string, WorkspaceDefinition>
    ) {
        if (!FormUploader.isValidParsed(parsed)) return;

        const namespace = parsed.namespace as string;

        Builder.reset();
        config.nameSpace = namespace;
        config.formFileName = uploadedFileName
            ? StringUtil.toSafeFileName(uploadedFileName)
            : StringUtil.toSafeFileName(namespace);
        syncJsonTypeNamespaces(config.nameSpace);
        this.workspaceDefinitions = workspaceDefinitions ?? new Map();

        const mainPanel: GlobalElementMapValue = GeneralUtil.elementToClassElement(config.rootElement!)!;
        FormUploader.tree(parsed[namespace] as StringObjectMap, mainPanel, [parsed["config"], parsed]);

        new Notification("Form uploaded successfully", 2000, "notif");
    }

    public static uploadForm(form: string, uploadedFileName?: string, workspaceDefinitions?: Map<string, WorkspaceDefinition>) {
        if (!FormUploader.isValid(form)) return;

        const parsed = FormUploader.parseJsonWithComments(form);
        FormUploader.uploadParsedForm(parsed, uploadedFileName, workspaceDefinitions);
    }

    public static tree(rootJson: StringObjectMap, parentClassElement: GlobalElementMapValue, args?: any) {
        const controls = FormUploader.getJsonControlsAndType(rootJson);

        for (const { control: childJson, type: childType } of controls) {
            const skip = () => {
                const nextNodeChildren = (rootJson.controls as ControlNode[]) || [];

                for (const nextNode of nextNodeChildren) {
                    const nextNodeKey = Object.keys(nextNode)[0]!;
                    const nextNodeJson = nextNode[nextNodeKey];

                    FormUploader.tree(nextNodeJson!, parentClassElement, args);
                }
            };

            if (childType == "skip") {
                skip();
                continue;
            }

            if (!childType) {
                new Notification("Some elements lack a type", 2000, "warning");
                continue;
            }

            const createClassElement = tagNameToCreateClassElementFunc.get(childType);
            if (!createClassElement) {
                new Notification(`Unsupported control type: ${childType}`, 3000, "warning");
                continue;
            }

            const newParent: { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined = createClassElement(
                childJson!,
                parentClassElement,
                args[0]!,
                rootJson
            );

            if (!newParent?.element || !newParent.instructions) {
                new Notification("Error creating element", 5000, "error");
                continue;
            }

            if (!newParent.instructions.ContinuePath) {
                continue;
            }

            // Skips the next node and goes to its children
            if (newParent.instructions.SkipToNextJsonNode) {
                skip();
                continue;
            }

            if (newParent.instructions.FollowPath) {
                const workspaceNode = this.workspaceDefinitions.get(newParent.instructions.FollowPath);
                if (workspaceNode) {
                    FormUploader.tree(workspaceNode.control, newParent.element, args);
                    continue;
                }

                const splitPathString = newParent.instructions.FollowPath.split(".");

                if (splitPathString[0] != args[1]["namespace"]) {
                    new Notification("Error following path, namespace error", 5000, "error");
                    continue;
                }

                const nextNode = args[1][splitPathString[1]!] as StringObjectMap;

                if (!nextNode) {
                    new Notification("Error following path", 5000, "error");
                    continue;
                }

                FormUploader.tree(nextNode!, newParent.element, args);
                continue;
            }

            FormUploader.tree(childJson!, newParent.element, args);
        }
    }
}

type ControlNode = {
    [key: string]: StringObjectMap;
};

export const tagNameToCreateClassElementFunc: Map<
    string,
    (
        json: StringObjectMap,
        parentClassElement: GlobalElementMapValue,
        usedConfig: SavedConfig,
        nextNodes: StringObjectMap
    ) => { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined
> = new Map([
    [
        "panel",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig,
            nextNodes: StringObjectMap
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;

            const id: string = StringUtil.generateRandomString(15);
            const panel: DraggablePanel = new DraggablePanel(id, parentClassElement.getMainHTMLElement());

            GLOBAL_ELEMENT_MAP.set(id, panel);

            const [width, height] = FormUploader.resolveVector2(
                json.size as [number | string, number | string] | undefined,
                UI_SCALAR,
                [panel.panel.style.width, panel.panel.style.height]
            );
            const [left, top] = FormUploader.resolveVector2(
                json.offset as [number | string, number | string] | undefined,
                UI_SCALAR,
                ["0px", "0px"]
            );

            panel.panel.style.width = width;
            panel.panel.style.height = height;

            ElementSharedFuncs.updateCenterCirclePosition(panel);

            panel.panel.style.left = left;
            panel.panel.style.top = top;

            panel.panel.style.zIndex = `${json.layer ?? 0}`;

            if ((json.bindings as []).length > 0) panel.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            const runeUiObject = json["$runeui"] as StringObjectMap | undefined;
            const followPath = FormUploader.resolveControlPath(runeUiObject?.panel_control as string | undefined);
            const directFollowPath = FormUploader.resolveControlPath(json.$runeui_panel_control as string | undefined);
            const runeUiPanelControl = FormUploader.resolveControlPath((json["$runeui:panel_control"] as string | undefined) ?? directFollowPath);

            return { element: panel, instructions: { ContinuePath: true, FollowPath: runeUiPanelControl ?? followPath } };
        },
    ],
    [
        "input_panel",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;

            const id: string = StringUtil.generateRandomString(15);
            const panel: DraggablePanel = new DraggablePanel(id, parentClassElement.getMainHTMLElement());

            GLOBAL_ELEMENT_MAP.set(id, panel);

            const size = (json.size as [number | string, number | string]) ?? ["100%", "100%"];
            const offset = (json.offset as [number, number]) ?? [0, 0];

            panel.panel.style.width = typeof size[0] === "number" ? `${size[0] / UI_SCALAR}px` : `${size[0]}`;
            panel.panel.style.height = typeof size[1] === "number" ? `${size[1] / UI_SCALAR}px` : `${size[1]}`;
            panel.panel.style.left = `${offset[0] / UI_SCALAR}px`;
            panel.panel.style.top = `${offset[1] / UI_SCALAR}px`;
            panel.panel.style.zIndex = `${json.layer ?? 0}`;

            ElementSharedFuncs.updateCenterCirclePosition(panel);

            if ((json.bindings as []).length > 0) panel.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            const followPath = FormUploader.resolveControlPath((json["$runeui:panel_control"] as string | undefined) ?? json.$runeui_panel_control as string | undefined);
            return { element: panel, instructions: { ContinuePath: true, FollowPath: followPath } };
        },
    ],
    [
        "grid",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;

            const id: string = StringUtil.generateRandomString(15);
            const panel: DraggablePanel = new DraggablePanel(id, parentClassElement.getMainHTMLElement());

            GLOBAL_ELEMENT_MAP.set(id, panel);

            const size = (json.size as [number | string, number | string]) ?? ["100%", "100%"];
            const offset = (json.offset as [number, number]) ?? [0, 0];

            panel.panel.style.width = typeof size[0] === "number" ? `${size[0] / UI_SCALAR}px` : `${size[0]}`;
            panel.panel.style.height = typeof size[1] === "number" ? `${size[1] / UI_SCALAR}px` : `${size[1]}`;
            panel.panel.style.left = `${offset[0] / UI_SCALAR}px`;
            panel.panel.style.top = `${offset[1] / UI_SCALAR}px`;
            panel.panel.style.zIndex = `${json.layer ?? 0}`;

            ElementSharedFuncs.updateCenterCirclePosition(panel);

            if ((json.bindings as []).length > 0) panel.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            const gridTemplate = FormUploader.resolveControlPath(json.grid_item_template as string | undefined);
            return { element: panel, instructions: { ContinuePath: true, FollowPath: gridTemplate } };
        },
    ],
    [
        "stack_panel",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;

            const id: string = StringUtil.generateRandomString(15);
            const stackPanel: DraggableStackPanel = new DraggableStackPanel(id, parentClassElement.getMainHTMLElement(), {
                orientation: json.orientation as "vertical" | "horizontal",
            });

            GLOBAL_ELEMENT_MAP.set(id, stackPanel as unknown as GlobalElementMapValue);

            const size = (json.size as [number | string, number | string]) ?? ["100%", "100%"];
            const offset = (json.offset as [number, number]) ?? [0, 0];

            stackPanel.panel.style.width = typeof size[0] === "number" ? `${size[0] / UI_SCALAR}px` : `${size[0]}`;
            stackPanel.panel.style.height = typeof size[1] === "number" ? `${size[1] / UI_SCALAR}px` : `${size[1]}`;
            stackPanel.panel.style.left = `${offset[0] / UI_SCALAR}px`;
            stackPanel.panel.style.top = `${offset[1] / UI_SCALAR}px`;
            stackPanel.panel.style.zIndex = `${json.layer ?? 0}`;

            ElementSharedFuncs.updateCenterCirclePosition(stackPanel);

            if ((json.bindings as []).length > 0) stackPanel.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            return { element: stackPanel as unknown as GlobalElementMapValue, instructions: { ContinuePath: true } };
        },
    ],
    [
        "label",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig,
            nextNodes: StringObjectMap
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;
            const fontScale = (json.font_scale_factor as number) / (UI_SCALAR * usedConfig.magicNumbers.fontScalar);

            const id: string = StringUtil.generateRandomString(15);
            const label: DraggableLabel = new DraggableLabel(id, parentClassElement.getMainHTMLElement(), {
                text: json.text as string,
                includeTextPrompt: true,
                fontScale: fontScale,
                textAlign: json.text_alignment as "left" | "right" | "center",
            });

            GLOBAL_ELEMENT_MAP.set(id, label);

            const offset = (json.offset as [number, number] | undefined) ?? [0, 0];
            const getFontScaledOffsetY = config.magicNumbers.getFontScaledOffsetY as Function;

            label.shadow(json.shadow as boolean);
            const fontType = json.font_type as string;

            label.label.style.left = `${offset[0] / UI_SCALAR - usedConfig.magicNumbers.fontOffsetX}px`;
            label.label.style.top = `${(offset[1] - getFontScaledOffsetY(fontScale, fontType)) / UI_SCALAR - usedConfig.magicNumbers.fontOffsetY}px`;

            const labelOffset = config.magicNumbers.labelToOffset(label.label);
            label.shadowLabel.style.left = `${StringUtil.cssDimToNumber(label.label.style.left) + label.shadowOffsetX + labelOffset[0]}px`;
            label.shadowLabel.style.top = `${StringUtil.cssDimToNumber(label.label.style.top) + label.shadowOffsetY + labelOffset[1]}px`;

            label.shadowLabel.style.fontFamily = fontType;
            label.mirror.style.fontFamily = fontType;
            label.label.style.fontFamily = fontType;

            label.label.style.zIndex = `${json.layer ?? 0}`;

            label.updateSize(true);
            label.label.dispatchEvent(new Event("input"));

            if ((json.bindings as []).length > 0) label.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            return { element: label, instructions: { ContinuePath: true } };
        },
    ],
    [
        "image",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig,
            nextNodes: StringObjectMap
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;
            let texturePath = json.texture as string;
            console.warn(texturePath);
            texturePath = texturePath.replace(/^textures\//, "");

            if (!FileUploader.isFileUploaded(texturePath)) {
                new Notification(`Image ${texturePath} not found`, 2000, "warning");
                texturePath = "assets/placeholder";
            }

            const imageData: ImageDataState = images.get(texturePath)!;

            if (!imageData) {
                new Notification(`Image ${texturePath} not found`, 2000, "warning");
                return undefined;
            }

            const id: string = StringUtil.generateRandomString(15);
            const canvas: DraggableCanvas = new DraggableCanvas(id, parentClassElement.getMainHTMLElement(), imageData.png!, texturePath, imageData.json);

            GLOBAL_ELEMENT_MAP.set(id, canvas);

            const size = (json.size as [number, number] | undefined) ?? [imageData.png?.width ?? 16, imageData.png?.height ?? 16];
            const offset = (json.offset as [number, number] | undefined) ?? [0, 0];

            canvas.drawImage(size[0] / UI_SCALAR, size[1] / UI_SCALAR);

            ElementSharedFuncs.updateCenterCirclePosition(canvas);

            canvas.canvasHolder.style.left = `${offset[0] / UI_SCALAR}px`;
            canvas.canvasHolder.style.top = `${offset[1] / UI_SCALAR}px`;

            canvas.canvasHolder.style.zIndex = `${json.layer ?? 0}`;

            if ((json.bindings as []).length > 0) canvas.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            return { element: canvas, instructions: { ContinuePath: true } };
        },
    ],
    [
        "collection_panel",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig,
            nextNodes: StringObjectMap
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;

            const id: string = StringUtil.generateRandomString(15);
            const collectionPanel: DraggableCollectionPanel = new DraggableCollectionPanel(id, parentClassElement.getMainHTMLElement());

            GLOBAL_ELEMENT_MAP.set(id, collectionPanel);

            const size = (json.size as [number, number] | undefined) ?? [100, 100];
            const offset = (json.offset as [number, number] | undefined) ?? [0, 0];

            if (!json.collection_name) {
                new Notification(`Collection name not found`, 2000, "warning");
            }

            collectionPanel.panel.dataset.collectionName = (json.collection_name as string) ?? config.defaultCollectionName;

            collectionPanel.panel.style.width = `${size[0] / UI_SCALAR}px`;
            collectionPanel.panel.style.height = `${size[1] / UI_SCALAR}px`;

            ElementSharedFuncs.updateCenterCirclePosition(collectionPanel);

            collectionPanel.panel.style.left = `${offset[0] / UI_SCALAR}px`;
            collectionPanel.panel.style.top = `${offset[1] / UI_SCALAR}px`;

            collectionPanel.panel.style.zIndex = `${json.layer ?? 0}`;

            if ((json.bindings as []).length > 0) collectionPanel.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            const followPath = FormUploader.resolveControlPath((json.factory as StringObjectMap | undefined)?.control_name as string | undefined);
            return { element: collectionPanel, instructions: { ContinuePath: true, FollowPath: followPath } };
        },
    ],
    [
        "scrolling_panel",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig,
            nextNodes: StringObjectMap
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;

            const id: string = StringUtil.generateRandomString(15);
            const scrollingPanel: DraggableScrollingPanel = new DraggableScrollingPanel(id, parentClassElement.getMainHTMLElement());

            GLOBAL_ELEMENT_MAP.set(id, scrollingPanel);

            // Iterate twice to get to the from the current node to the node ahead
            const controls1 = FormUploader.getJsonControlsAndType(nextNodes!);
            const scrollingLinkerPanel = FormUploader.getJsonControlsAndType(controls1[0]?.control!)[0]?.control!;

            const size = (json.size as [number, number] | undefined) ?? [100, 100];
            const offset = (scrollingLinkerPanel?.$scrolling_pane_offset as [number, number] | undefined) ?? [0, 0];

            scrollingPanel.panel.style.width = `${size[0] / UI_SCALAR}px`;
            scrollingPanel.panel.style.height = `${size[1] / UI_SCALAR}px`;
            scrollingPanel.basePanel.style.width = scrollingPanel.panel.style.width;
            scrollingPanel.basePanel.style.height = scrollingPanel.panel.style.height;

            scrollingPanel.basePanel.style.left = `${(offset[0] - config.magicNumbers.scrolling_panel_offsets.scrolling_pane_right_offset)! / UI_SCALAR}px`;
            scrollingPanel.basePanel.style.top = `${offset[1]! / UI_SCALAR}px`;

            scrollingPanel.slider.updateHandle();

            scrollingPanel.panel.style.zIndex = `${json.layer ?? 0}`;

            if ((scrollingLinkerPanel?.bindings as [])?.length > 0)
                scrollingPanel.bindings = JSON.stringify(scrollingLinkerPanel.bindings, null, config.magicNumbers.textEditor.indentation);

            return {
                element: scrollingPanel,
                instructions: {
                    ContinuePath: true,
                    FollowPath: FormUploader.resolveControlPath(scrollingLinkerPanel?.$scrolling_content as string | undefined),
                },
            };
        },
    ],
    [
        "button",
        (
            json: StringObjectMap,
            parentClassElement: GlobalElementMapValue,
            usedConfig: SavedConfig,
            nextNodes: StringObjectMap
        ): { element: GlobalElementMapValue; instructions: UploadTreeInstructions } | undefined => {
            const UI_SCALAR = usedConfig!.magicNumbers!.UI_SCALAR as number;
            let defaultTexturePath = json.$default_button_background_texture as string;
            let hoverTexturePath = json.$hover_button_background_texture as string;
            let pressedTexturePath = json.$pressed_button_background_texture as string;

            defaultTexturePath = defaultTexturePath.replace(/^textures\//, "");
            hoverTexturePath = hoverTexturePath.replace(/^textures\//, "");
            pressedTexturePath = pressedTexturePath.replace(/^textures\//, "");

            const imageNames: string[] = [];
            for (let image of [defaultTexturePath, hoverTexturePath, pressedTexturePath]) {
                if (!FileUploader.isFileUploaded(image)) {
                    new Notification(`Image ${image} not found`, 2000, "warning");
                    image = "assets/placeholder";
                }

                imageNames.push(image);
            }

            const id: string = StringUtil.generateRandomString(15);
            const button: DraggableButton = new DraggableButton(id, parentClassElement.getMainHTMLElement(), {
                buttonText: "예시 텍스트",
                defaultTexture: imageNames[0],
                hoverTexture: imageNames[1],
                pressedTexture: imageNames[2],
                displayTexture: "assets/placeholder",
                collectionIndex: json.collection_index as string,
            });

            GLOBAL_ELEMENT_MAP.set(id, button);

            const size = json.$button_size as [number, number];
            const offset = json.$button_offset as [number, number];

            button.drawImage(size[0] / UI_SCALAR, size[1] / UI_SCALAR);

            // LABEL -----------------------------------------------------
            const label = button.displayText!;

            const labelOffset = json.$text_offset as [number, number];

            const fontScale = (json.$font_size as number) / (UI_SCALAR * usedConfig.magicNumbers.fontScalar);
            const getFontScaledOffsetY: (fontSize: number, fontType: string) => number = config.magicNumbers.getFontScaledOffsetY;

            label.shadow(json.$shadow as boolean);

            const textAlign = json.$text_alignment as "left" | "right" | "center";
            label.label.style.textAlign = textAlign;
            label.mirror.style.textAlign = textAlign;
            label.shadowLabel.style.textAlign = textAlign;

            const fontType = json.$font_type as string;

            label.label.style.left = `${labelOffset[0] / UI_SCALAR - usedConfig.magicNumbers.fontOffsetX}px`;
            label.label.style.top = `${(labelOffset[1] - getFontScaledOffsetY(fontScale, fontType)) / UI_SCALAR - usedConfig.magicNumbers.fontOffsetY}px`;

            const labelExtraOffset = config.magicNumbers.labelToOffset(label.label);
            label.shadowLabel.style.left = `${StringUtil.cssDimToNumber(label.label.style.left) + label.shadowOffsetX + labelExtraOffset[0]}px`;
            label.shadowLabel.style.top = `${StringUtil.cssDimToNumber(label.label.style.top) + label.shadowOffsetY + labelExtraOffset[1]}px`;

            label.shadowLabel.style.fontFamily = fontType;
            label.mirror.style.fontFamily = fontType;
            label.label.style.fontFamily = fontType;

            label.updateSize(true);
            label.label.dispatchEvent(new Event("input"));
            // -----------------------------------------------------------

            // CANVAS ----------------------------------------------------
            const canvas = button.displayCanvas!;

            const canvasSize = json.$icon_size as [number, number];
            const canvasOffset = json.$icon_offset as [number, number];

            canvas.canvasHolder.style.left = `${(canvasOffset[0] - usedConfig.magicNumbers.buttonImageOffsetX) / UI_SCALAR}px`;
            canvas.canvasHolder.style.top = `${(canvasOffset[1] - usedConfig.magicNumbers.buttonImageOffsetY) / UI_SCALAR}px`;

            canvas.drawImage(canvasSize[0] / UI_SCALAR, canvasSize[1] / UI_SCALAR);
            // -----------------------------------------------------------

            button.button.style.left = `${offset[0] / UI_SCALAR}px`;
            button.button.style.top = `${offset[1] / UI_SCALAR}px`;

            button.button.style.zIndex = `${json.layer}`;

            ElementSharedFuncs.updateCenterCirclePosition(button);

            if ((json.bindings as []).length > 0) button.bindings = JSON.stringify(json.bindings, null, config.magicNumbers.textEditor.indentation);

            return { element: button, instructions: { ContinuePath: true } };
        },
    ],
]);
