function hexRange(start: number, end: number): string[] {
    const values: string[] = [];
    for (let value = start; value <= end; value++) {
        values.push(value.toString(16).toUpperCase().padStart(2, "0"));
    }
    return values;
}

const DEFAULT_GLYPH_HEX_CODES = [
    ...hexRange(0x00, 0xD7),
    ...hexRange(0xE0, 0xE1),
    ...hexRange(0xF9, 0xFF),
];

export const DEFAULT_GLYPH_SHEETS = DEFAULT_GLYPH_HEX_CODES.map((hexCode) => `glyph_${hexCode}.png`);
export const DEFAULT_GLYPH_BASE_PATH = "assets/glyphs";

export function getGlyphSheetHex(sheetName: string): string {
    return sheetName.replace(/^glyph_/u, "").replace(/\.png$/iu, "").toUpperCase();
}

export function getGlyphCodepoint(sheetName: string, cellIndex: number): number {
    const sheetHex = getGlyphSheetHex(sheetName);
    if (!/^[0-9A-F]{2}$/u.test(sheetHex)) {
        return cellIndex;
    }

    const highByte = Number.parseInt(sheetHex, 16);
    return (highByte << 8) | cellIndex;
}

export function getGlyphSlotHex(cellIndex: number): string {
    return cellIndex.toString(16).toUpperCase().padStart(2, "0");
}
