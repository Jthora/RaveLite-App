import {canGoInside} from '../../conditions/adapt';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {isSweaty} from '../../exercises/sweat';
import {STANDARD_EVENTS} from '../../standards/standards';
import {phaseForWeek} from '../progression';
import {defaultProgram, prescriptionsFor} from '../repository';
import {PARTNER_POOL, groupIntoRounds} from '../rounds';
import {TRACKS} from '../tracks';
import type {TrackId} from '../types';
import {
  ATTRIBUTES,
  DAILY_CORE,
  FOCUS_PARTNERS,
  FOCUS_TRACK,
  FOCUS_WHEEL,
  SATURDAY_TESTS,
  TEST_ROTATION,
  dayFocus,
  testForWeek,
} from '../week';

const drill = (id: string) => EXERCISE_LIBRARY.find(e => e.id === id);

// Monday 14 Sep 2026 starts the program.
const MONDAY = new Date(2026, 8, 14);
const TUESDAY = new Date(2026, 8, 15);

describe('focus wheel', () => {
  it('rotates each attribute outside the daily core twice a week, never more than four days apart', () => {
    const rotating = ATTRIBUTES.map(a => a.id).filter(
      id => !DAILY_CORE.includes(id),
    );
    expect(rotating).toHaveLength(9);
    for (const id of rotating) {
      const days = FOCUS_WHEEL.flatMap((d, weekday) =>
        d.focus.includes(id) ? [weekday] : [],
      );
      expect(days).toHaveLength(2);
      const gaps = [days[1] - days[0], days[0] + 7 - days[1]];
      expect(Math.max(...gaps)).toBeLessThanOrEqual(4);
    }
    for (const day of FOCUS_WHEEL) {
      expect(day.focus.filter(id => DAILY_CORE.includes(id))).toEqual([]);
      expect(day.focus.length).toBeGreaterThanOrEqual(2);
      expect(day.focus.length).toBeLessThanOrEqual(3);
    }
  });

  it('gives every morning a block of three real drills', () => {
    const blocks = [
      ...FOCUS_WHEEL.flatMap(d => (d.block ? [d.block] : [])),
      ...Object.values(SATURDAY_TESTS).map(test => test.block),
    ];
    expect(blocks).toHaveLength(10);
    for (const block of blocks) {
      expect(block.pieces).toHaveLength(3);
      expect(block.pieces.filter(id => !drill(id))).toEqual([]);
    }
  });

  it('rotates the Saturday test with the block, max tests in the deload week', () => {
    expect([1, 2, 3, 4, 5].map(testForWeek)).toEqual([
      'usaf',
      'usmc-pft',
      'usmc-cft',
      'max',
      'usaf',
    ]);
    for (let week = 1; week <= 12; week++) {
      expect(testForWeek(week) === 'max').toBe(phaseForWeek(week) === 'deload');
    }
    const events = new Set(STANDARD_EVENTS.map(e => e.id));
    for (const id of TEST_ROTATION) {
      expect(SATURDAY_TESTS[id].events.filter(e => !events.has(e))).toEqual([]);
    }
  });

  it('knows the day: Monday leans on Power, Mobility and Presence; a week 2 Saturday is the Marine PFT', () => {
    const monday = dayFocus(MONDAY, 1);
    expect(monday.focus).toEqual(['power', 'mobility', 'presence']);
    expect(monday.block.title).toBe('Kicks and flips');
    expect(monday.test).toBeUndefined();
    const saturday = dayFocus(new Date(2026, 8, 26), 2);
    expect(saturday.test?.id).toBe('usmc-pft');
    expect(saturday.block).toBe(SATURDAY_TESTS['usmc-pft'].block);
  });
});

describe('dry daytime', () => {
  const roundDrills = [
    ...TRACKS.flatMap(tr => [
      ...tr.ladder.map(r => r.exerciseId),
      ...tr.partners.map(p => p.exerciseId),
    ]),
    ...Object.values(PARTNER_POOL).flatMap(options =>
      options.map(p => p.exerciseId),
    ),
  ];
  const focusDrills = Object.values(FOCUS_PARTNERS).flatMap(options =>
    (options ?? []).map(p => p.exerciseId),
  );

  it('keeps sweat out of the rounds: every rung and partner is dry', () => {
    const all = [...roundDrills, ...focusDrills];
    expect(all.filter(id => !drill(id))).toEqual([]);
    expect(all.filter(id => isSweaty(drill(id)!))).toEqual([]);
  });

  it('focus partners fit indoors, at the desk or on the mat', () => {
    expect(focusDrills.filter(id => !canGoInside(drill(id)!))).toEqual([]);
  });

  it('a focus day adds a set to its dry track', () => {
    const program = defaultProgram(MONDAY);
    const sets = (date: Date, id: TrackId) =>
      prescriptionsFor(program, date).find(p => p.trackId === id)!.sets;
    // Monday is Mobility and Presence; Tuesday is neither.
    expect(sets(MONDAY, 'mobility')).toBe(sets(TUESDAY, 'mobility') + 1);
    expect(sets(MONDAY, 'stillness')).toBe(sets(TUESDAY, 'stillness') + 1);
    expect(sets(MONDAY, 'breath')).toBe(sets(TUESDAY, 'breath'));
    expect(Object.keys(FOCUS_TRACK).sort()).toEqual([
      'dexterity',
      'mobility',
      'presence',
      'recovery',
    ]);
  });

  it("ends every second round on the day's focus", () => {
    const monday = prescriptionsFor(defaultProgram(MONDAY), MONDAY);
    const focus = dayFocus(MONDAY, 1).focus;
    const options = focus.flatMap(a =>
      (FOCUS_PARTNERS[a] ?? []).map(p => p.exerciseId),
    );
    const rounds = groupIntoRounds(monday, {focus});
    const focusRounds = rounds.filter((_, i) => i % 2 === 1);
    expect(focusRounds.length).toBeGreaterThan(0);
    for (const r of focusRounds) {
      expect(options).toContain(r.partner?.exerciseId);
      expect(r.moves.map(m => m.element)).not.toContain(r.partner?.element);
    }
  });
});
