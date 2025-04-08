import {makeWebStreamReader, type AnyWebByteStream} from 'peek-readable';
import parseDbf from './parse-dbf.js';

async function incrementallyParseDbfStreamBrowser(webStream: AnyWebByteStream, encoding?: string) {
	const reader = makeWebStreamReader(webStream);
	return parseDbf(reader, encoding);
}

export const incrementallyParseDbfStream = incrementallyParseDbfStreamBrowser;

async function parseDbfStreamBrowser(stream: AnyWebByteStream, encoding?: string) {
	const {rows} = await incrementallyParseDbfStream(stream, encoding);
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	return Array.fromAsync(rows);
}

export const parseDbfStream = parseDbfStreamBrowser;
