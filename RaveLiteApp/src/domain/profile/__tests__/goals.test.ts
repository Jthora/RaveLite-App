/**
 * 200 push-ups a day is one person's goal. For most people it is a wall,
 * and a goal that never moves is not a goal — but it must not move for
 * anyone already training toward it either.
 */
import {ARCHETYPES, AUTHOR_PUSHUP_GOAL} from '../archetypes';
import {applyArchetype} from '../setup';
import {
  __resetProfileCache,
  loadPacks,
  loadPushupGoal,
  setPushupGoal,
} from '../repository';
import {pushupRamp} from '../../program/ramp';
import {loadProgram} from '../../program/repository';
import {store} from '../../../storage';

const NOW = new Date(2026, 8, 21, 9, 0).getTime();

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('leaves an install that was never asked on the number it had', () => {
  expect(loadPushupGoal()).toBe(AUTHOR_PUSHUP_GOAL);
  expect(AUTHOR_PUSHUP_GOAL).toBe(200);
});

it('gives each archetype a goal it could actually reach', () => {
  for (const archetype of ARCHETYPES) {
    applyArchetype(archetype.id);
    __resetProfileCache();
    expect(loadPushupGoal()).toBe(archetype.pushupGoal);
    expect(archetype.pushupGoal).toBeGreaterThanOrEqual(50);
    expect(archetype.pushupGoal).toBeLessThanOrEqual(AUTHOR_PUSHUP_GOAL);
  }
});

it('lets the number be set by hand, over any archetype', () => {
  applyArchetype('monk');
  __resetProfileCache();
  expect(loadPushupGoal()).toBe(50);

  setPushupGoal(120);
  __resetProfileCache();
  expect(loadPushupGoal()).toBe(120);

  // An archetype taken afterwards does not undo it. The archetype's
  // number is a fallback for people who never said, not an override for
  // people who did — unlike packs and the day shape, which are what an
  // archetype *is* and so get rewritten.
  applyArchetype('guardian');
  __resetProfileCache();
  expect(loadPushupGoal()).toBe(120);
});

it('the ramp aims at the goal it is given, not at 200', () => {
  const program = loadProgram(new Date(NOW));
  const far = pushupRamp(program, NOW, 200);
  const near = pushupRamp(program, NOW, 50);

  // A smaller goal is reached sooner, or already.
  if (far.kind === 'on-pace' && near.kind === 'on-pace') {
    expect(near.weeks).toBeLessThanOrEqual(far.weeks);
  } else {
    expect(['reached', 'on-pace']).toContain(near.kind);
  }
});

it('the fitness tests follow their pack', () => {
  applyArchetype('operator');
  __resetProfileCache();
  expect(loadPacks()).toContain('military-tests');

  applyArchetype('monk');
  __resetProfileCache();
  expect(loadPacks()).not.toContain('military-tests');
});
