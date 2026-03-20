import { closeAuthModalBridge, openAuthModalBridge } from "../react/authModalBridge.js";

export class AuthModal {
  init(): void {}

  show(signup: boolean = false): void {
    openAuthModalBridge(signup);
  }

  hide(): void {
    closeAuthModalBridge();
  }
}

export const authModal = new AuthModal();
