import type {Readable as NodeReadable} from 'node:stream';
import type {AnyWebByteStream} from 'peek-readable';

export type {AnyWebByteStream} from 'peek-readable';

const isNodeReadable = (stream: NodeReadable | AnyWebByteStream): stream is NodeReadable => 'pipe' in stream && typeof stream.pipe === 'function';

export default async function parseDbfFromStream(stream: NodeReadable | AnyWebByteStream, encoding?: string) {
	if (isNodeReadable(stream)) {
		const {default: nodeImplementation} = (await import ('./node.js'));
		return nodeImplementation(stream, encoding);
	}

	const {default: browserImplementation} = (await import ('./browser.js'));
	return browserImplementation(stream, encoding);
}
