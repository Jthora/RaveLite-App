import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {beforeEach, expect, it} from '@jest/globals';

import {ModePanel, SEE_SOMEONE} from '../ModePanel';
import {
  __resetProfileCache,
  loadInjured,
  loadMode,
} from '../../../domain/profile/repository';
import {store} from '../../../storage';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

function render() {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<ModePanel />);
  });
  const byTestId = (id: string) =>
    tree.root.findAll((n: ReactTestInstance) => n.props.testID === id)[0];
  const press = (id: string) => act(() => byTestId(id).props.onPress());
  const text = () => JSON.stringify(tree.toJSON());
  return {byTestId, press, text};
}

it('asks where, says when to see someone, and offers a neck', () => {
  const panel = render();
  panel.press('mode-injured');
  expect(panel.byTestId('region-neck')).toBeDefined();
  expect(panel.text()).toContain(SEE_SOMEONE);
  panel.press('region-neck');
  expect(loadInjured()).toBe('neck');
  expect(panel.text()).toContain('Hurt · neck');
});

it('lets a day off sit on top of an injury, and ends each on its own', () => {
  const panel = render();
  panel.press('mode-injured');
  panel.press('region-shoulder');
  panel.press('mode-rest');
  expect(loadMode()?.id).toBe('rest');
  expect(loadInjured()).toBe('shoulder');

  // "End", not "Done": it ends the thing, it does not tick it off.
  expect(panel.text()).not.toContain('"Done"');
  panel.press('mode-clear');
  expect(loadMode()).toBeUndefined();
  expect(loadInjured()).toBe('shoulder');

  panel.press('injury-clear');
  expect(loadInjured()).toBeUndefined();
});
