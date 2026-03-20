import { closePresetManagementBridge, openPresetManagementBridge } from "../react/modalBridge.js";

export class PresetManagementModal {
  init(): void {}

  show(): void {
    openPresetManagementBridge();
  }

  hide(): void {
    closePresetManagementBridge();
  }

  async refreshPresets(): Promise<void> {
    openPresetManagementBridge();
  }
}

export const presetManagementModal = new PresetManagementModal();
(window as any).presetManagementModal = presetManagementModal;
