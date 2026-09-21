/**
 * A logger that can fail while recording a failure is worse than none,
 * and one that grows without bound is a bug that fills a phone. Both of
 * those are the tests that matter here.
 */
import {
  MAX_ENTRIES,
  clearErrors,
  describe as describeError,
  errorSummary,
  logError,
  readErrors,
} from '../errorLog';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';

const NOW = new Date(2026, 8, 21, 12, 0).getTime();

beforeEach(() => {
  store.clearAll();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('writes down what went wrong, and where', () => {
  logError('weather', new Error('nothing came back'), NOW);
  const [entry] = readErrors();
  expect(entry.where).toBe('weather');
  expect(entry.what).toContain('nothing came back');
  expect(entry.at).toBe(NOW);
});

it('never grows past its cap, however bad it gets', () => {
  for (let i = 0; i < MAX_ENTRIES * 3; i += 1) {
    logError('loop', new Error(`crash ${i}`), NOW + i);
  }
  const kept = readErrors();
  expect(kept).toHaveLength(MAX_ENTRIES);
  // And it keeps the newest, which are the ones that explain the state
  // somebody is actually in.
  expect(kept[kept.length - 1].what).toContain(`crash ${MAX_ENTRIES * 3 - 1}`);
});

it('describes anything that can be thrown, without throwing', () => {
  expect(describeError(new TypeError('bad')).what).toBe('TypeError: bad');
  expect(describeError('just a string').what).toBe('just a string');
  expect(describeError({code: 42}).what).toContain('42');
  expect(describeError(undefined).what.length).toBeGreaterThan(0);
  // Something that cannot be stringified at all.
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  expect(describeError(circular).what.length).toBeGreaterThan(0);
});

it('survives a store that is broken underneath it', () => {
  const broken = jest.spyOn(store, 'set').mockImplementation(() => {
    throw new Error('storage is full');
  });
  // The whole point: recording a failure must not become one.
  expect(() => logError('anywhere', new Error('first'), NOW)).not.toThrow();
  broken.mockRestore();

  jest.spyOn(store, 'getString').mockImplementation(() => 'not json at all');
  expect(readErrors()).toEqual([]);
});

it('keeps stacks short enough to read and to carry', () => {
  const deep = new Error('deep');
  deep.stack = 'x'.repeat(5000);
  logError('somewhere', deep, NOW);
  const [entry] = readErrors();
  expect(entry.stack!.length).toBeLessThan(700);
});

it('says how bad it has been, in a sentence', () => {
  expect(errorSummary([], NOW)).toContain('Nothing has gone wrong');
  logError('a', new Error('one'), NOW);
  expect(errorSummary(readErrors(), NOW)).toContain('1 in the last day');
  // Old ones are counted but not alarming.
  store.set(
    KEYS.errorLog,
    JSON.stringify([{at: NOW - 10 * 86_400_000, where: 'a', what: 'old'}]),
  );
  expect(errorSummary(readErrors(), NOW)).toContain('none in the last day');
});

it('can be thrown away', () => {
  logError('a', new Error('one'), NOW);
  clearErrors();
  expect(readErrors()).toEqual([]);
});
