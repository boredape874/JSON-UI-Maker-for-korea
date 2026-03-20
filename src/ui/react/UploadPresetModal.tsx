import { FormEvent, useEffect, useState } from "react";
import { Notification } from "../notifs/noficationMaker.js";
import { closeUploadPresetBridge, subscribeModalBridge } from "./modalBridge.js";

export function UploadPresetModal() {
    const [open, setOpen] = useState(false);
    const [presetName, setPresetName] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [files, setFiles] = useState<FileList | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-upload-preset") {
            setPresetName("");
            setIsPublic(false);
            setFiles(null);
            setSubmitting(false);
            setMessage(null);
            setOpen(true);
        }

        if (event.type === "close-upload-preset") {
            setOpen(false);
        }
    }), []);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!presetName.trim()) {
            setMessage({ type: "error", text: "Please enter a name for your preset" });
            return;
        }
        if (!files || files.length === 0) {
            setMessage({ type: "error", text: "Please select files to upload" });
            return;
        }

        setSubmitting(true);
        try {
            const result = await (window as any).presetManager.uploadPreset(files, presetName.trim(), isPublic);
            setMessage({ type: result.success ? "success" : "error", text: result.message });
            if (!result.success) return;

            window.setTimeout(() => {
                closeUploadPresetBridge();
                if ((window as any).Builder) {
                    (window as any).Builder.refreshPresetTextures();
                }
                Notification && new Notification("Preset uploaded successfully", 2000, "notif");
            }, 1000);
        } catch (error) {
            console.error("Upload preset failed:", error);
            setMessage({ type: "error", text: "An unexpected error occurred during upload" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div id="modalUploadPreset" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) closeUploadPresetBridge();
        }}>
            <div className="modal-content" style={{ maxWidth: 500 }}>
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => closeUploadPresetBridge()}>&times;</span>
                <h2 className="modalHeader">Upload Preset</h2>
                <div className="modalUploadPresetForm">
                    <p style={{ color: "white", marginBottom: 15 }}>
                        Upload PNG textures and their corresponding nineslice JSON files.
                        <strong> Note:</strong> mappings.json files are not allowed.
                    </p>
                    <form onSubmit={submit}>
                        <div className="upload-form-group">
                            <label htmlFor="presetName" className="upload-label">Preset Name:</label>
                            <input
                                type="text"
                                id="presetName"
                                value={presetName}
                                onChange={(event) => setPresetName(event.target.value)}
                                placeholder="Enter a name for your preset"
                                style={{ display: "block", width: "100%", padding: 8, marginBottom: 15, border: "1px solid #ccc", borderRadius: 4, backgroundColor: "rgba(255,255,255,0.05)", color: "white" }}
                                required
                            />
                        </div>
                        <div className="upload-form-group">
                            <label htmlFor="presetFiles" className="upload-label">Select PNG and JSON files:</label>
                            <input id="presetFiles" type="file" accept=".png,.json" multiple required style={{ display: "block" }} onChange={(event) => setFiles(event.target.files)} />
                            <div className="file-info" style={{ color: "#ccc", fontSize: 12, marginTop: 5 }}>
                                You can select multiple PNG files and their corresponding JSON files
                            </div>
                        </div>
                        <div className="upload-form-group">
                            <label className="upload-label">
                                <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} style={{ marginRight: 8 }} />
                                Make this preset public
                            </label>
                            <div className="file-info" style={{ color: "#ccc", fontSize: 12, marginTop: 5 }}>
                                Public presets can be seen and used by other users
                            </div>
                        </div>
                        <div className="upload-form-buttons">
                            <button type="submit" disabled={submitting}>{submitting ? "Uploading..." : "Upload Preset"}</button>
                        </div>
                    </form>
                    <div className={`upload-message${message ? ` ${message.type}` : ""}`} style={{ display: message ? "block" : "none" }}>
                        {message?.text}
                    </div>
                </div>
            </div>
        </div>
    );
}
