/**
 * Pass 3: a restore reads a file from outside the app — mailed to
 * themselves, edited in a text editor, truncated by a full disk, or
 * written by a newer RaveLite. Every one of these must be refused in
 * words, and must leave the training log exactly as it was.
 */
import {store} from '../../../storage';
import {CURRENT_SCHEMA_VERSION, KEYS} from '../../../storage/keys';
import {__resetProfileCache, loadFacts} from '../../profile/repository';
import {addEntry, loadEntries} from '../../training/repository';
import {BACKUP_FORMAT, buildBackup, readBackup, restoreBackup} from '../backup';

const NOW = new Date(2026, 8, 20, 14, 5).getTime();

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

/** Something worth not losing. */
function aLifeLogged(): string {
  addEntry({at: NOW, kindId: 'builtin.run-2mi', value: 1040});
  store.set(KEYS.ambientToneVolumeMaster, 40);
  return JSON.stringify(buildBackup(NOW));
}

const good = () => buildBackup(NOW);

/** A key far longer than anything the app writes. */
const LONG_KEY = 'a.very.long.key'.padEnd(2000, 'x');

/** Files a restore must refuse. */
const REFUSED: [name: string, text: string][] = [
  ['nothing at all', ''],
  ['a space', ' '],
  ['not JSON', 'this is my training log, sorry'],
  ['HTML from a failed download', '<!doctype html><html>404</html>'],
  ['truncated mid-object', JSON.stringify(good()).slice(0, 120)],
  ['a bare array', '[]'],
  ['a bare number', '42'],
  ['null', 'null'],
  ['a JSON string', '"ravelite"'],
  ['no format', JSON.stringify({schema: 1, entries: {a: 1}})],
  ['a format that is text', JSON.stringify({format: '2', entries: {}})],
  ['no entries', JSON.stringify({format: BACKUP_FORMAT, schema: 1})],
  ['entries as null', JSON.stringify({format: 2, schema: 1, entries: null})],
  ['entries as an array', JSON.stringify({format: 2, schema: 1, entries: []})],
  ['entries empty', JSON.stringify({format: 2, schema: 1, entries: {}})],
  [
    'entries of nothing but nulls',
    JSON.stringify({format: 2, schema: 1, entries: {a: null, b: null}}),
  ],
  ['a newer format', JSON.stringify({...good(), format: BACKUP_FORMAT + 1})],
  [
    'a newer schema',
    JSON.stringify({...good(), schema: CURRENT_SCHEMA_VERSION + 1}),
  ],
];

it('refuses every file that is not a RaveLite export, in words', async () => {
  for (const [name, text] of REFUSED) {
    store.clearAll();
    __resetProfileCache();
    const mine = aLifeLogged();
    const before = loadEntries();
    const result = await restoreBackup(text);
    expect({name, ok: result.ok}).toEqual({name, ok: false});
    expect({name, why: !result.ok && result.why.length > 10}).toEqual({
      name,
      why: true,
    });
    // Nothing touched.
    expect({name, entries: loadEntries()}).toEqual({name, entries: before});
    expect(store.getNumber(KEYS.ambientToneVolumeMaster)).toBe(40);
    // And their own file still restores after it.
    const after = await restoreBackup(mine);
    expect({name, ok: after.ok}).toEqual({name, ok: true});
  }
});

it('drops values it cannot store, and keeps the rest', async () => {
  aLifeLogged();
  const text = JSON.stringify({
    format: BACKUP_FORMAT,
    schema: CURRENT_SCHEMA_VERSION,
    exportedAt: NOW,
    entries: {
      'profile.facts': null,
      'a.list': [1, 2, 3],
      'an.object': {nested: true},
      [KEYS.ambientToneVolumeMaster]: 65,
      __proto__: 'not a prototype',
      [LONG_KEY]: 'still a string',
    },
  });
  const result = await restoreBackup(text);
  expect(result.ok).toBe(true);
  expect(store.getNumber(KEYS.ambientToneVolumeMaster)).toBe(65);
  expect(store.getString('a.list')).toBeUndefined();
  expect(({} as Record<string, unknown>).nested).toBeUndefined();
  // The app still reads after it.
  __resetProfileCache();
  expect(() => loadFacts()).not.toThrow();
});

it('reads a big file without choking', () => {
  const entries: Record<string, string> = {};
  for (let i = 0; i < 20_000; i++) {
    entries[`journal.2026-09-20.${i}`] = JSON.stringify({
      kind: 'completion',
      at: NOW,
      exerciseId: 'fire.pushups',
      element: 'fire',
    });
  }
  const text = JSON.stringify({
    format: BACKUP_FORMAT,
    schema: CURRENT_SCHEMA_VERSION,
    exportedAt: NOW,
    entries,
  });
  const parsed = readBackup(text);
  expect(Object.keys(parsed!.entries)).toHaveLength(20_000);
});

it('treats a file with no schema as the oldest one, so it migrates', async () => {
  // A hand-edited file, or one from before the schema was written down.
  aLifeLogged();
  const result = await restoreBackup(
    JSON.stringify({
      format: BACKUP_FORMAT,
      exportedAt: NOW,
      entries: {[KEYS.ambientToneVolumeMaster]: 55},
    }),
  );
  expect(result.ok).toBe(true);
  const schema = store.getNumber(KEYS.schemaVersion);
  expect(typeof schema).toBe('number');
  expect(schema).toBeLessThan(CURRENT_SCHEMA_VERSION);
});
