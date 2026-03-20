import { DEFAULT_GLYPH_BASE_PATH, getGlyphCodepoint, getGlyphSheetHex } from "../../glyph/defaultGlyphSheets.js";
import { Notification } from "../notifs/noficationMaker.js";
import { openGlyphEditorModalBridge } from "../react/modalBridge.js";

export function createImageCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas context unavailable");
    }

    context.imageSmoothingEnabled = false;
    return { canvas, context };
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
    const { canvas, context } = createImageCanvas(source.width, source.height);
    context.drawImage(source, 0, 0);
    return canvas;
}

export function drawGlyphCanvas(displayCanvas: HTMLCanvasElement, workingCanvas: HTMLCanvasElement | null, selectedCell: number): void {
    const displayContext = displayCanvas.getContext("2d");
    if (!displayContext) {
        return;
    }

    displayContext.imageSmoothingEnabled = false;
    displayContext.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    displayContext.fillStyle = "#11151f";
    displayContext.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    if (workingCanvas) {
        displayContext.drawImage(workingCanvas, 0, 0, displayCanvas.width, displayCanvas.height);
    }

    const cellWidth = displayCanvas.width / 16;
    const cellHeight = displayCanvas.height / 16;

    displayContext.strokeStyle = "rgba(255, 255, 255, 0.15)";
    displayContext.lineWidth = 1;
    for (let index = 0; index <= 16; index++) {
        const x = Math.round(index * cellWidth) + 0.5;
        const y = Math.round(index * cellHeight) + 0.5;

        displayContext.beginPath();
        displayContext.moveTo(x, 0);
        displayContext.lineTo(x, displayCanvas.height);
        displayContext.stroke();

        displayContext.beginPath();
        displayContext.moveTo(0, y);
        displayContext.lineTo(displayCanvas.width, y);
        displayContext.stroke();
    }

    const { column, row } = getSelectedCellPosition(selectedCell);
    displayContext.strokeStyle = "#66d9ff";
    displayContext.lineWidth = 2;
    displayContext.strokeRect(column * cellWidth + 1, row * cellHeight + 1, cellWidth - 2, cellHeight - 2);
}

export function getCellMetrics(workingCanvas: HTMLCanvasElement | null): { cellWidth: number; cellHeight: number } | null {
    if (!workingCanvas) return null;

    return {
        cellWidth: Math.max(1, Math.floor(workingCanvas.width / 16)),
        cellHeight: Math.max(1, Math.floor(workingCanvas.height / 16)),
    };
}

export function getSelectedCellPosition(selectedCell: number): { column: number; row: number } {
    return {
        column: selectedCell % 16,
        row: Math.floor(selectedCell / 16),
    };
}

export function getSelectedCodepoint(sheetName: string | null, selectedCell: number): number {
    return sheetName ? getGlyphCodepoint(sheetName, selectedCell) : selectedCell;
}

export function hasStandardGlyphCodepoint(sheetName: string | null): boolean {
    const sheetHex = sheetName ? getGlyphSheetHex(sheetName) : "";
    return /^[0-9A-F]{2}$/u.test(sheetHex);
}

export function getSelectedGlyphCharacter(sheetName: string | null, selectedCell: number): string {
    return String.fromCodePoint(getSelectedCodepoint(sheetName, selectedCell));
}

export function getSelectedCellFromCanvasClick(canvas: HTMLCanvasElement, event: MouseEvent): number {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const column = Math.max(0, Math.min(15, Math.floor((x / canvas.width) * 16)));
    const row = Math.max(0, Math.min(15, Math.floor((y / canvas.height) * 16)));
    return row * 16 + column;
}

export function clearGlyphCell(workingCanvas: HTMLCanvasElement, selectedCell: number): HTMLCanvasElement {
    const metrics = getCellMetrics(workingCanvas);
    if (!metrics) {
        throw new Error("Working canvas is unavailable");
    }

    const nextCanvas = cloneCanvas(workingCanvas);
    const context = nextCanvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas context unavailable");
    }

    const { column, row } = getSelectedCellPosition(selectedCell);
    context.clearRect(column * metrics.cellWidth, row * metrics.cellHeight, metrics.cellWidth, metrics.cellHeight);
    return nextCanvas;
}

export function insertGlyphImage(workingCanvas: HTMLCanvasElement, selectedCell: number, insertImage: HTMLImageElement): HTMLCanvasElement {
    const metrics = getCellMetrics(workingCanvas);
    if (!metrics) {
        throw new Error("Working canvas is unavailable");
    }

    const nextCanvas = cloneCanvas(workingCanvas);
    const context = nextCanvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas context unavailable");
    }

    const { column, row } = getSelectedCellPosition(selectedCell);
    const cellLeft = column * metrics.cellWidth;
    const cellTop = row * metrics.cellHeight;

    context.clearRect(cellLeft, cellTop, metrics.cellWidth, metrics.cellHeight);

    const scale = Math.min(metrics.cellWidth / insertImage.width, metrics.cellHeight / insertImage.height);
    const drawWidth = Math.max(1, Math.round(insertImage.width * scale));
    const drawHeight = Math.max(1, Math.round(insertImage.height * scale));
    const drawLeft = cellLeft + Math.round((metrics.cellWidth - drawWidth) / 2);
    const drawTop = cellTop + Math.round((metrics.cellHeight - drawHeight) / 2);

    context.imageSmoothingEnabled = false;
    context.drawImage(insertImage, drawLeft, drawTop, drawWidth, drawHeight);
    return nextCanvas;
}

export function findNextEmptyGlyphCell(workingCanvas: HTMLCanvasElement): number | null {
    const metrics = getCellMetrics(workingCanvas);
    if (!metrics) {
        return null;
    }

    const context = workingCanvas.getContext("2d");
    if (!context) {
        return null;
    }

    for (let index = 0; index < 256; index++) {
        const column = index % 16;
        const row = Math.floor(index / 16);
        const imageData = context.getImageData(column * metrics.cellWidth, row * metrics.cellHeight, metrics.cellWidth, metrics.cellHeight).data;
        let hasPixels = false;

        for (let pixelIndex = 3; pixelIndex < imageData.length; pixelIndex += 4) {
            if (imageData[pixelIndex] !== 0) {
                hasPixels = true;
                break;
            }
        }

        if (!hasPixels) {
            return index;
        }
    }

    return null;
}

export function downloadWorkingSheet(workingCanvas: HTMLCanvasElement, sheetName: string): void {
    const link = document.createElement("a");
    link.href = workingCanvas.toDataURL("image/png");
    link.download = sheetName;
    link.click();
}

export async function copySelectedGlyphText(sheetName: string, selectedCell: number): Promise<void> {
    try {
        await navigator.clipboard.writeText(getSelectedGlyphCharacter(sheetName, selectedCell));
        new Notification("Selected glyph text copied to clipboard!", 2200, "notif");
    } catch (error) {
        console.error(error);
        new Notification("Could not copy the selected glyph text.", 2800, "error");
    }
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = src;
    });
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });

    return loadImageFromSrc(dataUrl);
}

export function createWorkingCanvasFromImage(image: HTMLImageElement): HTMLCanvasElement {
    const { canvas, context } = createImageCanvas(image.width, image.height);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return canvas;
}

export async function loadBuiltInGlyphSheet(sheetName: string): Promise<{ sheetName: string; workingCanvas: HTMLCanvasElement }> {
    try {
        const image = await loadImageFromSrc(`${DEFAULT_GLYPH_BASE_PATH}/${sheetName}`);
        const workingCanvas = createWorkingCanvasFromImage(image);
        new Notification(`Loaded built-in glyph sheet: ${sheetName}`, 2200, "notif");
        return { sheetName, workingCanvas };
    } catch (error) {
        console.error(error);
        new Notification("Could not load the glyph sheet.", 2800, "error");
        throw error;
    }
}

export async function loadUploadedGlyphSheet(file: File): Promise<{ sheetName: string; workingCanvas: HTMLCanvasElement }> {
    try {
        const image = await loadImageFromFile(file);
        const sheetName = file.name || "glyph_custom.png";
        const workingCanvas = createWorkingCanvasFromImage(image);
        new Notification(`Loaded edited glyph sheet: ${sheetName}`, 2200, "notif");
        return { sheetName, workingCanvas };
    } catch (error) {
        console.error(error);
        new Notification("Could not load the glyph sheet.", 2800, "error");
        throw error;
    }
}

export async function loadInsertGlyphImage(file: File): Promise<{ image: HTMLImageElement; name: string }> {
    try {
        const image = await loadImageFromFile(file);
        return { image, name: file.name };
    } catch (error) {
        console.error(error);
        new Notification("Could not load the image to insert.", 2800, "error");
        throw error;
    }
}

export async function glyphEditorModal(): Promise<void> {
    openGlyphEditorModalBridge();
}
