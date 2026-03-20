import { assetUrl } from "../../lib/assetUrl.js";

export function ChooseImageModalShell() {
    return (
        <div id="modalChooseImage" className="modal">
            <div className="modal-content chooseImageModalContent">
                <span id="modalChooseImageClose" className="modalClose">&times;</span>
                <h2 className="modalHeader">Choose Image</h2>
                <img src={assetUrl("icons/nineslice.webp")} style={{ width: 20, position: "relative", top: 5, left: 5 }} alt="Nineslice" />
                <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>: Nineslice Image</label>
                <div className="modalChooseImageForm"></div>
            </div>
        </div>
    );
}
