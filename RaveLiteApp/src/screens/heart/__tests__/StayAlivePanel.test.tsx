/**
 * Stay alive ends with what the phone's own maker does on top of
 * Android — the gates no app can read, and the ones that actually stop
 * chimes. It is named only when something has gone wrong.
 */
import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it, jest} from '@jest/globals';

import {StayAlivePanel} from '../StayAlivePanel';
import * as native from '../../../native/raveLiteDevice';
import {__resetDeviceFacts, loadDeviceFacts} from '../../../native/deviceFacts';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetDeviceFacts();
  jest.restoreAllMocks();
});

async function render() {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<StayAlivePanel />);
  });
  return tree;
}

const text = (tree: renderer.ReactTestRenderer) =>
  JSON.stringify(tree.toJSON());

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];

it('tells a Xiaomi owner about autostart, which no app can check', async () => {
  jest.spyOn(native, 'getDeviceInfo').mockResolvedValue({
    manufacturer: 'Xiaomi',
    brand: 'Redmi',
    model: '2312CRNCCL',
    release: '16',
    sdk: 36,
    abi: 'armeabi-v7a',
    is64Bit: false,
    skin: 'MIUI/HyperOS',
    build: 'V816.0.5.0.WGRMIXM',
    lowRam: true,
    standbyBucket: 10,
    backgroundRestricted: false,
  });
  await loadDeviceFacts();
  const tree = await render();
  expect(byTestId(tree, 'stay-alive-maker')).toBeDefined();
  expect(text(tree)).toContain('What Xiaomi phones need');
  expect(text(tree)).toContain('Autostart');
  // And it says whose settings these are, rather than implying the app
  // can do anything about them.
  expect(text(tree)).toContain('cannot read them');
  act(() => tree.unmount());
});

it('gives a phone with no such gates the plain answer', async () => {
  jest.spyOn(native, 'getDeviceInfo').mockResolvedValue({
    manufacturer: 'Google',
    brand: 'google',
    model: 'Pixel 8a',
    release: '16',
    sdk: 36,
    abi: 'arm64-v8a',
    is64Bit: true,
    skin: '',
    build: 'AP4A.250105.002',
    lowRam: false,
    standbyBucket: 10,
    backgroundRestricted: false,
  });
  await loadDeviceFacts();
  const tree = await render();
  expect(text(tree)).toContain('What Google phones need');
  expect(text(tree)).toContain('Unrestricted');
  expect(text(tree)).not.toContain('Autostart');
  act(() => tree.unmount());
});
