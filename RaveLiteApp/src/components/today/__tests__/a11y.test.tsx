import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {DayList} from '../DayList';
import {ConditionsLine} from '../ConditionsLine';
import type {DayRow} from '../../../domain/today/dayList';

const AT = new Date(2026, 8, 22, 9, 30).getTime();

function render(el: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  return tree;
}

it('says a day row as time, state and name, not "Keep or remove"', () => {
  const rows: DayRow[] = [
    {
      id: 'a',
      at: AT,
      element: 'water',
      status: 'upcoming',
      label: 'Water Call',
      detail: '1 glass',
    },
    {id: 'b', at: AT, element: 'fire', status: 'missed', label: 'Push-ups'},
  ];
  const tree = render(<DayList rows={rows} onRowPress={() => {}} />);
  const labels = tree.root
    .findAll(
      (n: ReactTestInstance) =>
        typeof n.props.accessibilityLabel === 'string' &&
        typeof n.props.testID === 'string',
    )
    .map(n => n.props.accessibilityLabel);
  // Each label reaches several layers of the same row; say each once.
  expect([...new Set(labels)]).toEqual([
    '09:30, Coming up, Water Call, 1 glass',
    '09:30, Missed, Push-ups',
  ]);
});

it('offers Settings and the rest as TalkBack actions on the first line of Today', () => {
  const opened: string[] = [];
  const tree = render(
    <ConditionsLine
      onPress={() => {}}
      quickActions={[
        {
          name: 'settings',
          label: 'Open Settings',
          run: () => opened.push('settings'),
        },
      ]}
    />,
  );
  const line = tree.root.findAll((n: ReactTestInstance) =>
    Array.isArray(n.props.accessibilityActions),
  )[0];
  expect(line.props.accessibilityActions).toEqual([
    {name: 'settings', label: 'Open Settings'},
  ]);
  act(() =>
    line.props.onAccessibilityAction({nativeEvent: {actionName: 'settings'}}),
  );
  expect(opened).toEqual(['settings']);
});
