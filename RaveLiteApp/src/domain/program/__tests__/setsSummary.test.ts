import type {ElementId} from '../../../theme/elements';
import {meterFill, summarizeSets} from '../setsSummary';
import type {DayPrescription, TrackId} from '../types';

const rx = (
  trackId: TrackId,
  setSize: number,
  sets: number,
  element: ElementId = 'fire',
): DayPrescription => ({
  trackId,
  element,
  exerciseId: `x.${trackId}`,
  label: trackId,
  unit: 'reps',
  setSize,
  sets,
  week: 1,
  phase: 'build',
});

it('caps each track at its quota and counts sets done', () => {
  const summary = summarizeSets(
    [rx('push', 5, 4), rx('squat', 10, 4, 'earth')],
    {
      push: {amount: 30, sets: 6},
      squat: {amount: 10, sets: 1},
    },
  );
  expect(summary.done).toBe(5);
  expect(summary.total).toBe(8);
  expect(summary.tracks).toEqual([
    expect.objectContaining({
      trackId: 'push',
      element: 'fire',
      done: 20,
      total: 20,
      fill: 1,
    }),
    expect.objectContaining({
      trackId: 'squat',
      element: 'earth',
      done: 10,
      total: 40,
      fill: 0.25,
    }),
  ]);
});

it('keeps a meter between empty and full', () => {
  expect(meterFill(-3, 10)).toBe(0);
  expect(meterFill(15, 10)).toBe(1);
  expect(meterFill(0, 0)).toBe(0);
});
