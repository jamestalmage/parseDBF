import test from "ava";
import fs from 'node:fs';
import {fileURLToPath} from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixture = (p: string) => path.join(__dirname, 'data', p);


// @ts-ignore
import basic from './data/watershed.js';
// @ts-ignore
import char11 from './data/watershed-11chars.js';
// @ts-ignore
import specialChar from './data/watershed-specialCharacters.js';

var utf = [
  {
    field: '💩'
  },
  {
    field: 'Hněvošický háj'
  }
]
import dbf from '../streaming-dbf.js'

function fixtureStream(path: string) {
  return fs.createReadStream(fixture(path));
}

test.only('should work', async (t) => {
  t.deepEqual(
      await dbf(fixtureStream('watershed.dbf')),
      basic
  )
});

test('should handle 11 character field names', async (t) => {
  t.deepEqual(
      await dbf(fixtureStream('watershed-11chars.dbf')),
      char11
  )
});

test('should handle special characters', async (t) => {
  t.deepEqual(
      await dbf(fixtureStream('watershed-specialCharacters.dbf')),
      specialChar
  );
});

test('should handle an empty / null dbf file', async (t) => {
  t.deepEqual(
      await dbf(fixtureStream('empty.dbf')),
      [{}, {}]
  );
});

test('should handle utf characters', async (t) => {
  t.deepEqual(
      await dbf(fixtureStream('utf.dbf')),
      utf
  );
});

test('should handle utf characters and a stupid formatting', async (t) => {
    t.deepEqual(
        await dbf(fixtureStream('utf.dbf'), fs.readFileSync(fixture('page.html'), 'utf8')),
        utf
    );
});

const processCodepage = async (codec?:any) => {
  return dbf(fixtureStream('codepage.dbf'), codec);
};
test('should handle other uther characters', async (t) => {
  t.notDeepEqual((await processCodepage())[1], utf[1]);
  t.deepEqual((await processCodepage('1250'))[1], utf[1]);
  t.deepEqual((await processCodepage('ANSI 1250'))[1], utf[1]);
  t.deepEqual((await processCodepage('windows-1250'))[1], utf[1]);

});