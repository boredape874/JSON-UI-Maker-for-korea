import { translateText } from "../../i18n.js";
export class Notification {
    message;
    showTimeMs;
    element;
    constructor(message, showTimeMs = 2000, type = "notif") {
        this.message = translateText(message);
        this.showTimeMs = showTimeMs;
        const container = document.getElementById("notif-container");
        this.element = document.createElement("div");
        this.element.className = "clipboard-notif";
        if (type === "warning") {
            this.element.style.backgroundColor = "rgb(196, 111, 0)";
            this.element.textContent = `⚠ ${this.message}`;
        }
        else if (type === "error") {
            this.element.style.backgroundColor = "red";
            this.element.textContent = `⚠ ${this.message}`;
        }
        else {
            this.element.textContent = this.message;
        }
        container.appendChild(this.element);
        this.show();
    }
    show() {
        requestAnimationFrame(() => this.element.classList.add("show"));
        setTimeout(() => this.element.classList.remove("show"), this.showTimeMs);
        setTimeout(() => this.delete(), this.showTimeMs + 500);
    }
    delete() {
        this.element.remove();
    }
}
//# sourceMappingURL=noficationMaker.js.map