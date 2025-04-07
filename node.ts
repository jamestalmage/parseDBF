import {type Readable} from 'node:stream';
import {StreamReader} from 'peek-readable';
import parseDbf from './parse-dbf.js';

export default async function parseDbfFromNodeStream(nodeStream: Readable, encoding?: string) {
	const reader = new StreamReader(nodeStream);
	return parseDbf(reader, encoding);
}
