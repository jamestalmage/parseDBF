import {makeWebStreamReader, type AnyWebByteStream} from 'peek-readable';
import parseDbf, {type StreamingDbfParseResult} from './parse-dbf.js';

async function incrementallyParseDbfStreamBrowser(webStream: AnyWebByteStream, encoding?: string): Promise<StreamingDbfParseResult> {
	const reader = makeWebStreamReader(webStream);
	return parseDbf(reader, encoding);
}

export const incrementallyParseDbfStream = incrementallyParseDbfStreamBrowser;

async function parseDbfStreamBrowser(stream: AnyWebByteStream, encoding?: string): Promise<Array<Record<string, any>>> {
	const {rows} = await incrementallyParseDbfStream(stream, encoding);
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	return Array.fromAsync(rows);
}

export const parseDbfStream = parseDbfStreamBrowser;
