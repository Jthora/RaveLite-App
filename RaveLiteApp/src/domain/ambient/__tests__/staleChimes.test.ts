import notifee from '@notifee/react-native';

import {store} from '../../../storage';
import {entriesForDay} from '../../journal/journal';
import {buildPulseNotification} from '../../reminders/notifeeScheduler';
import {handleNotificationAction} from '../notificationActions';
import {nextMorning, pauseUntilFor} from '../pause';
import * as runtime from '../pulseRuntime';

jest.mock('../../../native/raveLiteDevice', () => ({
  INTERRUPTION_FILTER_ALL: 1,
  RINGER_MODE_NORMAL: 2,
  hasDeviceModule: jest.fn(() => true),
  playCue: jest.fn(async () => true),
  getInterruptionFilter: jest.fn(async () => 1),
  getRingerMode: jest.fn(async () => 2),
  getAlarmVolume: jest.fn(),
}));

const cancel = notifee.cancelNotification as jest.Mock;
const display = notifee.displayNotification as jest.Mock;
// Monday 14 Sep 2026, 10:00 — inside the default My day.
const NOW = new Date(2026, 8, 14, 10, 0).getTime();
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
  cancel.mockClear();
  display.mockClear();
});

const payload = {
  element: 'fire' as const,
  color: '#FF3B2F',
  title: 'Push-ups · 10 reps',
  body: 'Set 1 of 4',
  exerciseId: 'fire.pushup-groove',
  pulseId: 'p1',
};

it('clears a live chime from the shade when its answer window ends', () => {
  const n = buildPulseNotification(
    {...payload, timeoutMs: 480_000},
    {quiet: true},
  );
  expect(n.android?.timeoutAfter).toBe(480_000);
});

it('offers +5 once, and a second press does not lose the chime', async () => {
  runtime.enqueue({id: 'p1', fireAt: NOW, element: 'fire'});
  runtime.tickNow(NOW);
  runtime.snoozeActive(NOW + 1000);
  runtime.tickNow(NOW + 6 * 60_000);
  await flush();
  expect(runtime.getActivePulseSummary()?.snoozed).toBe(true);
  // The re-sounded chime's notification has no +5 on it.
  const last = display.mock.calls[display.mock.calls.length - 1][0];
  expect(
    last.android.actions.map(
      (a: {pressAction: {id: string}}) => a.pressAction.id,
    ),
  ).toEqual(['seal', 'skip']);
  cancel.mockClear();
  runtime.snoozeActive(NOW + 7 * 60_000);
  expect(cancel).not.toHaveBeenCalled();
  expect(runtime.getActivePulseSummary()?.pulseId).toBe('p1');
});

it('takes an expired chime out of the shade', () => {
  runtime.enqueue({id: 'p1', fireAt: NOW, element: 'fire'});
  runtime.tickNow(NOW);
  cancel.mockClear();
  runtime.tickNow(NOW + 60 * 60_000);
  expect(cancel).toHaveBeenCalledWith('p1');
});

it('does not ring a chime again after Done on its backup', async () => {
  // The runtime still holds it queued, as when a backup chime is
  // answered while the app is frozen.
  runtime.enqueue({id: 'p1', fireAt: NOW + 60_000, element: 'fire'});
  await handleNotificationAction(
    {
      actionId: 'seal',
      data: {pulseId: 'p1', element: 'fire', exerciseId: 'fire.pushup-groove'},
    },
    NOW,
  );
  expect(runtime.hasPulse('p1')).toBe(false);
  expect(entriesForDay(new Date(NOW)).some(e => e.kind === 'completion')).toBe(
    true,
  );
});

describe('Till morning', () => {
  it('means the next start of My day', () => {
    expect(nextMorning(new Date(2026, 8, 14, 22, 0).getTime(), '05:00')).toBe(
      new Date(2026, 8, 15, 5, 0).getTime(),
    );
  });

  it('tapped after midnight, is this morning, not tomorrow', () => {
    const late = new Date(2026, 8, 15, 0, 30).getTime();
    expect(pauseUntilFor('tonight', late)).toBe(
      new Date(2026, 8, 15, 5, 0).getTime(),
    );
  });
});
