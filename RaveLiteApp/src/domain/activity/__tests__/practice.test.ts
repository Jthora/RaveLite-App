import {store} from '../../../storage';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {attributesForItem} from '../../attributes/trains';
import {activityForDay} from '../activity';
import {
  SKILL_GROUPS,
  formatCount,
  recordPractice,
  skillDrill,
  tallyPractice,
  unitFor,
} from '../practice';

const drill = (id: string) => EXERCISE_LIBRARY.find(e => e.id === id)!;

beforeEach(() => store.clearAll());

it('counts each skill in the unit it is taught in', () => {
  expect(unitFor(drill('fire.roundhouse-kick'))).toBe('reps');
  expect(unitFor(drill('water.toprock'))).toBe('eights');
  expect(unitFor(drill('heart.standing-post'))).toBe('sec');
  expect(formatCount(6, 'eights')).toBe('6 × 8');
  expect(formatCount(42, 'reps')).toBe('42 reps');
  expect(formatCount(180, 'sec')).toBe('3:00');
});

it('the curriculum only points at drills the library really has', () => {
  const missing = SKILL_GROUPS.flatMap(g =>
    g.ids.filter(id => skillDrill(id) === undefined),
  );
  expect(missing).toEqual([]);
});

it('logs what was done and how long it took, and the day shows it', () => {
  recordPractice({
    exercise: drill('water.toprock'),
    amount: 6,
    unit: 'eights',
    seconds: 8 * 60,
  });
  const [item] = activityForDay();
  expect(item).toMatchObject({
    label: 'Toprock',
    detail: '6 × 8',
    element: 'water',
    amount: 6,
  });
  // Eight minutes of drilling is worth eight points, like any long drill —
  // which is how Agility and Dexterity finally hear about the dancing.
  expect(item.points).toBe(8);
  expect(attributesForItem(item).map(a => a.id)).toEqual([
    'agility',
    'dexterity',
  ]);
});

it('adds a week up, drill by drill', () => {
  const kick = drill('fire.roundhouse-kick');
  recordPractice({exercise: kick, amount: 20, unit: 'reps', seconds: 120});
  recordPractice({exercise: kick, amount: 30, unit: 'reps', seconds: 180});
  const tally = tallyPractice(activityForDay());
  expect(tally.get(kick.id)).toEqual({times: 2, amount: 50});
  // A round's sets are the program's business, not the curriculum's.
  expect(tally.has('fire.pushup-groove')).toBe(false);
});
