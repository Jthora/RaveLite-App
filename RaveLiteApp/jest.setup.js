/**
 * Jest setup — register native-module mocks so importing
 * AsyncStorage (and friends) under Jest doesn't blow up with
 * "NativeModule cannot be null".
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@sayem314/react-native-keep-awake', () => ({
  __esModule: true,
  activateKeepAwake: jest.fn(),
  deactivateKeepAwake: jest.fn(),
  useKeepAwake: jest.fn(),
  default: () => null,
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('ch'),
    requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
    onForegroundEvent: jest.fn(() => () => {}),
    onBackgroundEvent: jest.fn(),
    displayNotification: jest.fn().mockResolvedValue(undefined),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    deleteChannel: jest.fn().mockResolvedValue(undefined),
    registerForegroundService: jest.fn(),
    stopForegroundService: jest.fn().mockResolvedValue(undefined),
    createTriggerNotification: jest.fn().mockResolvedValue('trigger'),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    getTriggerNotifications: jest.fn().mockResolvedValue([]),
    getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
    getNotificationSettings: jest
      .fn()
      .mockResolvedValue({authorizationStatus: 1, android: {alarm: 1}}),
    isBatteryOptimizationEnabled: jest.fn().mockResolvedValue(false),
    openBatteryOptimizationSettings: jest.fn().mockResolvedValue(undefined),
    getPowerManagerInfo: jest.fn().mockResolvedValue({activity: null}),
    openPowerManagerSettings: jest.fn().mockResolvedValue(undefined),
    openAlarmPermissionSettings: jest.fn().mockResolvedValue(undefined),
    openNotificationSettings: jest.fn().mockResolvedValue(undefined),
  },
  AndroidImportance: {LOW: 1, DEFAULT: 3, HIGH: 4},
  AndroidVisibility: {SECRET: -1, PRIVATE: 0, PUBLIC: 1},
  EventType: {DISMISSED: 0, PRESS: 1, ACTION_PRESS: 2, DELIVERED: 3},
  AlarmType: {
    SET: 0,
    SET_AND_ALLOW_WHILE_IDLE: 1,
    SET_EXACT: 2,
    SET_EXACT_AND_ALLOW_WHILE_IDLE: 3,
    SET_ALARM_CLOCK: 4,
  },
  TriggerType: {TIMESTAMP: 0, INTERVAL: 1},
}));

// No test reaches the internet. Node has a real `fetch`, so a test that
// set a place used to send its coordinates to the weather API for real —
// slow, flaky offline, and not something a test run should do. Anything
// that needs a response passes its own `fetchImpl`.
/* global globalThis */
globalThis.fetch = jest.fn(() =>
  Promise.reject(new Error('no network in tests: pass a fetchImpl')),
);
