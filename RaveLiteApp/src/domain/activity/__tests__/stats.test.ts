import type {ElementId} from '../../../theme/elements';
import type {ActivityItem} from '../activity';
import {countsByElementByDay, windowStart} from '../stats';

const DAY = 86_400_000;
const NOON = new Date(2026, 8, 14, 12, 0);

const doneAt = (
  daysBack: number,
  element: ElementId,
  id: string,
): ActivityItem => ({
  id,
  at: NOON.getTime() - daysBack * DAY,
  element,
  points: 1,
  source: 'manual',
  label: 'Drill',
  ref: {store: 'journal', id},
});

it('counts each element per day across the window, oldest first', () => {
  const out = countsByElementByDay(
    [
      doneAt(0, 'fire', 'a'),
      doneAt(0, 'fire', 'b'),
      doneAt(6, 'water', 'c'),
      doneAt(7, 'air', 'outside'),
    ],
    7,
    NOON,
  );
  expect(out.fire).toEqual([0, 0, 0, 0, 0, 0, 2]);
  expect(out.water).toEqual([1, 0, 0, 0, 0, 0, 0]);
  expect(out.air).toEqual([0, 0, 0, 0, 0, 0, 0]);
  expect(Object.keys(out).sort()).toEqual([
    'air',
    'earth',
    'fire',
    'heart',
    'water',
  ]);
});

it('starts the window at local midnight n-1 days back', () => {
  expect(windowStart(7, NOON)).toEqual(new Date(2026, 8, 8));
});
