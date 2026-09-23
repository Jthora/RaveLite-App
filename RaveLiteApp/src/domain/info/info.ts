import {
  attributeById,
  type AttributeId,
  type Modality,
} from '../attributes/attributes';
import {attributeSheet} from '../attributes/repository';
import {attributesForDrill} from '../attributes/trains';
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Exercise, Venue} from '../exercises/types';
import {prescribeDay} from '../program/progression';
import {loadProgram} from '../program/repository';
import {dayDensity, gradingTable, loadFacts} from '../profile/repository';
import {TRACKS} from '../program/tracks';
import {moveForExercise, moveForMetric, moveForTrack} from '../exercises/moves';
import type {MoveId} from '../exercises/moves';
import type {SetPrescription, TrackId} from '../program/types';
import {
  AGE_GROUP,
  STANDARD_EVENTS,
  markFor,
  type Sex,
  type StandardEvent,
} from '../standards/standards';
import {BUILTIN_METRICS} from '../training/builtinMetrics';
import type {MetricKind} from '../training/types';
import {EVENT_WHAT, MEASURES} from './measures';
import {ELEMENTS, type ElementId} from '../../theme/elements';

/**
 * What is this? — one card for any named thing in the app.
 *
 * Every drill already carries why it's there and how to do it; tracks
 * carry why they exist and their ladder; attributes carry what they are.
 * This turns all of that into one shape the card view can render, with
 * links: a round lists its moves, a drill points back at its track, a
 * track lists the variations you climb through.
 */

export type InfoRef =
  | {kind: 'drill'; id: string}
  | {kind: 'track'; id: TrackId}
  | {kind: 'attribute'; id: AttributeId}
  | {kind: 'metric'; id: string}
  | {kind: 'event'; id: string};

export interface InfoLink {
  /** Absent when the part is real but has nothing to explain (a glass). */
  ref?: InfoRef;
  label: string;
  detail?: string;
  /** Whose colour the row takes — in a group, which element this piece is. */
  element?: ElementId;
  /** Its pictogram. */
  move?: MoveId;
}

export interface InfoCard {
  title: string;
  subtitle?: string;
  element: ElementId;
  /** The pictogram for the thing itself; the element's mark when absent. */
  move?: MoveId;
  /** One line: what it is. */
  what: string;
  /** How to do it, in order. */
  how?: readonly string[];
  /** How much, as asked for right now. */
  dose?: string;
  /** Where, how long, what it trains. */
  meta?: readonly string[];
  /** Meta as its own line each, for marks that don't read as a sentence. */
  metaLines?: boolean;
  /** The things inside this one. */
  parts?: readonly InfoLink[];
  partsTitle?: string;
  /** Where it sits: its track, its variations. */
  related?: readonly InfoLink[];
  relatedTitle?: string;
}

const EXERCISES = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));

const VENUES: Record<Venue, string> = {
  desk: 'sitting',
  standing: 'standing anywhere',
  yard: 'in the yard',
  mat: 'on the mat',
  wall: 'at a wall or doorframe',
  porch: 'at a hang point',
  house: 'in the house',
  neighborhood: 'out in the neighborhood',
};

const trains = (ids: readonly AttributeId[]): string | undefined =>
  ids.length === 0
    ? undefined
    : `Trains ${ids.map(id => attributeById(id).name).join(' and ')}`;

const about = (seconds: number): string =>
  seconds >= 90
    ? `About ${Math.round(seconds / 60)} min`
    : `About ${seconds} sec`;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Every day", or the days a track trains. */
function daysLine(days: readonly number[]): string {
  return days.length === 7
    ? 'Every day'
    : days.map(d => DAY_NAMES[d]).join(', ');
}

/** The track a drill belongs to: one it's a rung of, else one it partners. */
function trackOf(exerciseId: string):
  | {
      track: (typeof TRACKS)[number];
      partner: boolean;
    }
  | undefined {
  for (const track of TRACKS) {
    if (track.ladder.some(r => r.exerciseId === exerciseId)) {
      return {track, partner: false};
    }
  }
  for (const track of TRACKS) {
    if (track.partners.some(p => p.exerciseId === exerciseId)) {
      return {track, partner: true};
    }
  }
  return undefined;
}

function drillCard(exercise: Exercise): InfoCard {
  const home = trackOf(exercise.id);
  const where = exercise.venues.map(v => VENUES[v]).join(' · ');
  return {
    title: exercise.name,
    subtitle: ELEMENTS[exercise.element].name,
    element: exercise.element,
    move: moveForExercise(exercise.id),
    what: exercise.purpose,
    how: exercise.cues,
    dose: exercise.dose,
    meta: [
      where,
      about(exercise.approxSeconds),
      trains(
        attributesForDrill(
          exercise.id,
          home?.partner ? undefined : home?.track.id,
        ),
      ),
    ].filter((line): line is string => Boolean(line)),
    relatedTitle: 'Part of',
    related: home
      ? [
          {
            ref: {kind: 'track', id: home.track.id},
            label: `${home.track.name} track`,
            element: home.track.element,
            move: moveForTrack(home.track.id),
            detail: home.partner
              ? 'Partner drill, done after its sets'
              : 'One of its variations',
          },
        ]
      : undefined,
  };
}

/** " reps" or " sec" — a number on a card without one says nothing. */
function setUnit(track: {unit: string}): string {
  return track.unit === 'seconds' ? ' sec' : ' reps';
}

function trackCard(id: TrackId): InfoCard | undefined {
  const track = TRACKS.find(t => t.id === id);
  if (!track) {
    return undefined;
  }
  const program = loadProgram();
  const state = program.tracks[id];
  const today = state?.enabled
    ? prescribeDay(track, state, program, new Date(), loadFacts(), dayDensity())
    : undefined;
  const rung = state ? track.ladder[state.rung] : undefined;
  return {
    title: track.name,
    subtitle: `${ELEMENTS[track.element].name} · a Daily Sets track`,
    element: track.element,
    move: moveForTrack(track.id),
    what: track.why,
    dose: today
      ? `Now: ${today.label}, ${today.sets} × ${today.setSize}${
          track.unit === 'seconds' ? ' sec' : ''
        } across the day`
      : undefined,
    meta: [
      daysLine(track.days),
      `Up to ${track.maxSets} sets a day`,
      trains(attributesForDrill(rung?.exerciseId, track.id)),
    ].filter((line): line is string => Boolean(line)),
    partsTitle: 'The steps',
    parts: track.ladder.map((step, i) => ({
      ref: {kind: 'drill' as const, id: step.exerciseId},
      label: step.label,
      element: EXERCISES.get(step.exerciseId)?.element ?? track.element,
      move: moveForExercise(step.exerciseId),
      detail:
        state && i === state.rung
          ? `You are here · next step at ${step.graduateAt}${setUnit(track)}`
          : i < (state?.rung ?? 0)
          ? 'Done'
          : `Opens at ${
              track.ladder[i - 1]?.graduateAt ?? step.graduateAt
            }${setUnit(track)}`,
    })),
    relatedTitle: 'Partner drills',
    related: track.partners.map(p => ({
      ref: {kind: 'drill' as const, id: p.exerciseId},
      label: EXERCISES.get(p.exerciseId)?.name ?? p.exerciseId,
      detail: `Done after its sets · ${p.seconds} sec`,
      element: EXERCISES.get(p.exerciseId)?.element,
      move: moveForExercise(p.exerciseId),
    })),
  };
}

/** What the grid's three columns mean, in words (see `attributes.ts`). */
const MODALITY_WORD: Record<Modality, string> = {
  cardinal: 'starting',
  fixed: 'holding',
  mutable: 'changing',
};

function attributeCard(id: AttributeId): InfoCard {
  const attribute = attributeById(id);
  const standing = attributeSheet().standings.find(s => s.attribute.id === id);
  const meta: string[] = [];
  if (standing) {
    meta.push(
      standing.practice >= 85
        ? `Level ${standing.level} · practice cannot raise it further`
        : `Level ${standing.level}. ${standing.xp} of ${
            standing.toNext
          } points to level ${standing.practice + 1}`,
    );
    if (standing.today > 0) {
      meta.push(`+${standing.today} points today`);
    }
    if (standing.testedBy && standing.tested !== undefined) {
      meta.push(`${standing.testedBy.name} sets it to ${standing.tested}`);
    }
    if (standing.idleDays !== undefined && standing.idleDays > 14) {
      meta.push(
        `Not trained for ${standing.idleDays} days. It drops a level a week`,
      );
    }
  }
  meta.push(
    attribute.events.length === 0
      ? 'No test for this yet. Only practice raises it'
      : 'Passing a test can raise it past 85',
  );
  // No `Sign: Aries` line. It was the author's frame for the grid, it
  // changed nothing, and it explained nothing to anybody who did not
  // already hold the frame.
  return {
    title: attribute.name,
    subtitle: `${ELEMENTS[attribute.element].name} · ${
      MODALITY_WORD[attribute.modality]
    }`,
    element: attribute.element,
    what: attribute.gist,
    how: [attribute.how],
    meta,
    metaLines: true,
  };
}

const METRICS = new Map(BUILTIN_METRICS.map(m => [m.id, m]));
const EVENTS = new Map(STANDARD_EVENTS.map(e => [e.id, e]));

const ENTRY: Record<MetricKind['inputMode'], string> = {
  mmss: 'Logged as minutes and seconds',
  integer: 'Logged as a count',
  'distance-time': 'Logged as a distance and a time',
  decimal: 'Logged to two decimal places',
};

/** An event's element: the one its drill lives under, else its goal group. */
function elementOfEvent(event: StandardEvent): ElementId {
  const metric = event.kindId ? METRICS.get(event.kindId) : undefined;
  if (metric && metric.element !== 'any') {
    return metric.element;
  }
  return event.group === 'tests' ? 'fire' : event.group;
}

function metricCard(id: string): InfoCard | undefined {
  const metric = METRICS.get(id);
  if (!metric) {
    return undefined;
  }
  const event = STANDARD_EVENTS.find(e => e.kindId === id);
  return {
    title: metric.label,
    subtitle:
      metric.element === 'any'
        ? 'A logged measurement'
        : `${ELEMENTS[metric.element].name} · a logged measurement`,
    element: metric.element === 'any' ? 'heart' : metric.element,
    move: moveForMetric(metric),
    // `what` is the first line under the title and has no heading of
    // its own, so a fallback that does not name the thing leaves the
    // card answering a question nobody asked. Name it, then say how.
    what:
      MEASURES[id] ??
      metric.notes ??
      `${metric.label}: a number you log. Take it the same way every ` +
        'time so the numbers compare.',
    meta: [ENTRY[metric.inputMode]],
    relatedTitle: 'Counts toward',
    related: event
      ? [
          {
            ref: {kind: 'event', id: event.id},
            label: event.name,
            detail: event.subtitle,
            element: elementOfEvent(event),
          },
        ]
      : undefined,
  };
}

function eventCard(id: string): InfoCard | undefined {
  const event = EVENTS.get(id);
  if (!event) {
    return undefined;
  }
  // Both tables until the person has said which one is theirs.
  const table = gradingTable();
  const tables: Sex[] = table ? [table] : ['male', 'female'];
  const official = (event.scales ?? []).some(scale => scale.test);
  const marks = (event.scales ?? []).flatMap(scale => {
    const name = scale.test ? scale.test.toUpperCase() : 'Marks';
    const same =
      scale.min.male === scale.min.female &&
      scale.max.male === scale.max.female;
    return (same ? tables.slice(0, 1) : tables).map(sex => {
      const whose =
        tables.length > 1 && !same
          ? sex === 'male'
            ? ' (men)'
            : ' (women)'
          : '';
      const at = (grade: 'D−' | 'B+' | 'A+') =>
        markFor(event, scale, sex, grade);
      return `${name}${whose}: pass ${at('D−')} · B+ ${at('B+')} · top ${at(
        'A+',
      )}`;
    });
  });
  return {
    title: event.name,
    subtitle: event.subtitle,
    element: elementOfEvent(event),
    // Never fall back to `event.name`: that printed the title twice and
    // told a reader who tapped "what is this?" exactly nothing.
    what:
      EVENT_WHAT[id] ??
      `${event.name}: a test you log a score for.${
        event.subtitle ? ` ${event.subtitle}` : ''
      }`,
    metaLines: true,
    meta: [
      ...marks,
      marks.length > 0
        ? 'Grades run evenly from the passing minimum to the top score.'
        : '',
      official
        ? `${
            table === 'male'
              ? "Men's charts, "
              : table === 'female'
              ? "Women's charts, "
              : ''
          }ages ${AGE_GROUP}.`
        : '',
    ].filter(Boolean),
    relatedTitle: 'Log it with',
    related: event.kindId
      ? [
          {
            ref: {kind: 'metric', id: event.kindId},
            label: METRICS.get(event.kindId)?.label ?? event.kindId,
            detail: 'How to measure it',
            element: elementOfEvent(event),
            move: moveForMetric(METRICS.get(event.kindId)),
          },
        ]
      : undefined,
  };
}

/** The card for anything with a ref. */
export function infoFor(ref: InfoRef): InfoCard | undefined {
  switch (ref.kind) {
    case 'drill': {
      const exercise = EXERCISES.get(ref.id);
      return exercise ? drillCard(exercise) : undefined;
    }
    case 'track':
      return trackCard(ref.id);
    case 'attribute':
      return attributeCard(ref.id);
    case 'metric':
      return metricCard(ref.id);
    case 'event':
      return eventCard(ref.id);
  }
}

/** The pieces of a round — its moves, the partner drill, the glass. */
export function partsOf(
  prescription: SetPrescription,
  element: ElementId,
): InfoLink[] {
  const moves = prescription.moves ?? [
    {
      trackId: prescription.trackId,
      exerciseId: '',
      element,
      label: prescription.label,
      unit: prescription.unit,
      amount: prescription.amount,
      setIndex: prescription.setIndex,
      sets: prescription.sets,
    },
  ];
  const parts: InfoLink[] = moves.map(move => ({
    ref: EXERCISES.has(move.exerciseId)
      ? {kind: 'drill' as const, id: move.exerciseId}
      : {kind: 'track' as const, id: move.trackId},
    label: move.label,
    detail: `${move.amount}${move.unit === 'seconds' ? ' sec' : ''} · set ${
      move.setIndex
    } of ${move.sets} today`,
    element: move.element,
    move: moveForTrack(move.trackId) ?? moveForExercise(move.exerciseId),
  }));
  if (prescription.partner) {
    parts.push({
      ref: {kind: 'drill', id: prescription.partner.exerciseId},
      label: prescription.partner.label,
      detail: `${prescription.partner.seconds} sec, straight after`,
      element: prescription.partner.element,
      move: moveForExercise(prescription.partner.exerciseId),
    });
  }
  if (prescription.water) {
    parts.push({
      label: 'A glass of water',
      detail: 'Drink it with this round',
    });
  }
  return parts;
}

/**
 * A group is not a thing: its card lists what's in it, so every piece can
 * be opened on its own.
 */
export function groupCard(input: {
  title: string;
  element: ElementId;
  what: string;
  parts: readonly InfoLink[];
  subtitle?: string;
}): InfoCard {
  return {...input, partsTitle: 'Each part'};
}

/** A Daily Sets round: what it is, and every piece of it. */
export function roundCard(
  prescription: SetPrescription,
  element: ElementId,
): InfoCard {
  const parts = partsOf(prescription, element);
  const several = (prescription.moves?.length ?? 1) > 1;
  return {
    title:
      prescription.roundIndex && prescription.rounds
        ? `Round ${prescription.roundIndex} of ${prescription.rounds}`
        : 'This round',
    subtitle: 'Daily Sets',
    element,
    what: several
      ? 'A few small sets back to back, then a drill from another element to balance them.'
      : 'One small set, well short of failure. You do many across the day.',
    parts,
    partsTitle: 'In this round',
  };
}
