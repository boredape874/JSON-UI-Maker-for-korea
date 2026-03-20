import { useEffect, useRef, useState } from "react";
import { registerHudEditorHost } from "../modals/hudEditorModal.js";
import { closeHudEditorBridge, subscribeHudEditorModalBridge } from "./hudEditorModalBridge.js";

export function HudEditorModalHost() {
    const [open, setOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const formRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeHudEditorModalBridge((event) => {
            setOpen(event.type === "open");
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const modal = modalRef.current;
        const closeButton = closeButtonRef.current;
        const form = formRef.current;
        if (!modal || !closeButton || !form) {
            return;
        }

        registerHudEditorHost({ modal, closeButton, form });
        return () => registerHudEditorHost(null);
    }, []);

    return (
        <div ref={modalRef} id="hudEditorScreen" className="hudEditorScreen" style={{ display: open ? "flex" : "none" }}>
            <div className="hudEditorScreenHeader">
                <div className="hudEditorScreenTitle">HUD Editor</div>
                <button
                    ref={closeButtonRef}
                    type="button"
                    id="hudEditorScreenClose"
                    className="propertyInputButton hudEditorScreenClose"
                    onClick={() => closeHudEditorBridge()}
                >
                    Close HUD Editor
                </button>
            </div>
            <div ref={formRef} className="hudEditorScreenBody modalHudEditorForm"></div>
        </div>
    );
}
