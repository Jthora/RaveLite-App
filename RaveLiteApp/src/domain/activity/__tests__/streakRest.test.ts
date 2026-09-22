import {store} from '../../../storage';
import {append} from '../../journal/journal';
import {markRest} from '../../profile/restDays';
import {streakDays} from '../stats';

const at = (day: number, h = 12) => new Date(2026, 8, day, h).getTime();

function did(day: number): void {
  append({
    kind: 'completion',
    at: at(day),
    exerciseId: 'air.chin-tuck',
    element: 'air',
    source: 'manual',
  });
}

beforeEach(() => store.clearAll());

it('does not read zero in the morning before the first Done', () => {
  did(18);
  did(19);
  did(20);
  expect(streakDays(new Date(at(21, 6)))).toBe(3);
  did(21);
  expect(streakDays(new Date(at(21, 13)))).toBe(4);
});

it('keeps a streak through a rest day, without counting it', () => {
  did(17);
  did(18);
  markRest('rest', at(19), at(19));
  did(20);
  expect(streakDays(new Date(at(20, 20)))).toBe(3);
});

it('still breaks on a day that was not rest', () => {
  did(17);
  did(18);
  did(20);
  expect(streakDays(new Date(at(20, 20)))).toBe(1);
});
