import { useEffect, useMemo, useState } from "react";
import { authManager } from "../../auth.js";
import { config } from "../../CONFIG.js";
import { loadPresetTextureSets } from "../../files/initDefaultImages.js";
import { presetManager } from "../../presetManager.js";
import { images } from "../../runtime/imageStore.js";
import { Notification } from "../notifs/noficationMaker.js";
import { closeTexturePresetsModal, subscribeModalBridge } from "./modalBridge.js";

type PresetRecord = {
    id: number;
    user_id: number;
    name: string;
    is_public: boolean;
    png_path: string;
};

type PresetFileMeta = {
    name: string;
    type: "png" | "json";
    key: string;
};

const builtinPresets = [
    { name: "turquoise_ore-ui_style", displayName: "Turquoise Ore-UI Style" },
    { name: "red_ore-ui_style", displayName: "Red Ore-UI Style" },
    { name: "pink_ore-ui_style", displayName: "Pink Ore-UI Style" },
    { name: "eternal_ore-ui_style", displayName: "Eternal Ore-UI Style" },
    { name: "other_ore-ui_style", displayName: "Other Ore-UI Style" },
] as const;

async function createImageDataFromBase64(base64Data: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.onerror = reject;
        img.src = base64Data.startsWith("data:image/") ? base64Data : `data:image/png;base64,${base64Data}`;
    });
}

async function saveLoadedTextureToAssets(imageName: string, data: { png?: ImageData; json?: any }): Promise<void> {
    if (data.png) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = data.png.width;
        canvas.height = data.png.height;
        ctx.putImageData(data.png, 0, 0);
        localStorage.setItem(`asset_${imageName}_png`, JSON.stringify({
            base64: canvas.toDataURL("image/png"),
            metadata: {
                name: `${imageName}.png`,
                type: "png",
                relativePath: `assets/${imageName}.png`,
                presetLoaded: true,
                loadedAt: new Date().toISOString(),
            },
        }));
    }

    if (data.json) {
        localStorage.setItem(`asset_${imageName}_json`, JSON.stringify({
            jsonContent: data.json,
            metadata: {
                name: `${imageName}.json`,
                type: "json",
                relativePath: `assets/${imageName}.json`,
                presetLoaded: true,
                loadedAt: new Date().toISOString(),
            },
        }));
    }
}

async function loadStoredPresetAssets(preset: PresetRecord): Promise<number> {
    const metadataStr = localStorage.getItem(preset.png_path);
    if (!metadataStr) return 0;

    const files: PresetFileMeta[] = JSON.parse(metadataStr);
    const loadedImages: Record<string, { png?: ImageData; json?: any }> = {};

    for (const file of files) {
        if (file.type === "png") {
            const pngData = localStorage.getItem(file.key);
            if (!pngData) continue;
            const imageName = file.name.replace(".png", "");
            loadedImages[imageName] ??= {};
            loadedImages[imageName].png = await createImageDataFromBase64(pngData);
        } else {
            const jsonDataStr = localStorage.getItem(file.key);
            if (!jsonDataStr) continue;
            const imageName = file.name.replace(".json", "");
            loadedImages[imageName] ??= {};
            loadedImages[imageName].json = JSON.parse(jsonDataStr);
        }
    }

    for (const [imageName, data] of Object.entries(loadedImages)) {
        images.set(imageName, data);
        await saveLoadedTextureToAssets(imageName, data);
    }

    return files.length;
}

export function TexturePresetsModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userPresets, setUserPresets] = useState<PresetRecord[]>([]);
    const [publicPresets, setPublicPresets] = useState<PresetRecord[]>([]);
    const [selectedBuiltins, setSelectedBuiltins] = useState<Record<string, boolean>>({});
    const [selectedPresets, setSelectedPresets] = useState<Record<string, boolean>>({});

    const signedInUser = authManager.getCurrentUser();

    const userOwnedPresets = useMemo(
        () => userPresets.filter((preset) => preset.user_id === signedInUser?.id),
        [signedInUser?.id, userPresets]
    );

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-texture-presets") {
            void (async () => {
                setLoading(true);
                setSelectedBuiltins(Object.fromEntries(builtinPresets.map((preset) => [preset.name, false])));
                setSelectedPresets({});
                setOpen(true);
                try {
                    if (authManager.getCurrentUser()) {
                        const [own, publicList] = await Promise.all([
                            presetManager.getUserPresets(),
                            presetManager.getPublicPresets(),
                        ]);
                        setUserPresets(own as PresetRecord[]);
                        setPublicPresets(publicList as PresetRecord[]);
                    } else {
                        setUserPresets([]);
                        setPublicPresets([]);
                    }
                } finally {
                    setLoading(false);
                }
            })();
        }

        if (event.type === "close-texture-presets") {
            setOpen(false);
        }
    }), []);

    const applySelections = async () => {
        setLoading(true);
        try {
            for (const preset of builtinPresets) {
                if (!selectedBuiltins[preset.name]) continue;
                if (config.texturePresets?.[preset.name]) continue;
                loadPresetTextureSets(preset.name);
                config.texturePresets![preset.name] = true;
            }

            const allPresets = [...userOwnedPresets, ...publicPresets];
            for (const preset of allPresets) {
                if (!selectedPresets[String(preset.id)]) continue;
                const loadedCount = await loadStoredPresetAssets(preset);
                if (loadedCount > 0) {
                    new Notification(`Loaded ${loadedCount} files from preset: ${preset.name}`, 3000, "notif");
                }
            }

            closeTexturePresetsModal();
        } catch (error) {
            console.error("Failed to load texture presets:", error);
            new Notification("Failed to load selected presets.", 3000, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="modalLoadTexturePresets" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) closeTexturePresetsModal();
        }}>
            <div className="modal-content">
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => closeTexturePresetsModal()}>&times;</span>
                <h2 className="modalHeader">Load Texture Presets</h2>
                <div className="modalLoadTexturePresetsForm">
                    <p className="modalOptionInput" style={{ textAlign: "center" }}>To get the textures in MC<br />download the files from github</p>
                    <br />
                    {signedInUser ? (
                        <>
                            <h3 style={{ color: "white", marginTop: 20, marginBottom: 10 }}>Your Uploaded Presets</h3>
                            {userOwnedPresets.length === 0 && publicPresets.length === 0 ? (
                                <p style={{ color: "#ccc", textAlign: "center" }}>No presets available. Upload some presets first.</p>
                            ) : null}
                            {userOwnedPresets.length > 0 ? (
                                <div style={{ marginBottom: 15 }}>
                                    <h4 style={{ color: "white", marginBottom: 8 }}>Your Presets</h4>
                                    {userOwnedPresets.map((preset) => (
                                        <label key={`user-${preset.id}`} style={{ display: "flex", alignItems: "center", marginBottom: 5, padding: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4, color: "white" }}>
                                            <input type="checkbox" checked={Boolean(selectedPresets[String(preset.id)])} onChange={(event) => setSelectedPresets((current) => ({ ...current, [String(preset.id)]: event.target.checked }))} style={{ marginRight: 10 }} />
                                            <span style={{ flex: 1 }} data-no-translate="true">{preset.name}</span>
                                            <span style={{ color: preset.is_public ? "#28a745" : "#ffc107", fontSize: 12 }}>{preset.is_public ? "(Public)" : "(Private)"}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : null}
                            {publicPresets.length > 0 ? (
                                <div style={{ marginBottom: 15 }}>
                                    <h4 style={{ color: "white", marginBottom: 8 }}>Public Presets</h4>
                                    {publicPresets.map((preset) => (
                                        <label key={`public-${preset.id}`} style={{ display: "flex", alignItems: "center", marginBottom: 5, padding: 5, backgroundColor: "rgba(0,123,255,0.1)", borderRadius: 4, color: "white" }}>
                                            <input type="checkbox" checked={Boolean(selectedPresets[String(preset.id)])} onChange={(event) => setSelectedPresets((current) => ({ ...current, [String(preset.id)]: event.target.checked }))} style={{ marginRight: 10 }} />
                                            <span style={{ flex: 1 }} data-no-translate="true">{preset.name}</span>
                                            <span style={{ color: "#28a745", fontSize: 12 }}>(Public)</span>
                                        </label>
                                    ))}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <p style={{ color: "#ccc", textAlign: "center", marginTop: 10 }}><em>Sign in to upload and view your presets</em></p>
                    )}

                    {builtinPresets.map((preset) => {
                        const alreadyLoaded = Boolean(config.texturePresets?.[preset.name]);
                        return (
                            <div key={preset.name}>
                                <label className="modalOptionLabel">{preset.displayName}: </label>
                                <input
                                    type="checkbox"
                                    className="modalOptionInput"
                                    checked={alreadyLoaded || Boolean(selectedBuiltins[preset.name])}
                                    disabled={alreadyLoaded}
                                    onChange={(event) => setSelectedBuiltins((current) => ({ ...current, [preset.name]: event.target.checked }))}
                                />
                                <br />
                            </div>
                        );
                    })}

                    <input type="button" value={loading ? "Loading..." : "Load Textures"} className="modalSubmitButton" disabled={loading} onClick={() => void applySelections()} />
                </div>
            </div>
        </div>
    );
}
