import { useEffect, useRef, useState } from "react";
import { ensureGlyphEditorReady, registerGlyphEditorHost } from "../modals/glyphEditorModal.js";
import { closeGlyphEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

export function GlyphEditorModal() {
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        const form = formRef.current;
        if (!form) {
            return;
        }

        registerGlyphEditorHost({ form });
        return () => registerGlyphEditorHost(null);
    }, []);

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
                <div ref={formRef} className="modalGlyphEditorForm"></div>
            </div>
        </div>
    );
}
