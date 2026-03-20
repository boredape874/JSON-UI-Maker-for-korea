import { NinesliceData } from "../nineslice.js";

export interface ImageDataState {
    png?: ImageData;
    json?: NinesliceData;
}

export const images: Map<string, ImageDataState> = new Map();
