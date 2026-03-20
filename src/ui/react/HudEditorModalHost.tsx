import { useEffect, useRef, useState } from "react";
import { registerHudEditorHost } from "../modals/hudEditorModal.js";
import { closeHudEditorBridge, subscribeHudEditorModalBridge } from "./hudEditorModalBridge.js";
import { HudEditorWorkspace } from "./HudEditorWorkspace.js";

export function HudEditorModalHost() {
    const [open, setOpen] = useState(false);
    const [hostReady, setHostReady] = useState(false);
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
        setHostReady(true);
        return () => {
            setHostReady(false);
            registerHudEditorHost(null);
        };
    }, []);

    return (
        <div ref={modalRef} id="hudEditorScreen" className="hudEditorScreen" style={{ display: open ? "flex" : "none" }}>
            <div className="hudEditorScreenHeader">
                <div className="hudEditorScreenTitle">HUD 에디터</div>
                <button
                    ref={closeButtonRef}
                    type="button"
                    id="hudEditorScreenClose"
                    className="propertyInputButton hudEditorScreenClose"
                    onClick={() => closeHudEditorBridge()}
                >
                    HUD 에디터 닫기
                </button>
            </div>
            <div ref={formRef} className="hudEditorScreenBody modalHudEditorForm">
                {hostReady ? <HudEditorWorkspace /> : null}
            </div>
        </div>
    );
}
