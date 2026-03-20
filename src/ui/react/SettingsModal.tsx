import { useEffect, useState } from "react";
import { config } from "../../CONFIG.js";
import { translateText } from "../../i18n.js";
import { getBuilderRuntime } from "../../runtime/builderRuntime.js";
import { closeSettingsModal, subscribeModalBridge } from "./modalBridge.js";

type SettingsSnapshot = Record<string, { type: string; editable: boolean; value: any; displayName?: string; onchange?: (value: any) => void }>;

function snapshotSettings(): SettingsSnapshot {
    return Object.fromEntries(Object.entries(config.settings).map(([key, value]) => [key, { ...value }]));
}

export function SettingsModal() {
    const [open, setOpen] = useState(false);
    const [settings, setSettings] = useState<SettingsSnapshot>(() => snapshotSettings());

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-settings") {
            setSettings(snapshotSettings());
            setOpen(true);
        }

        if (event.type === "close-settings") {
            setOpen(false);
        }
    }), []);

    const updateSetting = (key: string, value: any) => {
        setSettings((current) => ({ ...current, [key]: { ...current[key], value } }));
        getBuilderRuntime().setSettingToggle(key as keyof typeof config.settings, value);
        config.settings[key]?.onchange?.(value);
    };

    return (
        <div id="modalSettings" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) closeSettingsModal();
        }}>
            <div className="modal-content">
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => closeSettingsModal()}>&times;</span>
                <h2 className="modalHeader">Settings</h2>
                <div className="modalSettingsForm">
                    {Object.entries(settings).filter(([, setting]) => setting.editable).map(([key, setting]) => (
                        <div key={key}>
                            <label className="modalOptionLabel" htmlFor={key}>{translateText(setting.displayName ?? "")}: </label>
                            {setting.type === "checkbox" ? (
                                <input id={key} type="checkbox" className="modalOptionInput" checked={Boolean(setting.value)} onChange={(event) => updateSetting(key, event.target.checked)} />
                            ) : (
                                <input id={key} type={setting.type} className="modalOptionInput" value={String(setting.value)} onChange={(event) => updateSetting(key, setting.type === "number" ? event.target.valueAsNumber : event.target.value)} />
                            )}
                            <br />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
