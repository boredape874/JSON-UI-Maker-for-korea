import { useEffect, useMemo, useState } from "react";
import { translateText } from "../../i18n.js";
import { subscribeModalBridge } from "./modalBridge.js";

type Candidate = {
    id: string;
    type: string;
    sourceFile: string;
};

type WorkspaceResolver = ((value: { candidateId: string } | undefined) => void) | null;

export function UiWorkspaceModal() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [filesCount, setFilesCount] = useState(0);
    const [selectedId, setSelectedId] = useState("");
    const [resolver, setResolver] = useState<WorkspaceResolver>(null);

    useEffect(() => subscribeModalBridge((event) => {
        if (event.type !== "open-ui-workspace") return;
        setCandidates(event.workspace.candidates);
        setFilesCount(event.workspace.filesCount);
        setQuery("");
        setSelectedId(event.workspace.candidates[0]?.id ?? "");
        setResolver(() => event.resolve);
        setOpen(true);
    }), []);

    const filtered = useMemo(() => {
        const lowered = query.trim().toLowerCase();
        if (!lowered) return candidates;
        return candidates.filter((entry) => `${entry.id} ${entry.type} ${entry.sourceFile}`.toLowerCase().includes(lowered));
    }, [candidates, query]);

    useEffect(() => {
        if (!filtered.some((entry) => entry.id === selectedId)) {
            setSelectedId(filtered[0]?.id ?? "");
        }
    }, [filtered, selectedId]);

    const close = (value?: { candidateId: string }) => {
        resolver?.(value);
        setResolver(null);
        setOpen(false);
    };

    return (
        <div id="modalUiWorkspace" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) close(undefined);
        }}>
            <div className="modal-content" style={{ maxWidth: 900 }}>
                <span className="modalClose" style={{ cursor: "pointer" }} onClick={() => close(undefined)}>&times;</span>
                <h2 className="modalHeader">Import UI Folder</h2>
                <div className="modalUiWorkspaceForm">
                    <div className="modalOptionBody">{translateText("Loaded UI files:")} {filesCount}. {translateText("Choose the screen or control you want to open.")}</div>
                    <br />
                    <input type="text" className="modalOptionInput" placeholder={translateText("Search UI controls...")} value={query} onChange={(event) => setQuery(event.target.value)} />
                    <br />
                    <select className="modalOptionInput" size={14} style={{ width: "min(760px, 80vw)" }} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                        {filtered.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>{candidate.id} ({candidate.type}) - {candidate.sourceFile}</option>
                        ))}
                    </select>
                    <br />
                    <div className="modalOptionBody">{translateText("Tip: complex controls that depend on unsupported Bedrock features may only load partially in the editor.")}</div>
                    <br />
                    <input type="button" className="modalSubmitButton" value={translateText("Load Selected UI")} onClick={() => {
                        if (!selectedId) return;
                        close({ candidateId: selectedId });
                    }} />
                </div>
            </div>
        </div>
    );
}
