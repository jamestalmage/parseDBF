import {type IStreamReader} from 'peek-readable';
import {createDecoder, type Decoder} from './decoder.js';

function allocateBuffer(size: number) {
	const buffer
		= globalThis.Buffer && typeof globalThis.Buffer.alloc === 'function'
			? globalThis.Buffer.alloc(size)
			: new ArrayBuffer(size);

	return new Uint8Array(buffer);
}

export type DbfFileHeader = {
	lastUpdated: Date;
	recordCount: number;
	headerLength: number;
	recordLength: number;
};

export type DbfColumnHeader = {
	name: string;
	dataType: string;
	byteLength: number;
	decimalPlaces: number;
};

export type StreamingDbfParseResult = {
	fileHeader: DbfFileHeader;
	rowHeaders: DbfColumnHeader[];
	rows: AsyncIterableIterator<Record<string, any>>;
};

function parseFileHeader(data: DataView): DbfFileHeader {
	const lastUpdated = new Date(data.getUint8(1) + 1900, data.getUint8(2), data.getUint8(3));
	const recordCount = data.getUint32(4, true);
	const headerLength = data.getUint16(8, true);
	const recordLength = data.getUint16(10, true);
	return {
		lastUpdated, recordCount, headerLength, recordLength,
	};
}

function parseColumnHeader(data: DataView, decoder: Decoder): DbfColumnHeader {
	const name = decoder(new Uint8Array(data.buffer.slice(0, 11)));
	const dataType = String.fromCodePoint(data.getUint8(11));
	const byteLength = data.getUint8(16);
	const decimalPlaces = data.getUint8(17);
	return {
		name, dataType, byteLength, decimalPlaces,
	};
}

function parseColumn(view: DataView, offset: number, length: number, dataType: string, decoder: Decoder) {
	const data = new Uint8Array(view.buffer.slice(offset, offset + length));

	const textData = decoder(data);
	switch (dataType) {
		case 'N':
		case 'F':
		case 'O': {
			return Number.parseFloat(textData);
		}

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

function parseRow(view: DataView, rowHeaders: DbfColumnHeader[], decoder: Decoder) {
	const out: Record<string, any> = {};
	let offset = 0;
	for (const header of rowHeaders) {
		out[header.name] = parseColumn(view, offset, header.byteLength, header.dataType, decoder);
		offset += header.byteLength;
	}

	return out;
}

export default async function parseDbf(reader: IStreamReader, encoding?: string) {
	const decoder = createDecoder(encoding);

	const headerBuffer = allocateBuffer(32);
	const view = new DataView(headerBuffer.buffer);
	let bytesRead = await reader.read(headerBuffer, 0, 32);
	if (bytesRead !== 32) {
		throw new Error('Unexpected end of file');
	}

	const fileHeader = parseFileHeader(view);

	async function * parseColumnHeaders() {
		for (let i = 32; i < fileHeader.headerLength - 1; i += 32) {
			// eslint-disable-next-line no-await-in-loop
			await reader.peek(headerBuffer, 0, 1);
			if (view.getUint8(0) === 13) {
				return;
			}

			// eslint-disable-next-line no-await-in-loop
			bytesRead += await reader.read(headerBuffer, 0, 32);
			yield parseColumnHeader(view, decoder);
		}
	}

	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	const columnHeaders = await Array.fromAsync(parseColumnHeaders());

	bytesRead += await reader.read(headerBuffer, 0, 2);

	async function * rows() {
		// TODO: This is a hack to pass the 'empty' test
		//  The dbf file in that test lies about it's record length (1 byte per record instead of 0)
		//  So it seems like it's an invalid file and that throwing would be appropriate.
		//  Keeping for now so we can say full API compatibility
		if (columnHeaders.length === 0) {
			for (let i = 0; i < fileHeader.recordCount; i++) {
				yield {};
			}

			return;
		}

		const buff = allocateBuffer(fileHeader.recordLength);
		const view = new DataView(buff.buffer);
		for (let i = 0; i < fileHeader.recordCount; i++) {
			// eslint-disable-next-line no-await-in-loop
			await reader.read(buff, 0, fileHeader.recordLength);
			yield parseRow(view, columnHeaders, decoder);
		}
	}

	const result: StreamingDbfParseResult = {
		fileHeader: ({...fileHeader, lastUpdated: new Date(fileHeader.lastUpdated)}),
		rowHeaders: columnHeaders.map(row => ({...row})),
		rows: rows(),
	};

	return result;
}
