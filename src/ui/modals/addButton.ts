import { ButtonOptions } from "../../elements/button.js";
import { openAddButtonModal as openAddButtonModalBridge } from "../react/modalBridge.js";

const options = [
    {
        type: "texture",
        default: "assets/placeholder",
        name: "defaultTexture",
        displayName: "Default Texture",
    },
    {
        type: "texture",
        default: "assets/placeholder",
        name: "hoverTexture",
        displayName: "Hover Texture",
    },
    {
        type: "texture",
        default: "assets/placeholder",
        name: "pressedTexture",
        displayName: "Pressed Texture",
    },
    {
        type: "number",
        default: "0",
        name: "collectionIndex",
        displayName: "Collection Index",
    },
];

export async function addButtonModal(): Promise<ButtonOptions> {
    return openAddButtonModalBridge() as Promise<ButtonOptions>;
}
