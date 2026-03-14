import { SavedConfig, StringObjectMap } from "./converter.js";
import { GlobalElementMapValue } from "./index.js";
interface UploadTreeInstructions {
    ContinuePath: boolean;
    SkipToNextJsonNode?: boolean;
    FollowPath?: string;
}
export interface WorkspaceDefinition {
    id: string;
    namespace: string;
    key: string;
    rawKey: string;
    control: StringObjectMap;
    sourceFile: string;
}
export declare class FormUploader {
    static workspaceDefinitions: Map<string, WorkspaceDefinition>;
    static parseJsonWithComments(raw: string): any;
    static parseControlKey(childKey: string): {
        baseKey: string;
        type: string;
        reference?: string;
    };
    static deepMerge(base: any, override: any): any;
    static resolveReferencedControl(reference: string | undefined, override: StringObjectMap): StringObjectMap;
    static resolveDimension(value: string | number | undefined, scalar: number, fallback: string): string;
    static resolveVector2(value: [string | number, string | number] | undefined, scalar: number, fallback: [string, string]): [string, string];
    static resolveControlPath(path: string | undefined, args?: any): string | undefined;
    static isValid(form: string): boolean;
    static isValidParsed(parsed: StringObjectMap): boolean;
    static getJsonControlsAndType(json: StringObjectMap): {
        control: StringObjectMap;
        type: string;
    }[];
    static uploadParsedForm(parsed: StringObjectMap, uploadedFileName?: string, workspaceDefinitions?: Map<string, WorkspaceDefinition>): void;
    static uploadForm(form: string, uploadedFileName?: string, workspaceDefinitions?: Map<string, WorkspaceDefinition>): void;
    static tree(rootJson: StringObjectMap, parentClassElement: GlobalElementMapValue, args?: any): void;
}
export declare const tagNameToCreateClassElementFunc: Map<string, (json: StringObjectMap, parentClassElement: GlobalElementMapValue, usedConfig: SavedConfig, nextNodes: StringObjectMap) => {
    element: GlobalElementMapValue;
    instructions: UploadTreeInstructions;
} | undefined>;
export {};
