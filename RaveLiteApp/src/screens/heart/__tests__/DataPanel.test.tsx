import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it, jest} from '@jest/globals';

import {DataPanel} from '../DataPanel';
import {buildBackup} from '../../../domain/data/backup';
import {addEntry} from '../../../domain/training/repository';
import * as device from '../../../native/raveLiteDevice';
import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';

jest.mock('../../../native/raveLiteDevice', () => ({
  saveExport: jest.fn(),
  readExport: jest.fn(),
  restartApp: jest.fn(),
  shareExport: jest.fn(),
}));

const saveExport = device.saveExport as jest.Mock;
const readExport = device.readExport as jest.Mock;
const restartApp = device.restartApp as jest.Mock;
const shareExport = device.shareExport as jest.Mock;

const NOW = new Date(2026, 8, 20, 9, 0).getTime();

/** Something worth losing. */
function aLifeLogged(): void {
  addEntry({at: NOW, kindId: 'builtin.run-2mi', value: 1040});
}

beforeEach(() => {
  store.clearAll();
  jest.clearAllMocks();
  restartApp.mockResolvedValue(false);
});

function renderPanel() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<DataPanel />);
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((node: ReactTestInstance) => node.props.testID === id)[0];

const noteText = (tree: renderer.ReactTestRenderer): string | undefined =>
  byTestId(tree, 'data-note')?.props.children;

/** Press, and let the handler's promises settle before looking. */
async function press(
  tree: renderer.ReactTestRenderer,
  id: string,
): Promise<void> {
  await act(async () => {
    byTestId(tree, id).props.onPress();
  });
}

it('hands the whole life to the picker, and says what left', async () => {
  aLifeLogged();
  saveExport.mockResolvedValue({
    ok: true,
    value: 'ravelite-2026-09-20-0900.json',
  });
  const tree = renderPanel();

  await press(tree, 'data-export');

  const [filename, text] = saveExport.mock.calls[0] as [string, string];
  expect(filename).toMatch(/^ravelite-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  expect(JSON.parse(text).entries[KEYS.trainingEntries]).toBe(
    store.getString(KEYS.trainingEntries),
  );
  expect(noteText(tree)).toContain('ravelite-2026-09-20-0900.json');
  act(() => tree.unmount());
});

it('can send the whole of a life to whoever is looking at the bug', async () => {
  aLifeLogged();
  shareExport.mockResolvedValue(true);
  const tree = renderPanel();

  await press(tree, 'data-share');

  const [filename, text] = shareExport.mock.calls[0] as [string, string];
  expect(filename).toMatch(/^ravelite-.*\.json$/);
  expect(JSON.parse(text).entries[KEYS.trainingEntries]).toBe(
    store.getString(KEYS.trainingEntries),
  );
  // Nothing to say when it worked: the share sheet is the feedback.
  expect(byTestId(tree, 'data-note')).toBeUndefined();
  act(() => tree.unmount());
});

it('says so when there is nothing to share with', async () => {
  shareExport.mockResolvedValue(false);
  const tree = renderPanel();

  await press(tree, 'data-share');

  expect(noteText(tree)).toMatch(/nothing to share it with/);
  act(() => tree.unmount());
});

it('says nothing when the picker is dismissed', async () => {
  saveExport.mockResolvedValue({ok: false, why: 'cancelled'});
  const tree = renderPanel();

  await press(tree, 'data-export');

  expect(byTestId(tree, 'data-note')).toBeUndefined();
  act(() => tree.unmount());
});

it('will not replace a life without a second tap', async () => {
  aLifeLogged();
  const theirs = JSON.stringify(buildBackup(NOW));
  const mine = store.getString(KEYS.trainingEntries);

  readExport.mockResolvedValue({ok: true, value: theirs});
  const tree = renderPanel();

  // Picking a file only describes it.
  await press(tree, 'data-restore');
  expect(byTestId(tree, 'data-replace')).toBeDefined();
  expect(store.getString(KEYS.trainingEntries)).toBe(mine);

  await press(tree, 'data-cancel');
  expect(byTestId(tree, 'data-replace')).toBeUndefined();
  expect(store.getString(KEYS.trainingEntries)).toBe(mine);
  act(() => tree.unmount());
});

it('puts backing out where a narrow screen can still reach it', async () => {
  aLifeLogged();
  readExport.mockResolvedValue({
    ok: true,
    value: JSON.stringify(buildBackup(NOW)),
  });
  const tree = renderPanel();

  await press(tree, 'data-restore');

  // The pills wrap, so the one that can fall below the fold must be the
  // destructive one.
  const ids: string[] = [];
  for (const node of tree.root.findAll((n: ReactTestInstance) =>
    ['data-cancel', 'data-replace'].includes(n.props.testID),
  )) {
    // A Tap carries its testID down several host nodes; count each once.
    if (ids[ids.length - 1] !== node.props.testID) {
      ids.push(node.props.testID);
    }
  }
  expect(ids).toEqual(['data-cancel', 'data-replace']);
  act(() => tree.unmount());
});

it('replaces everything on the second tap, then starts the app again', async () => {
  aLifeLogged();
  const theirs = JSON.stringify(buildBackup(NOW));
  store.clearAll();
  store.set(KEYS.trainingEntries, '[]');
  restartApp.mockResolvedValue(true);

  readExport.mockResolvedValue({ok: true, value: theirs});
  const tree = renderPanel();

  await press(tree, 'data-restore');
  await press(tree, 'data-replace');

  expect(store.getString(KEYS.trainingEntries)).toContain('builtin.run-2mi');
  expect(restartApp).toHaveBeenCalled();
  act(() => tree.unmount());
});

it('stays usable when a picker never answers', async () => {
  // A picker torn down by the system resolves nothing. The buttons must
  // not be waiting on it — see onHostResume in RaveLiteDeviceModule.
  saveExport.mockReturnValue(new Promise(() => {}));
  const tree = renderPanel();

  await press(tree, 'data-export');

  expect(byTestId(tree, 'data-export').props.disabled).toBeFalsy();
  expect(byTestId(tree, 'data-restore').props.disabled).toBeFalsy();

  // And the next tap still reaches the native side.
  readExport.mockResolvedValue({ok: false, why: 'cancelled'});
  await press(tree, 'data-restore');
  expect(readExport).toHaveBeenCalled();
  act(() => tree.unmount());
});

it('names what is wrong with a file that is not an export', async () => {
  aLifeLogged();
  const mine = store.getString(KEYS.trainingEntries);
  readExport.mockResolvedValue({ok: true, value: 'a photo, probably'});
  const tree = renderPanel();

  await press(tree, 'data-restore');

  expect(noteText(tree)).toBe('That file is not a RaveLite export.');
  expect(store.getString(KEYS.trainingEntries)).toBe(mine);
  act(() => tree.unmount());
});

it('erases only after a confirm, and says so when it cannot restart', async () => {
  aLifeLogged();
  const tree = renderPanel();

  await press(tree, 'data-wipe');
  expect(store.getString(KEYS.trainingEntries)).toBeDefined();

  await press(tree, 'data-wipe');
  expect(store.getString(KEYS.trainingEntries)).toBeUndefined();
  expect(noteText(tree)).toMatch(/open it again/);
  act(() => tree.unmount());
});
