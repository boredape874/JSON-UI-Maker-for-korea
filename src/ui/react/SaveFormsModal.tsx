import { useEffect, useMemo, useState } from "react";
import { config } from "../../CONFIG.js";
import { Builder } from "../../index.js";
import { translateText } from "../../i18n.js";
import { StringUtil } from "../../util/stringUtil.js";
import { closeSaveFormsModal, subscribeModalBridge } from "./modalBridge.js";

function ActionCard({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="saveFormsActionCard">
            <div className="saveFormsActionTitle">{translateText(title)}</div>
            <div className="saveFormsActionDescription">{translateText(description)}</div>
            <div className="saveFormsActionButtons">{children}</div>
        </div>
    );
}

export function SaveFormsModal() {
    const [open, setOpen] = useState(false);
    const [formName, setFormName] = useState(config.formFileName);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-save-forms") {
            setFormName(config.formFileName);
            setOpen(true);
        }
        if (event.type === "close-save-forms") {
            setOpen(false);
        }
    }), []);

    const preview = useMemo(() => {
        const currentName = formName.trim() || config.formFileName || "form_ui";
        return {
            fileName: StringUtil.toSafeFileName(currentName),
            namespace: StringUtil.toSafeNamespace(currentName),
        };
    }, [formName]);

    const runAction = (action: () => void) => {
        if (!Builder.setFormIdentity(formName)) return;
        action();
        closeSaveFormsModal();
    };

    return (
        <div id="modalSaveForms" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) closeSaveFormsModal();
        }}>
            <div className="modal-content modalSaveFormsContent">
                <span id="modalSaveFormsClose" className="modalClose" onClick={() => closeSaveFormsModal()}>&times;</span>
                <h2 className="modalHeader">Save Forms</h2>
                <div className="modalSaveFormsForm">
                    <label className="modalOptionBody">{translateText("Adjust the form name before copying or downloading.")}</label>
                    <br /><br />
                    <label className="modalOptionLabel" htmlFor="saveFormsNameInput">{translateText("Form Name")}:</label>
                    <input id="saveFormsNameInput" className="modalOptionInput saveFormsNameInput" autoComplete="off" value={formName} onChange={(event) => setFormName(event.target.value)} />
                    <br />
                    <label className="modalOptionBody">{translateText("This updates the form file name and namespace together. Server-Form stays server_form.json.")}</label>
                    <br />
                    <label className="modalOptionBody">{translateText("Server-Form must be used together with the normal form JSON that has the same namespace. Export both files into the UI folder.")}</label>
                    <br /><br />
                    <div className="saveFormsPreviewBox">
                        <div className="saveFormsPreviewRow"><span className="saveFormsPreviewLabel">{translateText("Namespace")}</span><code className="saveFormsPreviewValue">{preview.namespace}</code></div>
                        <div className="saveFormsPreviewRow"><span className="saveFormsPreviewLabel">{translateText("Form")}</span><code className="saveFormsPreviewValue">{preview.fileName}.json</code></div>
                        <div className="saveFormsPreviewRow"><span className="saveFormsPreviewLabel">{translateText("Server-Form")}</span><code className="saveFormsPreviewValue">server_form.json</code></div>
                    </div>
                    <br />
                    <div className="saveFormsActionGrid">
                        <ActionCard title="Form" description="Copy or download the standard form JSON.">
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => Builder.generateAndCopyJsonUI("copy"))}>{translateText("Copy")}</button>
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => Builder.generateAndCopyJsonUI("download"))}>{translateText("Download")}</button>
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => { void Builder.downloadFormPackageZip(true); })}>{translateText("Package ZIP")}</button>
                        </ActionCard>
                        <ActionCard title="Server-Form" description="Copy or download the server form that points to this form.">
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => Builder.downloadServerForm("copy"))}>{translateText("Copy")}</button>
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => Builder.downloadServerForm("download"))}>{translateText("Download")}</button>
                        </ActionCard>
                        <ActionCard title="Used Images" description="Download the textures currently used by this form. ZIP keeps the in-game textures/... folder structure.">
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => { void Builder.downloadCurrentFormImages(); })}>{translateText("Download")}</button>
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => { void Builder.downloadCurrentFormImagesZip(); })}>{translateText("ZIP")}</button>
                        </ActionCard>
                        <ActionCard title="Loaded Presets" description="Download every preset texture currently loaded in the site. ZIP keeps the textures/... folder structure.">
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => { void Builder.downloadLoadedPresetTextures(); })}>{translateText("Download")}</button>
                            <button type="button" className="saveFormsActionButton" onClick={() => runAction(() => { void Builder.downloadLoadedPresetTexturesZip(); })}>{translateText("ZIP")}</button>
                        </ActionCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
