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

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('ch'),
    requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
    onForegroundEvent: jest.fn(() => () => {}),
    displayNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    registerForegroundService: jest.fn(),
    stopForegroundService: jest.fn().mockResolvedValue(undefined),
  },
  AndroidImportance: {LOW: 1, DEFAULT: 3, HIGH: 4},
  AndroidVisibility: {SECRET: -1, PRIVATE: 0, PUBLIC: 1},
  EventType: {DISMISSED: 0, PRESS: 1, ACTION_PRESS: 2, DELIVERED: 3},
}));
