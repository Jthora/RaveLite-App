import {store} from '../../../storage';
import {loadEntries} from '../repository';
import {
  SESSION_KIND_IDS,
  discardSession,
  getRunningSession,
  sessionSeconds,
  startSession,
  stopSession,
} from '../session';
import {BUILTIN_METRICS} from '../builtinMetrics';

const START = new Date(2026, 8, 15, 6, 0).getTime();
const MIN = 60_000;

beforeEach(() => store.clearAll());

it('offers only real session kinds', () => {
  for (const id of SESSION_KIND_IDS) {
    expect(BUILTIN_METRICS.find(m => m.id === id)?.category).toBe('session');
  }
});

it('keeps the clock from the start time, and Stop logs it dated when it began', () => {
  startSession('builtin.staff-session', START);
  const running = getRunningSession()!;
  expect(running).toEqual({kindId: 'builtin.staff-session', startedAt: START});
  expect(sessionSeconds(running, START + 90 * MIN + 5000)).toBe(5405);

  const entry = stopSession(START + 90 * MIN);
  expect(entry).toMatchObject({
    at: START,
    kindId: 'builtin.staff-session',
    value: 90 * 60,
    element: 'water',
  });
  expect(getRunningSession()).toBeUndefined();
  expect(loadEntries().map(e => e.id)).toEqual([entry!.id]);
});

it("doesn't log a slip of the thumb, or a discarded session", () => {
  startSession('builtin.walk-session', START);
  expect(stopSession(START + 30_000)).toBeUndefined();
  startSession('builtin.bike-ride', START);
  discardSession();
  expect(getRunningSession()).toBeUndefined();
  expect(stopSession(START + 40 * MIN)).toBeUndefined();
  expect(loadEntries()).toEqual([]);
});
