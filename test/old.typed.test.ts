import * as chai from 'chai';
import dbf from '../index.js';
import basic from './data/watershed.js';
import char11 from './data/watershed-11chars.js';
import specialChar from './data/watershed-specialCharacters.js';

// @ts-ignore
const expect = chai.default.expect;

const utf = [
	{
		field: '💩',
	},
	{
		field: 'Hněvošický háj',
	},
];

async function getStream(filePath: string) {
	if (typeof window !== 'undefined' && 'fetch' in window && typeof window.fetch === 'function') {
		const response = await fetch(filePath);
		if (!response.body) {
			throw new Error('Response body is not readable');
		}
		return response.body;
	}

	const {default: fs} = await import('node:fs');
	const {default: path} = await import('node:path');
	const {fileURLToPath} = await import('node:url');
	const __dirname = path.dirname(fileURLToPath(import.meta.url));

	return fs.createReadStream(path.join(__dirname, '..', '..', filePath));
}

describe('dbf', () => {
	it('should work', async () => {
		const stream = await getStream('./test/data/watershed.dbf');
		expect(await dbf(stream)).to.deep.equal(basic);
	});
	it('should handle 11 character field names', async () => {
		const stream = await getStream('./test/data/watershed-11chars.dbf');
		expect(await dbf(stream)).to.deep.equal(char11);
	});
	it('should handle special characters', async () => {
		const stream = await getStream('./test/data/watershed-specialCharacters.dbf');
		expect(await dbf(stream)).to.deep.equal(specialChar);
	});
	it('should handle an empty / null dbf file', async () => {
		const stream = await getStream('./test/data/empty.dbf');
		expect(await dbf(stream)).to.deep.equal([{}, {}]);
	});
	it('should handle utf characters', async() => {
		const stream1 = await getStream('./test/data/utf.dbf');
		expect(await dbf(stream1)).to.deep.equal(utf);
		const stream2 = await getStream('./test/data/utf.dbf');
		expect(await dbf(stream2, 'UTF-8')).to.deep.equal(utf);
	});
	it('should handle utf characters and a stupid formatting', async () => {
		const stream = await getStream('./test/data/utf.dbf');
		expect(await dbf(stream), 'absolutely ridiculous formatting').to.deep.equal(utf);
	});
	it('should handle other characters', async () => {
		const parseCodedpage = async (encoding?: string) => {
			return dbf(await getStream('./test/data/codepage.dbf'), encoding);
		}

		expect((await parseCodedpage())[1]).not.to.deep.equal(utf[1]);
		expect((await parseCodedpage('1250'))[1]).to.deep.equal(utf[1]);
		expect((await parseCodedpage('ANSI 1250'))[1]).to.deep.equal(utf[1]);
		expect((await parseCodedpage('windows-1250'))[1]).to.deep.equal(utf[1]);
	});
});
