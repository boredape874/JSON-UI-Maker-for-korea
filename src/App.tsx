import legacyShell from "./legacyShell.html?raw";

export function App(): JSX.Element {
    return <div dangerouslySetInnerHTML={{ __html: legacyShell }} />;
}
