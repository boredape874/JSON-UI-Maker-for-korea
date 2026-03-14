import { translateText } from "../../i18n.js";

const modal: HTMLElement = document.getElementById("modalPasteForm")!;
const closeBtn: HTMLElement = document.getElementById("modalPasteFormClose") as HTMLElement;
const form: HTMLDivElement = document.getElementsByClassName("modalPasteFormForm")[0] as HTMLDivElement;

export interface PasteFormResult {
    formText?: string;
    fileName?: string;
}

export async function pasteFormModal(): Promise<PasteFormResult | undefined> {
    modal.style.display = "block";
    form.innerHTML = "";

    const nameLabel = document.createElement("label");
    nameLabel.className = "modalOptionLabel";
    nameLabel.textContent = `${translateText("Form File Name (Optional)")}:`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "modalOptionInput";
    nameInput.placeholder = "example_screen.json";

    const bodyLabel = document.createElement("label");
    bodyLabel.className = "modalOptionLabel";
    bodyLabel.textContent = `${translateText("Paste JSON-UI Code")}:`;

    const textArea = document.createElement("textarea");
    textArea.className = "modalOptionInput modalTextareaInput";
    textArea.spellcheck = false;
    textArea.placeholder = '{\n  "namespace": "my_namespace"\n}';

    const helper = document.createElement("label");
    helper.className = "modalOptionBody";
    helper.textContent = translateText("Paste an existing JSON-UI form here to load it directly into the editor.");

    const submit = document.createElement("input");
    submit.type = "submit";
    submit.className = "modalSubmitButton";
    submit.value = translateText("Load Form");

    form.appendChild(nameLabel);
    form.appendChild(nameInput);
    form.appendChild(document.createElement("br"));
    form.appendChild(bodyLabel);
    form.appendChild(textArea);
    form.appendChild(document.createElement("br"));
    form.appendChild(helper);
    form.appendChild(document.createElement("br"));
    form.appendChild(submit);

    return new Promise((resolve) => {
        const close = (result?: PasteFormResult) => {
            modal.style.display = "none";
            submit.onclick = null;
            resolve(result);
        };

        submit.onclick = () => {
            const formText = textArea.value.trim();
            if (!formText) return;

            close({
                formText,
                fileName: nameInput.value.trim() || undefined,
            });
        };

        textArea.focus();

        const closeHandler = () => close(undefined);
        closeBtn.onclick = closeHandler;
        modal.onclick = (event: MouseEvent) => {
            if (event.target === modal) close(undefined);
        };
    });
}
