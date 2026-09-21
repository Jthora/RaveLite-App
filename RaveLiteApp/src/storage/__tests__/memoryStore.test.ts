/**
 * `keysWithPrefix` used to walk every key in the store. With four
 * thousand journal entries and a thirty-day range asking for thirty
 * prefixes, that was thirty full scans per query — on the JS thread,
 * during render, which is what made taps feel slow.
 *
 * These pin both halves: that it still answers correctly, and that it no
 * longer costs the whole store to ask.
 */
import {memoryStore as store} from '../memoryStore';

beforeEach(() => store.clearAll());

it('finds exactly the keys under a prefix', () => {
  store.set('journal.2026-09-20.a', '1');
  store.set('journal.2026-09-21.a', '2');
  store.set('journal.2026-09-21.b', '3');
  store.set('journal.2026-09-22.a', '4');
  store.set('training.entries', '5');

  expect(store.keysWithPrefix('journal.2026-09-21.')).toEqual([
    'journal.2026-09-21.a',
    'journal.2026-09-21.b',
  ]);
  expect(store.keysWithPrefix('journal.')).toHaveLength(4);
  expect(store.keysWithPrefix('')).toHaveLength(5);
  expect(store.keysWithPrefix('nothing.')).toEqual([]);
});

it('comes back sorted, so callers need not sort again', () => {
  for (const k of ['j.c', 'j.a', 'j.b']) {
    store.set(k, '1');
  }
  expect(store.keysWithPrefix('j.')).toEqual(['j.a', 'j.b', 'j.c']);
});

it('keeps up with writes, deletes and wipes', () => {
  store.set('a.1', '1');
  expect(store.keysWithPrefix('a.')).toEqual(['a.1']);

  store.set('a.2', '2');
  expect(store.keysWithPrefix('a.')).toEqual(['a.1', 'a.2']);

  // Overwriting a value must not disturb the ordering or the answer.
  store.set('a.1', 'changed');
  expect(store.keysWithPrefix('a.')).toEqual(['a.1', 'a.2']);

  store.delete('a.1');
  expect(store.keysWithPrefix('a.')).toEqual(['a.2']);

  store.clearAll();
  expect(store.keysWithPrefix('a.')).toEqual([]);
});

it('handles prefixes that are whole keys, and near-misses', () => {
  store.set('day', '1');
  store.set('day.1', '2');
  store.set('daylight', '3');
  // "day" is a prefix of all three, and that is the correct answer.
  expect(store.keysWithPrefix('day')).toHaveLength(3);
  expect(store.keysWithPrefix('day.')).toEqual(['day.1']);
  expect(store.keysWithPrefix('dayl')).toEqual(['daylight']);
});

it('no longer costs the whole store to ask for one day', () => {
  // Four thousand entries across two hundred days, which is roughly what
  // a year of real use looks like.
  for (let day = 0; day < 200; day++) {
    for (let n = 0; n < 20; n++) {
      store.set(`journal.2026-${String(day).padStart(3, '0')}.${n}`, '{}');
    }
  }
  expect(store.keysWithPrefix('').length).toBe(4000);

  const oneDay = () => store.keysWithPrefix('journal.2026-100.');
  const everything = () => store.keysWithPrefix('');
  expect(oneDay()).toHaveLength(20);

  const timed = (fn: () => unknown, runs: number) => {
    fn();
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < runs; i++) {
      fn();
    }
    return Number(process.hrtime.bigint() - t0) / runs;
  };

  // Measured against a full scan of the same store rather than against
  // the clock. An absolute threshold fails on a busy machine, and a
  // guard that fails for no reason is a guard somebody deletes — while
  // the ratio holds however loaded the box is, because both halves slow
  // down together.
  const day = timed(oneDay, 200);
  const all = timed(everything, 200);

  expect({fasterThanAFullScan: day * 4 < all}).toEqual({
    fasterThanAFullScan: true,
  });
});
