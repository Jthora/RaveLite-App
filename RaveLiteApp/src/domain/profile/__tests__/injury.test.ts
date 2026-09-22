import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {
  __resetProfileCache,
  clearInjury,
  clearMode,
  loadFacts,
  loadInjured,
  loadMode,
  rampIsPaused,
  setInjury,
  setMode,
} from '../repository';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('keeps an injury protected through a day off', () => {
  setInjury('shoulder');
  setMode('rest');
  expect(loadMode()?.id).toBe('rest');
  expect(loadFacts().injured).toBe('shoulder');

  // Resting used to end the protection. Now ending the rest leaves it.
  clearMode();
  expect(loadInjured()).toBe('shoulder');
  expect(rampIsPaused()).toBe(true);

  clearInjury();
  expect(loadInjured()).toBeUndefined();
  expect(rampIsPaused()).toBe(false);
});

it('takes a hurt mode as an injury, not as a mode', () => {
  setMode('injured', {region: 'wrist'});
  expect(loadMode()).toBeUndefined();
  expect(loadInjured()).toBe('wrist');
});

it('still honours a hurt mode stored before injuries stacked', () => {
  store.set(
    KEYS.profile,
    JSON.stringify({
      version: 1,
      facts: {kit: ['floor'], noise: 'normal', corrections: []},
      mode: {id: 'injured', startedAt: 1, region: 'knee'},
    }),
  );
  __resetProfileCache();
  expect(loadInjured()).toBe('knee');
  expect(loadFacts().injured).toBe('knee');
  // A new mode replaces the old hurt mode, and the injury moves across.
  setMode('festival');
  expect(loadFacts().injured).toBe('knee');
  expect(loadMode()?.id).toBe('festival');
});
