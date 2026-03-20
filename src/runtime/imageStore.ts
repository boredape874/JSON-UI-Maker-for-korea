export interface NinesliceDataLike {
    nineslice_size: [left: number, top: number, right: number, bottom: number];
    base_size: [width: number, height: number];
}

export interface ImageDataState {
    png?: ImageData;
    json?: NinesliceDataLike;
}

export const images: Map<string, ImageDataState> = new Map();
