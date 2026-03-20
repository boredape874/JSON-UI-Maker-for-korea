import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { config } from "../../CONFIG.js";
import { GLOBAL_FILE_SYSTEM } from "../../runtime/editorStore.js";
import { translateText } from "../../i18n.js";
import { assetUrl } from "../../lib/assetUrl.js";
import { Notification } from "../notifs/noficationMaker.js";
import {
    downloadExternalImage,
    ExternalImageEntry,
    fetchExternalImageState,
    loadExternalImageRepo,
} from "../modals/externalImageResources.js";
import {
    addFilePathToStructure,
    buildChooseImageTree,
    ChooseImageTreeNode,
    collectImagePaths,
    downloadSelectedImageAsset,
    enhanceFileSystemWithUserPresets,
    formatVector,
    getImageLabel,
    getImagesMap,
    persistImportedExternalAsset,
    PreviewableImageState,
} from "../modals/chooseImage.js";
import { subscribeModalBridge } from "./modalBridge.js";
import { registerChooseImageModalHost } from "./chooseImageModalHostBridge.js";

type ExternalStatusTone = "neutral" | "success" | "warning";

type ExternalStatusState = {
    message: string;
    tone: ExternalStatusTone;
};

type ExternalPreviewState = {
    entry: ExternalImageEntry;
    imageState?: PreviewableImageState;
    loading: boolean;
};

function drawPreviewCanvas(canvas: HTMLCanvasElement, imageData: ImageData): void {
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

function collectDirectoryIds(nodes: ChooseImageTreeNode[]): string[] {
    const ids: string[] = [];

    for (const node of nodes) {
        if (node.children.length > 0) {
            ids.push(node.id, ...collectDirectoryIds(node.children));
        }
    }

    return ids;
}

function collectAncestorIds(nodes: ChooseImageTreeNode[], imagePath: string, trail: string[] = []): string[] {
    for (const node of nodes) {
        if (node.imagePath === imagePath) {
            return trail;
        }

        if (node.children.length > 0) {
            const nested = collectAncestorIds(node.children, imagePath, [...trail, node.id]);
            if (nested.length > 0) {
                return nested;
            }
        }
    }

    return [];
}

function TreeNode({
    node,
    expanded,
    selectedImagePath,
    toggleExpanded,
    previewLocalImage,
    resolveSelection,
}: {
    node: ChooseImageTreeNode;
    expanded: Set<string>;
    selectedImagePath?: string;
    toggleExpanded: (id: string) => void;
    previewLocalImage: (imagePath: string) => void;
    resolveSelection: (imagePath: string | undefined) => void;
}) {
    const isDirectory = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = node.imagePath != null && selectedImagePath === node.imagePath;
    const left = isDirectory
        ? config.magicNumbers.explorer.folderIndentation - (node.depth === 0 ? 20 : 0)
        : config.magicNumbers.explorer.nonFolderIndentation - (node.depth === 0 ? 20 : 0);

    return (
        <div className="explorerDiv" style={{ left: `${left}px`, display: "block" }}>
            {isDirectory ? (
                <img
                    src={assetUrl(isExpanded ? "assets/arrow_down.webp" : "assets/arrow_right.webp")}
                    className="explorerArrow"
                    style={{ marginLeft: "5px" }}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleExpanded(node.id);
                    }}
                    alt=""
                />
            ) : null}
            <div
                className={`explorerText${isSelected ? " selected" : ""}`}
                data-image-path={node.imagePath}
                data-no-translate="true"
                title={node.imagePath}
                onClick={() => {
                    if (node.imagePath) previewLocalImage(node.imagePath);
                }}
                onDoubleClick={() => {
                    if (node.imagePath) resolveSelection(node.imagePath);
                }}
            >
                {node.label}
            </div>
            {node.hasNineslice ? <img src={assetUrl("icons/nineslice.webp")} className="explorerHasNineslice" alt="Nineslice" /> : null}
            {isDirectory && isExpanded ? node.children.map((child) => (
                <TreeNode
                    key={child.id}
                    node={child}
                    expanded={expanded}
                    selectedImagePath={selectedImagePath}
                    toggleExpanded={toggleExpanded}
                    previewLocalImage={previewLocalImage}
                    resolveSelection={resolveSelection}
                />
            )) : null}
        </div>
    );
}

export function ChooseImageModalShell() {
    const [open, setOpen] = useState(false);
    const [assetVersion, setAssetVersion] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDropdownValue, setSelectedDropdownValue] = useState("");
    const [selectedImagePath, setSelectedImagePath] = useState<string>();
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [repoInput, setRepoInput] = useState("PresentKim/ai-generated-pixelart");
    const [refInput, setRefInput] = useState("main");
    const [externalSearch, setExternalSearch] = useState("");
    const [externalEntries, setExternalEntries] = useState<ExternalImageEntry[]>([]);
    const [externalStatus, setExternalStatus] = useState<ExternalStatusState>({
        message: "Load a repository to browse external images.",
        tone: "neutral",
    });
    const [externalLicense, setExternalLicense] = useState("");
    const [externalLicenseTone, setExternalLicenseTone] = useState<ExternalStatusTone>("neutral");
    const [externalLoading, setExternalLoading] = useState(false);
    const [currentGitResourceUrl, setCurrentGitResourceUrl] = useState<string>();
    const [externalPreview, setExternalPreview] = useState<ExternalPreviewState | null>(null);
    const resolverRef = useRef<((value: string) => void) | null>(null);
    const rejectRef = useRef<((reason?: unknown) => void) | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const dropdownRef = useRef<HTMLSelectElement | null>(null);
    const externalPreviewCache = useRef(new Map<string, PreviewableImageState>());
    const activePreviewRequestId = useRef(0);

    useEffect(() => registerChooseImageModalHost(), []);

    const tree = useMemo(() => buildChooseImageTree(enhanceFileSystemWithUserPresets()), [assetVersion, open]);
    const localImagePaths = useMemo(() => collectImagePaths(enhanceFileSystemWithUserPresets()), [assetVersion, open]);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type !== "open-choose-image") return;

        resolverRef.current = event.resolve;
        rejectRef.current = event.reject;
        setOpen(true);
        setAssetVersion((value) => value + 1);
        setSearchQuery("");
        setSelectedDropdownValue("");
        setSelectedImagePath(undefined);
        setExpanded(new Set(collectDirectoryIds(buildChooseImageTree(enhanceFileSystemWithUserPresets()))));
        setRepoInput("PresentKim/ai-generated-pixelart");
        setRefInput("main");
        setExternalSearch("");
        setExternalEntries([]);
        setExternalStatus({ message: "Load a repository to browse external images.", tone: "neutral" });
        setExternalLicense("");
        setExternalLicenseTone("neutral");
        setExternalLoading(false);
        setCurrentGitResourceUrl(undefined);
        setExternalPreview(null);
        externalPreviewCache.current.clear();
        activePreviewRequestId.current = 0;
    }), []);

    useEffect(() => {
        return () => {
            if (rejectRef.current) {
                rejectRef.current(new Error("Choose image modal host unmounted"));
            }
            resolverRef.current = null;
            rejectRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key !== "Escape") return;
            close(new Error("Modal closed"));
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    useEffect(() => {
        const canvas = previewCanvasRef.current;
        const imageState = externalPreview?.imageState ?? (selectedImagePath ? getImagesMap().get(selectedImagePath) : undefined);

        if (!canvas || !imageState?.png) {
            if (canvas) {
                canvas.width = 1;
                canvas.height = 1;
            }
            return;
        }

        drawPreviewCanvas(canvas, imageState.png);
    }, [externalPreview, selectedImagePath]);

    const filteredLocalPaths = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return [];
        return localImagePaths.filter((path) => path.toLowerCase().includes(query)).slice(0, 50);
    }, [localImagePaths, searchQuery]);

    const filteredExternalEntries = useMemo(() => {
        const query = externalSearch.trim().toLowerCase();
        if (!query) return externalEntries;
        return externalEntries.filter((entry) => `${entry.name} ${entry.path}`.toLowerCase().includes(query));
    }, [externalEntries, externalSearch]);

    const close = (reason?: unknown) => {
        resolverRef.current = null;
        const reject = rejectRef.current;
        rejectRef.current = null;
        setOpen(false);
        if (reason !== undefined) {
            reject?.(reason);
        }
    };

    const resolveSelection = (imagePath: string | undefined) => {
        if (!imagePath) return;
        const imageState = getImagesMap().get(imagePath);
        if (!imageState?.png && !imageState?.json) return;
        const resolve = resolverRef.current;
        resolverRef.current = null;
        rejectRef.current = null;
        setOpen(false);
        resolve?.(imagePath);
    };

    const previewLocalImage = (imagePath: string) => {
        setSelectedImagePath(imagePath);
        setExternalPreview(null);
        setSelectedDropdownValue(imagePath);
        const ancestorIds = collectAncestorIds(tree, imagePath);
        if (ancestorIds.length > 0) {
            setExpanded((previous) => new Set([...previous, ...ancestorIds]));
        }
    };

    const getExternalState = async (entry: ExternalImageEntry): Promise<PreviewableImageState> => {
        const cached = externalPreviewCache.current.get(entry.importPath);
        if (cached) return cached;

        const imageState = await fetchExternalImageState(entry);
        externalPreviewCache.current.set(entry.importPath, imageState);
        return imageState;
    };

    const importExternalEntry = async (entry: ExternalImageEntry): Promise<string | undefined> => {
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
            (window as { Builder?: { updateExplorer?: () => void } }).Builder?.updateExplorer?.();

            setAssetVersion((value) => value + 1);
            new Notification("Imported external texture.", 2500, "notif");
            return entry.importPath;
        } catch (error) {
            console.error(error);
            new Notification(error instanceof Error ? error.message : "Could not import the external texture.", 3000, "error");
            return undefined;
        }
    };

    const previewExternalEntry = async (entry: ExternalImageEntry): Promise<void> => {
        setSelectedImagePath(undefined);
        setExternalPreview({ entry, loading: true });
        const requestId = ++activePreviewRequestId.current;

        try {
            const imageState = await getExternalState(entry);
            if (requestId !== activePreviewRequestId.current) return;
            setExternalPreview({ entry, imageState, loading: false });
        } catch (error) {
            console.error(error);
            if (requestId !== activePreviewRequestId.current) return;
            new Notification(error instanceof Error ? error.message : "Could not preview the external texture.", 3000, "error");
            setExternalPreview(null);
        }
    };

    const loadExternalRepo = async () => {
        setExternalLoading(true);
        setCurrentGitResourceUrl(undefined);
        setExternalStatus({ message: "Loading external resources...", tone: "neutral" });
        setExternalLicense("");

        try {
            const result = await loadExternalImageRepo(repoInput, refInput);
            setExternalEntries(result.images);
            setRefInput(result.repoInfo.ref);
            setCurrentGitResourceUrl(result.repoInfo.gitResourceUrl);
            setExternalStatus({
                message: result.truncated
                    ? `Loaded ${result.images.length} external images, but GitHub returned a partial tree.`
                    : `Loaded ${result.images.length} external images from ${result.repoInfo.owner}/${result.repoInfo.repo}@${result.repoInfo.ref}.`,
                tone: result.truncated ? "warning" : "success",
            });
            setExternalLicense(
                result.repoInfo.licenseName
                    ? `License: ${result.repoInfo.licenseName}`
                    : "License info was not provided. Only import resources you have permission to use."
            );
            setExternalLicenseTone(result.repoInfo.licenseName ? "neutral" : "warning");
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Could not load the external repository.";
            setExternalEntries([]);
            setExternalStatus({ message, tone: "warning" });
            setExternalLicense("");
            new Notification(message, 3000, "warning");
        } finally {
            setExternalLoading(false);
        }
    };

    const toggleExpanded = (id: string) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown" && filteredLocalPaths.length > 0) {
            event.preventDefault();
            setSelectedDropdownValue(filteredLocalPaths[0]!);
            previewLocalImage(filteredLocalPaths[0]!);
            dropdownRef.current?.focus();
        }

        if (event.key === "Enter" && filteredLocalPaths.length > 0) {
            event.preventDefault();
            const targetPath = selectedDropdownValue || filteredLocalPaths[0]!;
            previewLocalImage(targetPath);
            resolveSelection(targetPath);
        }
    };

    const localPreviewState = selectedImagePath ? getImagesMap().get(selectedImagePath) : undefined;
    const previewImageState = externalPreview?.imageState ?? localPreviewState;
    const previewTitle = externalPreview
        ? externalPreview.entry.name
        : selectedImagePath
            ? getImageLabel(selectedImagePath)
            : translateText("No texture selected yet.");
    const previewPath = externalPreview
        ? `${externalPreview.entry.repoInfo.owner}/${externalPreview.entry.repoInfo.repo}@${externalPreview.entry.repoInfo.ref}/${externalPreview.entry.path}`
        : selectedImagePath ?? "";
    const previewBadges = [
        previewImageState?.png ? { text: "PNG", className: "is-png" } : null,
        previewImageState?.json ? { text: "NineSlice", className: "is-nineslice" } : null,
        !previewImageState?.png && !previewImageState?.json && (externalPreview || selectedImagePath) ? { text: "Missing Data", className: "is-missing" } : null,
    ].filter(Boolean) as Array<{ text: string; className: string }>;
    const previewMetaRows = [
        { label: "Path", value: previewPath || "-" },
        { label: "Image Size", value: previewImageState?.png ? `${previewImageState.png.width} x ${previewImageState.png.height}` : "No image" },
        { label: "NineSlice", value: previewImageState?.json ? "Yes" : "No" },
        ...(previewImageState?.json?.nineslice_size ? [{ label: "nineslice_size", value: formatVector(previewImageState.json.nineslice_size) }] : []),
        ...(previewImageState?.json?.base_size ? [{ label: "base_size", value: formatVector(previewImageState.json.base_size) }] : []),
        ...(externalPreview ? [
            { label: "Source", value: `${externalPreview.entry.repoInfo.owner}/${externalPreview.entry.repoInfo.repo}` },
            { label: "Import Path", value: externalPreview.entry.importPath },
        ] : []),
    ];
    const previewEmptyText = externalPreview?.loading
        ? translateText("Loading Preview...")
        : previewImageState?.json
            ? "PNG is missing, but NineSlice data is available."
            : translateText("The selected texture will appear here.");

    return (
        <div id="modalChooseImage" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) {
                close(new Error("Modal closed"));
            }
        }}>
            <div className="modal-content chooseImageModalContent">
                <span id="modalChooseImageClose" className="modalClose" style={{ cursor: "pointer" }} onClick={() => close(new Error("Modal closed"))}>&times;</span>
                <h2 className="modalHeader">Choose Image</h2>
                <img src={assetUrl("icons/nineslice.webp")} style={{ width: 20, position: "relative", top: 5, left: 5 }} alt="Nineslice" />
                <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>: Nineslice Image</label>

                <div className="chooseImageExternalSection">
                    <div className="chooseImageExternalHeader">
                        <div className="chooseImageExternalTitle">External Resources</div>
                        <div className="chooseImageExternalBody">Load a GitHub repository, search its images, preview them, then import them into this builder.</div>
                    </div>
                    <div className="chooseImageExternalControls">
                        <input
                            type="text"
                            className="chooseImageExternalInput repo"
                            placeholder="owner/repo or GitHub URL"
                            value={repoInput}
                            onChange={(event) => setRepoInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void loadExternalRepo();
                                }
                            }}
                        />
                        <input
                            type="text"
                            className="chooseImageExternalInput ref"
                            placeholder="Branch"
                            value={refInput}
                            onChange={(event) => setRefInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void loadExternalRepo();
                                }
                            }}
                        />
                        <button type="button" className="chooseImageExternalButton primary" disabled={externalLoading} onClick={() => void loadExternalRepo()}>
                            {externalLoading ? "Loading..." : "Load Repo"}
                        </button>
                        <button
                            type="button"
                            className="chooseImageExternalButton"
                            disabled={!currentGitResourceUrl}
                            onClick={() => {
                                if (!currentGitResourceUrl) return;
                                window.open(currentGitResourceUrl, "_blank", "noopener,noreferrer");
                            }}
                        >
                            Open GitResource
                        </button>
                    </div>
                    <div className="chooseImageExternalStatus" data-state={externalStatus.tone}>{externalStatus.message}</div>
                    <div className="chooseImageExternalLicense" data-state={externalLicenseTone === "warning" ? "warning" : undefined}>{externalLicense}</div>
                    <input
                        type="text"
                        className="chooseImageExternalInput search"
                        placeholder="Search external images..."
                        disabled={externalEntries.length === 0}
                        value={externalSearch}
                        onChange={(event) => setExternalSearch(event.target.value)}
                    />
                    <div className="chooseImageExternalResults">
                        {filteredExternalEntries.length === 0 ? (
                            <div className="chooseImageExternalEmpty">
                                {externalEntries.length === 0 ? "No external images loaded yet." : "No external images matched your search."}
                            </div>
                        ) : filteredExternalEntries.map((entry) => (
                            <div key={entry.importPath} className="chooseImageExternalCard">
                                <img className="chooseImageExternalThumb" src={entry.downloadUrl} alt={entry.name} loading="lazy" />
                                <div className="chooseImageExternalInfo">
                                    <div className="chooseImageExternalName" data-no-translate="true">{entry.name}</div>
                                    <div className="chooseImageExternalPath" data-no-translate="true">{entry.path}</div>
                                </div>
                                <div className="chooseImageExternalActions">
                                    <button type="button" className="chooseImageExternalButton" onClick={() => void previewExternalEntry(entry)}>Preview</button>
                                    <button
                                        type="button"
                                        className="chooseImageExternalButton primary"
                                        onClick={async () => {
                                            const importedPath = await importExternalEntry(entry);
                                            if (importedPath) resolveSelection(importedPath);
                                        }}
                                    >
                                        Import &amp; Use
                                    </button>
                                    <button
                                        type="button"
                                        className="chooseImageExternalButton"
                                        onClick={async () => {
                                            try {
                                                await downloadExternalImage(entry);
                                            } catch (error) {
                                                console.error(error);
                                                new Notification(error instanceof Error ? error.message : "Could not download the external image.", 3000, "error");
                                            }
                                        }}
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chooseImageSearchWrapper">
                    <input
                        type="text"
                        className="chooseImageSearchInput"
                        placeholder={translateText("Search images...")}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <select
                        ref={dropdownRef}
                        size={6}
                        className="chooseImageSearchDropdown"
                        style={{ display: filteredLocalPaths.length > 0 ? "block" : "none" }}
                        value={selectedDropdownValue}
                        onChange={(event) => {
                            setSelectedDropdownValue(event.target.value);
                            previewLocalImage(event.target.value);
                        }}
                        onDoubleClick={() => resolveSelection(selectedDropdownValue)}
                        onKeyDown={(event) => {
                            if (event.key !== "Enter") return;
                            event.preventDefault();
                            resolveSelection(selectedDropdownValue);
                        }}
                    >
                        {filteredLocalPaths.map((path) => (
                            <option key={path} value={path}>{path}</option>
                        ))}
                    </select>
                </div>

                <div className="chooseImageContent">
                    <div className="modalChooseImageForm">
                        {tree.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                expanded={expanded}
                                selectedImagePath={selectedImagePath}
                                toggleExpanded={toggleExpanded}
                                previewLocalImage={previewLocalImage}
                                resolveSelection={resolveSelection}
                            />
                        ))}
                    </div>

                    <div className="chooseImagePreviewPanel">
                        <div className="chooseImagePreviewHeader">
                            <div className="chooseImagePreviewEyebrow">{translateText("Texture Preview")}</div>
                            <div className="chooseImagePreviewHint">{translateText("Select a texture from the list to preview it, then double-click it or use the button below.")}</div>
                        </div>
                        <div className="chooseImagePreviewCanvasWrap">
                            <canvas
                                ref={previewCanvasRef}
                                className="chooseImagePreviewCanvas"
                                style={{ display: previewImageState?.png ? "block" : "none" }}
                            />
                            <div
                                className="chooseImagePreviewEmpty"
                                style={{ display: previewImageState?.png ? "none" : "flex" }}
                            >
                                {previewEmptyText}
                            </div>
                        </div>
                        <div className="chooseImagePreviewTitle" data-no-translate="true">{previewTitle}</div>
                        <div className="chooseImagePreviewPath" data-no-translate="true">{previewPath}</div>
                        <div className="chooseImagePreviewBadgeRow">
                            {previewBadges.map((badge) => (
                                <span key={`${badge.text}-${badge.className}`} className={`chooseImagePreviewBadge ${badge.className}`}>{badge.text}</span>
                            ))}
                        </div>
                        <div className="chooseImagePreviewMeta">
                            {previewMetaRows.map((row) => (
                                <div key={`${row.label}-${row.value}`} className="chooseImagePreviewMetaRow">
                                    <span className="chooseImagePreviewMetaLabel">{row.label}</span>
                                    <span className="chooseImagePreviewMetaValue">{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="chooseImagePreviewActionRow">
                            <button
                                type="button"
                                className="chooseImagePreviewButton chooseImagePreviewDownloadButton"
                                disabled={!selectedImagePath && !externalPreview}
                                onClick={async () => {
                                    try {
                                        if (externalPreview) {
                                            await downloadExternalImage(externalPreview.entry);
                                            return;
                                        }

                                        if (selectedImagePath) {
                                            await downloadSelectedImageAsset(selectedImagePath);
                                        }
                                    } catch (error) {
                                        console.error(error);
                                        new Notification(error instanceof Error ? error.message : translateText("Could not download the selected image."), 3000, "error");
                                    }
                                }}
                            >
                                {translateText("Download")}
                            </button>
                            <button
                                type="button"
                                className="chooseImagePreviewButton chooseImagePreviewUseButton"
                                disabled={externalPreview?.loading || (!selectedImagePath && !externalPreview)}
                                onClick={async () => {
                                    if (externalPreview) {
                                        const importedPath = await importExternalEntry(externalPreview.entry);
                                        if (importedPath) resolveSelection(importedPath);
                                        return;
                                    }

                                    resolveSelection(selectedImagePath);
                                }}
                            >
                                {externalPreview ? "Import & Use" : translateText("Use This Texture")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
