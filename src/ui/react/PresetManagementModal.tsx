import { useEffect, useState } from "react";
import { authManager } from "../../auth.js";
import { confirmLocalized } from "../../i18n.js";
import { presetManager } from "../../presetManager.js";
import { Notification } from "../notifs/noficationMaker.js";
import { closePresetManagementBridge, subscribeModalBridge } from "./modalBridge.js";

type PresetRecord = {
    id: number;
    user_id: number;
    name: string;
    is_public: boolean;
    created_at: string;
};

export function PresetManagementModal() {
    const [open, setOpen] = useState(false);
    const [presets, setPresets] = useState<PresetRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");

    const loadPresets = async () => {
        const user = authManager.getCurrentUser();
        if (!user) {
            setPresets([]);
            return;
        }

        setLoading(true);
        try {
            const all = await presetManager.getUserPresets();
            setPresets((all as PresetRecord[]).filter((preset) => preset.user_id === user.id));
        } catch (error) {
            console.error("Error loading presets:", error);
            new Notification("Error loading presets", 3000, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-preset-management") {
            setOpen(true);
            void loadPresets();
        }

        if (event.type === "close-preset-management") {
            setOpen(false);
        }
    }), []);

    const savePresetName = async (presetId: number) => {
        if (!editingName.trim()) {
            new Notification("Preset name cannot be empty", 3000, "error");
            return;
        }

        setPresets((current) => current.map((preset) => preset.id === presetId ? { ...preset, name: editingName.trim() } : preset));
        setEditingId(null);
        new Notification("Preset name updated in UI", 2500, "notif");
    };

    const toggleVisibility = async (presetId: number) => {
        try {
            const result = await presetManager.makePresetPublic(presetId);
            if (!result.success) {
                new Notification(result.message, 3000, "error");
                return;
            }
            new Notification(result.message, 3000, "notif");
            await loadPresets();
        } catch (error) {
            console.error("Error toggling preset visibility:", error);
            new Notification("Failed to change preset visibility", 3000, "error");
        }
    };

    const deletePreset = async (presetId: number) => {
        if (!confirmLocalized("Are you sure you want to delete this preset? This action cannot be undone.")) return;
        try {
            if (!(window as any).dbManager?.deletePreset) {
                new Notification("Database manager not available", 3000, "error");
                return;
            }
            await (window as any).dbManager.deletePreset(presetId);
            new Notification("Preset deleted successfully", 3000, "notif");
            await loadPresets();
        } catch (error) {
            console.error("Error deleting preset:", error);
            new Notification("Failed to delete preset", 3000, "error");
        }
    };

    return (
        <div id="modalPresetManagement" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) closePresetManagementBridge();
        }}>
            <div className="modal-content" style={{ maxWidth: 600, maxHeight: "80vh", overflowY: "auto" }}>
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => closePresetManagementBridge()}>&times;</span>
                <h2 className="modalHeader">Manage Presets</h2>
                <div className="presetManagementContent">
                    {loading ? <p style={{ textAlign: "center", color: "#ccc" }}>Loading presets...</p> : null}
                    {!loading && presets.length === 0 ? <p style={{ textAlign: "center", color: "#ccc" }}>No presets found. Upload some presets first.</p> : null}
                    <div className="preset-list">
                        {presets.map((preset) => {
                            const createdDate = new Date(preset.created_at).toLocaleDateString("ko-KR");
                            const isEditing = editingId === preset.id;
                            return (
                                <div className="preset-item" data-preset-id={preset.id} key={preset.id}>
                                    <div className="preset-info">
                                        <div className="preset-name">
                                            {isEditing ? (
                                                <>
                                                    <input className="preset-name-input" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                                                    <div style={{ marginTop: 4 }}>
                                                        <button className="preset-btn edit" onClick={() => void savePresetName(preset.id)}>Save</button>
                                                        <button className="preset-btn" style={{ background: "#6c757d", color: "white", marginLeft: 4 }} onClick={() => setEditingId(null)}>Cancel</button>
                                                    </div>
                                                </>
                                            ) : (
                                                <span data-no-translate="true">{preset.name}</span>
                                            )}
                                        </div>
                                        <div className="preset-details">
                                            <span className={`preset-visibility ${preset.is_public ? "public" : "private"}`}>{preset.is_public ? "Public" : "Private"}</span>
                                            <span> 업로드일: {createdDate}</span>
                                        </div>
                                    </div>
                                    {!isEditing ? (
                                        <div className="preset-actions">
                                            <button className="preset-btn edit" onClick={() => { setEditingId(preset.id); setEditingName(preset.name); }}>Edit Name</button>
                                            <button className={`preset-btn visibility make-${preset.is_public ? "private" : "public"}`} onClick={() => void toggleVisibility(preset.id)}>
                                                {preset.is_public ? "Make Private" : "Make Public"}
                                            </button>
                                            <button className="preset-btn delete" onClick={() => void deletePreset(preset.id)}>Delete</button>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
