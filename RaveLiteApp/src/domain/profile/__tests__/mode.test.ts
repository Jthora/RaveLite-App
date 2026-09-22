/**
 * Modes, end to end: each one has to actually do the thing it promises in
 * the row that offers it, and all of them have to end by themselves.
 */
import {
  activeMode,
  densityUnder,
  factsUnder,
  modeLabel,
  MODES,
  rampPaused,
  startMode,
  trainsUnder,
} from '../mode';
import {AUTHOR_FACTS, canDo, usableDrills, type Facts} from '../kit';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {
  __resetProfileCache,
  clearMode,
  dayDensity,
  loadFacts,
  setMode,
  trainsToday,
} from '../repository';
import {loadProgram, prescriptionsFor} from '../../program/repository';
import {reviewTrack} from '../../program/adapt';
import {TRACKS} from '../../program/tracks';
import {store} from '../../../storage';

// A Sunday morning, so a mode started "today" has a day to run.
const NOW = new Date(2026, 8, 20, 9, 0).getTime();
const SUNDAY = new Date(2026, 8, 20, 9, 0);
const MONDAY = new Date(2026, 8, 21, 9, 0);

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

const drill = (id: string) => EXERCISE_LIBRARY.find(e => e.id === id)!;

it('every mode ends by itself, or says it must be cleared by hand', () => {
  for (const spec of MODES) {
    const mode = startMode(spec.id, NOW)!;
    expect(mode.startedAt).toBe(NOW);
    if (spec.days === undefined) {
      // Only an injury waits on a person, because only a person knows.
      expect(spec.id).toBe('injured');
      expect(mode.expiresAt).toBeUndefined();
    } else {
      expect(mode.expiresAt).toBeGreaterThan(NOW);
      expect(activeMode(mode, mode.expiresAt! + 1)).toBeUndefined();
      expect(activeMode(mode, mode.expiresAt! - 1)).toBe(mode);
    }
  }
});

it('a rest day started in the morning lasts the day, not 24 hours', () => {
  const rest = startMode('rest', NOW)!;
  const elevenPm = new Date(2026, 8, 20, 23, 0).getTime();
  const tomorrowMorning = new Date(2026, 8, 21, 9, 0).getTime();

  expect(activeMode(rest, elevenPm)).toBe(rest);
  expect(activeMode(rest, tomorrowMorning)).toBeUndefined();
});

it('travelling puts you in a hotel room, whatever you own at home', () => {
  const away = startMode('travelling', NOW)!;
  const facts = factsUnder(AUTHOR_FACTS, away);

  // A floor and a wall, plus what you carry — the staff and ball come,
  // the bricks stay home.
  expect(facts.kit).toEqual(['floor', 'wall', 'staff', 'ball']);
  expect(facts.noise).toBe('quiet');
  // The author's porch and bricks are 300 miles away.
  expect(canDo(drill('fire.porch-pullup'), facts)).toBe(false);
  expect(usableDrills(facts).length).toBeLessThan(
    usableDrills(AUTHOR_FACTS).length,
  );
  // But there is still a program, not an apology.
  expect(usableDrills(facts).length).toBeGreaterThan(20);
});

it('an injury drops what loads it, and nothing else', () => {
  const hurt = startMode('injured', NOW, {region: 'shoulder'})!;
  const facts = factsUnder(AUTHOR_FACTS, hurt);

  expect(facts.injured).toBe('shoulder');
  expect(canDo(drill('fire.porch-pullup'), facts)).toBe(false);
  // Legs have nothing to do with a shoulder.
  expect(canDo(drill('earth.squat'), facts)).toBe(true);
  expect(facts.kit).toEqual(AUTHOR_FACTS.kit);
});

it('the ramp stops reading the days a mode asked you to take off', () => {
  const track = TRACKS[0];
  const state = {
    enabled: true,
    rung: 0,
    testMax: 20,
    sets: 6,
    steppedOn: '2026-09-01',
  };
  // Three training days with nothing done: normally a break, and a cut.
  const days = [
    {day: '2026-09-18', prescribed: 60, done: 0},
    {day: '2026-09-19', prescribed: 60, done: 0},
    {day: '2026-09-20', prescribed: 60, done: 0},
  ];

  const unpaused = reviewTrack({
    track,
    state,
    days,
    today: '2026-09-20',
    deload: false,
  });
  expect(unpaused.lastReview?.change).toBe('rebuild');
  expect(unpaused.sets).toBeLessThan(6);

  const paused = reviewTrack({
    track,
    state,
    days,
    today: '2026-09-20',
    deload: false,
    paused: true,
  });
  expect(paused.lastReview?.change).toBe('paused');
  expect(paused.sets).toBe(6);
  // The step clock is not frozen: the rest days are left out of the
  // review once the mode lifts (`profile/restDays.ts`), so there is no
  // week of rest to pass judgement on, and a day off no longer pushes
  // the next step up back by a week.
  expect(paused.steppedOn).toBe('2026-09-01');
});

it('a rest day asks for nothing at all, and then it is over', () => {
  const program = loadProgram(SUNDAY);
  // Sunday has work in it, or this proves nothing.
  expect(prescriptionsFor(program, SUNDAY).length).toBeGreaterThan(0);

  setMode('rest', {}, NOW);
  expect(trainsToday(NOW)).toBe(false);
  expect(prescriptionsFor(program, SUNDAY)).toEqual([]);

  // Tomorrow it is simply not there any more. Nothing had to switch it
  // off, and nothing had to be running for it to lapse.
  expect(trainsToday(MONDAY.getTime())).toBe(true);
  expect(prescriptionsFor(program, MONDAY).length).toBeGreaterThan(0);
});

it('a festival keeps training, but much less of it', () => {
  const full = dayDensity(NOW);
  setMode('festival', {}, NOW);
  const during = dayDensity(NOW);

  expect(during).toBeLessThan(full);
  expect(during).toBeGreaterThan(0);
  expect(trainsUnder(startMode('festival', NOW))).toBe(true);
  expect(rampPaused(startMode('festival', NOW))).toBe(true);
});

it('clearing a mode puts the room back exactly as it was', () => {
  const before = loadFacts(NOW);
  setMode('travelling', {}, NOW);
  expect(loadFacts(NOW).kit).toEqual(['floor', 'wall']);

  clearMode();
  expect(loadFacts(NOW)).toEqual(before);
  expect(densityUnder(1, undefined)).toBe(1);
});

it('says how long is left, in words worth reading', () => {
  const away = startMode('travelling', NOW)!;
  expect(modeLabel(away, NOW)).toBe('Away from home · 7 days left');

  const hurt = startMode('injured', NOW, {region: 'knee'})!;
  expect(modeLabel(hurt, NOW)).toBe('Hurt somewhere · knee');

  const rest = startMode('rest', NOW)!;
  expect(modeLabel(rest, NOW)).toBe('Taking the day off · today');
});

it('packs the light things you carry when you travel, not the bricks', () => {
  const home = {
    kit: ['floor', 'poi', 'band', 'bricks'],
    noise: 'normal',
    corrections: [],
  } as unknown as Facts;
  const away = factsUnder(home, startMode('travelling', 0)!);
  expect(away.kit).toEqual(
    expect.arrayContaining(['floor', 'wall', 'poi', 'band']),
  );
  expect(away.kit).not.toContain('bricks');
});
