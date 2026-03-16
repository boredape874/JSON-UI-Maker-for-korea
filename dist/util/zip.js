const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();
function crc32(data) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}
function writeUint16(view, offset, value) {
    view.setUint16(offset, value, true);
    return offset + 2;
}
function writeUint32(view, offset, value) {
    view.setUint32(offset, value >>> 0, true);
    return offset + 4;
}
export function createZipBlob(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;
    for (const entry of entries) {
        const fileName = entry.name.replace(/\\/g, "/");
        const fileNameBytes = encoder.encode(fileName);
        const fileData = entry.data;
        const checksum = crc32(fileData);
        const localHeader = new Uint8Array(30 + fileNameBytes.length);
        const localView = new DataView(localHeader.buffer);
        let cursor = 0;
        cursor = writeUint32(localView, cursor, 0x04034b50);
        cursor = writeUint16(localView, cursor, 20);
        cursor = writeUint16(localView, cursor, 0);
        cursor = writeUint16(localView, cursor, 0);
        cursor = writeUint16(localView, cursor, 0);
        cursor = writeUint16(localView, cursor, 0);
        cursor = writeUint32(localView, cursor, checksum);
        cursor = writeUint32(localView, cursor, fileData.length);
        cursor = writeUint32(localView, cursor, fileData.length);
        cursor = writeUint16(localView, cursor, fileNameBytes.length);
        cursor = writeUint16(localView, cursor, 0);
        localHeader.set(fileNameBytes, cursor);
        localParts.push(localHeader, fileData);
        const centralHeader = new Uint8Array(46 + fileNameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        cursor = 0;
        cursor = writeUint32(centralView, cursor, 0x02014b50);
        cursor = writeUint16(centralView, cursor, 20);
        cursor = writeUint16(centralView, cursor, 20);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint32(centralView, cursor, checksum);
        cursor = writeUint32(centralView, cursor, fileData.length);
        cursor = writeUint32(centralView, cursor, fileData.length);
        cursor = writeUint16(centralView, cursor, fileNameBytes.length);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint16(centralView, cursor, 0);
        cursor = writeUint32(centralView, cursor, 0);
        cursor = writeUint32(centralView, cursor, localOffset);
        centralHeader.set(fileNameBytes, cursor);
        centralParts.push(centralHeader);
        localOffset += localHeader.length + fileData.length;
    }
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    let cursor = 0;
    cursor = writeUint32(endView, cursor, 0x06054b50);
    cursor = writeUint16(endView, cursor, 0);
    cursor = writeUint16(endView, cursor, 0);
    cursor = writeUint16(endView, cursor, entries.length);
    cursor = writeUint16(endView, cursor, entries.length);
    cursor = writeUint32(endView, cursor, centralSize);
    cursor = writeUint32(endView, cursor, localOffset);
    writeUint16(endView, cursor, 0);
    const parts = [...localParts, ...centralParts, endRecord].map((part) => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength));
    return new Blob(parts, { type: "application/zip" });
}
//# sourceMappingURL=zip.js.map