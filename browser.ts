import {makeWebStreamReader, type AnyWebByteStream} from 'peek-readable';
import parseDbf from './parse-dbf.js';

export default async function parseDbfFromWebStream(webStream: AnyWebByteStream, encoding?: string) {
	const reader = makeWebStreamReader(webStream);
	return parseDbf(reader, encoding);
}
