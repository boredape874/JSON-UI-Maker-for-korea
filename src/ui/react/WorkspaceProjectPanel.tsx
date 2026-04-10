import { builderActions } from "./builderActions.js";

export function WorkspaceProjectPanel() {
    return (
        <section className="bridgeProjectPanel" aria-label="MCBE workspace project">
            <div className="bridgeSectionTitle">Project</div>
            <div className="bridgeProjectCard">
                <div className="bridgeProjectName">Resource Pack UI</div>
                <div className="bridgeProjectMeta">ui/*.json / textures/ui / font glyph</div>
            </div>
            <div className="bridgeProjectActions">
                <label className="bridgeProjectAction" htmlFor="ui_workspace_importer">Import UI Folder</label>
                <label className="bridgeProjectAction" htmlFor="ui_textures_importer">Import Textures</label>
                <label className="bridgeProjectAction" htmlFor="form_importer">Upload Form JSON</label>
                <button type="button" className="bridgeProjectAction" onClick={() => builderActions.openPasteFormModal()}>Paste JSON</button>
            </div>
        </section>
    );
}
