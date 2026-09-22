import {store} from '../../../storage';
import {append} from '../../journal/journal';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
} from '../../profile/repository';
import {summarizeSets} from '../../program/setsSummary';
import {doneByTrack} from '../../program/progress';
import {entriesForDay} from '../../journal/journal';
import {buildTodayModel} from '../../../hooks/useTodayModel';
import {summarizeHealth} from '../healthChecks';
import {GAP_MS, __resetHeartbeat, beat, loadGaps, onGap} from '../heartbeat';
import {
  STALE_AFTER_MS,
  enqueue as queueEnqueue,
  emptyQueue,
  tick,
} from '../pulseQueue';
import * as runtime from '../pulseRuntime';
import {__test as setSchedulerTest, setsToday} from '../setScheduler';

const at = (h: number, m = 0) => new Date(2026, 8, 14, h, m).getTime();

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  __resetHeartbeat();
  runtime.__test.reset();
  setSchedulerTest.reset();
  saveProfile(authorProfile());
});

it('writes down a silence as a gap, and nothing else', () => {
  const seen: unknown[] = [];
  onGap(g => seen.push(g));
  beat(at(9));
  beat(at(9, 5));
  expect(loadGaps()).toEqual([]);
  beat(at(9, 5) + GAP_MS + 60_000);
  expect(loadGaps()).toEqual([
    {from: at(9, 5), to: at(9, 5) + GAP_MS + 60_000},
  ]);
  expect(seen).toHaveLength(1);
});

it('does not ring a string of stale chimes on resume', () => {
  let state = emptyQueue();
  state = queueEnqueue(state, {
    id: 'old',
    fireAt: at(9),
    element: 'fire',
  }).state;
  state = queueEnqueue(state, {
    id: 'new',
    fireAt: at(11),
    element: 'air',
  }).state;
  const {writes} = tick(state, at(11) + 1000);
  expect(writes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'reminder.suppressed',
        pulseId: 'old',
        reason: 'app-closed',
      }),
      expect.objectContaining({kind: 'reminder.fired', pulseId: 'new'}),
    ]),
  );
  expect(at(11) - at(9)).toBeGreaterThan(STALE_AFTER_MS);
});

it('shows chimes due while the app was closed as never sounded, and lets their sets go', () => {
  const owed = (now: number) => {
    const today = setsToday(now);
    return summarizeSets(
      today.prescriptions,
      doneByTrack(entriesForDay(new Date(now))),
      today.released,
    ).total;
  };
  const before = owed(at(12, 30));
  beat(at(9));
  beat(at(12, 30));

  const inGap = buildTodayModel(at(12, 30)).rows.filter(
    r => r.at > at(9) && r.at < at(12, 30) && r.status !== 'done',
  );
  expect(inGap.length).toBeGreaterThan(0);
  for (const row of inGap) {
    expect(row.status).toBe('unsounded');
    expect(row.detail).toMatch(/^RaveLite was closed, did not sound/);
  }
  // The rounds due in the gap are not owed any more.
  expect(owed(at(12, 30))).toBeLessThan(before);
});

it('says so in Stay alive instead of "all set"', () => {
  const {checks} = summarizeHealth({
    notificationsAuthorized: true,
    exactAlarms: 'enabled',
    batteryOptimized: false,
    powerManagerAvailable: true,
    alarmVolume: {current: 5, max: 15},
    cuePlayerAvailable: true,
    confirmed: {autostart: true, lockedInRecents: true, onCharger: true},
    lastGap: {from: at(13, 10), to: at(15, 40)},
  });
  expect(checks[0]).toMatchObject({
    id: 'kept-running',
    status: 'warn',
    detail:
      'Android closed RaveLite from 13:10 to 15:40. Chimes did not sound then.',
  });
});

it('leaves a chime the journal saw sound to the journal', () => {
  beat(at(9));
  beat(at(12, 30));
  const first = buildTodayModel(at(12, 30)).rows.find(
    r => r.at > at(9) && r.at < at(12, 30) && r.status === 'unsounded',
  )!;
  append({
    kind: 'reminder.fired',
    at: first.at,
    pulseId: first.id,
    element: first.element,
  });
  const again = buildTodayModel(at(12, 30)).rows.find(r => r.id === first.id)!;
  expect(again.status).toBe('missed');
});
