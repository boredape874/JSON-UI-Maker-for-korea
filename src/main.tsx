import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { App } from "./App.js";
import "../style.css";
import "./legacyInline.css";

async function main(): Promise<void> {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        throw new Error("React root element #root was not found.");
    }

    const root = createRoot(rootElement);
    flushSync(() => {
        root.render(<App />);
    });

    const { bootstrapLegacyApp } = await import("./index.js");
    await bootstrapLegacyApp();
    window.dispatchEvent(new Event("legacy-app-ready"));
}

void main();
