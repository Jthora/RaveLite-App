/**
 * Goals — the military tests the operator trains toward (the Space Force,
 * Air Force and Marine PFT tests, the Marine combat fitness test, and
 * MARSOC's screening marks), then a few goals for each other element on
 * RaveLite's own marks, since no official chart covers them.
 *
 * The goal is a B+ on every test. The services score points, not letters,
 * so grades run evenly along each test's chart for ages 35–40: the passing
 * minimum is a D−, the max is an A+, with A, A−, B+ … D between. An event
 * several tests use (the plank is on all three) targets the hardest B+ of
 * them, so one result clears every test. Events without a published
 * minimum (the combat fitness test) target their top score. Any target can
 * be changed. Results come from Train log tests; a longer run counts at the
 * same pace, so the 3.2-mile loop times the 3-mile event.
 *
 * The figures come from 2025–2026 calculator and news sites and a Space
 * Force chart dated 4 Feb 2026: the official charts would not load when
 * they were gathered. Treat them as close, not final.
 *
 * Element goals grade the same way on marks the operator approved on
 * 14 Sep 2026: D− a starting point, A+ strong, B+ the goal. Last week's sets
 * done is measured from Daily Sets rather than logged.
 */
import {METERS_PER_MILE} from '../../lib/constants';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import type {ElementId} from '../../theme/elements';
import type {Grade} from '../training/grading';
import type {MetricKind, TrainingLogEntry} from '../training/types';

export type Sex = 'male' | 'female';

export type TestId = 'usmc' | 'usaf' | 'ussf';

export const TEST_NAMES: Readonly<Record<TestId, string>> = {
  usmc: 'USMC',
  usaf: 'USAF',
  ussf: 'USSF',
};

/** Where a goal sits on the Goals page: the fitness tests, or an element. */
export type GoalGroup = 'tests' | Exclude<ElementId, 'fire'>;

/** The tests first, then the elements in the balance strip's order. */
export const GOAL_GROUPS: readonly GoalGroup[] = [
  'tests',
  'air',
  'heart',
  'earth',
  'water',
];

/** One chart for an event: the passing minimum (D−) and the max (A+), by sex. */
export interface EventScale {
  /** The test whose chart this is; unset for RaveLite's own marks. */
  test?: TestId;
  min: Record<Sex, number>;
  max: Record<Sex, number>;
}

export interface StandardEvent {
  id: string;
  name: string;
  /** Under the name: which tests use it, or which attributes it trains. */
  subtitle: string;
  group: GoalGroup;
  unit: 'reps' | 'seconds' | 'percent' | 'ratio';
  /** A higher count or a lower time scores better. */
  better: 'higher' | 'lower';
  /** The best top score among its tests, ages 35–40. */
  top: Record<Sex, number>;
  /** Charts that grade it; none for events without a published minimum. */
  scales?: readonly EventScale[];
  /** The Train log kind that holds results; unset for a goal the app measures. */
  kindId?: string;
  /** For runs: longer runs count at the same pace. */
  distanceMeters?: number;
  /** Results are the logged value divided by the operator's height. */
  perHeight?: boolean;
  /** Under a default target, in place of "B+ goal" or the top scores. */
  targetCaption?: string;
  note?: string;
}

export const STANDARDS_NOTE =
  'Targets are a B+ on every test that uses the result. Grades run evenly from the pass mark (D−) to the top score (A+). The numbers are unofficial. Tap a target to change it.';

export const MARKS_NOTE =
  "These grades are RaveLite's own, not official. D− is the pass mark, B+ is your goal, A+ is the top. Tap a target to change it.";

const both = (value: number): Record<Sex, number> => ({
  male: value,
  female: value,
});

/** RaveLite's own marks, the same for both tables. */
const ownMarks = (min: number, max: number): EventScale[] => [
  {min: both(min), max: both(max)},
];

export const STANDARD_EVENTS: readonly StandardEvent[] = [
  {
    id: 'pushups-1min',
    name: 'Push-ups, 1 min',
    group: 'tests',
    subtitle: 'USAF · USSF',
    unit: 'reps',
    better: 'higher',
    top: {male: 56, female: 42},
    scales: [
      {test: 'usaf', min: {male: 23, female: 11}, max: {male: 56, female: 42}},
      {test: 'ussf', min: {male: 21, female: 10}, max: {male: 51, female: 42}},
    ],
    kindId: 'builtin.pushups-1min',
  },
  {
    id: 'pushups-2min',
    name: 'Push-ups, 2 min',
    group: 'tests',
    subtitle: 'USMC',
    unit: 'reps',
    better: 'higher',
    top: {male: 76, female: 43},
    scales: [
      {test: 'usmc', min: {male: 34, female: 14}, max: {male: 76, female: 43}},
    ],
    kindId: 'builtin.pushups-2min',
    note: 'Scores at most 70 of 100 points; pull-ups can score 100.',
  },
  {
    id: 'pullups',
    name: 'Pull-ups',
    group: 'tests',
    subtitle: 'USMC · MARSOC',
    unit: 'reps',
    better: 'higher',
    top: {male: 21, female: 10},
    scales: [
      {test: 'usmc', min: {male: 5, female: 3}, max: {male: 21, female: 10}},
    ],
    kindId: 'builtin.pullups-amrap',
    note: 'MARSOC competitive: 17.',
  },
  {
    id: 'plank',
    name: 'Plank',
    group: 'tests',
    subtitle: 'USMC · USAF · USSF',
    unit: 'seconds',
    better: 'higher',
    top: both(225),
    scales: [
      {test: 'usmc', min: both(70), max: both(225)},
      {
        test: 'usaf',
        min: {male: 80, female: 75},
        max: {male: 205, female: 200},
      },
      {
        test: 'ussf',
        min: {male: 50, female: 45},
        max: {male: 200, female: 195},
      },
    ],
    kindId: 'builtin.plank',
  },
  {
    id: 'situps-1min',
    name: 'Sit-ups, 1 min',
    group: 'tests',
    subtitle: 'USAF · USSF',
    unit: 'reps',
    better: 'higher',
    top: {male: 52, female: 43},
    scales: [
      {test: 'usaf', min: {male: 27, female: 18}, max: {male: 52, female: 43}},
      {test: 'ussf', min: {male: 34, female: 24}, max: {male: 52, female: 43}},
    ],
    kindId: 'builtin.situps-1min',
  },
  {
    id: 'run-2mi',
    name: '2-mile run',
    group: 'tests',
    subtitle: 'USAF · USSF',
    unit: 'seconds',
    better: 'lower',
    top: {male: 836, female: 972},
    scales: [
      {
        test: 'usaf',
        min: {male: 1276, female: 1590},
        max: {male: 836, female: 972},
      },
      {
        test: 'ussf',
        min: {male: 1276, female: 1590},
        max: {male: 836, female: 972},
      },
    ],
    kindId: 'builtin.run-2mi',
    distanceMeters: 2 * METERS_PER_MILE,
    note: 'Or the 20 m shuttle run: 82 (M) / 63 (F).',
  },
  {
    id: 'run-3mi',
    name: '3-mile run',
    group: 'tests',
    subtitle: 'USMC · MARSOC',
    unit: 'seconds',
    better: 'lower',
    top: {male: 1080, female: 1260},
    scales: [
      {
        test: 'usmc',
        min: {male: 1720, female: 1910},
        max: {male: 1080, female: 1260},
      },
    ],
    kindId: 'builtin.run-3mi',
    distanceMeters: 3 * METERS_PER_MILE,
    note: 'MARSOC competitive: 20:50.',
  },
  {
    id: 'cft-mtc',
    name: '880-yard sprint',
    group: 'tests',
    subtitle: 'USMC CFT',
    unit: 'seconds',
    better: 'lower',
    top: {male: 165, female: 198},
    kindId: 'builtin.cft-mtc',
  },
  {
    id: 'cft-acl',
    name: 'Ammo-can lifts, 2 min',
    group: 'tests',
    subtitle: 'USMC CFT',
    unit: 'reps',
    better: 'higher',
    top: {male: 110, female: 70},
    kindId: 'builtin.cft-acl',
    note: 'A 30 lb can: about 6 bricks in a bag.',
  },
  {
    id: 'cft-manuf',
    name: 'Maneuver under fire',
    group: 'tests',
    subtitle: 'USMC CFT',
    unit: 'seconds',
    better: 'lower',
    top: both(173),
    kindId: 'builtin.cft-manuf',
  },
  {
    id: 'waist-height',
    name: 'Waist-to-height',
    group: 'tests',
    subtitle: 'USAF · USSF',
    unit: 'ratio',
    better: 'lower',
    top: both(0.49),
    kindId: 'builtin.waist',
    perHeight: true,
    targetCaption: 'USAF full points',
    note: 'Waist ÷ height. The Air Force gives full points at 0.49 or under; the Space Force measures it without scoring.',
  },

  // ── Air ──
  {
    id: 'breath-hold',
    name: 'Breath hold',
    group: 'air',
    subtitle: 'Breath',
    unit: 'seconds',
    better: 'higher',
    top: both(150),
    scales: ownMarks(30, 150),
    kindId: 'builtin.breath-hold',
    note: 'Seated and relaxed. Never in water or while driving.',
  },
  {
    id: 'exhale-hold',
    name: 'Exhale hold',
    group: 'air',
    subtitle: 'Breath',
    unit: 'seconds',
    better: 'higher',
    top: both(60),
    scales: ownMarks(15, 60),
    kindId: 'builtin.exhale-hold',
  },
  {
    id: 'rope-skips',
    name: 'Rope skips, 2 min',
    group: 'air',
    subtitle: 'Agility',
    unit: 'reps',
    better: 'higher',
    top: both(300),
    scales: ownMarks(120, 300),
    kindId: 'builtin.skipping-2min',
    note: 'No rope needed: one hop per turn.',
  },

  // ── Core ──
  {
    id: 'still-sit',
    name: 'Still sit',
    group: 'heart',
    subtitle: 'Focus',
    unit: 'seconds',
    better: 'higher',
    top: both(180),
    scales: ownMarks(30, 180),
    kindId: 'builtin.still-sit',
  },
  {
    id: 'sets-done',
    name: "Last week's sets done",
    group: 'heart',
    subtitle: 'Resolve',
    unit: 'percent',
    better: 'higher',
    top: both(100),
    scales: ownMarks(50, 100),
    note: 'Measured from Daily Sets every day.',
  },

  // ── Earth ──
  {
    id: 'squats',
    name: 'Squats, one set',
    group: 'earth',
    subtitle: 'Strength',
    unit: 'reps',
    better: 'higher',
    top: both(80),
    scales: ownMarks(20, 80),
    kindId: 'builtin.squats-amrap',
  },
  {
    id: 'wall-sit',
    name: 'Wall sit',
    group: 'earth',
    subtitle: 'Toughness',
    unit: 'seconds',
    better: 'higher',
    top: both(180),
    scales: ownMarks(45, 180),
    kindId: 'builtin.wall-sit',
  },
  {
    id: 'dead-hang',
    name: 'Dead hang',
    group: 'earth',
    subtitle: 'Toughness · grip',
    unit: 'seconds',
    better: 'higher',
    top: both(120),
    scales: ownMarks(30, 120),
    kindId: 'builtin.deadhang',
  },
  {
    id: 'side-plank',
    name: 'Side plank, weaker side',
    group: 'earth',
    subtitle: 'Toughness',
    unit: 'seconds',
    better: 'higher',
    top: both(120),
    scales: ownMarks(30, 120),
    kindId: 'builtin.side-plank',
  },
  {
    id: 'balance',
    name: 'One-leg balance, eyes closed',
    group: 'earth',
    subtitle: 'Balance',
    unit: 'seconds',
    better: 'higher',
    top: both(60),
    scales: ownMarks(10, 60),
    kindId: 'builtin.balance-hold',
  },

  // ── Water ──
  {
    id: 'deep-squat-hold',
    name: 'Deep squat hold',
    group: 'water',
    subtitle: 'Mobility',
    unit: 'seconds',
    better: 'higher',
    top: both(300),
    scales: ownMarks(30, 300),
    kindId: 'builtin.deep-squat-hold',
  },
  {
    id: 'staff-flow',
    name: 'Staff flow, no drops',
    group: 'water',
    subtitle: 'Dexterity',
    unit: 'seconds',
    better: 'higher',
    top: both(1200),
    scales: ownMarks(60, 1200),
    kindId: 'builtin.flow-no-drop',
  },
];

// ── Grades ───────────────────────────────────────────────────────────

/** Best first: A+ at a chart's max, D− at its passing minimum. */
export const GRADE_STEPS: readonly Grade[] = [
  'A+',
  'A',
  'A−',
  'B+',
  'B',
  'B−',
  'C+',
  'C',
  'C−',
  'D+',
  'D',
  'D−',
];

/** The grade the operator aims for on every test. */
export const GOAL_GRADE: Grade = 'B+';

const meets = (event: StandardEvent, value: number, mark: number) =>
  event.better === 'higher' ? value >= mark : value <= mark;

/**
 * What a grade needs on one chart, in whole reps or seconds rounded toward
 * the harder side. `steps` past D− give the F+ mark.
 */
function markAt(
  event: StandardEvent,
  scale: EventScale,
  sex: Sex,
  steps: number,
): number {
  const max = scale.max[sex];
  const step = (max - scale.min[sex]) / (GRADE_STEPS.length - 1);
  const raw = max - steps * step;
  return event.better === 'higher'
    ? Math.ceil(raw - 1e-9)
    : Math.floor(raw + 1e-9);
}

/** What `grade` needs on a chart (A+ to D−). */
export function markFor(
  event: StandardEvent,
  scale: EventScale,
  sex: Sex,
  grade: Grade,
): number {
  const steps = GRADE_STEPS.indexOf(grade);
  return markAt(event, scale, sex, steps < 0 ? GRADE_STEPS.length : steps);
}

/** The grade a result earns on a chart: A+ to D−, F+ within a step under the minimum, else F. */
export function gradeOn(
  event: StandardEvent,
  scale: EventScale,
  sex: Sex,
  value: number,
): Grade {
  for (let i = 0; i < GRADE_STEPS.length; i++) {
    if (meets(event, value, markAt(event, scale, sex, i))) {
      return GRADE_STEPS[i];
    }
  }
  return meets(event, value, markAt(event, scale, sex, GRADE_STEPS.length))
    ? 'F+'
    : 'F';
}

/** A B+ on every chart the event is on: the hardest of their marks. */
export function goalFor(event: StandardEvent, sex: Sex): number | undefined {
  if (!event.scales || event.scales.length === 0) {
    return undefined;
  }
  const marks = event.scales.map(s => markFor(event, s, sex, GOAL_GRADE));
  return event.better === 'higher' ? Math.max(...marks) : Math.min(...marks);
}

export interface TestGrade {
  /** Unset for RaveLite's own marks. */
  test?: TestId;
  grade: Grade;
}

/** A result's grade on each chart the event is on. */
export function gradesFor(
  event: StandardEvent,
  sex: Sex,
  value: number,
): TestGrade[] {
  return (event.scales ?? []).map(scale => ({
    test: scale.test,
    grade: gradeOn(event, scale, sex, value),
  }));
}

/** "B+ USAF · C USSF", "C+ USAF · USSF" when the grades agree, or "B+" on RaveLite's marks. */
export function formatGrades(grades: readonly TestGrade[]): string {
  const groups: {grade: Grade; tests: (TestId | undefined)[]}[] = [];
  for (const g of grades) {
    const group = groups.find(x => x.grade === g.grade);
    if (group) {
      group.tests.push(g.test);
    } else {
      groups.push({grade: g.grade, tests: [g.test]});
    }
  }
  return groups
    .map(g =>
      [g.grade, g.tests.flatMap(t => (t ? [TEST_NAMES[t]] : [])).join(' · ')]
        .filter(Boolean)
        .join(' '),
    )
    .join(' · ');
}

/** True when a result reaches the goal grade on every chart. */
export function meetsGoal(
  event: StandardEvent,
  sex: Sex,
  value: number,
): boolean {
  const goal = goalFor(event, sex);
  return goal !== undefined && meets(event, value, goal);
}

// ── Targets ──────────────────────────────────────────────────────────

function readTargets(): Record<string, number> {
  const raw = store.getString(KEYS.standardsTargets);
  if (raw === undefined) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

/** The charts the person picked, if they have picked. */
export function chosenSex(): Sex | undefined {
  const sex = store.getString(KEYS.standardsPrimary);
  return sex === 'male' || sex === 'female' ? sex : undefined;
}

/** The only age group whose charts the app has. */
export const AGE_GROUP = '35–40';

/** A table's top score, or halfway between the two when none is known. */
export function topFor(event: StandardEvent, sex: Sex | undefined): number {
  return sex ? event.top[sex] : (event.top.male + event.top.female) / 2;
}

/** The table that leads; male unless the operator chose otherwise. */
export function getPrimarySex(): Sex {
  return store.getString(KEYS.standardsPrimary) === 'female'
    ? 'female'
    : 'male';
}

export function setPrimarySex(sex: Sex): void {
  store.set(KEYS.standardsPrimary, sex);
}

/**
 * The operator's target for the leading table: their own, else a B+ on
 * every test, else the top score.
 */
export function targetFor(event: StandardEvent): number {
  const sex = getPrimarySex();
  return readTargets()[event.id] ?? goalFor(event, sex) ?? event.top[sex];
}

/** True when the operator set their own target. */
export function hasOwnTarget(event: StandardEvent): boolean {
  return readTargets()[event.id] !== undefined;
}

/** Set a target, or pass undefined to go back to the default. */
export function setTarget(eventId: string, value: number | undefined): void {
  const targets = readTargets();
  if (value === undefined) {
    delete targets[eventId];
  } else {
    targets[eventId] = value;
  }
  store.set(KEYS.standardsTargets, JSON.stringify(targets));
}

const HEIGHT_KEY = KEYS.setting('body.heightInches');

/** The operator's height in inches, for waist-to-height; unset until entered. */
export function getHeightInches(): number | undefined {
  const inches = store.getNumber(HEIGHT_KEY);
  return typeof inches === 'number' && inches > 0 ? inches : undefined;
}

export function setHeightInches(inches: number | undefined): void {
  if (inches === undefined) {
    store.delete(HEIGHT_KEY);
  } else {
    store.set(HEIGHT_KEY, inches);
  }
}

// ── Results ──────────────────────────────────────────────────────────

export interface StandardResult {
  value: number;
  at: number;
  /** When the result came from a longer run, that run's kind label. */
  from?: string;
}

/**
 * Every test result for an event, oldest first. Runs also count any longer
 * run at the same pace, scaled to the event's distance.
 */
export function resultsFor(
  event: StandardEvent,
  entries: readonly TrainingLogEntry[],
  metricFor: (kindId: string) => MetricKind | undefined,
  heightInches?: number,
): StandardResult[] {
  if (!event.kindId) {
    return [];
  }
  if (event.perHeight) {
    const kindId = event.kindId;
    return heightInches
      ? entries
          .filter(e => e.kindId === kindId && e.value > 0)
          .map(e => ({value: e.value / heightInches, at: e.at}))
          .sort((a, b) => a.at - b.at)
      : [];
  }
  const out: StandardResult[] = [];
  for (const entry of entries) {
    if (entry.value <= 0) {
      continue;
    }
    if (entry.kindId === event.kindId) {
      out.push({value: entry.value, at: entry.at});
      continue;
    }
    if (!event.distanceMeters) {
      continue;
    }
    const kind = metricFor(entry.kindId);
    if (kind?.category !== 'run') {
      continue;
    }
    const distance =
      kind.inputMode === 'distance-time'
        ? entry.distanceMeters
        : kind.defaultDistanceMeters;
    // Only longer runs: a short sprint says little about a 3-mile pace.
    if (!distance || distance < event.distanceMeters) {
      continue;
    }
    out.push({
      value: (entry.value / distance) * event.distanceMeters,
      at: entry.at,
      from: kind.label,
    });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** The best test result for an event (see `resultsFor`). */
export function bestResult(
  event: StandardEvent,
  entries: readonly TrainingLogEntry[],
  metricFor: (kindId: string) => MetricKind | undefined,
  heightInches?: number,
): StandardResult | undefined {
  let best: StandardResult | undefined;
  for (const result of resultsFor(event, entries, metricFor, heightInches)) {
    const better =
      !best ||
      (event.better === 'higher'
        ? result.value > best.value
        : result.value < best.value);
    if (better) {
      best = result;
    }
  }
  return best;
}

/** How close a result is to its target, from 0 to 1. */
export function progressToward(
  event: StandardEvent,
  value: number,
  target: number,
): number {
  if (value <= 0 || target <= 0) {
    return 0;
  }
  const ratio = event.better === 'higher' ? value / target : target / value;
  return Math.min(1, ratio);
}
