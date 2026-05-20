
import { Decimal } from '@prisma/client/runtime/library';

interface ZatcaTags {
    sellerName: string;
    vatRegistrationNumber: string;
    timestamp: string;
    invoiceTotal: string;
    vatTotal: string;
}

export function generateZatcaQr(tags: ZatcaTags): string {
    const tlvParts: Uint8Array[] = [];

    // Tag 1: Seller Name
    tlvParts.push(encodeTlv(1, tags.sellerName));

    // Tag 2: VAT Registration Number
    tlvParts.push(encodeTlv(2, tags.vatRegistrationNumber));

    // Tag 3: Timestamp (ISO 8601 or similar)
    tlvParts.push(encodeTlv(3, tags.timestamp));

    // Tag 4: Invoice Total (with VAT)
    tlvParts.push(encodeTlv(4, tags.invoiceTotal));

    // Tag 5: VAT Total
    tlvParts.push(encodeTlv(5, tags.vatTotal));

    // Concatenate all parts
    const combined = mergeUint8Arrays(tlvParts);

    // Convert to Base64
    return toBase64(combined);
}

function encodeTlv(tag: number, value: string): Uint8Array {
    const encoder = new TextEncoder();
    const valueBytes = encoder.encode(value);
    const length = valueBytes.length;

    const tagByte = new Uint8Array([tag]);
    const lengthByte = new Uint8Array([length]);

    return mergeUint8Arrays([tagByte, lengthByte, valueBytes]);
}

function mergeUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

function toBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}
