/**
 * A guard, not a unit test.
 *
 * `ELEMENTS[id].label` does not exist — the field is `name` — and React
 * renders `undefined` as nothing at all, so five call sites across the
 * plan and circuit editors quietly displayed a glyph followed by empty
 * space. Nothing crashed and no test failed; only `tsc` knew, and its
 * output had been noisy long enough that nobody read it.
 *
 * So: every property read off an element in the source has to be one an
 * element actually has.
 */
import {readdirSync, readFileSync, statSync} from 'fs';
import {join} from 'path';

import {ELEMENTS, ELEMENT_ORDER} from '../elements';

const SRC = join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

it('every element has the fields the UI reads off it', () => {
  const known = new Set(Object.keys(ELEMENTS[ELEMENT_ORDER[0]]));
  expect(known.has('name')).toBe(true);

  const wrong: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/ELEMENTS\[[^\]]+\]\.([A-Za-z_]\w*)/g)) {
      if (!known.has(match[1])) {
        wrong.push(`${file.slice(SRC.length + 1)} reads .${match[1]}`);
      }
    }
  }
  expect(wrong).toEqual([]);
});

it('every element is complete, so no lookup can come back empty', () => {
  for (const id of ELEMENT_ORDER) {
    const el = ELEMENTS[id];
    expect(el.id).toBe(id);
    for (const field of [
      'name',
      'domain',
      'ethos',
      'glyph',
      'emoji',
    ] as const) {
      expect(typeof el[field]).toBe('string');
      expect(el[field].length).toBeGreaterThan(0);
    }
  }
});
