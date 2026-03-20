import { FormEvent, useEffect, useState } from "react";
import { translateText } from "../../i18n.js";
import { subscribeModalBridge } from "./modalBridge.js";

type PasteResolver = ((value: { formText?: string; fileName?: string } | undefined) => void) | null;

export function PasteFormModal() {
    const [open, setOpen] = useState(false);
    const [fileName, setFileName] = useState("");
    const [formText, setFormText] = useState("");
    const [resolver, setResolver] = useState<PasteResolver>(null);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type !== "open-paste-form") return;
        setFileName(event.defaults?.fileName ?? "");
        setFormText(event.defaults?.formText ?? "");
        setResolver(() => event.resolve);
        setOpen(true);
    }), []);

    const close = (value?: { formText?: string; fileName?: string }) => {
        resolver?.(value);
        setResolver(null);
        setOpen(false);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = formText.trim();
        if (!trimmed) return;
        close({
            formText: trimmed,
            fileName: fileName.trim() || undefined,
        });
    };

    return (
        <div id="modalPasteForm" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) close(undefined);
        }}>
            <div className="modal-content" style={{ maxWidth: 860 }}>
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => close(undefined)}>&times;</span>
                <h2 className="modalHeader">Paste Form Code</h2>
                <form className="modalPasteFormForm" onSubmit={submit}>
                    <label className="modalOptionLabel">{translateText("Form File Name (Optional)")}: </label>
                    <input type="text" className="modalOptionInput" placeholder="example_screen.json" value={fileName} onChange={(event) => setFileName(event.target.value)} />
                    <br />
                    <label className="modalOptionLabel">{translateText("Paste JSON-UI Code")}: </label>
                    <textarea className="modalOptionInput modalTextareaInput" spellCheck={false} placeholder={'{\n  "namespace": "my_namespace"\n}'} value={formText} onChange={(event) => setFormText(event.target.value)} />
                    <br />
                    <label className="modalOptionBody">{translateText("Paste an existing JSON-UI form here to load it directly into the editor.")}</label>
                    <br />
                    <input type="submit" className="modalSubmitButton" value={translateText("Load Form")} />
                </form>
            </div>
        </div>
    );
}
