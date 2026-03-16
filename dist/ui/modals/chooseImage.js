import { config } from "../../CONFIG.js";
import { GLOBAL_FILE_SYSTEM } from "../../index.js";
import { translateText } from "../../i18n.js";
import { Notification } from "../notifs/noficationMaker.js";
import { downloadExternalImage, fetchExternalImageState, loadExternalImageRepo, } from "./externalImageResources.js";
const modal = document.getElementById("modalChooseImage");
const closeBtn = document.getElementById("modalChooseImageClose");
const form = document.getElementsByClassName("modalChooseImageForm")[0];
class ChooseImageFileTree {
    static constructTextElement(text, hasChildren, hasNineslice = false, imagePath) {
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
            const arrowDiv = document.createElement("img");
            arrowDiv.src = "assets/arrow_down.webp";
            arrowDiv.classList.add("explorerArrow");
            arrowDiv.style.marginLeft = "5px";
            div.appendChild(arrowDiv);
        }
        div.appendChild(textDiv);
        if (hasNineslice) {
            const ninesliceImg = document.createElement("img");
            ninesliceImg.src = "icons/nineslice.webp";
            ninesliceImg.classList.add("explorerHasNineslice");
            div.appendChild(ninesliceImg);
        }
        return div;
    }
    static tree(fileStructureCurrentDir, lastTextElement, depth = 0, currentPath = "") {
        const nextDirs = Object.keys(fileStructureCurrentDir);
        for (const nextDir of nextDirs) {
            const nextPath = currentPath ? `${currentPath}/${nextDir}` : nextDir;
            const hasChildren = Object.keys(fileStructureCurrentDir[nextDir]).length > 0;
            if (hasChildren) {
                const textElement = ChooseImageFileTree.constructTextElement(nextDir, true);
                textElement.style.left = `${config.magicNumbers.explorer.folderIndentation - (depth === 0 ? 20 : 0)}px`;
                const textArrowElement = textElement.querySelector(".explorerArrow");
                textArrowElement.onclick = (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const nextIcon = textArrowElement.src.endsWith("assets/arrow_down.webp")
                        ? "assets/arrow_right.webp"
                        : "assets/arrow_down.webp";
                    textArrowElement.src = nextIcon;
                    for (const child of Array.from(textElement.children)) {
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
            if (!fileType || !VALID_IMAGE_EXTENSIONS.includes(fileType))
                continue;
            const baseName = nextDir.replace(/\.[^.]+$/, "");
            const hasNineslice = nextDirs.some((dir) => dir === `${baseName}.json`);
            const imagePath = nextPath.replace(/\.[^/.]+$/, "");
            const textElement = ChooseImageFileTree.constructTextElement(nextDir, false, hasNineslice, imagePath);
            textElement.style.left = `${config.magicNumbers.explorer.nonFolderIndentation - (depth === 0 ? 20 : 0)}px`;
            lastTextElement.appendChild(textElement);
        }
    }
}
const VALID_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
function getModalContent() {
    return modal.querySelector(".modal-content");
}
function getImagesMap() {
    return window.images ?? new Map();
}
function collectImagePaths(fsObj, currentPath = "") {
    const paths = [];
    for (const key of Object.keys(fsObj)) {
        const value = fsObj[key];
        const joinedPath = currentPath ? `${currentPath}/${key}` : key;
        const ext = key.split(".").pop()?.toLowerCase();
        if (typeof value === "object" && value !== null && Object.keys(value).length > 0) {
            paths.push(...collectImagePaths(value, joinedPath));
        }
        else if (ext && VALID_IMAGE_EXTENSIONS.includes(ext)) {
            paths.push(joinedPath.replace(/\.[^/.]+$/, ""));
        }
    }
    return paths;
}
function createPreviewPanel() {
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
function createTranslatedPreviewPanel() {
    const previewPanel = document.createElement("div");
    previewPanel.className = "chooseImagePreviewPanel";
    previewPanel.innerHTML = `
        <div class="chooseImagePreviewHeader">
            <div class="chooseImagePreviewEyebrow">${translateText("Texture Preview")}</div>
            <div class="chooseImagePreviewHint">${translateText("Select a texture from the list to preview it, then double-click it or use the button below.")}</div>
        </div>
        <div class="chooseImagePreviewCanvasWrap">
            <canvas class="chooseImagePreviewCanvas"></canvas>
            <div class="chooseImagePreviewEmpty">${translateText("The selected texture will appear here.")}</div>
        </div>
        <div class="chooseImagePreviewTitle">${translateText("No texture selected yet.")}</div>
        <div class="chooseImagePreviewPath" data-no-translate="true"></div>
        <div class="chooseImagePreviewBadgeRow"></div>
        <div class="chooseImagePreviewMeta"></div>
        <div class="chooseImagePreviewActionRow">
            <button type="button" class="chooseImagePreviewButton chooseImagePreviewDownloadButton" disabled>${translateText("Download")}</button>
            <button type="button" class="chooseImagePreviewButton chooseImagePreviewUseButton" disabled>${translateText("Use This Texture")}</button>
        </div>
    `;
    return previewPanel;
}
function addFilePathToStructure(fsObj, filePath) {
    const parts = filePath.split("/").filter(Boolean);
    let current = fsObj;
    for (const part of parts) {
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }
}
function ensureChooseImageLayout() {
    const modalContent = getModalContent();
    let contentWrapper = modalContent.querySelector(".chooseImageContent");
    if (!contentWrapper) {
        contentWrapper = document.createElement("div");
        contentWrapper.className = "chooseImageContent";
        modalContent.insertBefore(contentWrapper, form);
        contentWrapper.appendChild(form);
    }
    let previewPanel = contentWrapper.querySelector(".chooseImagePreviewPanel");
    if (!previewPanel) {
        previewPanel = createTranslatedPreviewPanel();
        contentWrapper.appendChild(previewPanel);
    }
    return { contentWrapper, previewPanel };
}
function getPreviewElements(previewPanel) {
    return {
        canvas: previewPanel.querySelector(".chooseImagePreviewCanvas"),
        empty: previewPanel.querySelector(".chooseImagePreviewEmpty"),
        title: previewPanel.querySelector(".chooseImagePreviewTitle"),
        path: previewPanel.querySelector(".chooseImagePreviewPath"),
        badges: previewPanel.querySelector(".chooseImagePreviewBadgeRow"),
        meta: previewPanel.querySelector(".chooseImagePreviewMeta"),
        downloadButton: previewPanel.querySelector(".chooseImagePreviewDownloadButton"),
        button: previewPanel.querySelector(".chooseImagePreviewUseButton"),
    };
}
function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}
function imageDataToBlob(imageData) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            reject(new Error("Could not create canvas context."));
            return;
        }
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Could not create PNG blob."));
                return;
            }
            resolve(blob);
        }, "image/png");
    });
}
async function downloadSelectedImageAsset(imagePath) {
    const imageState = getImagesMap().get(imagePath);
    if (!imageState?.png && !imageState?.json) {
        throw new Error(translateText("Could not download the selected image."));
    }
    const fileName = getImageLabel(imagePath);
    if (imageState?.png) {
        const pngBlob = await imageDataToBlob(imageState.png);
        downloadBlob(pngBlob, `${fileName}.png`);
    }
    if (imageState?.json) {
        const jsonBlob = new Blob([JSON.stringify(imageState.json, null, 2)], { type: "application/json" });
        downloadBlob(jsonBlob, `${fileName}.json`);
    }
}
function resetPreview(previewPanel) {
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
    preview.downloadButton.disabled = true;
    preview.downloadButton.onclick = null;
    preview.button.disabled = true;
    preview.button.textContent = "Use This Texture";
    preview.button.onclick = null;
    delete preview.button.dataset.imagePath;
}
function resetTranslatedPreview(previewPanel) {
    const preview = getPreviewElements(previewPanel);
    preview.canvas.style.display = "none";
    preview.canvas.width = 1;
    preview.canvas.height = 1;
    preview.empty.style.display = "flex";
    preview.empty.textContent = translateText("The selected texture will appear here.");
    preview.title.textContent = translateText("No texture selected yet.");
    preview.path.textContent = "";
    preview.badges.innerHTML = "";
    preview.meta.innerHTML = "";
    preview.downloadButton.disabled = true;
    preview.downloadButton.onclick = null;
    preview.button.disabled = true;
    preview.button.textContent = translateText("Use This Texture");
    preview.button.onclick = null;
    delete preview.button.dataset.imagePath;
}
function drawImagePreview(canvas, imageData) {
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
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
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    context.drawImage(tempCanvas, 0, 0, width, height);
}
function formatVector(values) {
    if (!values || values.length === 0)
        return "-";
    return `[${values.join(", ")}]`;
}
function createBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = `chooseImagePreviewBadge ${className}`;
    badge.textContent = text;
    return badge;
}
function createMetaRow(label, value) {
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
function getImageLabel(imagePath) {
    const pathParts = imagePath.split("/");
    return pathParts[pathParts.length - 1] ?? imagePath;
}
function renderPreviewLegacy(previewPanel, imagePath) {
    if (!imagePath) {
        resetTranslatedPreview(previewPanel);
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
    }
    else {
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
    preview.meta.appendChild(createMetaRow("이미지 크기", imageState?.png ? `${imageState.png.width} x ${imageState.png.height}` : "이미지 없음"));
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
function renderPreviewState(previewPanel, imagePath, imageState, options = {}) {
    if (!imagePath && !imageState) {
        resetTranslatedPreview(previewPanel);
        return false;
    }
    const preview = getPreviewElements(previewPanel);
    const hasPreviewableData = Boolean(imageState?.png || imageState?.json);
    const displayPath = options.pathText ?? imagePath ?? "";
    preview.title.textContent = options.title ?? (imagePath ? getImageLabel(imagePath) : "Texture");
    preview.path.textContent = displayPath;
    preview.badges.innerHTML = "";
    preview.meta.innerHTML = "";
    preview.button.textContent = options.buttonText ?? "Use This Texture";
    if (imageState?.png) {
        preview.badges.appendChild(createBadge("PNG", "is-png"));
        drawImagePreview(preview.canvas, imageState.png);
        preview.canvas.style.display = "block";
        preview.empty.style.display = "none";
    }
    else {
        preview.canvas.style.display = "none";
        preview.empty.style.display = "flex";
        preview.empty.textContent =
            options.emptyText ??
                (imageState?.json ? "PNG is missing, but NineSlice data is available." : "Texture data could not be loaded yet.");
    }
    if (imageState?.json) {
        preview.badges.appendChild(createBadge("NineSlice", "is-nineslice"));
    }
    if (!hasPreviewableData) {
        preview.badges.appendChild(createBadge("Missing Data", "is-missing"));
    }
    preview.meta.appendChild(createMetaRow("Path", displayPath || "-"));
    preview.meta.appendChild(createMetaRow("Image Size", imageState?.png ? `${imageState.png.width} x ${imageState.png.height}` : "No image"));
    preview.meta.appendChild(createMetaRow("NineSlice", imageState?.json ? "Yes" : "No"));
    if (imageState?.json?.nineslice_size) {
        preview.meta.appendChild(createMetaRow("nineslice_size", formatVector(imageState.json.nineslice_size)));
    }
    if (imageState?.json?.base_size) {
        preview.meta.appendChild(createMetaRow("base_size", formatVector(imageState.json.base_size)));
    }
    for (const row of options.extraMetaRows ?? []) {
        preview.meta.appendChild(createMetaRow(row.label, row.value));
    }
    preview.button.disabled = !hasPreviewableData;
    preview.downloadButton.disabled = !hasPreviewableData;
    if (imagePath) {
        preview.downloadButton.onclick = async () => {
            try {
                await downloadSelectedImageAsset(imagePath);
            }
            catch (error) {
                console.error(error);
                new Notification(error instanceof Error ? error.message : translateText("Could not download the selected image."), 3000, "error");
            }
        };
        preview.button.dataset.imagePath = imagePath;
    }
    else {
        preview.downloadButton.onclick = null;
        delete preview.button.dataset.imagePath;
    }
    return hasPreviewableData;
}
function renderPreview(previewPanel, imagePath) {
    if (!imagePath) {
        resetTranslatedPreview(previewPanel);
        return false;
    }
    return renderPreviewState(previewPanel, imagePath, getImagesMap().get(imagePath));
}
function clearTreeSelection() {
    for (const selected of Array.from(form.querySelectorAll(".explorerText.selected"))) {
        selected.classList.remove("selected");
    }
}
function revealTreeItem(element) {
    let current = element.parentElement;
    while (current && current !== form) {
        if (current.classList.contains("explorerDiv")) {
            current.style.display = "block";
            const directChildren = Array.from(current.children);
            const arrow = directChildren.find((child) => child.classList.contains("explorerArrow"));
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
function highlightTreeSelection(imagePath) {
    clearTreeSelection();
    if (!imagePath)
        return;
    const matchingElement = Array.from(form.querySelectorAll(".explorerText[data-image-path]")).find((element) => element.dataset.imagePath === imagePath);
    if (!matchingElement)
        return;
    revealTreeItem(matchingElement);
    matchingElement.classList.add("selected");
}
async function chooseImageModalLegacy() {
    return new Promise((resolve, reject) => {
        const modalContent = getModalContent();
        const { contentWrapper, previewPanel } = ensureChooseImageLayout();
        const preview = getPreviewElements(previewPanel);
        modalContent.querySelector(".chooseImageSearchWrapper")?.remove();
        form.innerHTML = "";
        resetTranslatedPreview(previewPanel);
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
        let selectedImagePath;
        const syncDropdownSelection = (imagePath) => {
            const matchingOption = Array.from(dropdown.options).find((option) => option.value === imagePath);
            if (!matchingOption)
                return;
            dropdown.value = imagePath;
        };
        const previewImage = (imagePath) => {
            selectedImagePath = imagePath;
            renderPreview(previewPanel, imagePath);
            highlightTreeSelection(imagePath);
            if (imagePath) {
                syncDropdownSelection(imagePath);
            }
        };
        const resolveSelection = (imagePath) => {
            if (!imagePath)
                return;
            const imageState = getImagesMap().get(imagePath);
            if (!imageState?.png && !imageState?.json)
                return;
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
        const handleTreeClick = (event) => {
            const rawTarget = event.target;
            const textElement = rawTarget?.closest(".explorerText");
            if (!textElement || !form.contains(textElement))
                return;
            const imagePath = textElement.dataset.imagePath;
            if (!imagePath)
                return;
            previewImage(imagePath);
        };
        const handleTreeDoubleClick = (event) => {
            const rawTarget = event.target;
            const textElement = rawTarget?.closest(".explorerText");
            if (!textElement || !form.contains(textElement))
                return;
            const imagePath = textElement.dataset.imagePath;
            if (!imagePath)
                return;
            previewImage(imagePath);
            resolveSelection(imagePath);
        };
        const handleClose = () => {
            cleanup();
            reject(new Error("Modal closed"));
        };
        const handleWindowClick = (event) => {
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
            resetTranslatedPreview(previewPanel);
            clearTreeSelection();
        };
        searchInput.addEventListener("input", updateDropdown);
        searchInput.addEventListener("keydown", (event) => {
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
        dropdown.addEventListener("keydown", (event) => {
            if (event.key !== "Enter")
                return;
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
function imageDataToBase64(imageData) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
}
async function persistImportedExternalAsset(imagePath, entry, imageState) {
    if (imageState.png) {
        localStorage.setItem(`asset_${imagePath}_png`, JSON.stringify({
            base64: imageDataToBase64(imageState.png),
            metadata: {
                name: entry.name,
                type: entry.extension,
                relativePath: `${imagePath}.${entry.extension}`,
                source: "github",
                sourceUrl: entry.downloadUrl,
                importedAt: new Date().toISOString(),
            },
        }));
    }
    if (imageState.json) {
        localStorage.setItem(`asset_${imagePath}_json`, JSON.stringify({
            jsonContent: imageState.json,
            metadata: {
                name: `${entry.name.replace(/\.[^.]+$/, "")}.json`,
                type: "json",
                relativePath: `${imagePath}.json`,
                source: "github",
                sourceUrl: entry.jsonDownloadUrl ?? "",
                importedAt: new Date().toISOString(),
            },
        }));
    }
}
export async function chooseImageModal() {
    return new Promise((resolve, reject) => {
        const modalContent = getModalContent();
        const { contentWrapper, previewPanel } = ensureChooseImageLayout();
        const preview = getPreviewElements(previewPanel);
        const externalPreviewCache = new Map();
        let isClosed = false;
        let activeExternalPreviewRequest = 0;
        let currentGitResourceUrl;
        let externalEntries = [];
        let selectedImagePath;
        modalContent.querySelector(".chooseImageSearchWrapper")?.remove();
        modalContent.querySelector(".chooseImageExternalSection")?.remove();
        form.innerHTML = "";
        resetTranslatedPreview(previewPanel);
        clearTreeSelection();
        const externalSection = document.createElement("div");
        externalSection.className = "chooseImageExternalSection";
        const externalHeader = document.createElement("div");
        externalHeader.className = "chooseImageExternalHeader";
        const externalTitle = document.createElement("div");
        externalTitle.className = "chooseImageExternalTitle";
        externalTitle.textContent = "External Resources";
        const externalBody = document.createElement("div");
        externalBody.className = "chooseImageExternalBody";
        externalBody.textContent = "Load a GitHub repository, search its images, preview them, then import them into this builder.";
        externalHeader.appendChild(externalTitle);
        externalHeader.appendChild(externalBody);
        const repoControls = document.createElement("div");
        repoControls.className = "chooseImageExternalControls";
        const repoInput = document.createElement("input");
        repoInput.type = "text";
        repoInput.className = "chooseImageExternalInput repo";
        repoInput.placeholder = "owner/repo or GitHub URL";
        repoInput.value = "PresentKim/ai-generated-pixelart";
        const refInput = document.createElement("input");
        refInput.type = "text";
        refInput.className = "chooseImageExternalInput ref";
        refInput.placeholder = "Branch";
        refInput.value = "main";
        const loadRepoButton = document.createElement("button");
        loadRepoButton.type = "button";
        loadRepoButton.className = "chooseImageExternalButton primary";
        loadRepoButton.textContent = "Load Repo";
        const openGitResourceButton = document.createElement("button");
        openGitResourceButton.type = "button";
        openGitResourceButton.className = "chooseImageExternalButton";
        openGitResourceButton.textContent = "Open GitResource";
        openGitResourceButton.disabled = true;
        repoControls.appendChild(repoInput);
        repoControls.appendChild(refInput);
        repoControls.appendChild(loadRepoButton);
        repoControls.appendChild(openGitResourceButton);
        const externalStatus = document.createElement("div");
        externalStatus.className = "chooseImageExternalStatus";
        externalStatus.textContent = "Load a repository to browse external images.";
        const externalLicense = document.createElement("div");
        externalLicense.className = "chooseImageExternalLicense";
        const externalSearch = document.createElement("input");
        externalSearch.type = "text";
        externalSearch.className = "chooseImageExternalInput search";
        externalSearch.placeholder = "Search external images...";
        externalSearch.disabled = true;
        const externalResults = document.createElement("div");
        externalResults.className = "chooseImageExternalResults";
        externalSection.appendChild(externalHeader);
        externalSection.appendChild(repoControls);
        externalSection.appendChild(externalStatus);
        externalSection.appendChild(externalLicense);
        externalSection.appendChild(externalSearch);
        externalSection.appendChild(externalResults);
        const searchWrapper = document.createElement("div");
        searchWrapper.classList.add("chooseImageSearchWrapper");
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = translateText("Search images...");
        searchInput.classList.add("chooseImageSearchInput");
        searchWrapper.appendChild(searchInput);
        const dropdown = document.createElement("select");
        dropdown.size = 6;
        dropdown.classList.add("chooseImageSearchDropdown");
        dropdown.style.display = "none";
        searchWrapper.appendChild(dropdown);
        modalContent.insertBefore(externalSection, contentWrapper);
        modalContent.insertBefore(searchWrapper, contentWrapper);
        const enhancedFileSystem = enhanceFileSystemWithUserPresets();
        const allImagePaths = collectImagePaths(enhancedFileSystem);
        const setExternalStatus = (message, tone = "neutral") => {
            externalStatus.textContent = message;
            externalStatus.dataset.state = tone;
        };
        const syncDropdownSelection = (imagePath) => {
            const matchingOption = Array.from(dropdown.options).find((option) => option.value === imagePath);
            if (!matchingOption)
                return;
            dropdown.value = imagePath;
        };
        const resolveSelection = (imagePath) => {
            if (!imagePath)
                return;
            const imageState = getImagesMap().get(imagePath);
            if (!imageState?.png && !imageState?.json)
                return;
            cleanup();
            resolve(imagePath);
        };
        const previewImage = (imagePath) => {
            selectedImagePath = imagePath;
            renderPreview(previewPanel, imagePath);
            preview.button.onclick = () => {
                resolveSelection(selectedImagePath);
            };
            highlightTreeSelection(imagePath);
            if (imagePath) {
                syncDropdownSelection(imagePath);
            }
        };
        const getExternalState = async (entry) => {
            const cached = externalPreviewCache.get(entry.importPath);
            if (cached)
                return cached;
            const imageState = await fetchExternalImageState(entry);
            externalPreviewCache.set(entry.importPath, imageState);
            return imageState;
        };
        const importExternalEntry = async (entry) => {
            try {
                const imageState = await getExternalState(entry);
                if (!imageState.png && !imageState.json) {
                    new Notification("Could not load the external texture.", 2500, "error");
                    return undefined;
                }
                getImagesMap().set(entry.importPath, imageState);
                addFilePathToStructure(GLOBAL_FILE_SYSTEM, `${entry.importPath}.${entry.extension}`);
                if (imageState.json) {
                    addFilePathToStructure(GLOBAL_FILE_SYSTEM, `${entry.importPath}.json`);
                }
                void persistImportedExternalAsset(entry.importPath, entry, imageState);
                window.Builder?.updateExplorer?.();
                new Notification("Imported external texture.", 2500, "notif");
                return entry.importPath;
            }
            catch (error) {
                console.error(error);
                new Notification(error instanceof Error ? error.message : "Could not import the external texture.", 3000, "error");
                return undefined;
            }
        };
        const previewExternalEntry = async (entry) => {
            selectedImagePath = undefined;
            clearTreeSelection();
            const requestId = ++activeExternalPreviewRequest;
            preview.button.disabled = true;
            preview.button.textContent = translateText("Loading Preview...");
            try {
                const imageState = await getExternalState(entry);
                if (isClosed || requestId !== activeExternalPreviewRequest)
                    return;
                renderPreviewState(previewPanel, entry.importPath, imageState, {
                    title: entry.name,
                    pathText: `${entry.repoInfo.owner}/${entry.repoInfo.repo}@${entry.repoInfo.ref}/${entry.path}`,
                    buttonText: "Import & Use",
                    extraMetaRows: [
                        { label: "Source", value: `${entry.repoInfo.owner}/${entry.repoInfo.repo}` },
                        { label: "Import Path", value: entry.importPath },
                    ],
                });
                preview.button.onclick = async () => {
                    const importedPath = await importExternalEntry(entry);
                    if (!importedPath)
                        return;
                    cleanup();
                    resolve(importedPath);
                };
            }
            catch (error) {
                console.error(error);
                if (!isClosed) {
                    new Notification(error instanceof Error ? error.message : "Could not preview the external texture.", 3000, "error");
                    resetTranslatedPreview(previewPanel);
                }
            }
        };
        const renderExternalResults = () => {
            externalResults.innerHTML = "";
            if (externalEntries.length === 0) {
                const empty = document.createElement("div");
                empty.className = "chooseImageExternalEmpty";
                empty.textContent = "No external images loaded yet.";
                externalResults.appendChild(empty);
                return;
            }
            const query = externalSearch.value.trim().toLowerCase();
            const filtered = externalEntries
                .filter((entry) => !query || `${entry.name} ${entry.path}`.toLowerCase().includes(query));
            if (filtered.length === 0) {
                const empty = document.createElement("div");
                empty.className = "chooseImageExternalEmpty";
                empty.textContent = "No external images matched your search.";
                externalResults.appendChild(empty);
                return;
            }
            for (const entry of filtered) {
                const card = document.createElement("div");
                card.className = "chooseImageExternalCard";
                const thumb = document.createElement("img");
                thumb.className = "chooseImageExternalThumb";
                thumb.src = entry.downloadUrl;
                thumb.alt = entry.name;
                thumb.loading = "lazy";
                const info = document.createElement("div");
                info.className = "chooseImageExternalInfo";
                const name = document.createElement("div");
                name.className = "chooseImageExternalName";
                name.textContent = entry.name;
                name.dataset.noTranslate = "true";
                const path = document.createElement("div");
                path.className = "chooseImageExternalPath";
                path.textContent = entry.path;
                path.dataset.noTranslate = "true";
                info.appendChild(name);
                info.appendChild(path);
                const actions = document.createElement("div");
                actions.className = "chooseImageExternalActions";
                const previewButton = document.createElement("button");
                previewButton.type = "button";
                previewButton.className = "chooseImageExternalButton";
                previewButton.textContent = "Preview";
                previewButton.onclick = () => {
                    void previewExternalEntry(entry);
                };
                const useButton = document.createElement("button");
                useButton.type = "button";
                useButton.className = "chooseImageExternalButton primary";
                useButton.textContent = "Import & Use";
                useButton.onclick = async () => {
                    const importedPath = await importExternalEntry(entry);
                    if (!importedPath)
                        return;
                    cleanup();
                    resolve(importedPath);
                };
                const downloadButton = document.createElement("button");
                downloadButton.type = "button";
                downloadButton.className = "chooseImageExternalButton";
                downloadButton.textContent = "Download";
                downloadButton.onclick = async () => {
                    try {
                        await downloadExternalImage(entry);
                    }
                    catch (error) {
                        console.error(error);
                        new Notification(error instanceof Error ? error.message : "Could not download the external image.", 3000, "error");
                    }
                };
                actions.appendChild(previewButton);
                actions.appendChild(useButton);
                actions.appendChild(downloadButton);
                card.appendChild(thumb);
                card.appendChild(info);
                card.appendChild(actions);
                externalResults.appendChild(card);
            }
        };
        const loadExternalRepo = async () => {
            loadRepoButton.disabled = true;
            openGitResourceButton.disabled = true;
            externalSearch.disabled = true;
            setExternalStatus("Loading external resources...");
            externalLicense.textContent = "";
            try {
                const result = await loadExternalImageRepo(repoInput.value, refInput.value);
                if (isClosed)
                    return;
                externalEntries = result.images;
                currentGitResourceUrl = result.repoInfo.gitResourceUrl;
                refInput.value = result.repoInfo.ref;
                externalSearch.disabled = false;
                openGitResourceButton.disabled = false;
                setExternalStatus(result.truncated
                    ? `Loaded ${result.images.length} external images, but GitHub returned a partial tree.`
                    : `Loaded ${result.images.length} external images from ${result.repoInfo.owner}/${result.repoInfo.repo}@${result.repoInfo.ref}.`, result.truncated ? "warning" : "success");
                externalLicense.textContent = result.repoInfo.licenseName
                    ? `License: ${result.repoInfo.licenseName}`
                    : "License info was not provided. Only import resources you have permission to use.";
                externalLicense.dataset.state = result.repoInfo.licenseName ? "neutral" : "warning";
                renderExternalResults();
            }
            catch (error) {
                console.error(error);
                externalEntries = [];
                currentGitResourceUrl = undefined;
                externalSearch.disabled = true;
                renderExternalResults();
                const message = error instanceof Error ? error.message : "Could not load the external repository.";
                setExternalStatus(message, "warning");
                new Notification(message, 3000, "warning");
            }
            finally {
                if (!isClosed) {
                    loadRepoButton.disabled = false;
                }
            }
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
        const handleTreeClick = (event) => {
            const rawTarget = event.target;
            const textElement = rawTarget?.closest(".explorerText");
            if (!textElement || !form.contains(textElement))
                return;
            const imagePath = textElement.dataset.imagePath;
            if (!imagePath)
                return;
            previewImage(imagePath);
        };
        const handleTreeDoubleClick = (event) => {
            const rawTarget = event.target;
            const textElement = rawTarget?.closest(".explorerText");
            if (!textElement || !form.contains(textElement))
                return;
            const imagePath = textElement.dataset.imagePath;
            if (!imagePath)
                return;
            previewImage(imagePath);
            resolveSelection(imagePath);
        };
        const handleClose = () => {
            cleanup();
            reject(new Error("Modal closed"));
        };
        const handleWindowClick = (event) => {
            if (event.target === modal) {
                cleanup();
                reject(new Error("Modal closed"));
            }
        };
        const cleanup = () => {
            isClosed = true;
            form.removeEventListener("click", handleTreeClick);
            form.removeEventListener("dblclick", handleTreeDoubleClick);
            closeBtn.removeEventListener("click", handleClose);
            window.removeEventListener("click", handleWindowClick);
            preview.button.onclick = null;
            modal.style.display = "none";
            modalContent.querySelector(".chooseImageSearchWrapper")?.remove();
            modalContent.querySelector(".chooseImageExternalSection")?.remove();
            form.innerHTML = "";
            resetTranslatedPreview(previewPanel);
            clearTreeSelection();
        };
        searchInput.addEventListener("input", updateDropdown);
        searchInput.addEventListener("keydown", (event) => {
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
        dropdown.addEventListener("keydown", (event) => {
            if (event.key !== "Enter")
                return;
            event.preventDefault();
            resolveSelection(dropdown.value || undefined);
        });
        externalSearch.addEventListener("input", () => {
            renderExternalResults();
        });
        loadRepoButton.onclick = () => {
            void loadExternalRepo();
        };
        repoInput.addEventListener("keydown", (event) => {
            if (event.key !== "Enter")
                return;
            event.preventDefault();
            void loadExternalRepo();
        });
        refInput.addEventListener("keydown", (event) => {
            if (event.key !== "Enter")
                return;
            event.preventDefault();
            void loadExternalRepo();
        });
        openGitResourceButton.onclick = () => {
            if (!currentGitResourceUrl)
                return;
            window.open(currentGitResourceUrl, "_blank", "noopener,noreferrer");
        };
        preview.button.onclick = () => {
            resolveSelection(selectedImagePath);
        };
        ChooseImageFileTree.tree(enhancedFileSystem, form);
        renderExternalResults();
        form.addEventListener("click", handleTreeClick);
        form.addEventListener("dblclick", handleTreeDoubleClick);
        closeBtn.addEventListener("click", handleClose);
        window.addEventListener("click", handleWindowClick);
        modal.style.display = "block";
    });
}
function enhanceFileSystemWithUserPresets() {
    const enhanced = JSON.parse(JSON.stringify(GLOBAL_FILE_SYSTEM));
    const userImages = window.images;
    if (userImages && userImages.size > 0) {
        for (const [key, value] of userImages) {
            if (!value || (!value.png && !value.json))
                continue;
            addFilePathToStructure(enhanced, `${key}.png`);
            if (value.json) {
                addFilePathToStructure(enhanced, `${key}.json`);
            }
        }
    }
    return enhanced;
}
//# sourceMappingURL=chooseImage.js.map