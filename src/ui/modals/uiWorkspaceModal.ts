import { translateText } from "../../i18n.js";
import { UiWorkspaceCandidate, UiWorkspaceData } from "../uiWorkspace.js";

const modal: HTMLElement = document.getElementById("modalUiWorkspace")!;
const closeBtn: HTMLElement = document.getElementById("modalUiWorkspaceClose") as HTMLElement;
const form: HTMLDivElement = document.getElementsByClassName("modalUiWorkspaceForm")[0] as HTMLDivElement;

export interface UiWorkspaceSelection {
    candidateId: string;
}

function createCandidateOption(candidate: UiWorkspaceCandidate): HTMLOptionElement {
    const option = document.createElement("option");
    option.value = candidate.id;
    option.textContent = `${candidate.id} (${candidate.type}) - ${candidate.sourceFile}`;
    return option;
}

export async function uiWorkspaceModal(workspace: UiWorkspaceData): Promise<UiWorkspaceSelection | undefined> {
    modal.style.display = "block";
    form.innerHTML = "";

    const summary = document.createElement("div");
    summary.className = "modalOptionBody";
    summary.textContent = `${translateText("Loaded UI files:")} ${workspace.files.length}. ${translateText(
        "Choose the screen or control you want to open."
    )}`;

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "modalOptionInput";
    searchInput.placeholder = translateText("Search UI controls...");

    const select = document.createElement("select");
    select.className = "modalOptionInput";
    select.size = 14;
    select.style.width = "min(760px, 80vw)";

    const helper = document.createElement("div");
    helper.className = "modalOptionBody";
    helper.textContent = translateText(
        "Tip: complex controls that depend on unsupported Bedrock features may only load partially in the editor."
    );

    const submit = document.createElement("input");
    submit.type = "submit";
    submit.className = "modalSubmitButton";
    submit.value = translateText("Load Selected UI");

    const refreshOptions = () => {
        const query = searchInput.value.trim().toLowerCase();
        select.innerHTML = "";

        for (const candidate of workspace.candidates.filter(
            (entry) =>
                !query ||
                `${entry.id} ${entry.type} ${entry.sourceFile}`.toLowerCase().includes(query)
        )) {
            select.appendChild(createCandidateOption(candidate));
        }

        if (select.options.length > 0) {
            select.selectedIndex = 0;
        }
    };

    searchInput.addEventListener("input", refreshOptions);
    refreshOptions();

    form.appendChild(summary);
    form.appendChild(document.createElement("br"));
    form.appendChild(searchInput);
    form.appendChild(document.createElement("br"));
    form.appendChild(select);
    form.appendChild(document.createElement("br"));
    form.appendChild(helper);
    form.appendChild(document.createElement("br"));
    form.appendChild(submit);

    return new Promise((resolve) => {
        const close = (result?: UiWorkspaceSelection) => {
            modal.style.display = "none";
            resolve(result);
        };

        closeBtn.onclick = () => close(undefined);
        modal.onclick = (event: MouseEvent) => {
            if (event.target === modal) close(undefined);
        };

        submit.onclick = () => {
            if (!select.value) return;
            close({ candidateId: select.value });
        };
    });
}
