import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    rmSync,
    statSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const publicDir = resolve(root, "public");

mkdirSync(publicDir, { recursive: true });

const copyTargets = [
    { from: "assets", to: "assets" },
    { from: "icons", to: "icons" },
    { from: "presets", to: "presets" },
    { from: "background.png", to: "background.png" },
];

for (const target of copyTargets) {
    const source = resolve(root, target.from);
    const destination = resolve(publicDir, target.to);

    if (!existsSync(source)) {
        throw new Error(`Missing static asset source: ${target.from}`);
    }

    copyRecursive(source, destination);
}

function copyRecursive(source, destination) {
    const stats = statSync(source);

    if (stats.isDirectory()) {
        rmSync(destination, { recursive: true, force: true });
        mkdirSync(destination, { recursive: true });
        for (const entry of readdirSync(source)) {
            copyRecursive(resolve(source, entry), resolve(destination, entry));
        }
        return;
    }

    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
}
