import fs from 'node:fs';
import chai from 'chai';
import dbf from '../index.js';
import basic from './data/watershed.js';
import char11 from './data/watershed-11chars.js';
import specialChar from './data/watershed-specialCharacters.js';

const utf = [
	{
		field: '💩',
	},
	{
		field: 'Hněvošický háj',
	},
];
chai.should();
function toArrayBuffer(buffer) {
	return new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
}

describe('dbf', () => {
	it('should work', done => {
		fs.readFile('./test/data/watershed.dbf', (error, data) => {
			if (error) {
				return done(error);
			}

			dbf(toArrayBuffer(data)).should.deep.equal(basic);
			done();
		});
	});
	it('should handle 11 charicter field names', done => {
		fs.readFile('./test/data/watershed-11chars.dbf', (error, data) => {
			if (error) {
				return done(error);
			}

			dbf(toArrayBuffer(data)).should.deep.equal(char11);
			done();
		});
	});
	it('should handle special characters', done => {
		fs.readFile('./test/data/watershed-specialCharacters.dbf', (error, data) => {
			if (error) {
				return done(error);
			}

			dbf(toArrayBuffer(data)).should.deep.equal(specialChar);
			done();
		});
	});
	it('should handle an empty / null dbf file', done => {
		fs.readFile('./test/data/empty.dbf', (error, data) => {
			if (error) {
				return done(error);
			}

			dbf(toArrayBuffer(data)).should.deep.equal([{}, {}]);
			done();
		});
	});
	it('should handle utf charicters', done => {
		fs.readFile('./test/data/utf.dbf', (error, data) => {
			if (error) {
				return done(error);
			}

			dbf(toArrayBuffer(data)).should.deep.equal(utf);
			dbf(toArrayBuffer(data), 'UTF-8').should.deep.equal(utf);
			done();
		});
	});
	it('should handle utf charicters and a stupid formatting', done => {
		fs.readFile('./test/data/utf.dbf', (error, data) => {
			if (error) {
				return done(error);
			}

			fs.readFile('./test/data/page.html', 'utf8', (error, data2) => {
				dbf(toArrayBuffer(data), data2).should.deep.equal(utf);
				done();
			});
		});
	});
	it('should handle other charicters', done => {
		fs.readFile('./test/data/codepage.dbf', (error, dataraw) => {
			if (error) {
				return done(error);
			}

			const data = toArrayBuffer(dataraw);
			dbf(data)[1].should.not.deep.equal(utf[1]);
			dbf(data, '1250')[1].should.deep.equal(utf[1]);
			dbf(data, 'ANSI 1250')[1].should.deep.equal(utf[1]);
			dbf(data, 'windows-1250')[1].should.deep.equal(utf[1]);
			done();
		});
	});
});
