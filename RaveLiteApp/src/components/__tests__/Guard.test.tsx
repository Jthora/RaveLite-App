import React from 'react';
import {Text} from 'react-native';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {Guard} from '../Guard';
import {readErrors} from '../../domain/diagnostics/errorLog';
import {store} from '../../../src/storage';

beforeEach(() => {
  store.clearAll();
  // React logs the caught error itself; that is expected, not a failure.
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

/** Throws on first render, behaves on every one after. */
function Flaky({failTimes}: {failTimes: {count: number}}) {
  if (failTimes.count > 0) {
    failTimes.count -= 1;
    throw new Error('could not read the thing');
  }
  return <Text testID="worked">fine</Text>;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  // Some nodes in a fragment have null props; this walks the whole tree
  // including them.
  tree.root.findAll((n: ReactTestInstance) => n.props?.testID === id)[0];

it('keeps a crash inside one screen, and says what happened', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <>
        <Text testID="rest-of-app">still here</Text>
        <Guard name="Today">
          <Flaky failTimes={{count: 99}} />
        </Guard>
      </>,
    );
  });

  // The app did not go with it.
  expect(byTestId(tree!, 'rest-of-app')).toBeDefined();
  expect(byTestId(tree!, 'guard-Today')).toBeDefined();
  expect(JSON.stringify(tree!.toJSON())).toContain('could not read the thing');
  act(() => tree!.unmount());
});

it('writes it where the export will carry it', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <Guard name="Character sheet">
        <Flaky failTimes={{count: 99}} />
      </Guard>,
    );
  });

  const [logged] = readErrors();
  expect(logged.where).toBe('render:Character sheet');
  expect(logged.what).toContain('could not read the thing');
  act(() => tree!.unmount());
});

it('can be told to try again, and comes back when the cause has passed', () => {
  // Most of these are one bad row; remounting past it keeps somebody
  // training while the real fix gets written.
  const failTimes = {count: 1};
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <Guard name="Today">
        <Flaky failTimes={failTimes} />
      </Guard>,
    );
  });
  expect(byTestId(tree!, 'guard-Today')).toBeDefined();

  act(() => {
    byTestId(tree!, 'guard-retry-Today').props.onPress();
  });

  expect(byTestId(tree!, 'worked')).toBeDefined();
  expect(byTestId(tree!, 'guard-Today')).toBeUndefined();
  act(() => tree!.unmount());
});

it('stays out of the way when nothing is wrong', () => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <Guard name="Today">
        <Text testID="worked">fine</Text>
      </Guard>,
    );
  });
  expect(byTestId(tree!, 'worked')).toBeDefined();
  expect(readErrors()).toEqual([]);
  act(() => tree!.unmount());
});
