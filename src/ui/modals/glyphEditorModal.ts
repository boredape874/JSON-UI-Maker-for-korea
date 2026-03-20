import { DEFAULT_GLYPH_BASE_PATH, DEFAULT_GLYPH_SHEETS, getGlyphCodepoint, getGlyphSheetHex, getGlyphSlotHex } from "../../glyph/defaultGlyphSheets.js";
import { translateText } from "../../i18n.js";
import { Notification } from "../notifs/noficationMaker.js";
import { openGlyphEditorModalBridge } from "../react/modalBridge.js";

type GlyphEditorState = {
    displayCanvas: HTMLCanvasElement | null;
    displayContext: CanvasRenderingContext2D | null;
    workingCanvas: HTMLCanvasElement | null;
    workingContext: CanvasRenderingContext2D | null;
    selectedCell: number;
    sheetName: string | null;
    insertImage: HTMLImageElement | null;
    insertImageName: string | null;
};

const state: GlyphEditorState = {
    displayCanvas: null,
    displayContext: null,
    workingCanvas: null,
    workingContext: null,
    selectedCell: 0,
    sheetName: null,
    insertImage: null,
    insertImageName: null,
};

type GlyphEditorHostElements = {
    form: HTMLDivElement;
};

let glyphEditorHost: GlyphEditorHostElements | null = null;

export function registerGlyphEditorHost(host: GlyphEditorHostElements | null): void {
    glyphEditorHost = host;

    if (!host) {
        state.displayCanvas = null;
        state.displayContext = null;
    }
}

function getForm(): HTMLDivElement | null {
    return glyphEditorHost?.form ?? null;
}

function createImageCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context unavailable");

    context.imageSmoothingEnabled = false;
    return { canvas, context };
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = src;
    });
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });

    return loadImageFromSrc(dataUrl);
}

function ensureWorkingCanvas(image: HTMLImageElement): void {
    const { canvas, context } = createImageCanvas(image.width, image.height);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    state.workingCanvas = canvas;
    state.workingContext = context;
}

function getCellMetrics(): { cellWidth: number; cellHeight: number } | null {
    if (!state.workingCanvas) return null;

    return {
        cellWidth: Math.max(1, Math.floor(state.workingCanvas.width / 16)),
        cellHeight: Math.max(1, Math.floor(state.workingCanvas.height / 16)),
    };
}

function getSelectedCellPosition(): { column: number; row: number } {
    return {
        column: state.selectedCell % 16,
        row: Math.floor(state.selectedCell / 16),
    };
}

function getSelectedCodepoint(): number {
    return state.sheetName ? getGlyphCodepoint(state.sheetName, state.selectedCell) : state.selectedCell;
}

function hasStandardGlyphCodepoint(): boolean {
    const sheetHex = state.sheetName ? getGlyphSheetHex(state.sheetName) : "";
    return /^[0-9A-F]{2}$/u.test(sheetHex);
}

function getSelectedGlyphCharacter(): string {
    return String.fromCodePoint(getSelectedCodepoint());
}

async function copySelectedGlyphText(): Promise<void> {
    if (!state.sheetName) {
        new Notification("Please load a glyph sheet first.", 2500, "warning");
        return;
    }

    try {
        await navigator.clipboard.writeText(getSelectedGlyphCharacter());
        new Notification("Selected glyph text copied to clipboard!", 2200, "notif");
    } catch (error) {
        console.error(error);
        new Notification("Could not copy the selected glyph text.", 2800, "error");
    }
}

function updateGlyphInfo(): void {
    const form = getForm();
    if (!form) return;

    const status = form.querySelector(".glyphEditorStatus") as HTMLDivElement | null;
    const selectedCell = form.querySelector(".glyphEditorSelectedCell") as HTMLSpanElement | null;
    const unicodeValue = form.querySelector(".glyphEditorUnicode") as HTMLSpanElement | null;
    const glyphTextValue = form.querySelector(".glyphEditorGlyphText") as HTMLSpanElement | null;
    const imageStatus = form.querySelector(".glyphEditorImageStatus") as HTMLSpanElement | null;

    if (!status || !selectedCell || !unicodeValue || !glyphTextValue || !imageStatus) return;

    if (!state.sheetName) {
        status.textContent = translateText("Choose a built-in glyph sheet or upload an edited sheet to begin.");
    } else {
        status.textContent = `${state.sheetName} - ${translateText("Click a cell in the grid to choose where the next image should be inserted.")}`;
    }

    const slotHex = getGlyphSlotHex(state.selectedCell);
    const codepoint = getSelectedCodepoint();
    selectedCell.textContent = `${getSelectedCellPosition().row}, ${getSelectedCellPosition().column} (${slotHex})`;

    const unicodeHex = codepoint.toString(16).toUpperCase().padStart(4, "0");
    unicodeValue.textContent = hasStandardGlyphCodepoint()
        ? `U+${unicodeHex} / \\u${unicodeHex}`
        : `${translateText("Slot")}: ${slotHex}`;
    glyphTextValue.textContent = hasStandardGlyphCodepoint() ? getSelectedGlyphCharacter() : "-";

    imageStatus.textContent = state.insertImageName ?? translateText("No image selected yet.");
}

function redrawGlyphCanvas(): void {
    if (!state.displayCanvas || !state.displayContext) return;

    const displayContext = state.displayContext;
    displayContext.clearRect(0, 0, state.displayCanvas.width, state.displayCanvas.height);
    displayContext.fillStyle = "#11151f";
    displayContext.fillRect(0, 0, state.displayCanvas.width, state.displayCanvas.height);

    if (state.workingCanvas) {
        displayContext.imageSmoothingEnabled = false;
        displayContext.drawImage(state.workingCanvas, 0, 0, state.displayCanvas.width, state.displayCanvas.height);
    }

    const cellWidth = state.displayCanvas.width / 16;
    const cellHeight = state.displayCanvas.height / 16;

    displayContext.strokeStyle = "rgba(255, 255, 255, 0.15)";
    displayContext.lineWidth = 1;
    for (let index = 0; index <= 16; index++) {
        const x = Math.round(index * cellWidth) + 0.5;
        const y = Math.round(index * cellHeight) + 0.5;

        displayContext.beginPath();
        displayContext.moveTo(x, 0);
        displayContext.lineTo(x, state.displayCanvas.height);
        displayContext.stroke();

        displayContext.beginPath();
        displayContext.moveTo(0, y);
        displayContext.lineTo(state.displayCanvas.width, y);
        displayContext.stroke();
    }

    const { column, row } = getSelectedCellPosition();
    displayContext.strokeStyle = "#66d9ff";
    displayContext.lineWidth = 2;
    displayContext.strokeRect(column * cellWidth + 1, row * cellHeight + 1, cellWidth - 2, cellHeight - 2);

    updateGlyphInfo();
}

function downloadWorkingSheet(): void {
    if (!state.workingCanvas || !state.sheetName) {
        new Notification("Please load a glyph sheet first.", 2500, "warning");
        return;
    }

    const link = document.createElement("a");
    link.href = state.workingCanvas.toDataURL("image/png");
    link.download = state.sheetName;
    link.click();
}

function clearSelectedCell(): void {
    const metrics = getCellMetrics();
    if (!state.workingContext || !metrics) {
        new Notification("Please load a glyph sheet first.", 2500, "warning");
        return;
    }

    const { column, row } = getSelectedCellPosition();
    state.workingContext.clearRect(column * metrics.cellWidth, row * metrics.cellHeight, metrics.cellWidth, metrics.cellHeight);
    redrawGlyphCanvas();
    new Notification("Cleared glyph slot.", 2000, "notif");
}

function insertSelectedImage(): void {
    const metrics = getCellMetrics();
    if (!state.workingContext || !metrics) {
        new Notification("Please load a glyph sheet first.", 2500, "warning");
        return;
    }

    if (!state.insertImage) {
        new Notification("Please choose an image to insert.", 2500, "warning");
        return;
    }

    const { column, row } = getSelectedCellPosition();
    const cellLeft = column * metrics.cellWidth;
    const cellTop = row * metrics.cellHeight;

    state.workingContext.clearRect(cellLeft, cellTop, metrics.cellWidth, metrics.cellHeight);

    const scale = Math.min(metrics.cellWidth / state.insertImage.width, metrics.cellHeight / state.insertImage.height);
    const drawWidth = Math.max(1, Math.round(state.insertImage.width * scale));
    const drawHeight = Math.max(1, Math.round(state.insertImage.height * scale));
    const drawLeft = cellLeft + Math.round((metrics.cellWidth - drawWidth) / 2);
    const drawTop = cellTop + Math.round((metrics.cellHeight - drawHeight) / 2);

    state.workingContext.imageSmoothingEnabled = false;
    state.workingContext.drawImage(state.insertImage, drawLeft, drawTop, drawWidth, drawHeight);
    redrawGlyphCanvas();
    new Notification("Inserted image into glyph slot.", 2000, "notif");
}

function selectNextEmptyCell(): void {
    const metrics = getCellMetrics();
    if (!state.workingContext || !metrics) {
        new Notification("Please load a glyph sheet first.", 2500, "warning");
        return;
    }

    for (let index = 0; index < 256; index++) {
        const column = index % 16;
        const row = Math.floor(index / 16);
        const imageData = state.workingContext.getImageData(column * metrics.cellWidth, row * metrics.cellHeight, metrics.cellWidth, metrics.cellHeight).data;
        let hasPixels = false;

        for (let pixelIndex = 3; pixelIndex < imageData.length; pixelIndex += 4) {
            if (imageData[pixelIndex] !== 0) {
                hasPixels = true;
                break;
            }
        }

        if (!hasPixels) {
            state.selectedCell = index;
            redrawGlyphCanvas();
            new Notification("Selected the next empty glyph slot.", 2200, "notif");
            return;
        }
    }

    new Notification("No empty glyph slots were found in this sheet.", 2800, "warning");
}

async function loadBuiltInSheet(sheetName: string): Promise<void> {
    try {
        const image = await loadImageFromSrc(`${DEFAULT_GLYPH_BASE_PATH}/${sheetName}`);
        ensureWorkingCanvas(image);
        state.sheetName = sheetName;
        redrawGlyphCanvas();
        new Notification(`Loaded built-in glyph sheet: ${sheetName}`, 2200, "notif");
    } catch (error) {
        console.error(error);
        new Notification("Could not load the glyph sheet.", 2800, "error");
    }
}

async function handleSheetUpload(file: File): Promise<void> {
    try {
        const image = await loadImageFromFile(file);
        ensureWorkingCanvas(image);
        state.sheetName = file.name || "glyph_custom.png";
        redrawGlyphCanvas();
        new Notification(`Loaded edited glyph sheet: ${state.sheetName}`, 2200, "notif");
    } catch (error) {
        console.error(error);
        new Notification("Could not load the glyph sheet.", 2800, "error");
    }
}

async function handleInsertImageUpload(file: File): Promise<void> {
    try {
        state.insertImage = await loadImageFromFile(file);
        state.insertImageName = file.name;
        updateGlyphInfo();
    } catch (error) {
        console.error(error);
        new Notification("Could not load the image to insert.", 2800, "error");
    }
}

function buildGlyphEditor(): void {
    const form = getForm();
    if (!form) return;
    if (form.dataset.initialized === "true") return;

    form.dataset.initialized = "true";
    form.innerHTML = `
        <div class="glyphEditorLayout">
            <div class="glyphEditorSidebar">
                <label class="modalOptionLabel">${translateText("Built-in Glyph Sheets")}</label>
                <select class="modalOptionInput glyphEditorSheetSelect"></select>
                <div class="glyphEditorButtonRow">
                    <button type="button" class="propertyInputButton glyphEditorLoadBuiltIn">${translateText("Load Built-in Sheet")}</button>
                    <button type="button" class="propertyInputButton glyphEditorFindEmpty">${translateText("Find Empty Slot")}</button>
                </div>

                <label class="modalOptionLabel">${translateText("Upload Edited Glyph Sheet")}</label>
                <div class="glyphEditorButtonRow">
                    <button type="button" class="propertyInputButton glyphEditorUploadSheetButton">${translateText("Upload Edited Glyph Sheet")}</button>
                    <input type="file" class="glyphEditorUploadSheetInput" accept=".png,image/png">
                </div>

                <label class="modalOptionLabel">${translateText("Insert Image")}</label>
                <div class="glyphEditorButtonRow">
                    <button type="button" class="propertyInputButton glyphEditorUploadInsertButton">${translateText("Choose Image To Insert")}</button>
                    <input type="file" class="glyphEditorUploadInsertInput" accept=".png,image/png,image/webp,image/jpeg">
                </div>

                <div class="glyphEditorMetaCard">
                    <div class="glyphEditorMetaTitle">${translateText("Selected Cell")}</div>
                    <div class="glyphEditorMetaValue glyphEditorSelectedCell">0, 0 (00)</div>
                    <div class="glyphEditorMetaTitle">${translateText("Unicode")}</div>
                    <div class="glyphEditorMetaValue glyphEditorUnicode">U+0000 / \\u0000</div>
                    <div class="glyphEditorMetaTitle">${translateText("Glyph Text")}</div>
                    <div class="glyphEditorMetaValue glyphEditorGlyphText">-</div>
                    <div class="glyphEditorMetaTitle">${translateText("Insert Image")}</div>
                    <div class="glyphEditorMetaValue glyphEditorImageStatus">${translateText("No image selected yet.")}</div>
                </div>

                <div class="glyphEditorButtonColumn">
                    <button type="button" class="propertyInputButton glyphEditorInsertButton">${translateText("Insert Into Selected Cell")}</button>
                    <button type="button" class="propertyInputButton glyphEditorCopyGlyphButton">${translateText("Copy Selected Glyph Text")}</button>
                    <button type="button" class="propertyInputButton glyphEditorClearButton">${translateText("Clear Selected Cell")}</button>
                    <button type="button" class="propertyInputButton glyphEditorDownloadButton">${translateText("Download Glyph Sheet")}</button>
                </div>

                <div class="modalOptionBody glyphEditorStatus"></div>
            </div>

            <div class="glyphEditorCanvasPanel">
                <div class="glyphEditorCanvasHeader">${translateText("Load a built-in glyph sheet, upload an edited sheet to continue working, then insert your image into any slot.")}</div>
                <canvas class="glyphEditorCanvas" width="512" height="512"></canvas>
            </div>
        </div>
    `;

    const sheetSelect = form.querySelector(".glyphEditorSheetSelect") as HTMLSelectElement;
    const loadBuiltInButton = form.querySelector(".glyphEditorLoadBuiltIn") as HTMLButtonElement;
    const findEmptyButton = form.querySelector(".glyphEditorFindEmpty") as HTMLButtonElement;
    const uploadSheetButton = form.querySelector(".glyphEditorUploadSheetButton") as HTMLButtonElement;
    const uploadSheetInput = form.querySelector(".glyphEditorUploadSheetInput") as HTMLInputElement;
    const uploadInsertButton = form.querySelector(".glyphEditorUploadInsertButton") as HTMLButtonElement;
    const uploadInsertInput = form.querySelector(".glyphEditorUploadInsertInput") as HTMLInputElement;
    const insertButton = form.querySelector(".glyphEditorInsertButton") as HTMLButtonElement;
    const copyGlyphButton = form.querySelector(".glyphEditorCopyGlyphButton") as HTMLButtonElement;
    const clearButton = form.querySelector(".glyphEditorClearButton") as HTMLButtonElement;
    const downloadButton = form.querySelector(".glyphEditorDownloadButton") as HTMLButtonElement;
    const canvas = form.querySelector(".glyphEditorCanvas") as HTMLCanvasElement;

    for (const sheetName of DEFAULT_GLYPH_SHEETS) {
        const option = document.createElement("option");
        option.value = sheetName;
        option.textContent = sheetName;
        sheetSelect.appendChild(option);
    }

    const defaultSheet = DEFAULT_GLYPH_SHEETS.includes("glyph_E0.png") ? "glyph_E0.png" : DEFAULT_GLYPH_SHEETS[0];
    if (defaultSheet) sheetSelect.value = defaultSheet;

    state.displayCanvas = canvas;
    state.displayContext = canvas.getContext("2d");
    if (state.displayContext) state.displayContext.imageSmoothingEnabled = false;

    canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        const column = Math.max(0, Math.min(15, Math.floor((x / canvas.width) * 16)));
        const row = Math.max(0, Math.min(15, Math.floor((y / canvas.height) * 16)));
        state.selectedCell = row * 16 + column;
        redrawGlyphCanvas();
    });

    loadBuiltInButton.onclick = () => void loadBuiltInSheet(sheetSelect.value);
    sheetSelect.onchange = () => void loadBuiltInSheet(sheetSelect.value);
    findEmptyButton.onclick = () => selectNextEmptyCell();
    uploadSheetButton.onclick = () => uploadSheetInput.click();
    uploadInsertButton.onclick = () => uploadInsertInput.click();

    uploadSheetInput.onchange = () => {
        const file = uploadSheetInput.files?.[0];
        if (!file) return;
        void handleSheetUpload(file);
        uploadSheetInput.value = "";
    };

    uploadInsertInput.onchange = () => {
        const file = uploadInsertInput.files?.[0];
        if (!file) return;
        void handleInsertImageUpload(file);
        uploadInsertInput.value = "";
    };

    insertButton.onclick = () => insertSelectedImage();
    copyGlyphButton.onclick = () => void copySelectedGlyphText();
    clearButton.onclick = () => clearSelectedCell();
    downloadButton.onclick = () => downloadWorkingSheet();

    updateGlyphInfo();
    redrawGlyphCanvas();
}

export async function ensureGlyphEditorReady(): Promise<void> {
    const form = getForm();

    if (!form) {
        new Notification("Could not load the glyph sheet.", 2800, "error");
        return;
    }

    buildGlyphEditor();

    const select = form.querySelector(".glyphEditorSheetSelect") as HTMLSelectElement | null;
    if (!state.sheetName && select?.value) {
        await loadBuiltInSheet(select.value);
    } else {
        redrawGlyphCanvas();
    }
}

export async function glyphEditorModal(): Promise<void> {
    openGlyphEditorModalBridge();
}
