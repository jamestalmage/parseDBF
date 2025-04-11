import {type Readable, type Readable as NodeReadable} from 'node:stream';
import {StreamReader} from 'peek-readable';
import parseDbf, {type StreamingDbfParseResult} from './parse-dbf.js';

export type {AnyWebByteStream} from 'peek-readable';
export type {StreamingDbfParseResult, DbfFileHeader, DbfColumnHeader} from './parse-dbf.js';

async function incrementallyParseDbfStreamNode(nodeStream: Readable, encoding?: string): Promise<StreamingDbfParseResult> {
	const reader = new StreamReader(nodeStream);
	return parseDbf(reader, encoding);
}

export const incrementallyParseDbfStream = incrementallyParseDbfStreamNode;

async function parseDbfStreamNode(stream: NodeReadable, encoding?: string): Promise<Array<Record<string, any>>> {
	const {rows} = await incrementallyParseDbfStream(stream, encoding);
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	return Array.fromAsync(rows);
}

export const parseDbfStream = parseDbfStreamNode;
