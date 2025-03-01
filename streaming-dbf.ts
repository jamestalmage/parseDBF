import {StreamReader} from "peek-readable";
import { createDecoder } from './typed-decoder.js';
import {Readable} from "node:stream";

export type DbfHeader = {
    lastUpdated: Date,
    records: number,
    headerLen: number,
    recLen: number
}

function dbfHeader(data: DataView): DbfHeader {
    const lastUpdated = new Date(data.getUint8(1) + 1900, data.getUint8(2), data.getUint8(3));
    const records = data.getUint32(4, true);
    const headerLen = data.getUint16(8, true);
    const recLen = data.getUint16(10, true);
    return {lastUpdated, records, headerLen, recLen};
}

export type RowHeader = {
    name: string,
    dataType: string,
    len: number,
    decimal: number
}

function rowHeader(data: DataView, decoder:any): RowHeader {
    const name = decoder(new Uint8Array(data.buffer.slice(0, 11)));
    const dataType = String.fromCharCode(data.getUint8(11));
    const len = data.getUint8(16);
    const decimal = data.getUint8(17);
    return {name, dataType, len, decimal};
}


function rowFuncs(view: DataView, offset: number, len:number, dataType: string, decoder: any) {
    const data = new Uint8Array(view.buffer.slice(offset, offset + len));

    const textData = decoder(data);
    switch (dataType) {
        case 'N':
        case 'F':
        case 'O':
            return parseFloat(textData); // was parseFloat(textData, 10)?
        case 'D':
            return new Date(textData.slice(0, 4), parseInt(textData.slice(4, 6), 10) - 1, textData.slice(6, 8));
        case 'L':
            return textData.toLowerCase() === 'y' || textData.toLowerCase() === 't';
        default:
            return textData;
    }
}

function parseRow(view: DataView, rowHeaders: RowHeader[], decoder:any) {
    const out: {[key: string]: any} = {};
    let offset = 0;
    for (let header of rowHeaders) {
        out[header.name] = rowFuncs(view, offset, header.len, header.dataType, decoder);
        offset += header.len;
    }
    return out;
}

export default async function (stream: Readable, encoding?: string) {
    const reader = new StreamReader(stream);
    const decoder = createDecoder(encoding);

    let buffer = Buffer.alloc(32);
    let view = new DataView(buffer.buffer);
    const bytesRead = await reader.read(buffer, 0, 32);
    if (bytesRead !== 32) {
        throw new Error('Unexpected end of file');
    }

    const mainHeader = dbfHeader(view);

    async function* rowHeaders() {
        for(let i = 32; i < mainHeader.headerLen - 1; i += 32) {
            await reader.read(buffer, 0, 32);
            yield rowHeader(view, decoder);
            reader.peek(buffer, 0, 1);
            if (view.getUint8(0) === 13) {
                return;
            }
        }
    }

    const headers =  await Array.fromAsync(rowHeaders());

    //await reader.read(buffer, 0, 2);

    async function* rows() {
        const recLen = mainHeader.recLen;
        const records = mainHeader.records;
        const buff = Buffer.alloc(recLen);
        const view = new DataView(buff.buffer);
        for (let i = 0; i < records; i++) {
            await reader.read(buff, 0, recLen);
            yield parseRow(view, headers, decoder);
        }
    }

    return await Array.fromAsync(rows());
}
