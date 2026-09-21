/**
 * "It stopped chiming" is unanswerable. "It stopped chiming, schema 8,
 * no place set, last forecast failed four days ago" answers itself.
 * These check the report is honest on a fresh install and on a broken
 * one, since those are the two states somebody reports from.
 */
import {diagnostics, diagnosticsText} from '../report';
import {logError} from '../errorLog';
import {setPlace} from '../../conditions/weather';
import {applyArchetype} from '../../profile/setup';
import {__resetProfileCache} from '../../profile/repository';
import {store} from '../../../storage';

const NOW = new Date(2026, 8, 21, 12, 0).getTime();
const find = (label: string, now = NOW) =>
  diagnostics(now).find(d => d.label === label)!;

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  // A place is fetched on save; this test is not about the network.
  jest
    .spyOn(globalThis, 'fetch' as never)
    .mockImplementation((() => Promise.reject(new Error('offline'))) as never);
});

afterEach(() => jest.restoreAllMocks());

it('says something about every question worth asking', () => {
  const labels = diagnostics(NOW).map(d => d.label);
  for (const wanted of [
    'Problems recorded',
    'Storage',
    'Schema',
    'Program',
    'Place',
    'Last forecast',
  ]) {
    expect(labels).toContain(wanted);
  }
  // Every line has something in it, on a completely empty install.
  for (const d of diagnostics(NOW)) {
    expect(d.value.length).toBeGreaterThan(0);
  }
});

it('flags what is worth looking at, and only that', () => {
  // A fresh install with no place set is worth mentioning.
  expect(find('Place').concern).toBe(true);
  expect(find('Problems recorded').concern).toBeFalsy();

  logError('weather', new Error('nothing came back'), NOW - 3600_000);
  expect(find('Problems recorded').concern).toBe(true);
  expect(find('Problems recorded').value).toContain('1 in the last week');
});

it('does not cry about problems from months ago', () => {
  logError('old', new Error('long since fixed'), NOW - 40 * 86_400_000);
  expect(find('Problems recorded').concern).toBe(false);
  expect(find('Problems recorded').value).toContain('1 kept');
});

it('describes the program somebody is actually on', () => {
  applyArchetype('monk');
  __resetProfileCache();
  const program = find('Program').value;
  expect(program).toContain('monk');
  expect(program).toContain('office');
  expect(program).toContain('1 packs');
});

it('notices a place once there is one', () => {
  setPlace({name: 'Reykjavík', lat: 64.1, lon: -21.9, source: 'typed'}, NOW);
  expect(find('Place').value).toBe('Reykjavík');
  expect(find('Place').concern).toBeFalsy();
});

it('can be pasted into an issue', () => {
  const text = diagnosticsText(NOW);
  expect(text.split('\n').length).toBe(diagnostics(NOW).length);
  expect(text).toContain('Schema:');
});
