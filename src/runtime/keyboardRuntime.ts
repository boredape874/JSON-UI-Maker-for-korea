let keyboardEventState: KeyboardEvent = new KeyboardEvent("keypress");

export function getKeyboardEvent(): KeyboardEvent {
    return keyboardEventState;
}

export function setKeyboardEvent(event: KeyboardEvent): void {
    keyboardEventState = event;
}
