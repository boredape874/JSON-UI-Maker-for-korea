import { FormEvent, useEffect, useState } from "react";
import { config } from "../../CONFIG.js";
import { translateText } from "../../i18n.js";
import { subscribeModalBridge } from "./modalBridge.js";

type CreateFormResolver = ((value: Record<string, any>) => void) | null;

export function CreateFormModal() {
    const [open, setOpen] = useState(false);
    const [formName, setFormName] = useState(config.formFileName);
    const [titleFlag, setTitleFlag] = useState(config.title_flag);
    const [resolver, setResolver] = useState<CreateFormResolver>(null);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type !== "open-create-form") return;
        setFormName(config.formFileName);
        setTitleFlag(config.title_flag);
        setResolver(() => event.resolve);
        setOpen(true);
    }), []);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!formName.trim()) return;
        if (!/^[^0-9].*$/u.test(titleFlag) || !titleFlag.trim()) return;
        resolver?.({
            form_name: formName.trim(),
            title_flag: titleFlag.trim(),
        });
        setOpen(false);
        setResolver(null);
    };

    return (
        <div id="modalCreateForm" className="modal" style={{ display: open ? "block" : "none" }}>
            <div className="modal-content">
                <h2 className="modalHeader">Create Form</h2>
                <form className="modalCreateFormForm" onSubmit={submit}>
                    <label className="modalOptionLabel">{translateText("Form Name")}: </label>
                    <input className="modalOptionInput" style={{ maxWidth: 100 }} value={formName} onChange={(event) => setFormName(event.target.value)} />
                    <label className="modalRequiredLabel" style={{ fontSize: 20, color: "red" }}>*</label>
                    <br />
                    <label className="modalOptionBody">{translateText("Used for the exported file name and namespace")}</label>
                    <br />
                    <label className="modalOptionLabel">{translateText("Title Flag")}: </label>
                    <input className="modalOptionInput" style={{ maxWidth: 100 }} value={titleFlag} onChange={(event) => setTitleFlag(event.target.value)} />
                    <label className="modalRequiredLabel" style={{ fontSize: 20, color: "red" }}>*</label>
                    <br />
                    <label className="modalOptionBody">{translateText("Will be set as your title flag in scripts")}<br />{translateText("Cant start with a number")}</label>
                    <br />
                    <input type="submit" value="Create" className="modalSubmitButton" />
                </form>
            </div>
        </div>
    );
}
