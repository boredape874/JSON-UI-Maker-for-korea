import { useEffect, useState } from "react";
import { closeHelpModal, subscribeModalBridge } from "./modalBridge.js";

export function HelpModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type === "open-help") setOpen(true);
        if (event.type === "close-help") setOpen(false);
    }), []);

    return (
        <div id="modalHelpMenu" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) closeHelpModal();
        }}>
            <div className="modal-content" style={{ maxWidth: 640, maxHeight: "80vh", overflowY: "auto" }}>
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => closeHelpModal()}>&times;</span>
                <h2 className="modalHeader">Help</h2>
                <div className="modalHelpMenuForm">
                    <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Key Binds:</label><br /><br />
                    <label className="modalOptionLabel">CTRL + c: <b>Copy</b><br />CTRL + v: <b>Paste</b><br />CTRL + x: <b>Cut</b><br />Tab: <b>Indent</b><br />Del: <b>Delete</b><br />Tab | Enter: <b>Autocomplete</b><br />Arrow Keys: <b>Move</b></label><br /><br /><br />
                    <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)", fontSize: 20 }}>Bindings Quick Guide</label><br /><br />
                    <label className="modalOptionLabel">1. Use "binding_name" to receive a value such as "#title_text".</label><br /><br />
                    <label className="modalOptionLabel">2. Use "binding_type": "view" when you want to control visibility or other view properties.</label><br /><br />
                    <label className="modalOptionLabel">"source_property_name" is the condition or source expression, and "target_property_name" is the property to change.</label><br /><br />
                    <label className="modalOptionLabel" style={{ color: "#9dd1ff" }}>Tips: Type # for source property suggestions, and type " inside a key to see available binding keys.</label><br /><br />
                    <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Example:</label><br /><br />
                    <pre className="modalHelpCode">{`[
  {
    "binding_name": "#title_text"
  },
  {
    "binding_type": "view",
    "source_property_name": "(not (#title_text = ''))",
    "target_property_name": "#visible"
  }
]`}</pre><br /><br />
                    <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)", fontSize: 20 }}>General Issues:</label><br /><br />
                    <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Why arent my buttons working in-game?</label><br /><br />
                    <label className="modalOptionLabel">You probably need to stack the button on top of a collection panel. If that doesnt fix it, check that all texture paths are correct.</label><br /><br />
                    <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Why isnt the form uploader working?</label><br /><br />
                    <label className="modalOptionLabel">The form uploader can only upload forms made by the website.</label>
                </div>
            </div>
        </div>
    );
}
