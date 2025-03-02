import {type Readable} from 'node:stream';
import {StreamReader} from 'peek-readable';
import {createDecoder, type Decoder} from './decoder.js';

export type DbfHeader = {
	lastUpdated: Date;
	records: number;
	headerLen: number;
	recLen: number;
};

function dbfHeader(data: DataView): DbfHeader {
	const lastUpdated = new Date(data.getUint8(1) + 1900, data.getUint8(2), data.getUint8(3));
	const records = data.getUint32(4, true);
	const headerLength = data.getUint16(8, true);
	const recLength = data.getUint16(10, true);
	return {
		lastUpdated, records, headerLen: headerLength, recLen: recLength,
	};
}

export type RowHeader = {
	name: string;
	dataType: string;
	len: number;
	decimal: number;
};

function rowHeader(data: DataView, decoder: Decoder): RowHeader {
	const name = decoder(new Uint8Array(data.buffer.slice(0, 11)));
	const dataType = String.fromCodePoint(data.getUint8(11));
	const length = data.getUint8(16);
	const decimal = data.getUint8(17);
	return {
		name, dataType, len: length, decimal,
	};
}

function rowFuncs(view: DataView, offset: number, length: number, dataType: string, decoder: Decoder) {
	const data = new Uint8Array(view.buffer.slice(offset, offset + length));

	const textData = decoder(data);
	switch (dataType) {
		case 'N':
		case 'F':
		case 'O': {
			return Number.parseFloat(textData);
		} // Was parseFloat(textData, 10)?

		case 'D': {
			return new Date(
				Number.parseInt(textData.slice(0, 4), 10),
				Number.parseInt(textData.slice(4, 6), 10) - 1,
				Number.parseInt(textData.slice(6, 8), 10),
			);
		}

		case 'L': {
			return textData.toLowerCase() === 'y' || textData.toLowerCase() === 't';
		}

		default: {
			return textData;
		}
	}
}

function parseRow(view: DataView, rowHeaders: RowHeader[], decoder: Decoder) {
	const out: Record<string, any> = {};
	let offset = 0;
	for (const header of rowHeaders) {
		out[header.name] = rowFuncs(view, offset, header.len, header.dataType, decoder);
		offset += header.len;
	}

	return out;
}

export default async function parseDbf(stream: Readable, encoding?: string) {
	const reader = new StreamReader(stream);
	const decoder = createDecoder(encoding);

	const buffer = Buffer.alloc(32);
	const view = new DataView(buffer.buffer);
	const bytesRead = await reader.read(buffer, 0, 32);
	if (bytesRead !== 32) {
		throw new Error('Unexpected end of file');
	}

	const mainHeader = dbfHeader(view);

	async function * rowHeaders() {
		for (let i = 32; i < mainHeader.headerLen - 1; i += 32) {
			// eslint-disable-next-line no-await-in-loop
			await reader.read(buffer, 0, 32);
			yield rowHeader(view, decoder);
			// eslint-disable-next-line no-await-in-loop
			await reader.peek(buffer, 0, 1);
			if (view.getUint8(0) === 13) {
				return;
			}
		}
	}

	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	const headers = await Array.fromAsync(rowHeaders());

	await reader.read(buffer, 0, 2);

	async function * rows() {
		const recLength = mainHeader.recLen;
		const records = mainHeader.records;
		const buff = Buffer.alloc(recLength);
		const view = new DataView(buff.buffer);
		for (let i = 0; i < records; i++) {
			// eslint-disable-next-line no-await-in-loop
			await reader.read(buff, 0, recLength);
			yield parseRow(view, headers, decoder);
		}
	}

	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	return Array.fromAsync(rows());
}
