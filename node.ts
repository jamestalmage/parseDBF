import {type Readable, type Readable as NodeReadable} from 'node:stream';
import {StreamReader} from 'peek-readable';
import parseDbf from './parse-dbf.js';

async function incrementallyParseDbfStreamNode(nodeStream: Readable, encoding?: string) {
	const reader = new StreamReader(nodeStream);
	return parseDbf(reader, encoding);
}

export const incrementallyParseDbfStream = incrementallyParseDbfStreamNode;

async function parseDbfStreamNode(stream: NodeReadable, encoding?: string) {
	const {rows} = await incrementallyParseDbfStream(stream, encoding);
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	return Array.fromAsync(rows);
}

export const parseDbfStream = parseDbfStreamNode;
