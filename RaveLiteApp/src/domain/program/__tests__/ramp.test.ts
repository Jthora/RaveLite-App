import {pushupRamp} from '../ramp';
import {defaultProgram} from '../repository';
import type {ProgramState, TrackState} from '../types';

// Monday 14 Sep 2026 starts the program: week 1.
const MONDAY = new Date(2026, 8, 14, 12);
const DAY = 86_400_000;

function withPush(
  push: Partial<TrackState>,
  variants: Partial<TrackState> = {},
) {
  const program = defaultProgram(MONDAY);
  const next: ProgramState = {
    ...program,
    tracks: {
      ...program.tracks,
      push: {...program.tracks.push, ...push},
      'push-variants': {...program.tracks['push-variants'], ...variants},
    },
  };
  return next;
}

it('at the assumed maxes, says the sets top out and what max reaches 200', () => {
  // Push max 10 (sets of 5, at most 12) and variants 8 (sets of 4, at most 6).
  expect(pushupRamp(defaultProgram(MONDAY), MONDAY.getTime())).toEqual({
    kind: 'capped',
    most: 84,
    needMax: 29,
  });
});

it('dates 200 a day climbing a set a week, holding on the deload week', () => {
  // Sets of 20 push-ups and 4 variants: 88 today, 204 after six build weeks.
  const ramp = pushupRamp(
    withPush({testMax: 40, sets: 4}, {sets: 2}),
    MONDAY.getTime(),
  );
  expect(ramp.kind).toBe('on-pace');
  expect(ramp.kind === 'on-pace' && ramp.weeks).toBe(6);
  expect(ramp.kind === 'on-pace' && (ramp.at - MONDAY.getTime()) / DAY).toBe(
    42,
  );
});

it("says so when today's sets already add up to 200", () => {
  expect(
    pushupRamp(withPush({testMax: 40, sets: 12}), MONDAY.getTime()),
  ).toEqual({kind: 'reached'});
});
