/**
 * Checking a pack somebody else wrote.
 *
 * A pack is pure data, which is the whole reason a stranger can add a
 * curriculum without touching app code. It is also the reason this file
 * has to exist: data that arrives from outside gets checked, and told
 * plainly what is wrong, rather than failing somewhere deep in the
 * scheduler three screens later.
 *
 * The rules here are the same ones the built-in library has always been
 * held to by its own tests. They were assertions in a jest file, which
 * tells a maintainer what broke and tells a contributor nothing; as a
 * function they can say where the problem is and what to do about it.
 */
import {EXERCISE_LIBRARY} from '../exercises/library';
import type {Exercise, Target, Venue} from '../exercises/types';
import {MOVE_IDS, moveForExercise} from '../exercises/moves';
import {ELEMENT_ORDER} from '../../theme/elements';
import {TRACKS} from '../program/tracks';

export interface PackProblem {
  /** Where it is, as a contributor would look for it. */
  where: string;
  problem: string;
  /** What to do about it, when there is an obvious answer. */
  fix?: string;
}

const TARGETS: ReadonlySet<string> = new Set<Target>([
  'UCS',
  'Hourglass',
  'APT',
  'PFT-Pushups',
  'PFT-Situps',
  'PFT-Run',
  'Core',
  'Conditioning',
  'Grip',
  'Agility',
  'Mobility',
  'Strength',
  'Coordination',
  'Flow',
  'Breath',
  'Presence',
  'Hydration',
  'Fuel',
  'NoFloor',
  'Test',
]);

const VENUES: ReadonlySet<string> = new Set<Venue>([
  'desk',
  'standing',
  'yard',
  'mat',
  'wall',
  'porch',
  'house',
  'neighborhood',
]);

const ELEMENTS: ReadonlySet<string> = new Set(ELEMENT_ORDER);
const MOVES: ReadonlySet<string> = new Set<string>(MOVE_IDS);
const TRACK_IDS: ReadonlySet<string> = new Set(TRACKS.map(t => t.id));

/**
 * Kit this app does not assume anybody has. A drill that needs one is not
 * a RaveLite drill, however good it is — the whole premise is a body, a
 * floor and whatever happens to be in the room.
 */
const FORBIDDEN = [
  'gym',
  'barbell',
  'dumbbell',
  'kettlebell',
  'treadmill',
  'machine',
  'pool',
  'swim',
  'bench press',
];

const SHORTEST_DRILL_SECONDS = 5;
const LONGEST_DRILL_SECONDS = 3600;
const LONGEST_ID = 60;

const isText = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

/** Anything a drill claims about itself that has to be true. */
export function validateDrill(
  drill: unknown,
  where: string,
  knownIds: ReadonlySet<string>,
): PackProblem[] {
  const out: PackProblem[] = [];

  if (typeof drill !== 'object' || drill === null) {
    return [{where, problem: 'is not an object'}];
  }
  const d = drill as Partial<Exercise>;

  if (!isText(d.id)) {
    return [{where, problem: 'has no id', fix: 'Use "element.some-name".'}];
  }
  const at = `${where} (${d.id})`;
  const reword = (problem: string, fix?: string) =>
    out.push({where: at, problem, ...(fix ? {fix} : {})});

  if (!isText(d.element) || !ELEMENTS.has(d.element)) {
    reword(
      `element ${String(d.element)} is not one of the five`,
      `Use one of: ${[...ELEMENTS].join(', ')}.`,
    );
  } else if (!d.id.startsWith(`${d.element}.`)) {
    reword(
      'id does not start with its element',
      `Rename it to "${d.element}.${d.id.split('.').pop()}".`,
    );
  }
  if (!/^[a-z]+\.[a-z0-9-]+$/.test(d.id) || d.id.length > LONGEST_ID) {
    reword(
      'id is not lower-case words joined by hyphens',
      'For example "fire.spinning-back-kick".',
    );
  }
  if (knownIds.has(d.id)) {
    reword(
      'id is already taken by another drill',
      'Ids are global; pick one nobody has used.',
    );
  }

  if (!isText(d.name)) {
    reword('has no name');
  }
  if (!isText(d.purpose)) {
    reword('has no purpose', 'One sentence answering "why am I doing this".');
  }
  if (!isText(d.dose)) {
    reword('has no dose', 'For example "3 × 10" or "60 sec".');
  }
  if (
    d.cues !== undefined &&
    (!Array.isArray(d.cues) || d.cues.some(c => !isText(c)))
  ) {
    reword('has cues that are not a list of sentences');
  }

  if (!Array.isArray(d.targets) || d.targets.length === 0) {
    reword('has no targets', `Pick from: ${[...TARGETS].join(', ')}.`);
  } else {
    for (const target of d.targets) {
      if (!TARGETS.has(target)) {
        reword(`target "${String(target)}" is not one this app knows`);
      }
    }
  }

  if (!Array.isArray(d.venues) || d.venues.length === 0) {
    reword(
      'has no venues',
      `Where can it be done? Pick from: ${[...VENUES].join(', ')}.`,
    );
  } else {
    for (const venue of d.venues) {
      if (!VENUES.has(venue)) {
        reword(`venue "${String(venue)}" is not one this app knows`);
      }
    }
  }

  if (
    typeof d.approxSeconds !== 'number' ||
    !Number.isFinite(d.approxSeconds) ||
    d.approxSeconds < SHORTEST_DRILL_SECONDS ||
    d.approxSeconds > LONGEST_DRILL_SECONDS
  ) {
    reword(
      'approxSeconds is missing or out of range',
      `How long one go takes, between ${SHORTEST_DRILL_SECONDS} and ${LONGEST_DRILL_SECONDS} seconds.`,
    );
  }

  const text = `${d.name ?? ''} ${d.purpose ?? ''} ${d.dose ?? ''} ${(
    d.cues ?? []
  ).join(' ')}`.toLowerCase();
  for (const word of FORBIDDEN) {
    if (text.includes(word)) {
      reword(
        `mentions "${word}"`,
        'RaveLite assumes a body, a floor and whatever is in the room — no gym, no weights, no pool.',
      );
    }
  }

  // A pictogram is required, but it has to be satisfiable from the pack
  // file alone: the built-in mapping is app code, and a contributor who
  // must edit app code is not writing pure data. So a pack drill names
  // its own move, from the list the app already draws.
  const move = (drill as {move?: unknown}).move;
  if (move === undefined) {
    if (!isText(d.id) || moveForExercise(d.id) === undefined) {
      reword('has no pictogram', `Add "move": one of ${MOVE_IDS.join(', ')}.`);
    }
  } else if (typeof move !== 'string' || !MOVES.has(move)) {
    reword(
      `move "${String(move)}" is not one this app draws`,
      `Pick from: ${MOVE_IDS.join(', ')}.`,
    );
  }

  return out;
}

/** The shape a contributed pack file has. */
export interface PackFile {
  id: string;
  name: string;
  detail: string;
  groups?: {title: string; ids: string[]}[];
  extras?: string[];
  tracks?: string[];
  /** Drills this pack brings with it. */
  drills?: unknown[];
}

/**
 * Everything wrong with a pack, in the order a person would fix it. An
 * empty list means it can be merged.
 */
export function validatePack(pack: unknown): PackProblem[] {
  if (typeof pack !== 'object' || pack === null) {
    return [{where: 'pack', problem: 'is not an object'}];
  }
  const p = pack as Partial<PackFile>;
  const out: PackProblem[] = [];
  const where = isText(p.id) ? `pack "${p.id}"` : 'pack';
  const say = (problem: string, fix?: string) =>
    out.push({where, problem, ...(fix ? {fix} : {})});

  if (!isText(p.id) || !/^[a-z][a-z0-9-]*$/.test(p.id)) {
    say(
      'has no id, or one that is not lower-case and hyphenated',
      'For example "capoeira".',
    );
  }
  if (!isText(p.name)) {
    say('has no name');
  }
  if (!isText(p.detail) || p.detail.trim().length < 16) {
    say(
      'has no detail, or too short a one',
      'One line, second person, saying what it is for — it is the only thing a stranger reads before choosing.',
    );
  }

  const known = new Set(EXERCISE_LIBRARY.map(e => e.id));
  const mine = new Set<string>();
  const drills = Array.isArray(p.drills) ? p.drills : [];
  drills.forEach((drill, i) => {
    out.push(...validateDrill(drill, `${where} drill ${i + 1}`, known));
    const id = (drill as Partial<Exercise>)?.id;
    if (isText(id)) {
      if (mine.has(id)) {
        say(`names the drill "${id}" twice`);
      }
      mine.add(id);
      known.add(id);
    }
  });

  const available = new Set([...EXERCISE_LIBRARY.map(e => e.id), ...mine]);
  const groups = Array.isArray(p.groups) ? p.groups : [];
  groups.forEach((group, i) => {
    const at = `${where} group ${i + 1}`;
    if (!isText(group?.title)) {
      out.push({where: at, problem: 'has no title'});
    }
    const ids = Array.isArray(group?.ids) ? group.ids : [];
    if (ids.length === 0) {
      out.push({
        where: at,
        problem: 'teaches nothing',
        fix: 'List the drill ids it teaches, in the order worth learning.',
      });
    }
    for (const id of ids) {
      if (!available.has(id)) {
        out.push({
          where: at,
          problem: `names "${id}", which does not exist`,
          fix: "Add it to this pack's drills, or use an id from the library.",
        });
      }
    }
  });

  for (const id of Array.isArray(p.extras) ? p.extras : []) {
    if (!available.has(id)) {
      out.push({where, problem: `extras names "${id}", which does not exist`});
    }
  }

  for (const track of Array.isArray(p.tracks) ? p.tracks : []) {
    if (!TRACK_IDS.has(track)) {
      out.push({
        where,
        problem: `turns on a track "${track}" that does not exist`,
        fix: `Tracks are: ${[...TRACK_IDS].join(', ')}.`,
      });
    }
  }

  if (drills.length === 0 && groups.length === 0 && !p.extras?.length) {
    say(
      'brings nothing',
      'A pack needs drills, or groups naming existing ones.',
    );
  }

  return out;
}

/** The problems as lines a person can act on. */
export function explainProblems(problems: readonly PackProblem[]): string[] {
  return problems.map(p =>
    p.fix ? `${p.where}: ${p.problem}. ${p.fix}` : `${p.where}: ${p.problem}`,
  );
}
