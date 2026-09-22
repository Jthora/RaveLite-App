/**
 * Pass 2: every repository writes to storage and reads back. Each one was
 * checked by example; none was checked by property. Two of this wave's
 * bugs were one writer and one reader disagreeing about a shape.
 *
 * The values are generated from a fixed seed, so a failure repeats.
 */
import {saveCircuit, loadCircuit} from '../../domain/circuit/customRepository';
import type {CustomCircuit} from '../../domain/circuit/customTypes';
import {append, entriesForDay} from '../../domain/journal/journal';
import {
  __resetProfileCache,
  authorProfile,
  loadProfile,
  saveProfile,
} from '../../domain/profile/repository';
import {ALL_PACKS} from '../../domain/profile/packs';
import {loadProgram, saveProgram} from '../../domain/program/repository';
import {TRACKS} from '../../domain/program/tracks';
import {DAY_SHAPES} from '../../domain/program/density';
import {loadPlan, savePlan} from '../../domain/reminders/repository';
import {DEFAULT_PLAN} from '../../domain/reminders/defaultPlan';
import {
  getElementPrefs,
  setElementPrefs,
} from '../../domain/settings/elementPrefs';
import {
  STANDARD_EVENTS,
  hasOwnTarget,
  setTarget,
  targetFor,
} from '../../domain/standards/standards';
import {addEntry, loadEntries} from '../../domain/training/repository';
import {ELEMENT_ORDER} from '../../theme/elements';
import {store} from '../index';

/** Deterministic noise: a failure here repeats on the next run. */
function noise(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const ROUNDS = 25;

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('reads back every profile it writes', () => {
  const r = noise(1);
  for (let i = 0; i < ROUNDS; i++) {
    const profile = {
      ...authorProfile(),
      shape: DAY_SHAPES[Math.floor(r() * DAY_SHAPES.length)].id,
      packs: ALL_PACKS.filter(() => r() > 0.5),
      customRounds: r() > 0.5 ? Math.floor(r() * 12) : undefined,
      setUpAt: r() > 0.5 ? Math.floor(r() * 1e12) : undefined,
      eventDate: r() > 0.5 ? '2026-12-31' : undefined,
    };
    saveProfile(profile);
    __resetProfileCache();
    expect(loadProfile()).toEqual(JSON.parse(JSON.stringify(profile)));
  }
});

it('reads back every program it writes', () => {
  const r = noise(2);
  for (let i = 0; i < ROUNDS; i++) {
    const program = {
      version: 1 as const,
      startDay: '2026-09-01',
      tracks: Object.fromEntries(
        TRACKS.map(t => [
          t.id,
          {
            enabled: r() > 0.2,
            rung: Math.floor(r() * 6),
            testMax: Math.floor(r() * 60),
            sets: Math.floor(r() * 12),
            peakSets: r() > 0.5 ? Math.floor(r() * 12) : undefined,
            steppedOn: r() > 0.5 ? '2026-09-10' : undefined,
          },
        ]),
      ),
    };
    saveProgram(program as never);
    expect(loadProgram(new Date(2026, 8, 14))).toEqual(
      JSON.parse(JSON.stringify(program)),
    );
  }
});

it('reads back every plan it writes, windows in their own order', () => {
  const r = noise(3);
  for (let i = 0; i < ROUNDS; i++) {
    const windows = DEFAULT_PLAN.windows
      .filter(() => r() > 0.3)
      .map(w => ({...w, startTime: r() > 0.5 ? '07:15' : w.startTime}));
    const plan = {...DEFAULT_PLAN, windows};
    savePlan(plan);
    expect(loadPlan()).toEqual(plan);
  }
});

it('reads back every Train log entry it writes, numbers as numbers', () => {
  const r = noise(4);
  for (let i = 0; i < ROUNDS; i++) {
    const value = Math.round(r() * 100000) / 100;
    const entry = addEntry({
      at: 1_700_000_000_000 + Math.floor(r() * 1e9),
      kindId: 'builtin.pullups-amrap',
      value,
      notes: r() > 0.5 ? 'felt heavy — 2nd set\nsecond line' : undefined,
    });
    const read = loadEntries().find(e => e.id === entry.id)!;
    expect(read).toEqual(entry);
    expect(typeof read.value).toBe('number');
  }
});

it('reads back every circuit and every journal entry it writes', () => {
  const r = noise(5);
  for (let i = 0; i < ROUNDS; i++) {
    const circuit: CustomCircuit = {
      id: `c${i}`,
      name: `Circuit ${i} — “quoted”`,
      legs: Array.from({length: 1 + Math.floor(r() * 5)}, () => ({
        element: ELEMENT_ORDER[Math.floor(r() * ELEMENT_ORDER.length)],
        exerciseId: 'fire.pushups',
        durationSec: 15 + Math.floor(r() * 105),
      })),
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    };
    const saved = saveCircuit(circuit);
    expect(loadCircuit(circuit.id)).toEqual(saved);

    const at = new Date(2026, 8, 14, 9, i % 60).getTime();
    const written = append({
      kind: 'completion',
      at,
      exerciseId: 'fire.pushups',
      element: 'fire',
      source: 'manual',
      amount: Math.floor(r() * 50),
    });
    const back = entriesForDay(new Date(at)).find(e => e.id === written.id);
    expect(back).toEqual(written);
  }
});

it('reads back every setting it writes', () => {
  const r = noise(6);
  for (let i = 0; i < ROUNDS; i++) {
    const element = ELEMENT_ORDER[Math.floor(r() * ELEMENT_ORDER.length)];
    const prefs = {
      focusTargets: r() > 0.5 ? (['Strength'] as never) : ([] as never),
      focusLocked: r() > 0.5,
    };
    setElementPrefs(element, prefs);
    expect(getElementPrefs(element)).toEqual(prefs);

    const event = STANDARD_EVENTS[Math.floor(r() * STANDARD_EVENTS.length)];
    const target = Math.round(r() * 1000) / 10;
    setTarget(event.id, target);
    expect(targetFor(event)).toBe(target);
    expect(hasOwnTarget(event)).toBe(true);
    setTarget(event.id, undefined);
    expect(hasOwnTarget(event)).toBe(false);
  }
});
