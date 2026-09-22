import {store} from '../../storage';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
} from '../../domain/profile/repository';
import * as runtime from '../../domain/ambient/pulseRuntime';
import * as lifecycle from '../../domain/ambient/ambientLifecycle';
import {bootTask} from '../bootTask';

jest.mock('../../domain/ambient/ambientLifecycle', () => ({
  startAmbientLifecycle: jest.fn(),
}));
jest.mock('../../domain/ambient/planScheduler', () => ({
  startPlanScheduler: jest.fn(),
}));
jest.mock('../../domain/ambient/setScheduler', () => ({
  startSetScheduler: jest.fn(),
}));
jest.mock('../../domain/ambient/backupScheduler', () => ({
  startBackupScheduler: jest.fn(),
}));
jest.mock('../../domain/conditions/weather', () => ({
  startWeather: jest.fn(),
}));

const noWait = () => Promise.resolve();

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  runtime.__test.reset();
  (lifecycle.startAmbientLifecycle as jest.Mock).mockClear();
});

afterEach(() => runtime.stopPulseRuntime());

it('starts the chimes and the service after a reboot, for a phone in use', async () => {
  saveProfile({...authorProfile(), setUpAt: 1});
  const spy = jest.spyOn(runtime, 'startPulseRuntime');
  expect(await bootTask(noWait)).toBe(true);
  expect(spy).toHaveBeenCalled();
  expect(lifecycle.startAmbientLifecycle).toHaveBeenCalled();
  spy.mockRestore();
});

it('starts nothing on a new install that has not been set up', async () => {
  expect(await bootTask(noWait)).toBe(false);
  expect(lifecycle.startAmbientLifecycle).not.toHaveBeenCalled();
});
