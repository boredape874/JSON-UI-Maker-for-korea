import { config } from "../../CONFIG.js";
import { GLOBAL_FILE_SYSTEM } from "../../index.js";

const modal: HTMLElement = document.getElementById("modalChooseImage") as HTMLElement;
const closeBtn: HTMLElement = document.getElementById("modalChooseImageClose") as HTMLElement;
const form: HTMLDivElement = document.getElementsByClassName("modalChooseImageForm")[0] as HTMLDivElement;

type PreviewableImageState = {
    png?: ImageData;
    json?: {
        nineslice_size?: number[];
        base_size?: number[];
        [key: string]: any;
    };
};

class ChooseImageFileTree {
    static constructTextElement(
        text: string,
        hasChildren: boolean,
        hasNineslice: boolean = false,
        imagePath?: string
    ): HTMLDivElement {
        const div = document.createElement("div");
        div.classList.add("explorerDiv");

        const textDiv = document.createElement("div");
        textDiv.classList.add("explorerText");
        textDiv.textContent = text;
        textDiv.dataset.noTranslate = "true";

        if (imagePath) {
            textDiv.dataset.imagePath = imagePath;
            textDiv.title = imagePath;
        }

        if (hasChildren) {
            const arrowDiv = document.createElement("img") as HTMLImageElement;
            arrowDiv.src = "assets/arrow_down.webp";
            arrowDiv.classList.add("explorerArrow");
            arrowDiv.style.marginLeft = "5px";
            div.appendChild(arrowDiv);
        }

        div.appendChild(textDiv);

        if (hasNineslice) {
            const ninesliceImg = document.createElement("img") as HTMLImageElement;
            ninesliceImg.src = "icons/nineslice.webp";
            ninesliceImg.classList.add("explorerHasNineslice");
            div.appendChild(ninesliceImg);
        }

        return div;
    }

    static tree(fileStructureCurrentDir: any, lastTextElement: HTMLDivElement, depth: number = 0, currentPath: string = ""): void {
        const nextDirs = Object.keys(fileStructureCurrentDir);

        for (const nextDir of nextDirs) {
            const nextPath = currentPath ? `${currentPath}/${nextDir}` : nextDir;
            const hasChildren: boolean = Object.keys(fileStructureCurrentDir[nextDir]).length > 0;

            if (hasChildren) {
                const textElement = ChooseImageFileTree.constructTextElement(nextDir, true);
                textElement.style.left = `${config.magicNumbers.explorer.folderIndentation - (depth === 0 ? 20 : 0)}px`;

                const textArrowElement = textElement.querySelector<HTMLImageElement>(".explorerArrow")!;

                textArrowElement.onclick = (event: MouseEvent) => {
                    event.stopPropagation();
                    event.preventDefault();

                    const nextIcon = textArrowElement.src.endsWith("assets/arrow_down.webp")
                        ? "assets/arrow_right.webp"
                        : "assets/arrow_down.webp";
                    textArrowElement.src = nextIcon;

                    for (const child of Array.from(textElement.children) as HTMLElement[]) {
                        if (child.classList.contains("explorerDiv")) {
                            child.style.display = child.style.display === "none" ? "block" : "none";
                        }
                    }
                };

                lastTextElement.appendChild(textElement);
                this.tree(fileStructureCurrentDir[nextDir], textElement, depth + 1, nextPath);
                continue;
            }

            const fileType = nextDir.split(".").pop()?.toLowerCase();
            if (!fileType || !(VALID_IMAGE_EXTENSIONS as readonly string[]).includes(fileType)) continue;

            const baseName = nextDir.replace(/\.[^.]+$/, "");
            const hasNineslice = nextDirs.some((dir) => dir === `${baseName}.json`);
            const imagePath = nextPath.replace(/\.[^/.]+$/, "");

            const textElement = ChooseImageFileTree.constructTextElement(nextDir, false, hasNineslice, imagePath);
            textElement.style.left = `${config.magicNumbers.explorer.nonFolderIndentation - (depth === 0 ? 20 : 0)}px`;

            lastTextElement.appendChild(textElement);
        }
    }
}

const VALID_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;

function getModalContent(): HTMLDivElement {
    return modal.querySelector(".modal-content") as HTMLDivElement;
}

function getImagesMap(): Map<string, PreviewableImageState> {
    return ((window as any).images as Map<string, PreviewableImageState> | undefined) ?? new Map();
}

function collectImagePaths(fsObj: any, currentPath: string = ""): string[] {
    const paths: string[] = [];

    for (const key of Object.keys(fsObj)) {
        const value = fsObj[key];
        const joinedPath = currentPath ? `${currentPath}/${key}` : key;
        const ext = key.split(".").pop()?.toLowerCase();

        if (typeof value === "object" && value !== null && Object.keys(value).length > 0) {
            paths.push(...collectImagePaths(value, joinedPath));
        } else if (ext && (VALID_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
            paths.push(joinedPath.replace(/\.[^/.]+$/, ""));
        }
    }

    return paths;
}

function createPreviewPanel(): HTMLDivElement {
    const previewPanel = document.createElement("div");
    previewPanel.className = "chooseImagePreviewPanel";

    previewPanel.innerHTML = `
        <div class="chooseImagePreviewHeader">
            <div class="chooseImagePreviewEyebrow">텍스처 미리보기</div>
            <div class="chooseImagePreviewHint">왼쪽에서 텍스처를 클릭해 확인하고, 더블클릭하거나 아래 버튼으로 선택하세요.</div>
        </div>
        <div class="chooseImagePreviewCanvasWrap">
            <canvas class="chooseImagePreviewCanvas"></canvas>
            <div class="chooseImagePreviewEmpty">선택한 텍스처가 여기에 표시됩니다.</div>
        </div>
        <div class="chooseImagePreviewTitle" data-no-translate="true">아직 선택된 텍스처가 없습니다</div>
        <div class="chooseImagePreviewPath" data-no-translate="true"></div>
        <div class="chooseImagePreviewBadgeRow"></div>
        <div class="chooseImagePreviewMeta"></div>
        <button type="button" class="chooseImagePreviewButton" disabled>이 텍스처 사용</button>
    `;

    return previewPanel;
}

function addFilePathToStructure(fsObj: any, filePath: string): void {
    const parts = filePath.split("/").filter(Boolean);
    let current = fsObj;

    for (const part of parts) {
        if (!current[part]) {
            current[part] = {};
        }

        current = current[part];
    }
}

function ensureChooseImageLayout(): { contentWrapper: HTMLDivElement; previewPanel: HTMLDivElement } {
    const modalContent = getModalContent();

    let contentWrapper = modalContent.querySelector(".chooseImageContent") as HTMLDivElement | null;
    if (!contentWrapper) {
        contentWrapper = document.createElement("div");
        contentWrapper.className = "chooseImageContent";
        modalContent.insertBefore(contentWrapper, form);
        contentWrapper.appendChild(form);
    }

    let previewPanel = contentWrapper.querySelector(".chooseImagePreviewPanel") as HTMLDivElement | null;
    if (!previewPanel) {
        previewPanel = createPreviewPanel();
        contentWrapper.appendChild(previewPanel);
    }

    return { contentWrapper, previewPanel };
}

function getPreviewElements(previewPanel: HTMLElement) {
    return {
        canvas: previewPanel.querySelector(".chooseImagePreviewCanvas") as HTMLCanvasElement,
        empty: previewPanel.querySelector(".chooseImagePreviewEmpty") as HTMLDivElement,
        title: previewPanel.querySelector(".chooseImagePreviewTitle") as HTMLDivElement,
        path: previewPanel.querySelector(".chooseImagePreviewPath") as HTMLDivElement,
        badges: previewPanel.querySelector(".chooseImagePreviewBadgeRow") as HTMLDivElement,
        meta: previewPanel.querySelector(".chooseImagePreviewMeta") as HTMLDivElement,
        button: previewPanel.querySelector(".chooseImagePreviewButton") as HTMLButtonElement,
    };
}

function resetPreview(previewPanel: HTMLElement): void {
    const preview = getPreviewElements(previewPanel);

    preview.canvas.style.display = "none";
    preview.canvas.width = 1;
    preview.canvas.height = 1;
    preview.empty.style.display = "flex";
    preview.empty.textContent = "선택한 텍스처가 여기에 표시됩니다.";
    preview.title.textContent = "아직 선택된 텍스처가 없습니다";
    preview.path.textContent = "";
    preview.badges.innerHTML = "";
    preview.meta.innerHTML = "";
    preview.button.disabled = true;
    delete preview.button.dataset.imagePath;
}

function drawImagePreview(canvas: HTMLCanvasElement, imageData: ImageData): void {
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d")!;

    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempContext.putImageData(imageData, 0, 0);

    const maxSize = 240;
    const rawScale = Math.min(maxSize / imageData.width, maxSize / imageData.height);
    const scale = rawScale >= 1 ? Math.max(1, Math.floor(rawScale)) : rawScale;
    const width = Math.max(1, Math.round(imageData.width * scale));
    const height = Math.max(1, Math.round(imageData.height * scale));

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d")!;
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    context.drawImage(tempCanvas, 0, 0, width, height);
}

function formatVector(values: number[] | undefined): string {
    if (!values || values.length === 0) return "-";
    return `[${values.join(", ")}]`;
}

function createBadge(text: string, className: string): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = `chooseImagePreviewBadge ${className}`;
    badge.textContent = text;
    return badge;
}

function createMetaRow(label: string, value: string): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "chooseImagePreviewMetaRow";

    const labelElement = document.createElement("span");
    labelElement.className = "chooseImagePreviewMetaLabel";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");
    valueElement.className = "chooseImagePreviewMetaValue";
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);

    return row;
}

function getImageLabel(imagePath: string): string {
    const pathParts = imagePath.split("/");
    return pathParts[pathParts.length - 1] ?? imagePath;
}

function renderPreview(previewPanel: HTMLElement, imagePath: string | undefined): boolean {
    if (!imagePath) {
        resetPreview(previewPanel);
        return false;
    }

    const preview = getPreviewElements(previewPanel);
    const imageState = getImagesMap().get(imagePath);
    const hasPreviewableData = Boolean(imageState?.png || imageState?.json);

    preview.title.textContent = getImageLabel(imagePath);
    preview.path.textContent = imagePath;
    preview.badges.innerHTML = "";
    preview.meta.innerHTML = "";

    if (imageState?.png) {
        preview.badges.appendChild(createBadge("PNG", "is-png"));
        drawImagePreview(preview.canvas, imageState.png);
        preview.canvas.style.display = "block";
        preview.empty.style.display = "none";
    } else {
        preview.canvas.style.display = "none";
        preview.empty.style.display = "flex";
        preview.empty.textContent = imageState?.json
            ? "PNG는 없지만 NineSlice 정보는 들어 있어요."
            : "이 텍스처 데이터를 아직 불러오지 못했어요.";
    }

    if (imageState?.json) {
        preview.badges.appendChild(createBadge("NineSlice", "is-nineslice"));
    }

    if (!hasPreviewableData) {
        preview.badges.appendChild(createBadge("데이터 없음", "is-missing"));
    }

    preview.meta.appendChild(createMetaRow("경로", imagePath));
    preview.meta.appendChild(
        createMetaRow("이미지 크기", imageState?.png ? `${imageState.png.width} x ${imageState.png.height}` : "이미지 없음")
    );
    preview.meta.appendChild(createMetaRow("NineSlice", imageState?.json ? "있음" : "없음"));

    if (imageState?.json?.nineslice_size) {
        preview.meta.appendChild(createMetaRow("nineslice_size", formatVector(imageState.json.nineslice_size)));
    }

    if (imageState?.json?.base_size) {
        preview.meta.appendChild(createMetaRow("base_size", formatVector(imageState.json.base_size)));
    }

    preview.button.disabled = !hasPreviewableData;
    preview.button.dataset.imagePath = imagePath;

    return hasPreviewableData;
}

function clearTreeSelection(): void {
    for (const selected of Array.from(form.querySelectorAll(".explorerText.selected"))) {
        selected.classList.remove("selected");
    }
}

function revealTreeItem(element: HTMLElement): void {
    let current: HTMLElement | null = element.parentElement;

    while (current && current !== form) {
        if (current.classList.contains("explorerDiv")) {
            current.style.display = "block";

            const directChildren = Array.from(current.children) as HTMLElement[];
            const arrow = directChildren.find((child) => child.classList.contains("explorerArrow")) as HTMLImageElement | undefined;
            if (arrow) {
                arrow.src = "assets/arrow_down.webp";
            }

            for (const child of directChildren) {
                if (child.classList.contains("explorerDiv")) {
                    child.style.display = "block";
                }
            }
        }

        current = current.parentElement;
    }
}

function highlightTreeSelection(imagePath: string | undefined): void {
    clearTreeSelection();
    if (!imagePath) return;

    const matchingElement = Array.from(form.querySelectorAll(".explorerText[data-image-path]")).find(
        (element) => (element as HTMLElement).dataset.imagePath === imagePath
    ) as HTMLElement | undefined;

    if (!matchingElement) return;

    revealTreeItem(matchingElement);
    matchingElement.classList.add("selected");
}

export async function chooseImageModal(): Promise<string> {
    return new Promise((resolve, reject) => {
        const modalContent = getModalContent();
        const { contentWrapper, previewPanel } = ensureChooseImageLayout();
        const preview = getPreviewElements(previewPanel);

        modalContent.querySelector(".chooseImageSearchWrapper")?.remove();
        form.innerHTML = "";
        resetPreview(previewPanel);
        clearTreeSelection();

        const searchWrapper = document.createElement("div");
        searchWrapper.classList.add("chooseImageSearchWrapper");

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "이미지 검색...";
        searchInput.classList.add("chooseImageSearchInput");
        searchWrapper.appendChild(searchInput);

        const dropdown = document.createElement("select");
        dropdown.size = 6;
        dropdown.classList.add("chooseImageSearchDropdown");
        dropdown.style.display = "none";
        searchWrapper.appendChild(dropdown);

        modalContent.insertBefore(searchWrapper, contentWrapper);

        const enhancedFileSystem = enhanceFileSystemWithUserPresets();
        const allImagePaths = collectImagePaths(enhancedFileSystem);

        let selectedImagePath: string | undefined;

        const syncDropdownSelection = (imagePath: string) => {
            const matchingOption = Array.from(dropdown.options).find((option) => option.value === imagePath);
            if (!matchingOption) return;
            dropdown.value = imagePath;
        };

        const previewImage = (imagePath: string | undefined) => {
            selectedImagePath = imagePath;
            renderPreview(previewPanel, imagePath);
            highlightTreeSelection(imagePath);

            if (imagePath) {
                syncDropdownSelection(imagePath);
            }
        };

        const resolveSelection = (imagePath: string | undefined) => {
            if (!imagePath) return;
            const imageState = getImagesMap().get(imagePath);
            if (!imageState?.png && !imageState?.json) return;
            cleanup();
            resolve(imagePath);
        };

        const updateDropdown = () => {
            const query = searchInput.value.trim().toLowerCase();
            dropdown.innerHTML = "";

            if (!query) {
                dropdown.style.display = "none";
                return;
            }

            const filtered = allImagePaths.filter((path) => path.toLowerCase().includes(query)).slice(0, 50);

            if (filtered.length === 0) {
                dropdown.style.display = "none";
                return;
            }

            for (const path of filtered) {
                const option = document.createElement("option");
                option.value = path;
                option.textContent = path;
                dropdown.appendChild(option);
            }

            dropdown.style.display = "block";
            dropdown.selectedIndex = 0;
        };

        const handleTreeClick = (event: MouseEvent) => {
            const rawTarget = event.target as HTMLElement | null;
            const textElement = rawTarget?.closest(".explorerText") as HTMLElement | null;
            if (!textElement || !form.contains(textElement)) return;

            const imagePath = textElement.dataset.imagePath;
            if (!imagePath) return;

            previewImage(imagePath);
        };

        const handleTreeDoubleClick = (event: MouseEvent) => {
            const rawTarget = event.target as HTMLElement | null;
            const textElement = rawTarget?.closest(".explorerText") as HTMLElement | null;
            if (!textElement || !form.contains(textElement)) return;

            const imagePath = textElement.dataset.imagePath;
            if (!imagePath) return;

            previewImage(imagePath);
            resolveSelection(imagePath);
        };

        const handleClose = () => {
            cleanup();
            reject(new Error("Modal closed"));
        };

        const handleWindowClick = (event: MouseEvent) => {
            if (event.target === modal) {
                cleanup();
                reject(new Error("Modal closed"));
            }
        };

        const cleanup = () => {
            form.removeEventListener("click", handleTreeClick);
            form.removeEventListener("dblclick", handleTreeDoubleClick);
            closeBtn.removeEventListener("click", handleClose);
            window.removeEventListener("click", handleWindowClick);

            preview.button.onclick = null;
            modal.style.display = "none";
            modalContent.querySelector(".chooseImageSearchWrapper")?.remove();

            form.innerHTML = "";
            resetPreview(previewPanel);
            clearTreeSelection();
        };

        searchInput.addEventListener("input", updateDropdown);
        searchInput.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "ArrowDown" && dropdown.options.length > 0) {
                event.preventDefault();
                dropdown.style.display = "block";
                dropdown.focus();
                dropdown.selectedIndex = 0;
                previewImage(dropdown.value);
            }

            if (event.key === "Enter" && dropdown.value) {
                event.preventDefault();
                previewImage(dropdown.value);
                resolveSelection(dropdown.value);
            }
        });

        dropdown.addEventListener("change", () => {
            previewImage(dropdown.value || undefined);
        });

        dropdown.addEventListener("dblclick", () => {
            resolveSelection(dropdown.value || undefined);
        });

        dropdown.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            resolveSelection(dropdown.value || undefined);
        });

        preview.button.onclick = () => {
            resolveSelection(selectedImagePath);
        };

        ChooseImageFileTree.tree(enhancedFileSystem, form);

        form.addEventListener("click", handleTreeClick);
        form.addEventListener("dblclick", handleTreeDoubleClick);
        closeBtn.addEventListener("click", handleClose);
        window.addEventListener("click", handleWindowClick);

        modal.style.display = "block";
    });
}

function enhanceFileSystemWithUserPresets(): any {
    const enhanced = JSON.parse(JSON.stringify(GLOBAL_FILE_SYSTEM));
    const userImages = (window as any).images;

    if (userImages && userImages.size > 0) {
        for (const [key, value] of userImages) {
            if (!value || (!value.png && !value.json)) continue;

            addFilePathToStructure(enhanced, `${key}.png`);

            if (value.json) {
                addFilePathToStructure(enhanced, `${key}.json`);
            }
        }
    }

    return enhanced;
}
