import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "../../lib/assetUrl.js";
import { closeChestUiEditorModalBridge, subscribeModalBridge } from "./modalBridge.js";

export function ChestUiEditorModal() {
    const [open, setOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-chest-ui-editor") setOpen(true);
        if (event.type === "close-chest-ui-editor") setOpen(false);
    }), []);

    const iframeSrc = useMemo(() => assetUrl(`chest-ui-editor/index.html?v=${reloadKey}`), [reloadKey]);

    return (
        <div id="chestUiEditorScreen" className="chestUiEditorScreen" style={{ display: open ? "flex" : "none" }}>
            <div className="chestUiEditorScreenHeader">
                <div className="chestUiEditorScreenTitle">Chest UI Editor (New Beta)</div>
                <div className="chestUiEditorScreenActions">
                    <button
                        type="button"
                        className="propertyInputButton"
                        onClick={() => setReloadKey((value) => value + 1)}
                    >
                        새로고침
                    </button>
                    <a
                        className="propertyInputButton chestUiEditorExternalLink"
                        href={iframeSrc}
                        target="_blank"
                        rel="noreferrer"
                    >
                        새 탭 열기
                    </a>
                    <button
                        type="button"
                        className="propertyInputButton chestUiEditorScreenClose"
                        onClick={() => closeChestUiEditorModalBridge()}
                    >
                        닫기
                    </button>
                </div>
            </div>

            <div className="chestUiEditorEmbeddedBody">
                <iframe
                    key={reloadKey}
                    className="chestUiEditorIframe"
                    src={iframeSrc}
                    title="Chest UI Editor (New Beta)"
                />
            </div>
        </div>
    );
}
