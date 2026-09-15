import {projectGoal} from '../projection';
import {STANDARD_EVENTS, type StandardResult} from '../standards';

const event = (id: string) => STANDARD_EVENTS.find(e => e.id === id)!;
const NOW = new Date(2026, 8, 14, 12).getTime();
const DAY = 86_400_000;
/** Results `[daysAgo, value]`, oldest first. */
const results = (...points: [number, number][]): StandardResult[] =>
  points.map(([ago, value]) => ({at: NOW - ago * DAY, value}));

it('needs two tests at least a week apart in the last four months', () => {
  const pullups = event('pullups');
  expect(projectGoal(pullups, [], 17, NOW)).toEqual({kind: 'need-more'});
  expect(projectGoal(pullups, results([0, 8]), 17, NOW).kind).toBe('need-more');
  expect(projectGoal(pullups, results([3, 7], [0, 8]), 17, NOW).kind).toBe(
    'need-more',
  );
  expect(projectGoal(pullups, results([200, 4], [190, 6]), 17, NOW).kind).toBe(
    'need-more',
  );
});

it('dates the goal where the trend reaches it', () => {
  // Two reps every two weeks: 10 now, 17 in 49 days.
  const pullups = projectGoal(
    event('pullups'),
    results([28, 6], [14, 8], [0, 10]),
    17,
    NOW,
  );
  expect(pullups.kind).toBe('on-pace');
  expect(pullups.kind === 'on-pace' && (pullups.at - NOW) / DAY).toBeCloseTo(
    49,
  );

  // A minute faster a month: 25:00 now, 20:54 in 123 days.
  const run = projectGoal(
    event('run-3mi'),
    results([30, 26 * 60], [0, 25 * 60]),
    20 * 60 + 54,
    NOW,
  );
  expect(run.kind === 'on-pace' && (run.at - NOW) / DAY).toBeCloseTo(123);
});

it('says so when a test reached it, when the trend is there, or when it is not on pace', () => {
  const pullups = event('pullups');
  expect(projectGoal(pullups, results([10, 12], [0, 17]), 17, NOW)).toEqual({
    kind: 'reached',
  });
  // No test reached 17, but the trend through them already has.
  expect(
    projectGoal(pullups, results([20, 10], [10, 16.9], [0, 16.8]), 17, NOW)
      .kind,
  ).toBe('close');
  expect(projectGoal(pullups, results([14, 9], [0, 8]), 17, NOW).kind).toBe(
    'not-yet',
  );
  // Far too slow: more than three years out.
  expect(projectGoal(pullups, results([100, 6], [0, 6.1]), 17, NOW).kind).toBe(
    'not-yet',
  );
});
