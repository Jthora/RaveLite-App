/**
 * Pass 2: journal → activity → counts. Two of this wave's bugs were here
 * — a completion without `amount` that was not a set, and an entry with
 * an element nothing recognised, which crashed Today.
 *
 * The entries are generated from a fixed seed, so a failure repeats.
 */
import {append, entriesForDay} from '../../journal/journal';
import {TRACKS} from '../../program/tracks';
import {store} from '../../../storage';
import {ELEMENT_ORDER, type ElementId} from '../../../theme/elements';
import {buildActivity} from '../activity';
import {pointsByElement, pointsByElementByDay} from '../stats';

function noise(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const DAY = new Date(2026, 8, 14, 12);
const ENTRIES = 200;

beforeEach(() => store.clearAll());

/** Everything the app itself writes, plus the shapes it has written by mistake. */
function aDayOfEntries(): void {
  const r = noise(7);
  for (let i = 0; i < ENTRIES; i++) {
    const at = new Date(
      2026,
      8,
      14,
      Math.floor(r() * 24),
      Math.floor(r() * 60),
    );
    const track = TRACKS[Math.floor(r() * TRACKS.length)];
    const element = ELEMENT_ORDER[Math.floor(r() * ELEMENT_ORDER.length)];
    const kind = r();
    if (kind < 0.3) {
      // A round: several moves in one entry.
      append({
        kind: 'completion',
        at: at.getTime(),
        exerciseId: track.exerciseIds?.[0] ?? 'fire.pushups',
        element,
        source: 'pulse',
        moves: TRACKS.filter(() => r() > 0.7).map(t => ({
          trackId: t.id,
          amount: Math.floor(r() * 30),
        })),
      });
    } else if (kind < 0.6) {
      // One set.
      append({
        kind: 'completion',
        at: at.getTime(),
        exerciseId: 'fire.pushups',
        element,
        source: 'manual',
        trackId: track.id,
        amount: Math.floor(r() * 40),
      });
    } else if (kind < 0.8) {
      // A drill tap or a glass of water: no amount at all.
      append({
        kind: 'completion',
        at: at.getTime(),
        exerciseId: r() > 0.5 ? 'water.toprock' : 'water.glass',
        element,
        source: 'manual',
      });
    } else {
      // Shapes the app has written by mistake: an element nothing knows,
      // a drill id that is gone, an amount with no unit.
      append({
        kind: 'completion',
        at: at.getTime(),
        exerciseId: r() > 0.5 ? 'fire.removed-in-v2' : 'fire.pushups',
        element: (r() > 0.5 ? 'aether' : element) as ElementId,
        source: 'manual',
        amount: r() > 0.5 ? Math.floor(r() * 20) : undefined,
      });
    }
  }
}

it('turns every entry into activity nobody has to guess about', () => {
  aDayOfEntries();
  const journal = entriesForDay(DAY);
  expect(journal.length).toBe(ENTRIES);
  const items = buildActivity({journal, train: []});

  // Nothing silently dropped: every entry is in there somewhere.
  const seen = new Set(items.map(i => i.ref?.id));
  for (const entry of journal) {
    expect({id: entry.id, kept: seen.has(entry.id)}).toEqual({
      id: entry.id,
      kept: true,
    });
  }

  // And every item is one the rest of the app can count.
  for (const item of items) {
    expect({
      element: ELEMENT_ORDER.includes(item.element) ? 'known' : item.element,
      points: Number.isFinite(item.points) && item.points >= 0,
      at: Number.isFinite(item.at),
    }).toEqual({element: 'known', points: true, at: true});
  }
});

it('counts every point once, whichever way they are counted', () => {
  aDayOfEntries();
  const items = buildActivity({journal: entriesForDay(DAY), train: []});
  const total = items.reduce((sum, i) => sum + i.points, 0);
  const byElement = pointsByElement(items);
  expect(Object.values(byElement).reduce((a, b) => a + b, 0)).toBeCloseTo(
    total,
  );
  // The same points again, spread over a window that holds the whole day.
  const byDay = pointsByElementByDay(items, 7, DAY);
  const spread = Object.values(byDay)
    .flat()
    .reduce((a, b) => a + b, 0);
  expect(spread).toBeCloseTo(total);
  for (const element of ELEMENT_ORDER) {
    expect(byDay[element].length).toBe(7);
  }
});
