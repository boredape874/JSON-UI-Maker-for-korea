import { config } from "../../CONFIG.js";
import { translateText } from "../../i18n.js";
import { Builder } from "../../index.js";
import { StringUtil } from "../../util/stringUtil.js";

const modal: HTMLElement = document.getElementById("modalSaveForms")!;
const closeBtn: HTMLElement = document.getElementById("modalSaveFormsClose") as HTMLElement;

function closeModal(): void {
    modal.style.display = "none";
}

function createActionButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "saveFormsActionButton";
    button.textContent = translateText(label);
    button.onclick = onClick;
    return button;
}

function createPreviewRow(labelText: string, valueElement: HTMLElement): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "saveFormsPreviewRow";

    const label = document.createElement("span");
    label.className = "saveFormsPreviewLabel";
    label.textContent = translateText(labelText);

    row.appendChild(label);
    row.appendChild(valueElement);

    return row;
}

function createActionCard(title: string, description: string, buttons: HTMLButtonElement[]): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "saveFormsActionCard";

    const header = document.createElement("div");
    header.className = "saveFormsActionTitle";
    header.textContent = translateText(title);

    const body = document.createElement("div");
    body.className = "saveFormsActionDescription";
    body.textContent = translateText(description);

    const actions = document.createElement("div");
    actions.className = "saveFormsActionButtons";

    for (const button of buttons) {
        actions.appendChild(button);
    }

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    return card;
}

export function saveFormsModal(): void {
    modal.style.display = "block";

    const form = document.getElementsByClassName("modalSaveFormsForm")[0] as HTMLDivElement;
    form.innerHTML = "";

    const intro = document.createElement("label");
    intro.className = "modalOptionBody";
    intro.textContent = translateText("Adjust the form name before copying or downloading.");

    const nameLabel = document.createElement("label");
    nameLabel.className = "modalOptionLabel";
    nameLabel.htmlFor = "saveFormsNameInput";
    nameLabel.textContent = `${translateText("Form Name")}:`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "saveFormsNameInput";
    nameInput.className = "modalOptionInput saveFormsNameInput";
    nameInput.autocomplete = "off";
    nameInput.value = config.formFileName;

    const helper = document.createElement("label");
    helper.className = "modalOptionBody";
    helper.textContent = translateText("This updates the form file name and namespace together. Server-Form stays server_form.json.");

    const serverFormNotice = document.createElement("label");
    serverFormNotice.className = "modalOptionBody";
    serverFormNotice.textContent = translateText("Server-Form must be used together with the normal form JSON that has the same namespace. Export both files into the UI folder.");

    const previewBox = document.createElement("div");
    previewBox.className = "saveFormsPreviewBox";

    const namespaceValue = document.createElement("code");
    namespaceValue.className = "saveFormsPreviewValue";

    const formValue = document.createElement("code");
    formValue.className = "saveFormsPreviewValue";

    const serverFormValue = document.createElement("code");
    serverFormValue.className = "saveFormsPreviewValue";

    previewBox.appendChild(createPreviewRow("Namespace", namespaceValue));
    previewBox.appendChild(createPreviewRow("Form", formValue));
    previewBox.appendChild(createPreviewRow("Server-Form", serverFormValue));

    const refreshPreview = (): void => {
        const currentName = nameInput.value.trim() || config.formFileName || "form_ui";
        const safeFileName = StringUtil.toSafeFileName(currentName);
        const safeNamespace = StringUtil.toSafeNamespace(currentName);

        namespaceValue.textContent = safeNamespace;
        formValue.textContent = `${safeFileName}.json`;
        serverFormValue.textContent = "server_form.json";
    };

    const runAction = (action: () => void): void => {
        if (!Builder.setFormIdentity(nameInput.value)) return;

        action();
        closeModal();
    };

    const cardGrid = document.createElement("div");
    cardGrid.className = "saveFormsActionGrid";

    cardGrid.appendChild(
        createActionCard("Form", "Copy or download the standard form JSON.", [
            createActionButton("Copy", () => runAction(() => Builder.generateAndCopyJsonUI("copy"))),
            createActionButton("Download", () => runAction(() => Builder.generateAndCopyJsonUI("download"))),
        ])
    );

    cardGrid.appendChild(
        createActionCard("Server-Form", "Copy or download the server form that points to this form.", [
            createActionButton("Copy", () => runAction(() => Builder.downloadServerForm("copy"))),
            createActionButton("Download", () => runAction(() => Builder.downloadServerForm("download"))),
        ])
    );

    cardGrid.appendChild(
        createActionCard("Used Images", "Download the textures currently used by this form, including button states and nineslice JSON when available.", [
            createActionButton("Download", () => {
                void runAction(() => {
                    void Builder.downloadCurrentFormImages();
                });
            }),
        ])
    );

    cardGrid.appendChild(
        createActionCard("Loaded Presets", "Download every preset texture currently loaded in the site, including matching nineslice JSON files.", [
            createActionButton("Download", () => {
                void runAction(() => {
                    void Builder.downloadLoadedPresetTextures();
                });
            }),
        ])
    );

    nameInput.addEventListener("input", refreshPreview);
    refreshPreview();

    form.appendChild(intro);
    form.appendChild(document.createElement("br"));
    form.appendChild(document.createElement("br"));
    form.appendChild(nameLabel);
    form.appendChild(nameInput);
    form.appendChild(document.createElement("br"));
    form.appendChild(helper);
    form.appendChild(document.createElement("br"));
    form.appendChild(serverFormNotice);
    form.appendChild(document.createElement("br"));
    form.appendChild(document.createElement("br"));
    form.appendChild(previewBox);
    form.appendChild(document.createElement("br"));
    form.appendChild(cardGrid);
}

closeBtn.onclick = () => {
    closeModal();
};

window.addEventListener("click", (event) => {
    if (event.target == modal) {
        closeModal();
    }
});
