import { closeUploadPresetBridge, openUploadPresetBridge } from "../react/modalBridge.js";

export class UploadPresetModal {
  init(): void {}

  show(): void {
    openUploadPresetBridge();
  }

  hide(): void {
    closeUploadPresetBridge();
  }
}

export const uploadPresetModal = new UploadPresetModal();
