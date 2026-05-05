/**
 * Tests for the new aggregates that drive InsightsPanel.
 */
import {append} from '../journal';
import {
  completionsByDay,
  completionsLastNDaysByElement,
} from '../stats';
import {store} from '../../../storage';
import type {ElementId} from '../../../theme/elements';

function logAt(daysAgo: number, element: ElementId) {
  const at = Date.now() - daysAgo * 86400_000;
  append({
    kind: 'completion',
    at,
    exerciseId: 'x',
    element,
    source: 'manual',
  });
}

beforeEach(() => store.clearAll());

describe('completionsByDay', () => {
  test('returns array of length n, oldest → newest', () => {
    logAt(0, 'fire');
    logAt(0, 'air');
    logAt(2, 'water');
    const arr = completionsByDay(7);
    expect(arr).toHaveLength(7);
    expect(arr[6]).toBe(2); // today
    expect(arr[4]).toBe(1); // 2 days ago
    expect(arr[0]).toBe(0); // 6 days ago
  });

  test('all zeros when no entries', () => {
    expect(completionsByDay(5)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('completionsLastNDaysByElement', () => {
  test('counts each element separately within window', () => {
    logAt(0, 'fire');
    logAt(1, 'fire');
    logAt(2, 'water');
    logAt(8, 'air'); // outside 7d window
    const totals = completionsLastNDaysByElement(7);
    expect(totals.fire).toBe(2);
    expect(totals.water).toBe(1);
    expect(totals.air).toBe(0);
    expect(totals.earth).toBe(0);
    expect(totals.heart).toBe(0);
  });

  test('empty journal returns all zeros', () => {
    expect(completionsLastNDaysByElement(7)).toEqual({
      fire: 0,
      air: 0,
      earth: 0,
      water: 0,
      heart: 0,
    });
  });
});
