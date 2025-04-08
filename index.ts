import type {Readable as NodeReadable} from 'node:stream';
import type {AnyWebByteStream} from 'peek-readable';
import {type StreamingDbfParseResult} from './parse-dbf.js';

export type {AnyWebByteStream} from 'peek-readable';

const isNodeReadable = (stream: NodeReadable | AnyWebByteStream): stream is NodeReadable => 'pipe' in stream && typeof stream.pipe === 'function';

export async function incrementallyParseDbfStream(stream: NodeReadable | AnyWebByteStream, encoding?: string): Promise<StreamingDbfParseResult> {
	if (isNodeReadable(stream)) {
		const {incrementallyParseDbfStream: nodeImplementation} = (await import ('./node.js'));
		return nodeImplementation(stream, encoding);
	}

	const {incrementallyParseDbfStream: browserImplementation} = (await import ('./browser.js'));
	return browserImplementation(stream, encoding);
}

export async function parseDbfStream(stream: NodeReadable | AnyWebByteStream, encoding?: string): Promise<Array<Record<string, any>>> {
	const {rows} = await incrementallyParseDbfStream(stream, encoding);
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	return Array.fromAsync(rows);
}
