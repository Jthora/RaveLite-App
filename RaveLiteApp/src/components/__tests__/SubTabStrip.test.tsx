import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import renderer from 'react-test-renderer';
import {Activity, ListChecks} from 'lucide-react-native';

import {SubTabRail, revealOffset} from '../SubTabStrip';

const tabs = [
  {slug: 'now', label: 'Now', Icon: Activity},
  {slug: 'drills', label: 'Drills', Icon: ListChecks},
] as const;

function railStyle(axis: 'horizontal' | 'vertical') {
  const tree = renderer.create(
    <SubTabRail
      tabs={tabs}
      active="now"
      color="#FFD60A"
      onChange={() => {}}
      axis={axis}
    />,
  );
  const scroll = tree.root.findByType(ScrollView);
  return StyleSheet.flatten(scroll.props.style) ?? {};
}

describe('SubTabRail layout', () => {
  it('portrait strip keeps its content height instead of splitting the screen', () => {
    // A ScrollView grows by default; unpinned, the strip took half the
    // screen on the Redmi A3 and pushed the content down.
    expect(railStyle('horizontal')).toMatchObject({flexGrow: 0, flexShrink: 0});
  });

  it('landscape rail keeps its fixed width', () => {
    expect(railStyle('vertical')).toMatchObject({width: 88, flexGrow: 0});
  });
});

describe('revealOffset', () => {
  it('centers a tab that sits past the visible edge', () => {
    // 360-wide strip, tab at 500..580 → centered start is 500 - 140.
    expect(revealOffset(500, 80, 360)).toBe(360);
  });

  it('never scrolls before the start for the first tabs', () => {
    expect(revealOffset(16, 70, 360)).toBe(0);
  });
});
