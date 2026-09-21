import notifee from '@notifee/react-native';

import {store} from '../../../storage';
import {
  gatherHealthInputs,
  setConfirmed,
  summarizeHealth,
  type HealthInputs,
} from '../healthChecks';

jest.mock('../../../native/raveLiteDevice', () => ({
  INTERRUPTION_FILTER_ALL: 1,
  hasDeviceModule: jest.fn(() => true),
  getAlarmVolume: jest.fn(() => Promise.resolve({current: 5, max: 15})),
}));

const healthy: HealthInputs = {
  notificationsAuthorized: true,
  exactAlarms: 'enabled',
  batteryOptimized: false,
  powerManagerAvailable: true,
  alarmVolume: {current: 5, max: 15},
  cuePlayerAvailable: true,
  confirmed: {autostart: true, lockedInRecents: true, onCharger: true},
};

beforeEach(() => store.clearAll());

describe('summarizeHealth', () => {
  it('is all clear when everything is in place', () => {
    const {checks, warnings} = summarizeHealth(healthy);
    expect(warnings).toBe(0);
    expect(checks.every(c => c.status === 'ok')).toBe(true);
  });

  it('lists problems first, each with a way to fix it', () => {
    const {checks, warnings} = summarizeHealth({
      ...healthy,
      batteryOptimized: true,
      alarmVolume: {current: 0, max: 15},
      confirmed: {...healthy.confirmed, autostart: false},
    });
    expect(warnings).toBe(3);
    expect(checks.slice(0, 3).map(c => c.id)).toEqual([
      'battery',
      'autostart',
      'alarm-volume',
    ]);
    expect(checks.find(c => c.id === 'battery')?.fix).toBe(
      'battery-optimization',
    );
    expect(checks.find(c => c.id === 'autostart')).toMatchObject({
      fix: 'power-manager',
      confirm: 'autostart',
    });
  });

  it('skips Autostart on phones without an OEM power manager', () => {
    const ids = summarizeHealth({
      ...healthy,
      powerManagerAvailable: false,
    }).checks.map(c => c.id);
    expect(ids).not.toContain('autostart');
  });

  it('reports unknown, not ok, when a check cannot run', () => {
    const {checks} = summarizeHealth({
      ...healthy,
      cuePlayerAvailable: false,
      alarmVolume: null,
      exactAlarms: null,
      notificationsAuthorized: null,
    });
    for (const id of ['alarm-volume', 'exact-alarms', 'notifications']) {
      expect(checks.find(c => c.id === id)?.status).toBe('unknown');
    }
  });

  it('exact alarms: denied warns; unsupported on older Android is fine', () => {
    const denied = summarizeHealth({...healthy, exactAlarms: 'disabled'});
    expect(denied.checks.find(c => c.id === 'exact-alarms')).toMatchObject({
      status: 'warn',
      fix: 'alarm-permission',
    });
    const old = summarizeHealth({...healthy, exactAlarms: 'not-supported'});
    expect(old.checks.find(c => c.id === 'exact-alarms')?.status).toBe('ok');
  });
});

describe('gatherHealthInputs', () => {
  it('reads notifee, the device module and saved confirmations', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValueOnce({
      authorizationStatus: 1,
      android: {alarm: 0},
    });
    (notifee.isBatteryOptimizationEnabled as jest.Mock).mockResolvedValueOnce(
      true,
    );
    (notifee.getPowerManagerInfo as jest.Mock).mockResolvedValueOnce({
      activity: 'com.miui.securitycenter/.PowerCenter',
    });
    setConfirmed('onCharger', true);
    await expect(gatherHealthInputs()).resolves.toEqual({
      notificationsAuthorized: true,
      exactAlarms: 'disabled',
      batteryOptimized: true,
      powerManagerAvailable: true,
      alarmVolume: {current: 5, max: 15},
      cuePlayerAvailable: true,
      confirmed: {autostart: false, lockedInRecents: false, onCharger: true},
    });
  });

  it('treats a failed probe as unknown', async () => {
    (notifee.getNotificationSettings as jest.Mock).mockRejectedValueOnce(
      new Error('no activity'),
    );
    const inputs = await gatherHealthInputs();
    expect(inputs.notificationsAuthorized).toBeNull();
    expect(inputs.exactAlarms).toBeNull();
  });
});
