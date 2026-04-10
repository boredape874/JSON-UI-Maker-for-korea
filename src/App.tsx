import { ComponentType, useEffect, useState } from "react";
import { assetUrl } from "./lib/assetUrl.js";
import { CreateFormModal } from "./ui/react/CreateFormModal.js";
import { AuthModal } from "./ui/react/AuthModal.js";
import { builderActions } from "./ui/react/builderActions.js";
import { useAuthUiState } from "./ui/react/authUiBridge.js";
import { PasteFormModal } from "./ui/react/PasteFormModal.js";
import { UiWorkspaceModal } from "./ui/react/UiWorkspaceModal.js";
import { SettingsModal } from "./ui/react/SettingsModal.js";
import { HelpModal } from "./ui/react/HelpModal.js";
import { AddButtonModal } from "./ui/react/AddButtonModal.js";
import { openSettingsModal } from "./ui/react/modalBridge.js";
import { TexturePresetsModal } from "./ui/react/TexturePresetsModal.js";
import { UploadPresetModal } from "./ui/react/UploadPresetModal.js";
import { PresetManagementModal } from "./ui/react/PresetManagementModal.js";
import { HudEditorModalHost } from "./ui/react/HudEditorModalHost.js";
import { GlyphEditorModal } from "./ui/react/GlyphEditorModal.js";
import { ChooseImageModalShell } from "./ui/react/ChooseImageModalShell.js";
import { ChestUiEditorModal } from "./ui/react/ChestUiEditorModal.js";
import { InspectorTabId, WorkspaceTabId, inspectorTabs, workspaceTools } from "./ui/react/workspaceRegistry.js";
import { WorkspaceProjectPanel } from "./ui/react/WorkspaceProjectPanel.js";

const directoryPickerProps = {
    webkitdirectory: "",
    directory: "",
} as unknown as Record<string, string>;

function icon(path: string): string {
    return assetUrl(path);
}

export function App() {
    const auth = useAuthUiState();
    const [legacyReady, setLegacyReady] = useState(false);
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTabId>("visual");
    const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTabId>("properties");
    const [ExplorerPanelComponent, setExplorerPanelComponent] = useState<ComponentType | null>(null);
    const [PropertiesPanelComponent, setPropertiesPanelComponent] = useState<ComponentType | null>(null);
    const [SaveFormsModalComponent, setSaveFormsModalComponent] = useState<ComponentType | null>(null);
    const activeWorkspaceTool = workspaceTools.find((tool) => tool.id === activeWorkspaceTab) ?? workspaceTools[0];
    const activeInspectorTool = inspectorTabs.find((tab) => tab.id === activeInspectorTab) ?? inspectorTabs[0];

    const openWorkspaceTool = (tab: WorkspaceTabId) => {
        setActiveWorkspaceTab(tab);
        if (tab === "hud") builderActions.openHudEditorModal();
        if (tab === "chest") builderActions.openChestUiEditorModal();
        if (tab === "glyph") builderActions.openGlyphEditorModal();
    };

    useEffect(() => {
        const markReady = () => setLegacyReady(true);
        window.addEventListener("legacy-app-ready", markReady);
        return () => window.removeEventListener("legacy-app-ready", markReady);
    }, []);

    useEffect(() => {
        if (!legacyReady) return;
        let mounted = true;

        void import("./ui/react/ExplorerPanel.js").then((module) => {
            if (mounted) setExplorerPanelComponent(() => module.ExplorerPanel);
        });

        void import("./ui/react/PropertiesPanel.js").then((module) => {
            if (mounted) setPropertiesPanelComponent(() => module.PropertiesPanel);
        });

        void import("./ui/react/SaveFormsModal.js").then((module) => {
            if (mounted) setSaveFormsModalComponent(() => module.SaveFormsModal);
        });

        return () => {
            mounted = false;
        };
    }, [legacyReady]);

    return (
        <>
            <div className="top-navbar bridgeCommandBar">
                <div className="navbar-left">
                    <div className="bridgeBrand">
                        <div className="bridgeBrandTitle">JSON UI Maker</div>
                        <div className="bridgeBrandSub">MCBE Add-On Workspace</div>
                    </div>
                    <div className="toolMenu">
                        <div className="toolMenuSummary">Tools</div>
                        <div className="importers toolMenuPanel">
                            <label className="ui_textures_importer">
                                <input
                                    title="Import Textures"
                                    type="file"
                                    id="ui_textures_importer"
                                    onChange={() => builderActions.handleUiTexturesUpload()}
                                    multiple
                                    {...directoryPickerProps}
                                />
                                Import Textures
                            </label>

                            <label className="form_importer">
                                <input
                                    title="Upload Form"
                                    type="file"
                                    id="form_importer"
                                    onChange={() => builderActions.uploadForm()}
                                    accept=".json"
                                />
                                Upload Form
                            </label>

                            <label className="form_importer">
                                <input
                                    title="Import UI Folder"
                                    type="file"
                                    id="ui_workspace_importer"
                                    onChange={() => builderActions.importUiWorkspace()}
                                    multiple
                                    {...directoryPickerProps}
                                />
                                Import UI Folder
                            </label>

                            <button type="button" className="propertyInputButton" onClick={() => builderActions.openPasteFormModal()}>Paste Form Code</button>
                            <button type="button" className="propertyInputButton" onClick={() => builderActions.openHudEditorModal()}>HUD Editor</button>
                            <button type="button" className="propertyInputButton" onClick={() => builderActions.openChestUiEditorModal()}>Chest UI Editor</button>
                            <button type="button" className="propertyInputButton" onClick={() => builderActions.openGlyphEditorModal()}>Glyph Editor</button>
                        </div>
                    </div>
                </div>

                <div className="navbar-center bridgeCommandCenter">
            <div id="authStatus" className="auth-status-inline">
                <span id="authUserDisplay">{auth.signedIn && auth.username ? `Signed in as: ${auth.username}` : "Not signed in"}</span>
                {!auth.signedIn ? <button id="authSignInBtn" onClick={() => builderActions.openAuthModal(false)}>Sign In</button> : null}
                {!auth.signedIn ? <button id="authSignUpBtn" onClick={() => builderActions.openAuthModal(true)}>Sign Up</button> : null}
                {auth.signedIn ? <button id="authLogoutBtn" onClick={() => builderActions.logout()}>Logout</button> : null}
            </div>

                    {auth.signedIn ? <button id="presetUploadBtn" onClick={() => builderActions.openUploadPresetModal()} className="navbar-preset-btn primary">Upload Preset</button> : null}
                    {auth.signedIn ? <button id="presetManagementBtn" onClick={() => builderActions.openPresetManagementModal()} className="navbar-preset-btn secondary">Manage Presets</button> : null}
                    <button className="navbar-preset-btn tertiary" onClick={() => builderActions.texturePresetsModal()}>Preset Textures</button>

                    <div className="navbar-divider"></div>

                    <button className="modalSettingsBtn" id="modalSettingsBtn" onClick={() => openSettingsModal()}>
                        <span className="settings_label">Settings</span>
                        <img className="settings_img" src={icon("icons/settings_cog.webp")} alt="Settings" />
                    </button>

                    <div className="scale-control">
                        <label htmlFor="ui_scale_slider" style={{ color: "white", fontSize: 12, marginRight: 5 }}>Scale:</label>
                        <input id="ui_scale_slider" type="range" min="10" max="100" />
                    </div>

                    <button id="undo-btn" onClick={() => builderActions.undo()} disabled title="Undo (Ctrl+Z)">Undo</button>
                    <button id="redo-btn" onClick={() => builderActions.redo()} disabled title="Redo (Ctrl+Y)">Redo</button>
                </div>

                <div className="navbar-right">
                    <img src={icon("icons/help.webp")} className="help_button" onClick={() => builderActions.openHelpMenu()} alt="Help" />
                    <a href="https://discord.gg/zqfNbYCcA9" className="discord_link" target="_blank" rel="noreferrer">
                        <img src={icon("icons/discord.webp")} className="discord_icon" alt="Discord" />
                    </a>
                </div>
            </div>

            <SettingsModal />
            <AddButtonModal />
            <AuthModal />
            <CreateFormModal />
            <PasteFormModal />
            <UiWorkspaceModal />
            <HelpModal />
            <TexturePresetsModal />
            <UploadPresetModal />
            <PresetManagementModal />
            <GlyphEditorModal />
            <ChestUiEditorModal />
            {SaveFormsModalComponent ? <SaveFormsModalComponent /> : null}

            <HudEditorModalHost />

            <ChooseImageModalShell />

            <div className="main bridgeWorkspace">
                <div className="buttons bridgeExplorerPane">
                    <div className="bridgePaneHeader">
                        <span>Explorer</span>
                        <span className="bridgePaneMeta">RP / UI</span>
                    </div>
                    <WorkspaceProjectPanel />

                    <div className="bridgeDivider"></div>

                    <div className="addElements">
                        <div className="bridgeSectionTitle">Elements</div>
                        <button type="button" onClick={() => builderActions.addPanel()}>Add panel</button>
                        <button type="button" onClick={() => builderActions.openAddImageMenu()}>Add image</button>
                        <button type="button" onClick={() => builderActions.addButton()}>Add button</button>
                        <button type="button" onClick={() => builderActions.addCollectionPanel()}>Add Collection Panel</button>
                        <button type="button" onClick={() => builderActions.addLabel()}>Add Label</button>
                        <button type="button" onClick={() => builderActions.addScrollingPanel()}>Add Scrolling Panel</button>
                    </div>

                    <div className="bridgeDivider"></div>

                    <div className="bridgeToolShelf">
                        <div className="bridgeSectionTitle">Tools</div>
                        {workspaceTools.filter((tool) => tool.id !== "visual").map((tool) => (
                            <button key={tool.id} type="button" className="bridgeToolButton" onClick={() => openWorkspaceTool(tool.id)}>
                                <span>{tool.label}</span>
                                <small>{tool.description}</small>
                            </button>
                        ))}
                    </div>

                    <div className="bridgeDivider"></div>

                    <div className="utilElements">
                        <div className="bridgeSectionTitle">Actions</div>
                        <button className="utilElement" type="button" onClick={() => builderActions.reset()}>Reset <img style={{ width: 17, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/reset.webp")} alt="Reset" /></button>
                        <button className="utilElement" type="button" onClick={() => builderActions.deleteSelected()}>Delete Selected <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/bin.webp")} alt="Delete" /></button>
                        <button className="utilElement saveFormsLauncher" type="button" onClick={() => builderActions.openSaveFormsModal()}>Save Forms <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/download.webp")} alt="Save" /></button>
                    </div>

                    <div className="bridgeDivider"></div>

                    {ExplorerPanelComponent ? <ExplorerPanelComponent /> : <div id="explorer" className="explorer"></div>}
                </div>

                <div className="canvasViewport bridgeEditorPane">
                    <div className="bridgeWorkspaceTabs">
                        {workspaceTools.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`bridgeWorkspaceTab${activeWorkspaceTab === tab.id ? " bridgeWorkspaceTabActive" : ""}`}
                                title={tab.description}
                                onClick={() => openWorkspaceTool(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="bridgeEditorHeader">
                        <div>
                            <div className="bridgeEditorTitle">{activeWorkspaceTool.label}</div>
                            <div className="bridgeEditorMeta">{activeWorkspaceTool.category} / {activeWorkspaceTool.description}</div>
                        </div>
                        <div className="bridgeEditorActions">
                            <span className={`bridgeToolStatus bridgeToolStatus-${activeWorkspaceTool.status}`}>{activeWorkspaceTool.status}</span>
                            <button type="button" onClick={() => builderActions.openSaveFormsModal()}>Export</button>
                            <button type="button" onClick={() => builderActions.openHelpMenu()}>Help</button>
                        </div>
                    </div>
                    <div className="main_window_outline">
                        <div className="main_window" id="main_window">
                            <img title="Background" src={icon("background.png")} width="100%" height="100%" className="bg_image" id="bg_image" alt="Background" />
                        </div>
                    </div>
                    <div className="bridgeOutputBar">
                        <span>Output</span>
                        <span>Legacy JSON UI canvas retained. Tool tabs currently launch their existing full editor hosts.</span>
                    </div>
                </div>

                <div className="scripter bridgeInspectorPane">
                    <div className="bridgePaneHeader">
                        <span>Inspector</span>
                        <span className="bridgePaneMeta">Properties / Script</span>
                    </div>
                    <div className="bridgeInspectorTabs" aria-label="Inspector tabs">
                        {inspectorTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`bridgeInspectorTab${activeInspectorTab === tab.id ? " bridgeInspectorTabActive" : ""}`}
                                onClick={() => setActiveInspectorTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="bridgeInspectorTabHint">
                        {activeInspectorTool.description}
                    </div>
                    {PropertiesPanelComponent ? <PropertiesPanelComponent /> : <div id="properties" className="properties"></div>}
                    <div className="bridgeDivider"></div>
                    <div className="scripter_title_label">Script</div>
                    <div style={{ color: "rgb(139, 139, 139)" }}>For Fixed Collection Index Forms Only</div>
                    <div className="scripter_buttons">
                        <button className="generate_js_scripter" id="generate_js_scripter">Copy <img style={{ width: 18, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/js.webp")} alt="JavaScript" /> To Clipboard</button>
                        <button className="generate_ts_scripter" id="generate_ts_scripter">Copy <img style={{ width: 18, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/ts.webp")} alt="TypeScript" /> To Clipboard</button>
                    </div>
                    <br /><br /><br />
                    <div className="scripter_title_label">Bindings</div>
                    <div style={{ color: "rgb(139, 139, 139)" }}>Advanced Feature</div>
                    <div id="errorMessage" title="Default Error Message" style={{ visibility: "hidden", color: "#7e0000" }}>Warnings here</div>
                    <textarea spellCheck={false} className="bindings" id="bindings"></textarea>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                        <div style={{ fontSize: 20, color: "rgb(39, 165, 255)" }}>TAB</div>&nbsp;To indent
                        <div onClick={() => builderActions.formatBindingsArea()} style={{ position: "relative", marginLeft: 15, cursor: "pointer" }} className="utilElement">
                            Format <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/curly_brackets.webp")} alt="Format" />
                        </div>
                    </div>
                </div>
            </div>

            <div id="notif-container"></div>
            <div id="mainWarningMessage"></div>
        </>
    );
}
