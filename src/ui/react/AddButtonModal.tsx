import { useEffect, useState } from "react";
import { GeneralUtil } from "../../util/generalUtil.js";
import { chooseImageModal } from "../modals/chooseImage.js";
import { subscribeModalBridge } from "./modalBridge.js";

type AddButtonResolver = ((value: Record<string, string>) => void) | null;

export function AddButtonModal() {
    const [open, setOpen] = useState(false);
    const [resolver, setResolver] = useState<AddButtonResolver>(null);
    const [defaultTexture, setDefaultTexture] = useState("assets/placeholder");
    const [hoverTexture, setHoverTexture] = useState("assets/placeholder");
    const [pressedTexture, setPressedTexture] = useState("assets/placeholder");
    const [collectionIndex, setCollectionIndex] = useState("0");

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type !== "open-add-button") return;
        setDefaultTexture("assets/placeholder");
        setHoverTexture("assets/placeholder");
        setPressedTexture("assets/placeholder");
        setCollectionIndex("0");
        setResolver(() => event.resolve);
        setOpen(true);
    }), []);

    const close = (value?: Record<string, string>) => {
        if (value) resolver?.(value);
        setResolver(null);
        setOpen(false);
    };

    const pickTexture = async (setter: (value: string) => void) => {
        const filePath = await chooseImageModal();
        if (!filePath) return;
        setter(filePath);
    };

    return (
        <div id="modalAddButton" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
        }}>
            <div className="modal-content">
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => setOpen(false)}>&times;</span>
                <h2 className="modalHeader">Add Button</h2>
                <div className="modalAddButtonForm">
                    {[
                        ["Default Texture", defaultTexture, setDefaultTexture],
                        ["Hover Texture", hoverTexture, setHoverTexture],
                        ["Pressed Texture", pressedTexture, setPressedTexture],
                    ].map(([label, value, setter]) => (
                        <div key={label}>
                            <label className="modalOptionLabel">{label}: </label>
                            <input
                                type="text"
                                readOnly
                                className="modalOptionInput"
                                value={value}
                                onClick={() => void pickTexture(setter as (value: string) => void)}
                                ref={(input) => {
                                    if (input) window.setTimeout(() => GeneralUtil.autoResizeInput(input));
                                }}
                            />
                            <br />
                        </div>
                    ))}
                    <label className="modalOptionLabel">Collection Index: </label>
                    <input type="number" className="modalOptionInput" value={collectionIndex} onChange={(event) => setCollectionIndex(event.target.value)} />
                    <br />
                    <input
                        type="button"
                        value="Create"
                        className="modalSubmitButton"
                        onClick={() => close({ defaultTexture, hoverTexture, pressedTexture, collectionIndex })}
                    />
                </div>
            </div>
        </div>
    );
}
