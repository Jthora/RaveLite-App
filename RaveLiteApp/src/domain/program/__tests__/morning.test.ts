import {store} from '../../../storage';
import {authorProfile, saveProfile} from '../../profile/repository';
import {KEYS} from '../../../storage/keys';
import {drillForPlanChime} from '../../conditions/weather';
import {DEFAULT_PLAN} from '../../reminders/defaultPlan';
import {expandPlanToFires, planPulseId} from '../../reminders/expandPlan';
import {pickDrillForSlotSeeded} from '../../reminders/scheduler';
import {addEntry} from '../../training/repository';
import {plannedDrill} from '../morning';
import {defaultProgram} from '../repository';
import {SATURDAY_TESTS} from '../week';

// Monday 14 Sep 2026 starts the program.
const MONDAY = new Date(2026, 8, 14);
const morning = DEFAULT_PLAN.windows.find(w => w.id === 'backyard-session')!;

/** The Morning Session's chimes on `date`, with the drill each asks for. */
function chimesOn(date: Date) {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return expandPlanToFires(
    DEFAULT_PLAN,
    midnight.getTime(),
    midnight.getTime() + 86_399_999,
  )
    .filter(fire => fire.windowId === morning.id)
    .map(fire => ({
      fire,
      ...plannedDrill(
        morning.slots[fire.slotIndex],
        morning,
        planPulseId(fire),
        fire.ts,
      ),
    }));
}

beforeEach(() => {
  store.clearAll();
  // These are the author's program; a fresh store is now a stranger's.
  saveProfile(authorProfile());
  store.set(KEYS.programState, JSON.stringify(defaultProgram(MONDAY)));
});

it("chimes Monday's block piece by piece at 05:45, 06:10 and 06:35", () => {
  const chimes = chimesOn(MONDAY);
  expect(
    chimes.map(c => new Date(c.fire.ts).toTimeString().slice(0, 5)),
  ).toEqual(['05:45', '06:10', '06:35']);
  expect(chimes.map(c => c.drill?.id)).toEqual([
    'fire.roundhouse-kick',
    'fire.kick-flip-foundations',
    'water.front-split-progression',
  ]);
  expect(chimes.map(c => c.detail)).toEqual([
    'Kicks and flips · 1 of 3',
    'Kicks and flips · 2 of 3',
    'Kicks and flips · 3 of 3',
  ]);
});

it("a week 2 Saturday's morning is the Marine PFT", () => {
  const chimes = chimesOn(new Date(2026, 8, 26));
  expect(chimes.map(c => c.drill?.id)).toEqual(
    SATURDAY_TESTS['usmc-pft'].block.pieces,
  );
});

it('other slots still pick from the library, and the weather keeps the piece', () => {
  const water = DEFAULT_PLAN.windows[0];
  const id = 'plan:hydration:0:1';
  expect(plannedDrill(water.slots[0], water, id, MONDAY.getTime())).toEqual({
    drill: pickDrillForSlotSeeded(water.slots[0], id),
  });
  const [first] = chimesOn(MONDAY);
  expect(
    drillForPlanChime(
      morning.slots[0],
      planPulseId(first.fire),
      first.fire.ts,
      morning,
    ),
  ).toEqual({drill: first.drill, detail: 'Kicks and flips · 1 of 3'});
});

it('on a run day the run plan takes the piece, and the chime says the run', () => {
  // A 25:00 3-mile ten days before program week 5's Tuesday (13 Oct 2026).
  const tuesday = new Date(2026, 9, 13);
  addEntry({
    at: tuesday.getTime() - 10 * 86_400_000,
    kindId: 'builtin.run-3mi',
    value: 25 * 60,
  });
  const [first] = chimesOn(tuesday);
  expect(first.drill?.id).toBe('fire.interval-run');
  expect(first.detail).toBe('6 × 400 m in 1:59 · 1 of 3');
});
