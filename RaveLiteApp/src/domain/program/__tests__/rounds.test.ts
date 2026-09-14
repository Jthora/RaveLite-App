import {EXERCISE_LIBRARY} from '../../exercises/library';
import {doneFields} from '../../ambient/pulsePayload';
import {setsForWeek} from '../progression';
import {defaultProgram, prescriptionsFor} from '../repository';
import {
  MAX_MOVES_PER_ROUND,
  PARTNER_POOL,
  TARGET_ROUNDS,
  groupIntoRounds,
} from '../rounds';
import {
  CLEARANCE_MS,
  MIN_GAP_MS,
  placeRounds,
  selectUpcomingRounds,
} from '../schedule';
import {TRACKS} from '../tracks';
import type {DayPrescription, TrackId} from '../types';

// Monday 14 Sep 2026 (local).
const MONDAY = new Date(2026, 8, 14);
const monday = prescriptionsFor(defaultProgram(MONDAY), MONDAY);
const totalSets = (ps: DayPrescription[]) => ps.reduce((s, p) => s + p.sets, 0);
const trackOf = (id: TrackId) => TRACKS.find(t => t.id === id)!;

/** Monday's tracks at a later program week. */
const mondayInWeek = (week: number): DayPrescription[] =>
  monday.map(p => ({...p, week, sets: setsForWeek(trackOf(p.trackId), week)}));

describe('track partners', () => {
  it('every partner is a library drill from another element', () => {
    const problems: string[] = [];
    for (const t of TRACKS) {
      expect(t.partners.length).toBeGreaterThan(0);
      for (const partner of t.partners) {
        const drill = EXERCISE_LIBRARY.find(e => e.id === partner.exerciseId);
        if (!drill) {
          problems.push(`${t.id}: ${partner.exerciseId} missing`);
        } else if (drill.element === t.element) {
          problems.push(`${t.id}: ${partner.exerciseId} is also ${t.element}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('groupIntoRounds', () => {
  it.each([1, 2, 3, 5, 9, 17])(
    'week %i: every set lands once, no track twice in a round',
    week => {
      const ps = mondayInWeek(week);
      const rounds = groupIntoRounds(ps);
      const moves = rounds.flatMap(r => r.moves);
      expect(moves).toHaveLength(totalSets(ps));
      for (const r of rounds) {
        const ids = r.moves.map(m => m.trackId);
        expect(new Set(ids).size).toBe(ids.length);
        expect(r.moves.length).toBeGreaterThan(0);
        expect(r.moves.length).toBeLessThanOrEqual(MAX_MOVES_PER_ROUND);
      }
      for (const p of ps) {
        const setIndexes = moves
          .filter(m => m.trackId === p.trackId)
          .map(m => m.setIndex);
        expect(setIndexes).toEqual(
          Array.from({length: p.sets}, (_, i) => i + 1),
        );
      }
    },
  );

  it('turns week 1 Monday into nine rounds of two or three moves', () => {
    expect(totalSets(monday)).toBe(24);
    const rounds = groupIntoRounds(monday);
    expect(rounds).toHaveLength(TARGET_ROUNDS);
    for (const r of rounds) {
      expect(r.moves.length).toBeGreaterThanOrEqual(2);
      expect(r.moves.length).toBeLessThanOrEqual(3);
    }
  });

  it('gives each round a partner from its lead move', () => {
    const rounds = groupIntoRounds(monday);
    for (const r of rounds) {
      const lead = trackOf(r.moves[0].trackId);
      expect(lead.partners.map(p => p.exerciseId)).toContain(
        r.partner?.exerciseId,
      );
    }
  });

  it('is empty on a rest day', () => {
    expect(groupIntoRounds([])).toEqual([]);
  });
});

describe('placeRounds', () => {
  const rounds = groupIntoRounds(monday);
  const blockedTs = [new Date(2026, 8, 14, 11, 0).getTime()];
  const fires = placeRounds({
    date: MONDAY,
    dayStart: '09:00',
    dayEnd: '21:00',
    rounds,
    blockedTs,
  });

  it('places one chime per round, apart and clear of plan chimes', () => {
    expect(fires).toHaveLength(rounds.length);
    for (let i = 1; i < fires.length; i++) {
      expect(fires[i].ts - fires[i - 1].ts).toBeGreaterThanOrEqual(MIN_GAP_MS);
    }
    for (const f of fires) {
      expect(Math.abs(f.ts - blockedTs[0])).toBeGreaterThanOrEqual(
        CLEARANCE_MS,
      );
    }
    expect(fires[0].id).toBe('sets:2026-09-14:round:1');
    expect(fires[0].prescription).toMatchObject({
      moves: rounds[0].moves,
      roundIndex: 1,
      rounds: rounds.length,
    });
  });

  it('spreads the rounds across the day', () => {
    expect(new Date(fires[0].ts).getHours()).toBeLessThan(11);
    expect(
      new Date(fires[fires.length - 1].ts).getHours(),
    ).toBeGreaterThanOrEqual(19);
  });
});

describe('selectUpcomingRounds', () => {
  const rounds = groupIntoRounds(monday);
  const fires = placeRounds({
    date: MONDAY,
    dayStart: '09:00',
    dayEnd: '21:00',
    rounds,
  });
  const base = {
    fires,
    prescriptions: monday,
    firedIds: new Set<string>(),
    now: MONDAY.getTime(),
    graceMs: 60_000,
  };
  const hasTrack = (id: TrackId) => (f: (typeof fires)[number]) =>
    f.prescription.moves!.some(m => m.trackId === id);

  it('keeps every round while nothing is done', () => {
    const r = selectUpcomingRounds({...base, doneByTrack: {}});
    expect(r.keep).toEqual(fires);
    expect(r.drop).toEqual([]);
  });

  it('sets done early retire the latest moves first', () => {
    const push = monday.find(p => p.trackId === 'push')!;
    const r = selectUpcomingRounds({
      ...base,
      doneByTrack: {push: {amount: push.setSize * (push.sets - 1)}},
    });
    const withPush = r.keep.filter(hasTrack('push'));
    expect(withPush.map(f => f.id)).toEqual([fires.find(hasTrack('push'))!.id]);
    expect(r.keep.length + r.drop.length).toBe(fires.length);
  });

  it('drops every round once the day is done', () => {
    const doneAll = Object.fromEntries(
      monday.map(p => [p.trackId, {amount: p.setSize * p.sets}]),
    );
    const r = selectUpcomingRounds({...base, doneByTrack: doneAll});
    expect(r.keep).toEqual([]);
    expect(r.drop).toHaveLength(fires.length);
  });

  it('never counts a round that already fired', () => {
    const r = selectUpcomingRounds({
      ...base,
      doneByTrack: {},
      firedIds: new Set([fires[0].id]),
    });
    expect(r.keep.map(f => f.id)).not.toContain(fires[0].id);
  });
});

describe('doneFields', () => {
  const [first] = placeRounds({
    date: MONDAY,
    dayStart: '09:00',
    dayEnd: '21:00',
    rounds: groupIntoRounds(monday),
  });

  it('records every move, the partner and the glass', () => {
    const rx = {...first.prescription, water: true};
    const [lead, ...rest] = rx.moves!;
    const fields = doneFields(rx, {amounts: {[lead.trackId]: 0}});
    expect(fields.moves).toEqual(
      rest.map(m => ({trackId: m.trackId, amount: m.amount})),
    );
    expect(fields).toMatchObject({
      partnerExerciseId: rx.partner!.exerciseId,
      partnerSec: rx.partner!.seconds,
      water: true,
    });
    expect(fields.trackId).toBeUndefined();
  });

  it('keeps a single set as track and amount', () => {
    const single = {
      trackId: 'push' as const,
      label: 'Push-ups',
      unit: 'reps' as const,
      amount: 5,
      setIndex: 1,
      sets: 4,
    };
    expect(doneFields(single, {amount: 7})).toEqual({
      trackId: 'push',
      amount: 7,
    });
  });
});

describe('smart partners', () => {
  it('lean toward the element with the least work this week', () => {
    const rounds = groupIntoRounds(monday, {
      balance: {fire: 30, earth: 30, air: 12, water: 0, heart: 12},
    });
    expect(rounds[0].partner?.element).toBe('water');
  });

  it('spread across the neglected elements through the day', () => {
    const rounds = groupIntoRounds(monday, {
      balance: {fire: 30, earth: 30, air: 0, water: 0, heart: 0},
    });
    const tally: Record<string, number> = {air: 0, water: 0, heart: 0};
    for (const r of rounds) {
      const element = r.partner!.element;
      tally[element] = (tally[element] ?? 0) + 1;
    }
    expect(Object.keys(tally).sort()).toEqual(['air', 'heart', 'water']);
    const counts = Object.values(tally);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it('never end a round with an element already in it', () => {
    const rounds = groupIntoRounds(monday, {
      balance: {fire: 0, earth: 0, air: 50, water: 50, heart: 50},
    });
    for (const r of rounds) {
      expect(r.moves.map(m => m.element)).not.toContain(r.partner?.element);
    }
  });

  it('draw from real drills filed under their own element', () => {
    for (const [element, options] of Object.entries(PARTNER_POOL)) {
      for (const option of options) {
        expect(
          EXERCISE_LIBRARY.find(e => e.id === option.exerciseId)?.element,
        ).toBe(element);
      }
    }
  });
});
