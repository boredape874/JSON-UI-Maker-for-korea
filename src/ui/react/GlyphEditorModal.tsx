import { useEffect, useRef, useState } from "react";
import { DEFAULT_GLYPH_SHEETS } from "../../glyph/defaultGlyphSheets.js";
import { translateText } from "../../i18n.js";
import {
    clearGlyphCell,
    drawGlyphCanvas,
    findNextEmptyGlyphCell,
    getGlyphSelectionDetails,
    getSelectedCellFromCanvasClick,
    insertGlyphImage,
    loadBuiltInGlyphSheet,
    loadInsertGlyphImage,
    loadUploadedGlyphSheet,
} from "../modals/glyphEditorModal.js";
import { Notification } from "../notifs/noficationMaker.js";
import { closeGlyphEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

const DEFAULT_CANVAS_SHEET = DEFAULT_GLYPH_SHEETS.includes("glyph_E0.png") ? "glyph_E0.png" : (DEFAULT_GLYPH_SHEETS[0] ?? "");

export function GlyphEditorModal() {
    const [open, setOpen] = useState(false);
    const [sheetName, setSheetName] = useState<string | null>(null);
    const [workingCanvas, setWorkingCanvas] = useState<HTMLCanvasElement | null>(null);
    const [selectedCell, setSelectedCell] = useState(0);
    const [insertImage, setInsertImage] = useState<HTMLImageElement | null>(null);
    const [insertImageName, setInsertImageName] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const uploadSheetInputRef = useRef<HTMLInputElement | null>(null);
    const uploadInsertInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-glyph-editor") {
            setOpen(true);
        }

        if (event.type === "close-glyph-editor") {
            setOpen(false);
        }
    }), []);

    useEffect(() => {
        if (!open || workingCanvas || !DEFAULT_CANVAS_SHEET) {
            return;
        }

        void loadBuiltInGlyphSheet(DEFAULT_CANVAS_SHEET).then((result) => {
            setSheetName(result.sheetName);
            setWorkingCanvas(result.workingCanvas);
            setSelectedCell(0);
        }).catch(() => {});
    }, [open, workingCanvas]);

    useEffect(() => {
        if (!open || !canvasRef.current) {
            return;
        }

        drawGlyphCanvas(canvasRef.current, workingCanvas, selectedCell);
    }, [open, workingCanvas, selectedCell]);

    const selectionDetails = getGlyphSelectionDetails(sheetName, selectedCell);
    const status = !sheetName
        ? translateText("Choose a built-in glyph sheet or upload an edited sheet to begin.")
        : `${sheetName} - ${translateText("Click a cell in the grid to choose where the next image should be inserted.")}`;

    const handleBuiltInLoad = async (nextSheetName: string) => {
        if (!nextSheetName) {
            return;
        }

        try {
            const result = await loadBuiltInGlyphSheet(nextSheetName);
            setSheetName(result.sheetName);
            setWorkingCanvas(result.workingCanvas);
            setSelectedCell(0);
        } catch {}
    };

    const handleSheetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const result = await loadUploadedGlyphSheet(file);
            setSheetName(result.sheetName);
            setWorkingCanvas(result.workingCanvas);
            setSelectedCell(0);
        } catch {}

        event.target.value = "";
    };

    const handleInsertImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const result = await loadInsertGlyphImage(file);
            setInsertImage(result.image);
            setInsertImageName(result.name);
        } catch {}

        event.target.value = "";
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) {
            return;
        }

        setSelectedCell(getSelectedCellFromCanvasClick(canvasRef.current, event.nativeEvent));
    };

    const handleFindEmpty = () => {
        if (!workingCanvas) {
            new Notification("Please load a glyph sheet first.", 2500, "warning");
            return;
        }

        const nextCell = findNextEmptyGlyphCell(workingCanvas);
        if (nextCell == null) {
            new Notification("No empty glyph slots were found in this sheet.", 2800, "warning");
            return;
        }

        setSelectedCell(nextCell);
        new Notification("Selected the next empty glyph slot.", 2200, "notif");
    };

    const handleInsert = () => {
        if (!workingCanvas) {
            new Notification("Please load a glyph sheet first.", 2500, "warning");
            return;
        }

        if (!insertImage) {
            new Notification("Please choose an image to insert.", 2500, "warning");
            return;
        }

        try {
            setWorkingCanvas(insertGlyphImage(workingCanvas, selectedCell, insertImage));
            new Notification("Inserted image into glyph slot.", 2000, "notif");
        } catch (error) {
            console.error(error);
            new Notification("Could not update the glyph sheet.", 2800, "error");
        }
    };

    const handleClear = () => {
        if (!workingCanvas) {
            new Notification("Please load a glyph sheet first.", 2500, "warning");
            return;
        }

        try {
            setWorkingCanvas(clearGlyphCell(workingCanvas, selectedCell));
            new Notification("Cleared glyph slot.", 2000, "notif");
        } catch (error) {
            console.error(error);
            new Notification("Could not update the glyph sheet.", 2800, "error");
        }
    };

    const handleDownload = () => {
        if (!workingCanvas || !sheetName) {
            new Notification("Please load a glyph sheet first.", 2500, "warning");
            return;
        }

        const link = document.createElement("a");
        link.href = workingCanvas.toDataURL("image/png");
        link.download = sheetName;
        link.click();
    };

    const handleCopy = async () => {
        if (!sheetName || !selectionDetails.hasStandardCodepoint) {
            new Notification("Only built-in glyph sheets expose a standard glyph character to copy.", 2800, "warning");
            return;
        }

        try {
            await navigator.clipboard.writeText(selectionDetails.glyphText);
            new Notification("Selected glyph text copied to clipboard!", 2200, "notif");
        } catch (error) {
            console.error(error);
            new Notification("Could not copy the selected glyph text.", 2800, "error");
        }
    };

    return (
        <div
            id="modalGlyphEditor"
            className="modal"
            style={{ display: open ? "block" : "none" }}
            onClick={(event) => {
                if (event.target === event.currentTarget) closeGlyphEditorModalBridge();
            }}
        >
            <div className="modal-content glyphEditorModalContent">
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => closeGlyphEditorModalBridge()}>&times;</span>
                <h2 className="modalHeader">Glyph Editor</h2>
                <div className="modalGlyphEditorForm">
                    <div className="glyphEditorLayout">
                        <div className="glyphEditorSidebar">
                            <label className="modalOptionLabel">{translateText("Built-in Glyph Sheets")}</label>
                            <select
                                className="modalOptionInput glyphEditorSheetSelect"
                                value={sheetName && DEFAULT_GLYPH_SHEETS.includes(sheetName) ? sheetName : DEFAULT_CANVAS_SHEET}
                                onChange={(event) => void handleBuiltInLoad(event.target.value)}
                            >
                                {DEFAULT_GLYPH_SHEETS.map((entry) => (
                                    <option key={entry} value={entry}>{entry}</option>
                                ))}
                            </select>
                            <div className="glyphEditorButtonRow">
                                <button type="button" className="propertyInputButton glyphEditorLoadBuiltIn" onClick={() => void handleBuiltInLoad(sheetName && DEFAULT_GLYPH_SHEETS.includes(sheetName) ? sheetName : DEFAULT_CANVAS_SHEET)}>
                                    {translateText("Load Built-in Sheet")}
                                </button>
                                <button type="button" className="propertyInputButton glyphEditorFindEmpty" onClick={handleFindEmpty}>
                                    {translateText("Find Empty Slot")}
                                </button>
                            </div>

                            <label className="modalOptionLabel">{translateText("Upload Edited Glyph Sheet")}</label>
                            <div className="glyphEditorButtonRow">
                                <button type="button" className="propertyInputButton glyphEditorUploadSheetButton" onClick={() => uploadSheetInputRef.current?.click()}>
                                    {translateText("Upload Edited Glyph Sheet")}
                                </button>
                                <input
                                    ref={uploadSheetInputRef}
                                    type="file"
                                    className="glyphEditorUploadSheetInput"
                                    accept=".png,image/png"
                                    onChange={(event) => void handleSheetUpload(event)}
                                />
                            </div>

                            <label className="modalOptionLabel">{translateText("Insert Image")}</label>
                            <div className="glyphEditorButtonRow">
                                <button type="button" className="propertyInputButton glyphEditorUploadInsertButton" onClick={() => uploadInsertInputRef.current?.click()}>
                                    {translateText("Choose Image To Insert")}
                                </button>
                                <input
                                    ref={uploadInsertInputRef}
                                    type="file"
                                    className="glyphEditorUploadInsertInput"
                                    accept=".png,image/png,image/webp,image/jpeg"
                                    onChange={(event) => void handleInsertImageUpload(event)}
                                />
                            </div>

                            <div className="glyphEditorMetaCard">
                                <div className="glyphEditorMetaTitle">{translateText("Selected Cell")}</div>
                                <div className="glyphEditorMetaValue glyphEditorSelectedCell">{`${selectionDetails.row}, ${selectionDetails.column} (${selectionDetails.slotHex})`}</div>
                                <div className="glyphEditorMetaTitle">{translateText("Unicode")}</div>
                                <div className="glyphEditorMetaValue glyphEditorUnicode">
                                    {selectionDetails.hasStandardCodepoint
                                        ? `U+${selectionDetails.unicodeHex} / \\u${selectionDetails.unicodeHex}`
                                        : `${translateText("Slot")}: ${selectionDetails.slotHex}`}
                                </div>
                                <div className="glyphEditorMetaTitle">{translateText("Glyph Text")}</div>
                                <div className="glyphEditorMetaValue glyphEditorGlyphText">{selectionDetails.glyphText}</div>
                                <div className="glyphEditorMetaTitle">{translateText("Insert Image")}</div>
                                <div className="glyphEditorMetaValue glyphEditorImageStatus">{insertImageName ?? translateText("No image selected yet.")}</div>
                            </div>

                            <div className="glyphEditorButtonColumn">
                                <button type="button" className="propertyInputButton glyphEditorInsertButton" onClick={handleInsert}>
                                    {translateText("Insert Into Selected Cell")}
                                </button>
                                <button type="button" className="propertyInputButton glyphEditorCopyGlyphButton" onClick={() => void handleCopy()}>
                                    {translateText("Copy Selected Glyph Text")}
                                </button>
                                <button type="button" className="propertyInputButton glyphEditorClearButton" onClick={handleClear}>
                                    {translateText("Clear Selected Cell")}
                                </button>
                                <button type="button" className="propertyInputButton glyphEditorDownloadButton" onClick={handleDownload}>
                                    {translateText("Download Glyph Sheet")}
                                </button>
                            </div>

                            <div className="modalOptionBody glyphEditorStatus">{status}</div>
                        </div>

                        <div className="glyphEditorCanvasPanel">
                            <div className="glyphEditorCanvasHeader">
                                {translateText("Load a built-in glyph sheet, upload an edited sheet to continue working, then insert your image into any slot.")}
                            </div>
                            <canvas
                                ref={canvasRef}
                                className="glyphEditorCanvas"
                                width={512}
                                height={512}
                                onClick={handleCanvasClick}
                            ></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
