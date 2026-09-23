/**
 * A beta is spread across phones that behave differently, so a report
 * that does not name the phone is a guess. This pins that the line is
 * there even without the native module, and that the two settings which
 * decide whether chimes happen at all are said plainly.
 */
import {beforeEach, expect, it, jest} from '@jest/globals';

import {
  __resetDeviceFacts,
  deviceFacts,
  deviceLine,
  loadDeviceFacts,
  standbyLine,
} from '../deviceFacts';
import * as native from '../raveLiteDevice';
import {diagnosticsText} from '../../domain/diagnostics/report';
import {store} from '../../storage';

const phone = (over: Partial<native.DeviceInfo> = {}): native.DeviceInfo => ({
  manufacturer: 'Xiaomi',
  brand: 'Redmi',
  model: '2312CRNCCL',
  release: '16',
  sdk: 36,
  abi: 'armeabi-v7a',
  is64Bit: false,
  skin: 'MIUI/HyperOS V816.0.5.0',
  lowRam: true,
  standbyBucket: 10,
  backgroundRestricted: false,
  ...over,
});

beforeEach(() => {
  store.clearAll();
  __resetDeviceFacts();
  jest.restoreAllMocks();
});

it('names the phone with nothing but React Native', () => {
  const line = deviceLine();
  expect(line).toContain('Android');
  expect(line).toContain('API');
  expect(deviceFacts().screen).toMatch(/\d+ × \d+ dp @/);
});

it('adds what only the native module knows', async () => {
  jest.spyOn(native, 'getDeviceInfo').mockResolvedValue(phone());
  const facts = await loadDeviceFacts();
  expect(deviceLine(facts)).toBe(
    'Xiaomi 2312CRNCCL · Android 16 (API 36) · MIUI/HyperOS V816.0.5.0 · armeabi-v7a · low-RAM device',
  );
  expect(standbyLine(facts)).toEqual({value: 'active', concern: false});
});

it('says plainly when the phone will not let chimes fire', async () => {
  jest
    .spyOn(native, 'getDeviceInfo')
    .mockResolvedValue(phone({standbyBucket: 45}));
  expect(standbyLine(await loadDeviceFacts())).toEqual({
    value: 'restricted',
    concern: true,
  });

  __resetDeviceFacts();
  jest
    .spyOn(native, 'getDeviceInfo')
    .mockResolvedValue(phone({backgroundRestricted: true}));
  expect(standbyLine(await loadDeviceFacts())).toEqual({
    value: 'background restricted — chimes will not fire',
    concern: true,
  });
});

it('carries the phone into the report a tester pastes', async () => {
  jest.spyOn(native, 'getDeviceInfo').mockResolvedValue(
    phone({
      manufacturer: 'motorola',
      model: 'moto g54',
      release: '14',
      sdk: 34,
      skin: '',
      abi: 'arm64-v8a',
      is64Bit: true,
      lowRam: false,
      standbyBucket: 20,
    }),
  );
  await loadDeviceFacts();
  const text = diagnosticsText();
  expect(text).toContain('Phone: motorola moto g54 · Android 14 (API 34)');
  expect(text).toContain('Screen: ');
  expect(text).toContain('Background: working set');
});
