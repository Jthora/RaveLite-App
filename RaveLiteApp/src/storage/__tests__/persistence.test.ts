import AsyncStorage from '@react-native-async-storage/async-storage';
import {beforeEach, expect, it} from '@jest/globals';

import {store, replaceStoredData} from '..';
import {memoryStore} from '../memoryStore';
import {
  __resetPersistenceHealth,
  flushPersistence,
  hydratePersistence,
  persistenceHealth,
} from '../persistence';
import {readErrors} from '../../domain/diagnostics/errorLog';

const PREFIX = 'ravelite.v1.';
type Mocked = {mockRejectedValueOnce: (e: unknown) => Mocked};
/** Make the next `n` calls fail, then behave again. */
const failNext = (fn: unknown, n: number, message: string) => {
  for (let i = 0; i < n; i++) {
    (fn as Mocked).mockRejectedValueOnce(new Error(message));
  }
};

const disk = () =>
  (
    AsyncStorage as unknown as {
      __INTERNAL_MOCK_STORAGE__: Record<string, string>;
    }
  ).__INTERNAL_MOCK_STORAGE__;

beforeEach(async () => {
  memoryStore.clearAll();
  for (const k of Object.keys(disk())) {
    delete disk()[k];
  }
  __resetPersistenceHealth();
});

it('lands a write that follows a clear, even for a key the clear removed', async () => {
  // The clear used to fetch the key list and remove it a moment later —
  // after the next writes had landed, so a key written both before and
  // after the clear (the profile, in a restore) was deleted anyway.
  store.set('profile', 'old');
  await flushPersistence();
  store.clearAll();
  store.set('profile', 'new');
  await flushPersistence();
  expect(disk()[PREFIX + 'profile']).toBe(JSON.stringify('new'));
});

it('counts a write the phone refused, and logs it once', async () => {
  failNext(AsyncStorage.setItem, 2, 'database or disk is full');
  store.set('a', 1);
  store.set('b', 2);
  await flushPersistence();
  expect(persistenceHealth().failures).toBeGreaterThanOrEqual(2);
  expect(persistenceHealth().lastError).toBe('database or disk is full');
  // Once — and the log's own failed write did not recurse into it.
  expect(readErrors().filter(e => e.where.startsWith('storage.'))).toHaveLength(
    1,
  );
});

it('stops writing when the saved data could not be read', async () => {
  failNext(AsyncStorage.getAllKeys, 3, 'cannot open database');
  await hydratePersistence();
  expect(persistenceHealth().readFailed).toBe(true);
  // An empty-looking app must not save over what is really there.
  store.set('profile', 'a stranger');
  await flushPersistence();
  expect(disk()[PREFIX + 'profile']).toBeUndefined();
});

it('reads a number or a switch that was saved as text', () => {
  // Format 1 exports wrote them as text, and a restore put the text back.
  store.set('volume', '75');
  store.set('respectDnd', 'true');
  store.set('day', '2026-09-21');
  expect(store.getNumber('volume')).toBe(75);
  expect(store.getBoolean('respectDnd')).toBe(true);
  expect(store.getNumber('day')).toBeUndefined();
  expect(store.getString('volume')).toBe('75');
});

it('replaces everything on disk and proves it', async () => {
  store.set('old', 'gone soon');
  await flushPersistence();
  const result = await replaceStoredData([
    ['profile', '{"x":1}'],
    ['volume', 75],
    ['respectDnd', true],
  ]);
  expect(result).toEqual({ok: true, written: 3});
  expect(disk()).toEqual({
    [PREFIX + 'profile']: JSON.stringify('{"x":1}'),
    [PREFIX + 'volume']: '75',
    [PREFIX + 'respectDnd']: 'true',
  });
  expect(store.getString('old')).toBeUndefined();
  expect(store.getNumber('volume')).toBe(75);
});

it('puts the old data back when a restore cannot finish', async () => {
  store.set('profile', 'mine');
  store.set('journal.2026-09-20.a', '{}');
  await flushPersistence();
  failNext(AsyncStorage.multiSet, 1, 'disk I/O error');
  const result = await replaceStoredData([['profile', 'theirs']]);
  expect(result).toMatchObject({ok: false, rolledBack: true});
  // Memory never changed, and the disk holds what it held.
  expect(store.getString('profile')).toBe('mine');
  expect(disk()[PREFIX + 'profile']).toBe(JSON.stringify('mine'));
  expect(disk()[PREFIX + 'journal.2026-09-20.a']).toBe(JSON.stringify('{}'));
});

it('keeps writes made during a restore out of the disk until it is done', async () => {
  store.set('profile', 'mine');
  await flushPersistence();
  const pending = replaceStoredData([['profile', 'theirs']]);
  // A chime fires mid-restore.
  store.set('journal.2026-09-21.x', '{}');
  expect(await pending).toMatchObject({ok: true});
  await flushPersistence();
  expect(Object.keys(disk())).toEqual([PREFIX + 'profile']);
});
