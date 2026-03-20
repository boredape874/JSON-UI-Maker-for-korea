import { config } from "../CONFIG.js";
import { DraggableButton } from "../elements/button.js";
import { DraggableCanvas } from "../elements/canvas.js";
import { GLOBAL_ELEMENT_MAP, type GlobalElementMapValue } from "../runtime/editorStore.js";

function redrawScaledElements(): void {
    const allElements = Array.from(GLOBAL_ELEMENT_MAP.values());
    const allImages = allElements.filter((element: GlobalElementMapValue) => element instanceof DraggableCanvas) as DraggableCanvas[];
    const allButtons = allElements.filter((element: GlobalElementMapValue) => element instanceof DraggableButton) as DraggableButton[];

    allImages.forEach((image: DraggableCanvas) => image.drawImage(image.canvas.width, image.canvas.height, false));
    allButtons.forEach((button: DraggableButton) => button.drawImage(button.canvas.width, button.canvas.height, button.imageDataDefault, false));
}

export function initScaleUi(): void {
    const slider = document.getElementById("ui_scale_slider") as HTMLInputElement | null;
    if (!slider) return;

    slider.valueAsNumber = config.magicNumbers.UI_SCALAR * 100;

    slider.oninput = () => {
        config.magicNumbers.UI_SCALAR = slider.valueAsNumber / 100;
        redrawScaledElements();
    };
}
