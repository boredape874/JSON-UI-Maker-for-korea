import { TextPrompt } from "../../ui/textPrompt.js";
export declare class BindingsArea {
    private static hudBindingDefaults;
    private static placeHolderBindings;
    static bindingsTextArea: HTMLTextAreaElement;
    static errorMessage: HTMLLabelElement;
    static isBindingsTextAreaFocused: boolean;
    static BindingsTextPrompt: TextPrompt;
    static hudBindingSourceSelect: HTMLSelectElement | null;
    static hudBindingSourceKeyInput: HTMLInputElement | null;
    static hudBindingMatchInput: HTMLInputElement | null;
    static lastValue: string;
    static isEditable: boolean;
    static doubledLetters: Map<string, string>;
    static init(): void;
    private static initHudBindingHelper;
    private static syncHudBindingSourceDefault;
    static insertHudBindingSnippet(kind: "show" | "hide" | "text"): void;
    private static createHudBindingSnippet;
    static format(): void;
    static indent(e: KeyboardEvent): void;
    static tryOpenBrackets(e: KeyboardEvent): boolean;
    static updateBindingsEditor(): void;
    static editable(isEditable: boolean): void;
    static saveBindings(): void;
    static updateWarningLabel(): boolean;
    static handleKeyboardInput(e: KeyboardEvent): void;
    static checkForDeletedChars(char: string): void;
    static filterSourcePropertyNames(): void;
    static filterBindingKeys(): void;
    /**
     * Inserts a source property name into the BindingsTextArea at the current selection index.
     *
     * @param {string} textToInsert - The source property name to insert.
     * @returns {void}
     */
    static insertSourcePropertyName(textToInsert: string): void;
    /**
     * Inserts a binding key into the BindingsTextArea at the current selection index.
     *
     * @param {string} textToInsert - The binding key to insert.
     * @returns {void}
     */
    static insertBindingKey(textToInsert: string): void;
}
