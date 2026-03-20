import { useEffect, useState } from "react";
import { ensureGlyphEditorReady } from "../modals/glyphEditorModal.js";
import { closeGlyphEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

export function GlyphEditorModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-glyph-editor") {
            setOpen(true);
        }

        if (event.type === "close-glyph-editor") {
            setOpen(false);
        }
    }), []);

    useEffect(() => {
        if (!open) return;
        void ensureGlyphEditorReady();
    }, [open]);

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
                <div className="modalGlyphEditorForm"></div>
            </div>
        </div>
    );
}
