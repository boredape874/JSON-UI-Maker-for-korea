import { assetUrl } from "./lib/assetUrl.js";

const directoryPickerProps = {
    webkitdirectory: "",
    directory: "",
} as unknown as Record<string, string>;

function callBuilder(method: string, ...args: unknown[]): void {
    const builder = (window as { Builder?: Record<string, (...values: unknown[]) => void> }).Builder;
    builder?.[method]?.(...args);
}

function icon(path: string): string {
    return assetUrl(path);
}

export function App() {
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
                                    onChange={() => callBuilder("handleUiTexturesUpload")}
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
                                    onChange={() => callBuilder("uploadForm")}
                                    accept=".json"
                                />
                                Upload Form
                            </label>

                            <label className="form_importer">
                                <input
                                    title="Import UI Folder"
                                    type="file"
                                    id="ui_workspace_importer"
                                    onChange={() => callBuilder("importUiWorkspace")}
                                    multiple
                                    {...directoryPickerProps}
                                />
                                Import UI Folder
                            </label>

                            <button type="button" className="propertyInputButton" onClick={() => callBuilder("openPasteFormModal")}>Paste Form Code</button>
                            <button type="button" className="propertyInputButton" onClick={() => callBuilder("openHudEditorModal")}>HUD Editor</button>
                            <button type="button" className="propertyInputButton" onClick={() => callBuilder("openGlyphEditorModal")}>Glyph Editor</button>
                        </div>
                    </div>
                </div>

                <div className="navbar-center">
                    <div id="authStatus" className="auth-status-inline">
                        <span id="authUserDisplay">Not signed in</span>
                        <button id="authSignInBtn" onClick={() => callBuilder("openAuthModal", false)}>Sign In</button>
                        <button id="authSignUpBtn" onClick={() => callBuilder("openAuthModal", true)}>Sign Up</button>
                        <button id="authLogoutBtn" onClick={() => callBuilder("logout")} style={{ display: "none" }}>Logout</button>
                    </div>

                    <button id="presetUploadBtn" onClick={() => callBuilder("openUploadPresetModal")} style={{ display: "none" }} className="navbar-preset-btn primary">Upload Preset</button>
                    <button id="presetManagementBtn" onClick={() => callBuilder("openPresetManagementModal")} style={{ display: "none" }} className="navbar-preset-btn secondary">Manage Presets</button>
                    <button className="navbar-preset-btn tertiary" onClick={() => callBuilder("texturePresetsModal")}>Preset Textures</button>

                    <div className="navbar-divider"></div>

                    <button className="modalSettingsBtn" id="modalSettingsBtn">
                        <span className="settings_label">Settings</span>
                        <img className="settings_img" src={icon("icons/settings_cog.webp")} alt="Settings" />
                    </button>

                    <div className="scale-control">
                        <label htmlFor="ui_scale_slider" style={{ color: "white", fontSize: 12, marginRight: 5 }}>Scale:</label>
                        <input id="ui_scale_slider" type="range" min="10" max="100" />
                    </div>

                    <button id="undo-btn" onClick={() => callBuilder("undo")} disabled title="Undo (Ctrl+Z)">Undo</button>
                    <button id="redo-btn" onClick={() => callBuilder("redo")} disabled title="Redo (Ctrl+Y)">Redo</button>
                </div>

                <div className="navbar-right">
                    <img src={icon("icons/help.webp")} className="help_button" onClick={() => callBuilder("openHelpMenu")} alt="Help" />
                    <a href="https://discord.gg/zqfNbYCcA9" className="discord_link" target="_blank" rel="noreferrer">
                        <img src={icon("icons/discord.webp")} className="discord_icon" alt="Discord" />
                    </a>
                </div>
            </div>

            <div id="modalSettings" className="modal"><div className="modal-content"><span id="modalSettingsClose" className="modalClose">&times;</span><h2 className="modalHeader">Settings</h2><div className="modalSettingsForm"></div></div></div>
            <div id="modalAddButton" className="modal"><div className="modal-content"><span id="modalAddButtonClose" className="modalClose">&times;</span><h2 className="modalHeader">Add Button</h2><div className="modalAddButtonForm"></div></div></div>
            <div id="modalCreateForm" className="modal"><div className="modal-content"><h2 className="modalHeader">Create Form</h2><div className="modalCreateFormForm"></div></div></div>
            <div id="modalSaveForms" className="modal"><div className="modal-content modalSaveFormsContent"><span id="modalSaveFormsClose" className="modalClose">&times;</span><h2 className="modalHeader">Save Forms</h2><div className="modalSaveFormsForm"></div></div></div>
            <div id="modalPasteForm" className="modal"><div className="modal-content" style={{ maxWidth: 860 }}><span id="modalPasteFormClose" className="modalClose">&times;</span><h2 className="modalHeader">Paste Form Code</h2><div className="modalPasteFormForm"></div></div></div>
            <div id="modalUiWorkspace" className="modal"><div className="modal-content" style={{ maxWidth: 900 }}><span id="modalUiWorkspaceClose" className="modalClose">&times;</span><h2 className="modalHeader">Import UI Folder</h2><div className="modalUiWorkspaceForm"></div></div></div>

            <div id="hudEditorScreen" className="hudEditorScreen">
                <div className="hudEditorScreenHeader">
                    <div className="hudEditorScreenTitle">HUD Editor</div>
                    <button type="button" id="hudEditorScreenClose" className="propertyInputButton hudEditorScreenClose">Close HUD Editor</button>
                </div>
                <div className="hudEditorScreenBody modalHudEditorForm"></div>
            </div>

            <div id="modalGlyphEditor" className="modal"><div className="modal-content glyphEditorModalContent"><span id="modalGlyphEditorClose" className="modalClose">&times;</span><h2 className="modalHeader">Glyph Editor</h2><div className="modalGlyphEditorForm"></div></div></div>
            <div id="modalLoadTexturePresets" className="modal"><div className="modal-content"><span id="modalLoadTexturePresetsClose" className="modalClose">&times;</span><h2 className="modalHeader">Load Texture Presets</h2><div className="modalLoadTexturePresetsForm"></div></div></div>

            <div id="modalHelpMenu" className="modal">
                <div className="modal-content" style={{ maxWidth: 640, maxHeight: "80vh", overflowY: "auto" }}>
                    <span id="modalHelpMenuClose" className="modalClose">&times;</span>
                    <h2 className="modalHeader">Help</h2>
                    <div className="modalHelpMenuForm">
                        <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Key Binds:</label><br /><br />
                        <label className="modalOptionLabel">CTRL + c: <b>Copy</b><br />CTRL + v: <b>Paste</b><br />CTRL + x: <b>Cut</b><br />Tab: <b>Indent</b><br />Del: <b>Delete</b><br />Tab | Enter: <b>Autocomplete</b><br />Arrow Keys: <b>Move</b></label><br /><br /><br />
                        <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)", fontSize: 20 }}>Bindings Quick Guide</label><br /><br />
                        <label className="modalOptionLabel">1. Use &quot;binding_name&quot; to receive a value such as &quot;#title_text&quot;.</label><br /><br />
                        <label className="modalOptionLabel">2. Use &quot;binding_type&quot;: &quot;view&quot; when you want to control visibility or other view properties.</label><br /><br />
                        <label className="modalOptionLabel">&quot;source_property_name&quot; is the condition or source expression, and &quot;target_property_name&quot; is the property to change.</label><br /><br />
                        <label className="modalOptionLabel" style={{ color: "#9dd1ff" }}>Tips: Type # for source property suggestions, and type &quot; inside a key to see available binding keys.</label><br /><br />
                        <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Example:</label><br /><br />
                        <pre className="modalHelpCode">{`[
  {
    "binding_name": "#title_text"
  },
  {
    "binding_type": "view",
    "source_property_name": "(not (#title_text = ''))",
    "target_property_name": "#visible"
  }
]`}</pre><br /><br />
                        <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)", fontSize: 20 }}>General Issues:</label><br /><br />
                        <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Why arent my buttons working in-game?</label><br /><br />
                        <label className="modalOptionLabel">You probably need to stack the button on top of a collection panel. If that doesnt fix it, check that all texture paths are correct.</label><br /><br />
                        <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>Why isnt the form uploader working?</label><br /><br />
                        <label className="modalOptionLabel">The form uploader can only upload forms made by the website.</label>
                    </div>
                </div>
            </div>

            <div id="modalChooseImage" className="modal">
                <div className="modal-content chooseImageModalContent">
                    <span id="modalChooseImageClose" className="modalClose">&times;</span>
                    <h2 className="modalHeader">Choose Image</h2>
                    <img src={icon("icons/nineslice.webp")} style={{ width: 20, position: "relative", top: 5, left: 5 }} alt="Nineslice" />
                    <label style={{ fontWeight: 500, color: "rgb(255, 255, 255)" }}>: Nineslice Image</label>
                    <div className="modalChooseImageForm"></div>
                </div>
            </div>

            <div className="main">
                <div className="buttons">
                    <div className="addElements">
                        Elements:
                        <button type="button" onClick={() => callBuilder("addPanel")}>Add panel</button>
                        <button type="button" onClick={() => callBuilder("openAddImageMenu")}>Add image</button>
                        <button type="button" onClick={() => callBuilder("addButton")}>Add button</button>
                        <button type="button" onClick={() => callBuilder("addCollectionPanel")}>Add Collection Panel</button>
                        <button type="button" onClick={() => callBuilder("addLabel")}>Add Label</button>
                        <button type="button" onClick={() => callBuilder("addScrollingPanel")}>Add Scrolling Panel</button>
                    </div>

                    <div className="breaker"></div>

                    <div className="utilElements">
                        <button className="utilElement" type="button" onClick={() => callBuilder("reset")}>Reset <img style={{ width: 17, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/reset.webp")} alt="Reset" /></button>
                        <button className="utilElement" type="button" onClick={() => callBuilder("deleteSelected")}>Delete Selected <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/bin.webp")} alt="Delete" /></button>
                        <button className="utilElement saveFormsLauncher" type="button" onClick={() => callBuilder("openSaveFormsModal")}>Save Forms <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/download.webp")} alt="Save" /></button>
                    </div>

                    <div className="breaker"></div>

                    <div id="explorer" className="explorer"></div>
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
                        <div onClick={() => callBuilder("formatBindingsArea")} style={{ position: "relative", marginLeft: 15, cursor: "pointer" }} className="utilElement">
                            Format <img style={{ width: 20, top: 3, position: "relative", filter: "drop-shadow(0px 0px 5px #000000)" }} src={icon("icons/curly_brackets.webp")} alt="Format" />
                        </div>
                    </div>
                </div>
            </div>

            <div id="properties" className="properties"></div>
            <div id="notif-container"></div>
            <div id="mainWarningMessage"></div>
        </>
    );
}
