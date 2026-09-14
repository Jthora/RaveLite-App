/**
 * ElementShell — the orientation-adaptive root of RaveLite's UX.
 *
 * Replaces React Navigation's BottomTab.Navigator with a hand-rolled
 * shell that places the 5-element rail by orientation. Each element is one
 * page; lower-priority content opens in sheets from the page itself, so
 * there is no second row of tabs.
 *
 *   Portrait ───────────────┐   Landscape ──────────────────┐
 *   ┌─────────────────────┐ │   ┌─────────────────────┬───┐ │
 *   │                     │ │   │                     │ E │ │
 *   │  <ElementScreen />  │ │   │  <ElementScreen />  │ l │ │
 *   │                     │ │   │                     │ R │ │
 *   ├─────────────────────┤ │   │                     │ a │ │
 *   │     ElementRail     │ │   │                     │ i │ │
 *   └─────────────────────┘ │   └─────────────────────┴───┘ │
 *
 * The app always opens on Heart, the home screen.
 */
import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ElementRail} from './ElementRail';
import {useOrientation} from './useOrientation';
import {UndoBar} from '../components/UndoBar';

import type {ElementId} from '../theme/elements';
import {palette} from '../theme';

import {makeElementScreen} from '../screens/ElementScreen';
import HeartScreen from '../screens/HeartScreen';

/** The contract every element screen satisfies. */
export interface ElementScreenProps {
  /** Cross-element jump, e.g. Today's balance strip opening an element. */
  onElementChange: (next: ElementId) => void;
}

const SCREENS: Record<ElementId, React.ComponentType<ElementScreenProps>> = {
  fire: makeElementScreen('fire'),
  air: makeElementScreen('air'),
  heart: HeartScreen,
  earth: makeElementScreen('earth'),
  water: makeElementScreen('water'),
};

export function ElementShell(): React.JSX.Element {
  const {orientation, isTablet} = useOrientation();
  const isLandscape = orientation === 'landscape';

  const [activeElement, setActiveElement] = useState<ElementId>('heart');

  // Fade in on each element switch so it feels intentional rather than
  // abrupt. 120ms is short enough not to delay interaction; long enough to
  // register as a transition.
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [activeElement, fade]);

  const Screen = SCREENS[activeElement];

  const elementRail = (
    <ElementRail
      active={activeElement}
      onChange={setActiveElement}
      axis={isLandscape ? 'vertical' : 'horizontal'}
      isTablet={isTablet}
    />
  );

  const screen = (
    <Animated.View style={[styles.content, {opacity: fade}]}>
      <Screen onElementChange={setActiveElement} />
      <UndoBar />
    </Animated.View>
  );

  if (isLandscape) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.row}>
          {screen}
          {elementRail}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {screen}
      {elementRail}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.bg},
  row: {flex: 1, flexDirection: 'row'},
  content: {flex: 1},
});
