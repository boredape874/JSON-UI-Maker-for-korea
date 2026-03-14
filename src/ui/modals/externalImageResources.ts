import { StringUtil } from "../../util/stringUtil.js";

const VALID_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;
const DEFAULT_REF = "main";

export interface ExternalImageState {
    png?: ImageData;
    json?: {
        nineslice_size?: number[];
        base_size?: number[];
        [key: string]: any;
    };
}

export interface ExternalRepoInfo {
    owner: string;
    repo: string;
    ref: string;
    htmlUrl: string;
    gitResourceUrl: string;
    licenseName: string | null;
}

export interface ExternalImageEntry {
    repoInfo: ExternalRepoInfo;
    path: string;
    name: string;
    extension: string;
    downloadUrl: string;
    htmlUrl: string;
    jsonDownloadUrl?: string;
    importPath: string;
}

export interface ExternalRepoLoadResult {
    repoInfo: ExternalRepoInfo;
    images: ExternalImageEntry[];
    truncated: boolean;
}

interface GithubRepoResponse {
    default_branch?: string;
    html_url?: string;
    license?: {
        name?: string;
    } | null;
}

interface GithubTreeResponse {
    truncated?: boolean;
    tree?: Array<{
        path?: string;
        type?: string;
    }>;
}

const externalRepoCache = new Map<string, ExternalRepoLoadResult>();

function encodeGitHubPath(path: string): string {
    return path
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");
}

function getRawGithubUrl(owner: string, repo: string, ref: string, path: string): string {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${encodeGitHubPath(path)}`;
}

function getGithubHtmlUrl(owner: string, repo: string, ref: string, path?: string): string {
    const base = `https://github.com/${owner}/${repo}`;
    if (!path) return base;
    return `${base}/blob/${encodeURIComponent(ref)}/${encodeGitHubPath(path)}`;
}

function buildGitResourceUrl(owner: string, repo: string, ref: string): string {
    return `https://gitresource.com/${owner}/${repo}/${encodeURIComponent(ref)}`;
}

function normalizeRepoName(repo: string): string {
    return repo.replace(/\.git$/i, "");
}

function parseGithubSource(repoInput: string, refInput: string): { owner: string; repo: string; ref: string } {
    const trimmed = repoInput.trim();
    if (!trimmed) {
        throw new Error("Enter a GitHub repository in owner/repo format.");
    }

    const fallbackRef = refInput.trim() || DEFAULT_REF;

    if (/^https?:\/\//i.test(trimmed)) {
        const url = new URL(trimmed);
        const parts = url.pathname.split("/").filter(Boolean);

        if (url.hostname.includes("github.com")) {
            if (parts.length < 2) {
                throw new Error("GitHub URL must include owner and repository.");
            }

            const owner = parts[0]!;
            const repo = normalizeRepoName(parts[1]!);
            const ref = parts[2] === "tree" && parts[3] ? decodeURIComponent(parts[3]) : fallbackRef;

            return { owner, repo, ref };
        }

        if (url.hostname.includes("gitresource.com")) {
            if (parts.length < 2) {
                throw new Error("GitResource URL must include owner and repository.");
            }

            const owner = parts[0]!;
            const repo = normalizeRepoName(parts[1]!);
            const ref = parts[2] ? decodeURIComponent(parts[2]) : fallbackRef;

            return { owner, repo, ref };
        }

        throw new Error("Only GitHub and GitResource URLs are supported.");
    }

    const normalized = trimmed.replace(/^github\.com\//i, "").replace(/^gitresource\.com\//i, "");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length < 2) {
        throw new Error("Repository must look like owner/repo.");
    }

    return {
        owner: parts[0]!,
        repo: normalizeRepoName(parts[1]!),
        ref: fallbackRef,
    };
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
        },
    });

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("GitHub API rate limit was hit. Try again later.");
        }

        if (response.status === 404) {
            throw new Error("Repository or branch was not found.");
        }

        throw new Error(`GitHub request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
}

function buildImportPath(owner: string, repo: string, ref: string, path: string): string {
    const safeOwner = StringUtil.toSafeFileName(owner.toLowerCase());
    const safeRepo = StringUtil.toSafeFileName(repo.toLowerCase());
    const safeRef = StringUtil.toSafeFileName(ref.toLowerCase());
    const pathWithoutExtension = path.replace(/\.[^.]+$/, "");
    const safeSegments = pathWithoutExtension
        .split("/")
        .filter(Boolean)
        .map((segment) => StringUtil.toSafeFileName(segment));

    return `external/github/${safeOwner}/${safeRepo}/${safeRef}/${safeSegments.join("/")}`;
}

export async function loadExternalImageRepo(repoInput: string, refInput: string): Promise<ExternalRepoLoadResult> {
    const source = parseGithubSource(repoInput, refInput);
    const cacheKey = `${source.owner}/${source.repo}@${source.ref}`.toLowerCase();
    const cached = externalRepoCache.get(cacheKey);
    if (cached) return cached;

    const repoMetadata = await fetchJson<GithubRepoResponse>(`https://api.github.com/repos/${source.owner}/${source.repo}`);
    const ref = source.ref || repoMetadata.default_branch || DEFAULT_REF;
    const repoInfo: ExternalRepoInfo = {
        owner: source.owner,
        repo: source.repo,
        ref,
        htmlUrl: repoMetadata.html_url ?? getGithubHtmlUrl(source.owner, source.repo, ref),
        gitResourceUrl: buildGitResourceUrl(source.owner, source.repo, ref),
        licenseName: repoMetadata.license?.name ?? null,
    };

    const tree = await fetchJson<GithubTreeResponse>(
        `https://api.github.com/repos/${source.owner}/${source.repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`
    );

    const blobItems = (tree.tree ?? []).filter((entry) => entry.type === "blob" && entry.path);
    const jsonPaths = new Map<string, string>();

    for (const item of blobItems) {
        const itemPath = item.path!;
        if (itemPath.toLowerCase().endsWith(".json")) {
            jsonPaths.set(itemPath.replace(/\.json$/i, ""), itemPath);
        }
    }

    const images: ExternalImageEntry[] = [];

    for (const item of blobItems) {
        const itemPath = item.path!;
        const extension = itemPath.split(".").pop()?.toLowerCase();
        if (!extension || !(VALID_IMAGE_EXTENSIONS as readonly string[]).includes(extension)) continue;

        const basePath = itemPath.replace(/\.[^.]+$/, "");
        images.push({
            repoInfo,
            path: itemPath,
            name: itemPath.split("/").pop() ?? itemPath,
            extension,
            downloadUrl: getRawGithubUrl(source.owner, source.repo, ref, itemPath),
            htmlUrl: getGithubHtmlUrl(source.owner, source.repo, ref, itemPath),
            jsonDownloadUrl: jsonPaths.get(basePath)
                ? getRawGithubUrl(source.owner, source.repo, ref, jsonPaths.get(basePath)!)
                : undefined,
            importPath: buildImportPath(source.owner, source.repo, ref, itemPath),
        });
    }

    const result: ExternalRepoLoadResult = {
        repoInfo,
        images,
        truncated: Boolean(tree.truncated),
    };

    externalRepoCache.set(cacheKey, result);
    return result;
}

async function blobToImageData(blob: Blob): Promise<ImageData> {
    const objectUrl = URL.createObjectURL(blob);

    try {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const context = canvas.getContext("2d")!;
                context.drawImage(img, 0, 0);
                resolve(context.getImageData(0, 0, canvas.width, canvas.height));
            };
            img.onerror = reject;
            img.src = objectUrl;
        });
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export async function fetchExternalImageState(entry: ExternalImageEntry): Promise<ExternalImageState> {
    const imageResponse = await fetch(entry.downloadUrl);
    if (!imageResponse.ok) {
        throw new Error("Could not load the selected image from GitHub.");
    }

    const png = await blobToImageData(await imageResponse.blob());

    let json: ExternalImageState["json"];
    if (entry.jsonDownloadUrl) {
        try {
            const jsonResponse = await fetch(entry.jsonDownloadUrl);
            if (jsonResponse.ok) {
                json = (await jsonResponse.json()) as ExternalImageState["json"];
            }
        } catch {
            // Keep image import usable even if the paired JSON fails.
        }
    }

    return { png, json };
}

export async function downloadExternalImage(entry: ExternalImageEntry): Promise<void> {
    const response = await fetch(entry.downloadUrl);
    if (!response.ok) {
        throw new Error("Could not download the selected image.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = entry.name;
        anchor.click();
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}
