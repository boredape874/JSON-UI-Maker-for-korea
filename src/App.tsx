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
    const [ExplorerPanelComponent, setExplorerPanelComponent] = useState<ComponentType | null>(null);
    const [PropertiesPanelComponent, setPropertiesPanelComponent] = useState<ComponentType | null>(null);
    const [SaveFormsModalComponent, setSaveFormsModalComponent] = useState<ComponentType | null>(null);

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
            <div className="top-navbar">
                <div className="navbar-left">
                    <div className="toolMenu">
                        <div className="toolMenuSummary">도구 목록</div>
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

                <div className="navbar-center">
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

            <div className="main">
                <div className="buttons">
                    <div className="addElements">
                        Elements:
                        <button type="button" onClick={() => builderActions.addPanel()}>Add panel</button>
                        <button type="button" onClick={() => builderActions.openAddImageMenu()}>Add image</button>
                        <button type="button" onClick={() => builderActions.addButton()}>Add button</button>
                        <button type="button" onClick={() => builderActions.addCollectionPanel()}>Add Collection Panel</button>
                        <button type="button" onClick={() => builderActions.addLabel()}>Add Label</button>
                        <button type="button" onClick={() => builderActions.addScrollingPanel()}>Add Scrolling Panel</button>
                    </div>

                    <div className="breaker"></div>

                    <div className="utilElements">
                        <button className="utilElement" type="button" onClick={() => builderActions.reset()}>Reset <img style={{ width: 17, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/reset.webp")} alt="Reset" /></button>
                        <button className="utilElement" type="button" onClick={() => builderActions.deleteSelected()}>Delete Selected <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/bin.webp")} alt="Delete" /></button>
                        <button className="utilElement saveFormsLauncher" type="button" onClick={() => builderActions.openSaveFormsModal()}>Save Forms <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/download.webp")} alt="Save" /></button>
                    </div>

                    <div className="breaker"></div>

                    {ExplorerPanelComponent ? <ExplorerPanelComponent /> : <div id="explorer" className="explorer"></div>}
                </div>

                <div className="canvasViewport">
                    <div className="main_window_outline">
                        <div className="main_window" id="main_window">
                            <img title="Background" src={icon("background.png")} width="100%" height="100%" className="bg_image" id="bg_image" alt="Background" />
                        </div>
                    </div>
                </div>

                <div className="scripter">
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

            {PropertiesPanelComponent ? <PropertiesPanelComponent /> : <div id="properties" className="properties"></div>}
            <div id="notif-container"></div>
            <div id="mainWarningMessage"></div>
        </>
    );
}
