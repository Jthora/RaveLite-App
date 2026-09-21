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

  expect(backup.format).toBe(1);
  expect(backup.schema).toBe(CURRENT_SCHEMA_VERSION);
  expect(Object.keys(backup.entries)).toEqual(
    expect.arrayContaining([KEYS.trainingEntries, KEYS.profile]),
  );
  // Caches are rebuilt from the log, so they are not part of a life.
  expect(Object.keys(backup.entries)).not.toContain(
    KEYS.statsCache('anything'),
  );
});

it('puts a life back exactly as it was', () => {
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

  const result = restoreBackup(text);
  __resetProfileCache();
  expect(result).toMatchObject({ok: true, from: NOW});
  expect(store.getString(KEYS.trainingEntries)).toBe(before.entries);
  expect(loadFacts().kit).toEqual(before.kit);
  expect(activityForDay(new Date(NOW))).toHaveLength(before.activity);
});

it('refuses what it should refuse', () => {
  expect(restoreBackup('not json at all')).toEqual({
    ok: false,
    why: 'That file is not a RaveLite export.',
  });
  expect(restoreBackup(JSON.stringify({format: 1, entries: {}}))).toMatchObject(
    {ok: false},
  );
  const fromTheFuture = JSON.stringify({
    format: 99,
    schema: 99,
    exportedAt: NOW,
    entries: {a: 'b'},
  });
  expect(restoreBackup(fromTheFuture)).toMatchObject({ok: false});
  // And a refusal leaves what was already there alone.
  setFacts(AUTHOR_FACTS);
  restoreBackup('rubbish');
  __resetProfileCache();
  expect(loadFacts().kit).toEqual(AUTHOR_FACTS.kit);
});

it('names the file by its date, and says what is in it', () => {
  expect(backupFilename(NOW)).toBe('ravelite-2026-09-20-1405.json');
  aLifeLogged();
  const summary = backupSummary(readBackup(JSON.stringify(buildBackup(NOW)))!);
  expect(summary).toMatch(/^1 day, \d+ logged things?$/);
});
