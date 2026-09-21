import {store} from '../../../storage';
import {authorProfile, saveProfile} from '../repository';
import {blockPieces} from '../../program/morning';
import {defaultProgram, prescriptionsFor} from '../../program/repository';
import {groupIntoRounds} from '../../program/rounds';
import {dayFocus} from '../../program/week';

/**
 * The promise: opening RaveLite up to other people does not change the
 * app its author uses.
 *
 * This snapshots the author's own program — the tracks, the doses, the
 * rounds and the week's mornings — as it stood on 20 Sep 2026, the day
 * before the profile work began. Kit gating, archetypes, day shapes and
 * packs all arrive afterwards, and every one of them must leave this
 * exactly as it is. A deliberate change to the author's program is a
 * deliberate edit to this file, with a reason in the commit.
 */

// Monday 14 Sep 2026, week 1: the program's own first week.
const MONDAY = new Date(2026, 8, 14);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

beforeEach(() => {
  store.clearAll();
  // These are the author's program; a fresh store is now a stranger's.
  saveProfile(authorProfile());
});

it("the author's Monday is unchanged", () => {
  const day = prescriptionsFor(defaultProgram(MONDAY), MONDAY);
  const shape = day.map(p => `${p.trackId} ${p.sets}×${p.setSize} ${p.unit}`);
  expect(shape).toEqual([
    'push 4×5 reps',
    'push-variants 2×4 reps',
    'row 4×6 reps',
    'pull 3×2 reps',
    'squat 4×10 reps',
    'legs-up 3×5 reps',
    'crunch 3×10 reps',
    'plank 3×20 seconds',
    'hang 3×15 seconds',
    'posture 4×10 reps',
    'breath 4×60 seconds',
    'mobility 4×30 seconds',
    'stillness 4×30 seconds',
    'pelvis 3×10 reps',
    'kicks 2×30 seconds',
    'flow 2×30 seconds',
  ]);
});

it("the author's rounds are unchanged", () => {
  const rounds = groupIntoRounds(
    prescriptionsFor(defaultProgram(MONDAY), MONDAY),
  );
  expect(rounds).toHaveLength(9);
  expect(
    rounds.map(r => r.moves.map(m => m.trackId).join(' + ')),
  ).toMatchSnapshot();
});

it("the author's week of mornings is unchanged", () => {
  const week = Array.from({length: 7}, (_, i) => {
    const date = new Date(MONDAY);
    date.setDate(MONDAY.getDate() + i);
    const focus = dayFocus(date, 1);
    const pieces = blockPieces(date, date.getTime()).map(p => p.exerciseId);
    return `${DAYS[date.getDay()]}: ${focus.block.title} — ${pieces.join(
      ', ',
    )}`;
  });
  expect(week).toEqual([
    'Mon: Kicks and flips — fire.roundhouse-kick, fire.kick-flip-foundations, water.front-split-progression',
    'Tue: Strides and staff — fire.backyard-strides, water.staff-combat-rounds, earth.standing-hip-airplane',
    'Wed: Easy run — fire.zone2-run, air.nasal-recovery-walk, water.calf-wall-stretch',
    'Thu: Dance basics — water.body-isolations, water.toprock, water.groove-combo',
    'Fri: Strikes, blocks and stances — fire.jab-cross, fire.block-drill, earth.stance-transitions',
    'Sat: Air Force test — fire.pushups, fire.situps, fire.run-2mi',
    'Sun: Yoga and a long walk — water.sun-salutation, air.long-walk, air.shadow-rope',
  ]);
});
