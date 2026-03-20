let hostReady = false;
const pendingResolvers = new Set<() => void>();

export function registerChooseImageModalHost(): () => void {
    hostReady = true;

    for (const resolve of pendingResolvers) {
        resolve();
    }
    pendingResolvers.clear();

    return () => {
        hostReady = false;
    };
}

export function waitForChooseImageModalHost(): Promise<void> {
    if (hostReady) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        pendingResolvers.add(resolve);
    });
}
