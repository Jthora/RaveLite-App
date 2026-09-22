import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {append} from '../../journal/journal';
import {defaultProgram} from '../../program/repository';
import {addEntry} from '../../training/repository';
import {attributeSheet, loadAttributes, reviewAttributes} from '../repository';
import {markRest} from '../../profile/restDays';
import type {AttributeId} from '../attributes';

const DAY = 86_400_000;
const NOW = new Date(2026, 8, 15, 12).getTime();

const standing = (id: AttributeId, now = NOW) =>
  attributeSheet(now).standings.find(s => s.attribute.id === id)!;

beforeEach(() => {
  store.clearAll();
  // A program that has been running a month, so the roll-up has days to read.
  store.set(
    KEYS.programState,
    JSON.stringify(defaultProgram(new Date(NOW - 30 * DAY))),
  );
});

/** A round of push-ups and squats, `back` days ago. */
function round(back: number) {
  append({
    at: NOW - back * DAY,
    kind: 'completion',
    exerciseId: 'fire.pushup-groove',
    element: 'fire',
    source: 'always-on',
    pulseId: `sets:day-${back}:round:1`,
    moves: [
      {trackId: 'push', amount: 10},
      {trackId: 'squat', amount: 15},
    ],
  });
}

it('rolls finished days up once, and leaves today out of what it saves', () => {
  for (let back = 1; back <= 5; back++) {
    round(back);
  }
  round(0);

  const state = reviewAttributes(NOW);
  expect(state.throughDay).toBe('2026-09-14');
  expect(state.byId.strength!.level).toBeGreaterThan(0);
  const saved = loadAttributes();
  expect(saved.byId.strength).toEqual(state.byId.strength);

  // Reviewing again the same day changes nothing.
  expect(reviewAttributes(NOW).byId.strength).toEqual(state.byId.strength);

  // Today is added live on top, and counted for the day it happened.
  const strength = standing('strength');
  expect(strength.today).toBeGreaterThan(0);
  expect(strength.idleDays).toBe(0);
  expect(loadAttributes().byId.strength!.xp).toBe(state.byId.strength!.xp);
});

it('rides along at half: squats lead Strength, and Power comes with them', () => {
  for (let back = 1; back <= 6; back++) {
    round(back);
  }
  const sheet = attributeSheet(NOW);
  const power = sheet.standings.find(s => s.attribute.id === 'power')!;
  const strength = sheet.standings.find(s => s.attribute.id === 'strength')!;
  expect(power.practice).toBeGreaterThan(0);
  expect(strength.practice).toBeGreaterThan(power.practice);
  expect(sheet.character.level).toBeGreaterThanOrEqual(1);
});

it('lets a passed test set the level past what practice can reach', () => {
  addEntry({at: NOW - 2 * DAY, kindId: 'builtin.plank', value: 200});
  const toughness = standing('toughness');
  // A 3:20 plank against a 3:45 perfect score.
  expect(toughness.tested).toBe(89);
  expect(toughness.testedBy?.eventId).toBe('plank');
  expect(toughness.level).toBe(89);
  expect(toughness.practice).toBeLessThan(89);
});

it('slides an attribute that has been left alone for a fortnight', () => {
  // Last worked on 23 Aug, so the three-week mark falls on 13 Sep — week 5,
  // the week after the deload, where a slide is allowed to happen.
  for (let back = 23; back <= 25; back++) {
    round(back);
  }
  const before = reviewAttributes(NOW - 20 * DAY).byId.strength!.level;
  store.delete(KEYS.attributesState);
  const after = reviewAttributes(NOW).byId.strength!;
  expect(before).toBeGreaterThan(0);
  expect(after.level).toBeLessThan(before);
  expect(after.lastFedDay).toBe('2026-08-23');
});

it('does not slide through an injury', () => {
  // The same fortnight and more away, but hurt the whole time.
  for (let back = 23; back <= 25; back++) {
    round(back);
  }
  const before = reviewAttributes(NOW - 20 * DAY).byId.strength!.level;
  store.delete(KEYS.attributesState);
  markRest('injured', NOW - 22 * DAY, NOW - DAY);
  const after = reviewAttributes(NOW).byId.strength!;
  expect(after.level).toBe(before);
});
