import {store} from '../../../storage';
import {CURRENT_SCHEMA_VERSION, KEYS} from '../../../storage/keys';
import {activityForDay} from '../../activity/activity';
import {recordPractice} from '../../activity/practice';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {
  __resetProfileCache,
  loadFacts,
  setFacts,
} from '../../profile/repository';
import {AUTHOR_FACTS, DEFAULT_FACTS} from '../../profile/kit';
import {addEntry} from '../../training/repository';
import {
  backupFilename,
  backupSummary,
  buildBackup,
  readBackup,
  restoreBackup,
} from '../backup';

const NOW = new Date(2026, 8, 20, 14, 5).getTime();

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

/** A day with something in it: a practice, a run and a changed setting. */
function aLifeLogged(): void {
  recordPractice({
    exercise: EXERCISE_LIBRARY.find(e => e.id === 'water.toprock')!,
    amount: 6,
    unit: 'eights',
    seconds: 480,
  });
  addEntry({at: NOW, kindId: 'builtin.run-2mi', value: 1040});
  setFacts({...DEFAULT_FACTS, kit: ['floor', 'wall', 'mat']});
}

it('carries everything worth keeping, and nothing worth rebuilding', () => {
  aLifeLogged();
  store.set(KEYS.statsCache('anything'), 'throwaway');
  const backup = buildBackup(NOW);

  expect(backup.format).toBe(2);
  expect(backup.schema).toBe(CURRENT_SCHEMA_VERSION);
  expect(Object.keys(backup.entries)).toEqual(
    expect.arrayContaining([KEYS.trainingEntries, KEYS.profile]),
  );
  // Caches are rebuilt from the log, so they are not part of a life.
  expect(Object.keys(backup.entries)).not.toContain(
    KEYS.statsCache('anything'),
  );
});

it('puts a life back exactly as it was', async () => {
  aLifeLogged();
  const before = {
    activity: activityForDay(new Date(NOW)).length,
    kit: loadFacts().kit,
    entries: store.getString(KEYS.trainingEntries),
  };
  const text = JSON.stringify(buildBackup(NOW));

  // A new phone: nothing at all.
  store.clearAll();
  __resetProfileCache();
  expect(store.getString(KEYS.trainingEntries)).toBeUndefined();

  const result = await restoreBackup(text);
  __resetProfileCache();
  expect(result).toMatchObject({ok: true, from: NOW});
  expect(store.getString(KEYS.trainingEntries)).toBe(before.entries);
  expect(loadFacts().kit).toEqual(before.kit);
  expect(activityForDay(new Date(NOW))).toHaveLength(before.activity);
});

it('refuses what it should refuse', async () => {
  expect(await restoreBackup('not json at all')).toEqual({
    ok: false,
    why: 'That file is not a RaveLite export.',
  });
  expect(
    await restoreBackup(JSON.stringify({format: 1, entries: {}})),
  ).toMatchObject({ok: false});
  const fromTheFuture = JSON.stringify({
    format: 99,
    schema: 99,
    exportedAt: NOW,
    entries: {a: 'b'},
  });
  expect(await restoreBackup(fromTheFuture)).toMatchObject({ok: false});
  // And a refusal leaves what was already there alone.
  setFacts(AUTHOR_FACTS);
  await restoreBackup('rubbish');
  __resetProfileCache();
  expect(loadFacts().kit).toEqual(AUTHOR_FACTS.kit);
});

it('names the file by its date, and says what is in it', () => {
  expect(backupFilename(NOW)).toBe('ravelite-2026-09-20-1405.json');
  aLifeLogged();
  const summary = backupSummary(readBackup(JSON.stringify(buildBackup(NOW)))!);
  expect(summary).toMatch(/^1 day, \d+ logged things?$/);
});

it('keeps numbers and switches as numbers and switches', async () => {
  // Format 1 wrote them as text; a restore then read every volume, muted
  // element and ticked health check as unset.
  store.set(KEYS.ambientToneVolumeMaster, 40);
  store.set('some.switch', true);
  const text = JSON.stringify(buildBackup(NOW));
  const parsed = readBackup(text)!;
  expect(parsed.entries[KEYS.ambientToneVolumeMaster]).toBe(40);
  expect(parsed.entries['some.switch']).toBe(true);

  store.clearAll();
  await restoreBackup(text);
  expect(store.getNumber(KEYS.ambientToneVolumeMaster)).toBe(40);
  expect(store.getBoolean('some.switch')).toBe(true);
});

it('still restores a format 1 file, text and all', async () => {
  const old = JSON.stringify({
    format: 1,
    schema: 8,
    exportedAt: NOW,
    entries: {[KEYS.ambientToneVolumeMaster]: '40', 'some.switch': 'true'},
  });
  expect(await restoreBackup(old)).toMatchObject({ok: true});
  expect(store.getNumber(KEYS.ambientToneVolumeMaster)).toBe(40);
  expect(store.getBoolean('some.switch')).toBe(true);
  // The old schema comes with it, so the migrations run on next launch.
  expect(store.getNumber(KEYS.schemaVersion)).toBe(8);
});
