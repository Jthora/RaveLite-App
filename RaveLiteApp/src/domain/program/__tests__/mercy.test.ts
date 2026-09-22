import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {append} from '../../journal/journal';
import {setActiveHours} from '../../ambient/activeHours';
import {markRest} from '../../profile/restDays';
import {
  __resetProfileCache,
  authorProfile,
  clearMode,
  saveProfile,
  setMode,
} from '../../profile/repository';
import {excuseSuppressedRound} from '../../ambient/setScheduler';
import {
  defaultProgram,
  prescriptionsFor,
  recordPrescribed,
  reviewProgram,
} from '../repository';
import type {ProgramState} from '../types';

/**
 * Rest must not read as quitting once it is over. Before this, the review
 * asked "is a mode on now?" the morning after, read a rest day's empty ask
 * as a full one, and read a track switched off and on as a break.
 */

// Program started Monday 7 Sep 2026; reviewed on Monday 14 Sep.
const START = new Date(2026, 8, 7, 9);
const MONDAY = new Date(2026, 8, 14, 6).getTime();
const dayKey = (i: number) => `2026-09-${String(7 + i).padStart(2, '0')}`;
const noon = (i: number) => new Date(2026, 8, 7 + i, 12);

function program(): ProgramState {
  const p = defaultProgram(START);
  p.tracks.push = {...p.tracks.push, sets: 6, steppedOn: '2026-08-01'};
  store.set(KEYS.programState, JSON.stringify(p));
  return p;
}

/** Record the day's asks, and log the push ask as done in full. */
function trainDay(p: ProgramState, i: number): void {
  const asks = prescriptionsFor(p, noon(i));
  recordPrescribed(dayKey(i), asks);
  const ask = asks.find(a => a.trackId === 'push')!;
  append({
    kind: 'completion',
    at: noon(i).getTime(),
    exerciseId: ask.exerciseId,
    element: 'fire',
    source: 'manual',
    trackId: 'push',
    amount: ask.setSize * ask.sets,
  });
}

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  saveProfile(authorProfile());
});

it('reads the last days of a festival as rest, not as a break', () => {
  const p = program();
  for (let i = 0; i < 4; i++) {
    trainDay(p, i);
  }
  // Friday to Sunday at a festival: nothing logged, and the mode is over
  // by Monday's review.
  setMode('festival', {}, noon(4).getTime());
  for (let i = 4; i < 7; i++) {
    recordPrescribed(dayKey(i), prescriptionsFor(p, noon(i)));
  }
  clearMode(noon(6).getTime());

  const push = reviewProgram(MONDAY).tracks.push;
  // Four good days: a set up, not "back from a break" at 80%.
  expect(push.lastReview?.change).toBe('up');
  expect(push.sets).toBe(7);
});

it('reads a rest day recorded with no asks as nothing asked', () => {
  const p = program();
  for (let i = 0; i < 4; i++) {
    trainDay(p, i);
  }
  // Three days recorded empty — a rest day asks nothing — with no log.
  for (let i = 4; i < 7; i++) {
    recordPrescribed(dayKey(i), []);
  }
  expect(reviewProgram(MONDAY).tracks.push.lastReview?.change).toBe('up');
});

it('does not read a track switched off and on again as a break', () => {
  const p = program();
  for (let i = 0; i < 4; i++) {
    trainDay(p, i);
  }
  // Push was off for three days: the day records have no push in them.
  for (let i = 4; i < 7; i++) {
    const asks = prescriptionsFor(p, noon(i)).filter(a => a.trackId !== 'push');
    recordPrescribed(dayKey(i), asks);
  }
  expect(reviewProgram(MONDAY).tracks.push.lastReview?.change).not.toBe(
    'rebuild',
  );
});

it('does not ask for sets on a day My day is switched off', () => {
  const p = program();
  // Monday to Friday only (bit 0 = Monday).
  setActiveHours({start: '05:00', end: '21:00', daysMask: 0b0011111});
  expect(prescriptionsFor(p, noon(5))).toEqual([]); // Saturday 12 Sep
  expect(prescriptionsFor(p, noon(0)).length).toBeGreaterThan(0);
});

it('does not hold a round nobody heard against its day', () => {
  const p = program();
  for (let i = 0; i < 7; i++) {
    const asks = prescriptionsFor(p, noon(i));
    recordPrescribed(dayKey(i), asks);
    const ask = asks.find(a => a.trackId === 'push')!;
    // Half done; the other half was in rounds that never sounded.
    const half = (ask.setSize * ask.sets) / 2;
    append({
      kind: 'completion',
      at: noon(i).getTime(),
      exerciseId: ask.exerciseId,
      element: 'fire',
      source: 'manual',
      trackId: 'push',
      amount: half,
    });
    excuseSuppressedRound({
      pulseId: `sets:${dayKey(i)}:round:9`,
      at: noon(i).getTime(),
      prescription: {
        trackId: 'push',
        label: ask.label,
        unit: ask.unit,
        amount: half,
        setIndex: 1,
        sets: 1,
      },
    });
  }
  // Everything that sounded was done: that is a full week, not 50%.
  expect(reviewProgram(MONDAY).tracks.push.lastReview).toMatchObject({
    change: 'up',
    ratio: 1,
  });
});

it('keeps a marked rest day as rest even after the mode is gone', () => {
  const p = program();
  for (let i = 0; i < 7; i++) {
    if (i >= 4) {
      recordPrescribed(dayKey(i), prescriptionsFor(p, noon(i)));
      markRest('rest', noon(i).getTime(), noon(i).getTime());
    } else {
      trainDay(p, i);
    }
  }
  expect(reviewProgram(MONDAY).tracks.push.lastReview?.change).toBe('up');
});
