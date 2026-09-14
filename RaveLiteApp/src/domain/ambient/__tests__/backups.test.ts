import notifee from '@notifee/react-native';

import {store} from '../../../storage';
import {BACKUP_OFFSET_MS} from '../backupPlanner';
import {backupCandidates, reconcileBackupsNow} from '../backupScheduler';
import {
  DETACHED_SNOOZE_MS,
  handleNotificationAction,
} from '../notificationActions';
import {prescriptionFromData, pulsePayload} from '../pulsePayload';
import * as runtime from '../pulseRuntime';
import {__test as setSchedulerTest} from '../setScheduler';

jest.mock('../../../native/raveLiteDevice', () => ({
  INTERRUPTION_FILTER_ALL: 1,
  hasDeviceModule: jest.fn(() => false),
  playCue: jest.fn(() => Promise.resolve(false)),
  getInterruptionFilter: jest.fn(() => Promise.resolve(null)),
  getAlarmVolume: jest.fn(() => Promise.resolve(null)),
  setWindowBrightness: jest.fn(() => Promise.resolve(false)),
}));

const createTrigger = notifee.createTriggerNotification as jest.Mock;
const cancelTrigger = notifee.cancelTriggerNotification as jest.Mock;
const getTriggers = notifee.getTriggerNotifications as jest.Mock;

// Monday 14 Sep 2026, 10:00 local — inside default active hours.
const NOW = new Date(2026, 8, 14, 10, 0).getTime();
const MIN = 60_000;

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
  setSchedulerTest.reset();
  createTrigger.mockClear();
  cancelTrigger.mockClear();
  getTriggers.mockReset().mockResolvedValue([]);
});

describe('pulse payload', () => {
  it('carries a set prescription through notification data', () => {
    const rx = {
      trackId: 'push' as const,
      label: 'Push-ups',
      unit: 'reps' as const,
      amount: 10,
      setIndex: 2,
      sets: 6,
    };
    const payload = pulsePayload({
      pulseId: 's',
      element: 'fire',
      exerciseId: 'fire.pushup-groove',
      prescription: rx,
    });
    expect(payload.title).toBe('Push-ups · 10 reps');
    expect(prescriptionFromData(payload.data!)).toEqual(rx);
    expect(prescriptionFromData({pulseId: 'x'})).toBeUndefined();
  });
});

describe('live runtime and backups', () => {
  it("cancels a pulse's backup once, when the pulse comes due", () => {
    runtime.enqueue({id: 'p1', fireAt: NOW + MIN, element: 'air'});
    runtime.tickNow(NOW);
    expect(cancelTrigger).not.toHaveBeenCalled();
    runtime.tickNow(NOW + MIN);
    runtime.tickNow(NOW + MIN + 1_000);
    expect(cancelTrigger.mock.calls).toEqual([['p1']]);
  });

  it("cancels again when a snoozed pulse's new time comes due", () => {
    runtime.enqueue({id: 'p1', fireAt: NOW, element: 'air'});
    runtime.tickNow(NOW);
    runtime.snoozeActive(NOW + 1_000);
    runtime.tickNow(NOW + 6 * MIN + 2_000);
    const forP1 = cancelTrigger.mock.calls.filter(([id]) => id === 'p1');
    expect(forP1).toHaveLength(2);
  });
});

describe('backup scheduler', () => {
  it('asks the OS for an exact backup 90 s after an upcoming chime', async () => {
    runtime.enqueue({
      id: 'queued-1',
      fireAt: NOW + 20 * MIN,
      element: 'water',
      exerciseId: 'water.sip',
    });
    await reconcileBackupsNow(NOW);
    const call = createTrigger.mock.calls.find(([n]) => n.id === 'queued-1');
    expect(call).toBeDefined();
    const [notification, trigger] = call!;
    expect(trigger).toMatchObject({
      type: 0, // TriggerType.TIMESTAMP
      timestamp: NOW + 20 * MIN + BACKUP_OFFSET_MS,
      alarmManager: {type: 3}, // SET_EXACT_AND_ALLOW_WHILE_IDLE
    });
    expect(notification.data).toMatchObject({backup: '1', pulseId: 'queued-1'});
    expect(notification.android).toMatchObject({
      channelId: 'elem.water.v3',
      onlyAlertOnce: true,
    });
  });

  it('cancels backups no longer needed, but leaves OS snoozes alone', async () => {
    getTriggers.mockResolvedValue([
      {
        notification: {id: 'gone', data: {backup: '1'}},
        trigger: {type: 0, timestamp: NOW + 5 * MIN},
      },
      {
        notification: {id: 'os-snooze', data: {snooze: '1'}},
        trigger: {type: 0, timestamp: NOW + 3 * MIN},
      },
    ]);
    await reconcileBackupsNow(NOW);
    expect(cancelTrigger).toHaveBeenCalledWith('gone');
    expect(cancelTrigger).not.toHaveBeenCalledWith('os-snooze');
  });

  it("covers tomorrow morning's sets through the night", () => {
    const tenPm = new Date(2026, 8, 14, 22, 0).getTime();
    const ids = backupCandidates(tenPm).map(c => c.pulseId);
    expect(ids.some(id => id.startsWith('sets:2026-09-15:'))).toBe(true);
  });
});

describe('+5 on a notification the app no longer holds', () => {
  it('hands the snooze to the OS for the same pulse in 5 min', async () => {
    await handleNotificationAction(
      {
        actionId: 'snooze',
        data: {
          pulseId: 'sets:x:push:3',
          element: 'fire',
          exerciseId: 'fire.pushup-groove',
          trackId: 'push',
          amount: '10',
          unit: 'reps',
          label: 'Push-ups',
          setIndex: '3',
          sets: '6',
        },
      },
      NOW,
    );
    expect(createTrigger).toHaveBeenCalledTimes(1);
    const [notification, trigger] = createTrigger.mock.calls[0];
    expect(notification).toMatchObject({
      id: 'sets:x:push:3',
      title: 'Push-ups · 10 reps',
      data: expect.objectContaining({snooze: '1'}),
    });
    expect(notification.data.backup).toBeUndefined();
    expect(trigger.timestamp).toBe(NOW + DETACHED_SNOOZE_MS);
  });
});
