import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: "./",
    plugins: [react()],
    build: {
        rollupOptions: {
            onwarn(warning, warn) {
                const message = typeof warning === "string" ? warning : warning.message;
                if (
                    message.includes("dynamically imported by") &&
                    message.includes("but also statically imported by")
                ) {
                    return;
                }
                warn(warning);
            },
        },
    },
});
