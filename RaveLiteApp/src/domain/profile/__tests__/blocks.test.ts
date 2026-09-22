import {store} from '../../../storage';
import {archetypeById} from '../archetypes';
import {
  DEFAULT_WEEKS_TO_EVENT,
  RAMP_IN_WEEKS,
  blockFactor,
  blockLine,
  blockPhase,
  testsHeldBack,
} from '../blocks';
import {
  __resetProfileCache,
  advanceBlock,
  dayDensity,
  loadMode,
  loadProfile,
  saveProfile,
} from '../repository';
import {applyArchetype} from '../setup';

const day = (d: number, h = 12) => new Date(2026, 9, d, h).getTime(); // October 2026

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('matches what the archetypes promise', () => {
  expect(archetypeById('comeback')?.blockWeeks).toBe(RAMP_IN_WEEKS);
  expect(archetypeById('festival-six')?.blockWeeks).toBe(
    DEFAULT_WEEKS_TO_EVENT,
  );
});

describe('the Comeback', () => {
  const input = {archetype: 'comeback' as const, archetypeAt: day(1)};

  it('ramps in over four weeks, then gets out of the way', () => {
    expect(blockPhase(input, day(1))).toMatchObject({
      kind: 'ramp-in',
      week: 1,
      factor: 0.5,
    });
    expect(blockPhase(input, day(8))).toMatchObject({week: 2});
    expect(blockPhase(input, day(28))).toMatchObject({week: 4, factor: 0.9});
    expect(blockPhase(input, day(29))).toBeUndefined();
  });

  it('asks for half a day in week one, and holds back max tests', () => {
    applyArchetype('comeback');
    const full = dayDensity(Date.now() + 40 * 86_400_000);
    expect(dayDensity()).toBeCloseTo(full * 0.5);
    expect(testsHeldBack(blockPhase(loadProfile(), Date.now()))).toBe(true);
    expect(blockLine(blockPhase(loadProfile(), Date.now()))).toMatch(
      /^Coming back: week 1 of 4\./,
    );
  });
});

describe('Festival Six', () => {
  const input = {archetype: 'festival-six' as const, eventDate: '2026-10-31'};

  it('builds, tapers for the last week, runs the event, then a recovery day', () => {
    expect(blockPhase(input, day(20))).toEqual({kind: 'build', daysToGo: 11});
    expect(blockPhase(input, day(24))).toEqual({
      kind: 'taper',
      daysToGo: 7,
      factor: 0.6,
    });
    expect(blockPhase(input, day(31))).toEqual({kind: 'event', day: 1});
    expect(blockPhase(input, new Date(2026, 10, 2, 12).getTime())).toEqual({
      kind: 'event',
      day: 3,
    });
    expect(blockPhase(input, new Date(2026, 10, 3, 12).getTime())).toEqual({
      kind: 'recovery',
    });
    expect(
      blockPhase(input, new Date(2026, 10, 4, 12).getTime()),
    ).toBeUndefined();
    expect(blockFactor(blockPhase(input, day(25)))).toBe(0.6);
  });

  it('sets a date six weeks out when taken', () => {
    applyArchetype('festival-six');
    expect(loadProfile().eventDate).toBeDefined();
    expect(blockPhase(loadProfile(), Date.now())).toMatchObject({
      kind: 'build',
    });
  });

  it('starts festival mode on the day, and a rest day after, once each', () => {
    saveProfile({...loadProfile(), ...input});
    advanceBlock(day(31, 9));
    expect(loadMode(day(31, 10))?.id).toBe('festival');
    // Ended early, it stays ended.
    saveProfile({...loadProfile(), mode: undefined});
    advanceBlock(day(31, 15));
    expect(loadMode(day(31, 16))).toBeUndefined();

    const after = new Date(2026, 10, 3, 9).getTime();
    advanceBlock(after);
    expect(loadMode(after + 3_600_000)?.id).toBe('rest');
  });
});
