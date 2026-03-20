const STATIC_PREFIXES = ["assets/", "icons/", "presets/", "background.png"];

export function assetUrl(path: string): string {
    if (/^(?:https?:|data:|blob:)/u.test(path)) {
        return path;
    }

    const normalized = path.replace(/^\.\//u, "").replace(/^\/+/u, "");
    const isStaticPath = STATIC_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix));
    if (!isStaticPath) {
        return path;
    }

    const base = import.meta.env.BASE_URL || "/";
    return `${base}${normalized}`.replace(/(?<!:)\/{2,}/gu, "/");
}
