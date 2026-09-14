/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {afterEach, beforeEach, it, jest} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

// After hydration App starts 1 s / 60 s schedulers. Fake timers keep them
// from outliving the test.
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('hydrates and renders the shell', async () => {
  let tree: renderer.ReactTestRenderer | undefined;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  act(() => {
    tree?.unmount();
  });
});
