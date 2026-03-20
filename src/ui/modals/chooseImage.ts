import { GLOBAL_FILE_SYSTEM } from "../../runtime/editorStore.js";
import { images as runtimeImages } from "../../runtime/imageStore.js";
import { openChooseImageModal } from "../react/modalBridge.js";
import { waitForChooseImageModalHost } from "../react/chooseImageModalHostBridge.js";
import { ExternalImageEntry, ExternalImageState } from "./externalImageResources.js";

export type PreviewableImageState = ExternalImageState;

export type ChooseImageTreeNode = {
    id: string;
    label: string;
    imagePath?: string;
    hasNineslice: boolean;
    depth: number;
    children: ChooseImageTreeNode[];
};

const VALID_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;

export function getImagesMap(): Map<string, PreviewableImageState> {
    return ((window as { images?: Map<string, PreviewableImageState> }).images ?? runtimeImages) as Map<string, PreviewableImageState>;
}

export function addFilePathToStructure(fsObj: any, filePath: string): void {
    const parts = filePath.split("/").filter(Boolean);
    let current = fsObj;

    for (const part of parts) {
        if (!current[part]) {
            current[part] = {};
        }

        current = current[part];
    }
}

export function collectImagePaths(fsObj: any, currentPath: string = ""): string[] {
    const paths: string[] = [];

    for (const key of Object.keys(fsObj)) {
        const value = fsObj[key];
        const joinedPath = currentPath ? `${currentPath}/${key}` : key;
        const ext = key.split(".").pop()?.toLowerCase();

        if (typeof value === "object" && value !== null && Object.keys(value).length > 0) {
            paths.push(...collectImagePaths(value, joinedPath));
        } else if (ext && (VALID_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
            paths.push(joinedPath.replace(/\.[^/.]+$/, ""));
        }
    }

    return paths;
}

export function buildChooseImageTree(fsObj: any, depth: number = 0, currentPath: string = ""): ChooseImageTreeNode[] {
    const nodes: ChooseImageTreeNode[] = [];

    for (const nextDir of Object.keys(fsObj)) {
        const nextPath = currentPath ? `${currentPath}/${nextDir}` : nextDir;
        const entry = fsObj[nextDir];
        const hasChildren = typeof entry === "object" && entry !== null && Object.keys(entry).length > 0;

        if (hasChildren) {
            nodes.push({
                id: `dir:${nextPath}`,
                label: nextDir,
                hasNineslice: false,
                depth,
                children: buildChooseImageTree(entry, depth + 1, nextPath),
            });
            continue;
        }

        const fileType = nextDir.split(".").pop()?.toLowerCase();
        if (!fileType || !(VALID_IMAGE_EXTENSIONS as readonly string[]).includes(fileType)) continue;

        const baseName = nextDir.replace(/\.[^.]+$/, "");
        const siblings = Object.keys(fsObj);
        const imagePath = nextPath.replace(/\.[^/.]+$/, "");

        nodes.push({
            id: `file:${imagePath}`,
            label: nextDir,
            imagePath,
            hasNineslice: siblings.some((dir) => dir === `${baseName}.json`),
            depth,
            children: [],
        });
    }

    return nodes;
}

export function getImageLabel(imagePath: string): string {
    const pathParts = imagePath.split("/");
    return pathParts[pathParts.length - 1] ?? imagePath;
}

export function formatVector(values: number[] | undefined): string {
    if (!values || values.length === 0) return "-";
    return `[${values.join(", ")}]`;
}

export async function imageDataToBlob(imageData: ImageData): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            reject(new Error("Could not create canvas context."));
            return;
        }

        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not create PNG blob."));
                return;
            }
            resolve(blob);
        }, "image/png");
    });
}

function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

export async function downloadSelectedImageAsset(imagePath: string): Promise<void> {
    const imageState = getImagesMap().get(imagePath);
    if (!imageState?.png && !imageState?.json) {
        throw new Error("Could not download the selected image.");
    }

    const fileName = getImageLabel(imagePath);

    if (imageState?.png) {
        const pngBlob = await imageDataToBlob(imageState.png);
        downloadBlob(pngBlob, `${fileName}.png`);
    }

    if (imageState?.json) {
        const jsonBlob = new Blob([JSON.stringify(imageState.json, null, 2)], { type: "application/json" });
        downloadBlob(jsonBlob, `${fileName}.json`);
    }
}

function imageDataToBase64(imageData: ImageData): string {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
}

export async function persistImportedExternalAsset(
    imagePath: string,
    entry: ExternalImageEntry,
    imageState: PreviewableImageState
): Promise<void> {
    if (imageState.png) {
        localStorage.setItem(
            `asset_${imagePath}_png`,
            JSON.stringify({
                base64: imageDataToBase64(imageState.png),
                metadata: {
                    name: entry.name,
                    type: entry.extension,
                    relativePath: `${imagePath}.${entry.extension}`,
                    source: "github",
                    sourceUrl: entry.downloadUrl,
                    importedAt: new Date().toISOString(),
                },
            })
        );
    }

    if (imageState.json) {
        localStorage.setItem(
            `asset_${imagePath}_json`,
            JSON.stringify({
                jsonContent: imageState.json,
                metadata: {
                    name: `${entry.name.replace(/\.[^.]+$/, "")}.json`,
                    type: "json",
                    relativePath: `${imagePath}.json`,
                    source: "github",
                    sourceUrl: entry.jsonDownloadUrl ?? "",
                    importedAt: new Date().toISOString(),
                },
            })
        );
    }
}

export function enhanceFileSystemWithUserPresets(): any {
    const enhanced = JSON.parse(JSON.stringify(GLOBAL_FILE_SYSTEM));
    const userImages = getImagesMap();

    if (userImages.size > 0) {
        for (const [key, value] of userImages) {
            if (!value || (!value.png && !value.json)) continue;

            addFilePathToStructure(enhanced, `${key}.png`);

            if (value.json) {
                addFilePathToStructure(enhanced, `${key}.json`);
            }
        }
    }

    return enhanced;
}

export async function chooseImageModal(): Promise<string> {
    await waitForChooseImageModalHost();
    return openChooseImageModal();
}
