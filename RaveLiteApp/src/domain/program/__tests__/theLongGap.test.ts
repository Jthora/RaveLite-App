/**
 * Pass 4: the app was shut in a drawer. Three days, a month, or more than
 * a year later it is opened again, and what it says then is the whole
 * question — nobody comes back to a screen that says they failed 400
 * times.
 */
import {reconcileSetsNow, setsToday} from '../../ambient/setScheduler';
import {append} from '../../journal/journal';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
} from '../../profile/repository';
import {streakDays} from '../../activity/stats';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {defaultProgram, loadProgram, prescriptionsFor} from '../repository';
import {TRACKS} from '../tracks';

const DAY_MS = 86_400_000;
const NOW = new Date(2026, 8, 14, 9);

/** A program that was going well, and then a gap of `gap` days. */
function trainedThenGone(gap: number): void {
  store.clearAll();
  __resetProfileCache();
  saveProfile(authorProfile());
  const started = new Date(NOW.getTime() - (gap + 30) * DAY_MS);
  const program = defaultProgram(started);
  program.tracks.push = {
    ...program.tracks.push,
    sets: 8,
    steppedOn: '2025-01-01',
  };
  store.set(KEYS.programState, JSON.stringify(program));
  // A month of training, ending `gap` days ago.
  for (let back = gap + 30; back > gap; back--) {
    const day = new Date(NOW.getTime() - back * DAY_MS);
    append({
      kind: 'completion',
      at: day.getTime(),
      exerciseId: 'fire.pushups',
      element: 'fire',
      source: 'manual',
      trackId: 'push',
      amount: 80,
    });
  }
}

describe.each([
  ['three days', 3],
  ['a month', 30],
  ['four hundred days', 400],
])('back after %s', (_name, gap) => {
  it('builds a day that can be done, and says nothing absurd', () => {
    trainedThenGone(gap);
    expect(() => reconcileSetsNow(NOW.getTime())).not.toThrow();

    const program = loadProgram(NOW);
    for (const track of TRACKS) {
      const state = program.tracks[track.id];
      expect({
        id: track.id,
        ok:
          (state.sets ?? 1) >= 1 &&
          (state.sets ?? 1) <= track.maxSets &&
          state.rung >= 0,
      }).toEqual({id: track.id, ok: true});
    }

    const asks = prescriptionsFor(program, NOW);
    expect(asks.length).toBeGreaterThan(0);
    for (const ask of asks) {
      expect({
        id: ask.trackId,
        ok: ask.sets >= 1 && ask.setSize >= 1 && Number.isFinite(ask.week),
      }).toEqual({id: ask.trackId, ok: true});
    }

    // The day is a day, not a year of catching up.
    const today = setsToday(NOW.getTime());
    expect(today.fires.length).toBeLessThanOrEqual(40);
    expect(today.fires.length).toBeGreaterThan(0);
    // And the streak is honest: nothing today yet.
    expect(streakDays(NOW)).toBe(0);
  });
});
