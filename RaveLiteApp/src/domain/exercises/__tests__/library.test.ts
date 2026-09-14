import {EXERCISE_LIBRARY, exercisesFor} from '../library';
import {BUILTIN_METRICS} from '../../training/builtinMetrics';
import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {expandPlanToFires} from '../../reminders/expandPlan';
import {pickDrillForSlotSeeded} from '../../reminders/scheduler';
import {ELEMENT_ORDER} from '../../../theme/elements';

/**
 * Guards for the operator's kit and goals. The library is content, but
 * content that drifts (a swim drill, a kettlebell, a plan slot with no
 * matching drill) breaks the daily chime loop as badly as a code bug.
 */

// Equipment the operator does not have. A mat, bricks, a porch edge and
// a backyard are fine; anything matched here is not.
const MISSING_KIT =
  /\b(pool|swim\w*|dumbbells?|kettlebells?|barbells?|gym|machines?|treadmill|pull-?up bar)\b/i;

const drillText = (ex: (typeof EXERCISE_LIBRARY)[number]) =>
  [ex.name, ex.purpose, ex.dose, ...(ex.cues ?? [])].join(' ');

// A Monday, so every daily window is live.
const MONDAY = new Date(2026, 8, 14).getTime();
const firesOnMonday = () =>
  expandPlanToFires(DEFAULT_PLAN, MONDAY, MONDAY + 86_399_999);

describe('exercise library integrity', () => {
  it('has unique ids prefixed with their element', () => {
    const ids = EXERCISE_LIBRARY.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const misfiled = EXERCISE_LIBRARY.filter(
      ex => !ex.id.startsWith(`${ex.element}.`),
    );
    expect(misfiled.map(e => e.id)).toEqual([]);
  });

  it('every drill is fully specified', () => {
    for (const ex of EXERCISE_LIBRARY) {
      expect(ex.name && ex.purpose && ex.dose).toBeTruthy();
      expect(ex.targets.length).toBeGreaterThan(0);
      expect(ex.venues.length).toBeGreaterThan(0);
      expect(ex.approxSeconds).toBeGreaterThan(0);
    }
  });

  it.each(ELEMENT_ORDER)('%s has at least five drills', el => {
    expect(exercisesFor(el).length).toBeGreaterThanOrEqual(5);
  });
});

describe("operator's kit", () => {
  it('no drill needs a pool, weights or gym equipment', () => {
    const offenders = EXERCISE_LIBRARY.filter(ex =>
      MISSING_KIT.test(drillText(ex)),
    );
    expect(offenders.map(e => e.id)).toEqual([]);
  });

  it('no Train metric needs a pool, weights or gym equipment', () => {
    const offenders = BUILTIN_METRICS.filter(m =>
      MISSING_KIT.test(`${m.label} ${m.notes ?? ''}`),
    );
    expect(offenders.map(m => m.id)).toEqual([]);
  });

  it('every porch drill says to test the hang point', () => {
    const porch = EXERCISE_LIBRARY.filter(ex => ex.venues.includes('porch'));
    expect(porch.length).toBeGreaterThan(0);
    const unsafe = porch.filter(
      ex => !(ex.cues ?? []).some(c => /test the hang point/i.test(c)),
    );
    expect(unsafe.map(e => e.id)).toEqual([]);
  });
});

describe("operator's staple movements", () => {
  it.each([
    ['push-ups', /push-?ups?/i],
    ['sit-ups', /sit-?ups?/i],
    ['leg-ups', /leg (raise|up)/i],
    ['crunches', /crunch/i],
    ['side-ups', /side-?ups?/i],
    ['squats', /squat/i],
    ['pull-ups', /pull-?ups?/i],
    ['running', /\brun\b/i],
    ['breathing', /breath/i],
  ])('%s are in the library', (_label, pattern) => {
    expect(EXERCISE_LIBRARY.some(ex => (pattern as RegExp).test(ex.name))).toBe(
      true,
    );
  });

  it('has plenty of stretches', () => {
    const stretches = EXERCISE_LIBRARY.filter(ex =>
      ex.targets.includes('Mobility'),
    );
    expect(stretches.length).toBeGreaterThanOrEqual(15);
  });
});

describe('default plan', () => {
  it('every slot resolves to at least one drill', () => {
    const empty = DEFAULT_PLAN.windows.flatMap(w =>
      w.slots.flatMap((slot, i) =>
        pickDrillForSlotSeeded(slot, 'probe') ? [] : [`${w.id}[${i}]`],
      ),
    );
    expect(empty).toEqual([]);
  });

  it('water calls add up to about 2 L a day', () => {
    const calls = firesOnMonday().filter(f => f.windowId === 'hydration');
    expect(calls).toHaveLength(8);
  });

  it('water calls and fuel checks never share a tick with another pulse', () => {
    const fires = firesOnMonday();
    const solo = ['hydration', 'fuel-lunch', 'fuel-dinner'];
    const clashes = fires
      .filter(f => solo.includes(f.windowId))
      .filter(f => fires.filter(o => o.ts === f.ts).length > 1)
      .map(f => `${f.windowId}@${new Date(f.ts).toTimeString().slice(0, 5)}`);
    expect(clashes).toEqual([]);
  });
});
