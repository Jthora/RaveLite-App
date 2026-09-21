/**
 * A person who does not exist, with a history that could.
 *
 * Screenshots of this app are screenshots of somebody's training: what
 * they lifted, how long they held a plank, which days they missed, where
 * they live. None of that should be on a store listing, so the app can
 * pretend to be somebody else for as long as it takes to photograph it.
 *
 * The fiction has to be *plausible* or the screenshots are worse than
 * useless — a character sheet of zeroes or a perfect unbroken streak both
 * tell a lie about what using this is like. So: eleven weeks in, most
 * days answered, a couple of bad ones, one test passed and one not taken.
 */
import {ELEMENT_ORDER} from '../../theme/elements';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {KEYS} from '../../storage/keys';
import {TRACKS} from '../program/tracks';
import {setSizeFor} from '../program/progression';
import type {TrackState} from '../program/types';
import type {KeyValueStore} from '../../storage/types';

/** Someone eleven weeks in, training at a desk, not a beginner. */
export const DEMO_PROFILE = {
  version: 1 as const,
  facts: {
    kit: ['floor', 'wall', 'mat', 'chair', 'stairs', 'hangPoint', 'yard'],
    noise: 'normal' as const,
    corrections: ['UCS' as const],
    heightInches: 69,
  },
  shape: 'desk' as const,
  archetype: 'raver' as const,
  packs: ['dance', 'staff', 'yoga-taichi', 'jumps', 'runs'],
  starting: 'returning' as const,
  setUpAt: 0,
  taughtAt: 0,
};

const DAY_MS = 86_400_000;

/** Weekday rhythm: strong Mon–Thu, lighter Friday, patchy weekends. */
const ANSWERED_BY_WEEKDAY = [0.45, 0.95, 0.9, 0.95, 0.85, 0.6, 0.5];

/** A deterministic wobble, so every screenshot run looks the same. */
function wobble(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export interface DemoOptions {
  /** The day the demo pretends is today. */
  now: number;
  days?: number;
}

/**
 * Fill a store with a life. Writes journal entries and a program the app
 * then reads exactly as it reads a real one — nothing here is a special
 * case the rest of the app has to know about, which is the only way the
 * screenshots show the real thing.
 */
export function seedDemo(store: KeyValueStore, opts: DemoOptions): void {
  const {now, days = 77} = opts;
  store.clearAll();

  store.set(KEYS.schemaVersion, 8);
  store.set(KEYS.profile, JSON.stringify(DEMO_PROFILE));

  // A program eleven weeks old, with maxes somebody would have by now.
  const tracks: Record<string, TrackState> = {};
  for (const track of TRACKS) {
    const grown = 1 + wobble(track.id.length * 7) * 0.8;
    tracks[track.id] = {
      enabled: track.enabledByDefault,
      rung: track.defaultRung,
      testMax: Math.max(1, Math.round(track.defaultMax * grown)),
      sets: Math.min(track.maxSets, track.baseSets + 1),
      steppedOn: dayKeyOf(now - 5 * DAY_MS),
    };
  }

  // A place, so the conditions line has something in it. Nowhere anybody
  // lives: a screenshot should not say where its owner wakes up.
  store.set(
    KEYS.weatherPlace,
    JSON.stringify({
      name: 'Reykjavík',
      region: 'Iceland',
      lat: 64.1,
      lon: -21.9,
      source: 'typed',
      setAt: now - 60 * DAY_MS,
    }),
  );
  store.set(
    KEYS.programState,
    JSON.stringify({
      version: 1,
      startDay: dayKeyOf(now - days * DAY_MS),
      tracks,
    }),
  );

  let id = 0;
  const write = (at: number, entry: Record<string, unknown>) => {
    id += 1;
    const key = KEYS.journalEntry(dayKeyOf(at), `demo.${id}`);
    store.set(key, JSON.stringify({...entry, id: `demo.${id}`, at}));
  };

  for (let ago = days; ago >= 0; ago -= 1) {
    const at = now - ago * DAY_MS;
    const weekday = new Date(at).getDay();
    const rate = ANSWERED_BY_WEEKDAY[weekday];

    // Water, most of it, most days. Every entry here is shaped exactly
    // like one the app writes itself — element and all — because a demo
    // built on entries the app would never produce is a demo that tests
    // nothing and photographs a lie.
    const glasses = Math.round(4 + wobble(ago) * 4);
    for (let g = 0; g < glasses; g += 1) {
      write(at + (8 + g) * 3_600_000, {
        kind: 'completion',
        exerciseId: 'water.glass',
        element: 'water',
        source: 'manual',
        water: true,
      });
    }

    // The day's sets, in the proportion this person actually manages.
    for (const track of TRACKS) {
      const state = tracks[track.id];
      if (!track.enabledByDefault || !track.days.includes(weekday)) {
        continue;
      }
      const asked = Math.min(track.maxSets, track.baseSets + 1);
      const done = Math.round(asked * rate * (0.8 + wobble(ago + asked) * 0.3));
      const size = setSizeFor(track, state);
      for (let n = 0; n < Math.min(asked, done); n += 1) {
        write(at + (9 + n) * 3_000_000, {
          kind: 'completion',
          exerciseId: track.ladder[track.defaultRung].exerciseId,
          element: track.element,
          source: 'always-on',
          trackId: track.id,
          // A set without an amount is not counted as a set (see
          // `doneByTrack`), which is how the first demo showed eleven
          // weeks of training and a Daily Sets meter reading zero.
          amount: size,
        });
      }
    }

    // One drill from a rotating element, so the balance strip has colour.
    const element = ELEMENT_ORDER[ago % ELEMENT_ORDER.length];
    if (wobble(ago * 3) > 0.25) {
      const drill = EXERCISE_LIBRARY.find(e => e.element === element);
      if (drill) {
        write(at + 18 * 3_600_000, {
          kind: 'completion',
          exerciseId: drill.id,
          element,
          source: 'notification',
          durationSec: 60,
        });
      }
    }
  }
}

function dayKeyOf(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
