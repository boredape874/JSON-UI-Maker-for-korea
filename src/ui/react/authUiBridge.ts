import { useSyncExternalStore } from "react";

type AuthUiState = {
    signedIn: boolean;
    username: string | null;
};

let state: AuthUiState = {
    signedIn: false,
    username: null,
};

const listeners = new Set<() => void>();

export function setAuthUiState(nextState: AuthUiState): void {
    state = nextState;
    for (const listener of listeners) {
        listener();
    }
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): AuthUiState {
    return state;
}

export function useAuthUiState(): AuthUiState {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
