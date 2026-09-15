/**
 * ElementShell — the root: Today, with element pages opened over it.
 *
 * Today (Core's home) is always mounted. Its balance strip opens an
 * element's page — Fire, Air, Core, Earth or Water — drawn over Today, and
 * Back (the page's ‹ or Android's) returns to Today where it was left.
 * There's no tab bar: the strip is the navigation and its gear opens
 * Settings, so the whole height goes to content.
 */
import React, {useEffect, useRef, useState} from 'react';
import {Animated, BackHandler, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {UndoBar} from '../components/UndoBar';
import type {ElementId} from '../theme/elements';
import {palette} from '../theme';

import {makeElementScreen} from '../screens/ElementScreen';
import HeartScreen from '../screens/HeartScreen';

/** The contract every screen satisfies. */
export interface ElementScreenProps {
  /** Open an element's page, e.g. from Today's balance strip. */
  onElementChange: (next: ElementId) => void;
  /** Back to Today, for pages opened over it. */
  onBack?: () => void;
}

const PAGES: Record<ElementId, React.ComponentType<ElementScreenProps>> = {
  fire: makeElementScreen('fire'),
  air: makeElementScreen('air'),
  heart: makeElementScreen('heart'),
  earth: makeElementScreen('earth'),
  water: makeElementScreen('water'),
};

export function ElementShell(): React.JSX.Element {
  const [page, setPage] = useState<ElementId | undefined>();
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (page === undefined) {
      return;
    }
    // A short fade so opening a page reads as a step, not a jump.
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPage(undefined);
      return true;
    });
    return () => sub.remove();
  }, [page, fade]);

  const Page = page ? PAGES[page] : undefined;

  return (
    <SafeAreaView
      style={styles.root}
      edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        <HeartScreen onElementChange={setPage} />
        {Page ? (
          <Animated.View style={[styles.page, {opacity: fade}]}>
            <Page onElementChange={setPage} onBack={() => setPage(undefined)} />
          </Animated.View>
        ) : null}
        <UndoBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.bg},
  content: {flex: 1},
  page: {...StyleSheet.absoluteFillObject, backgroundColor: palette.bg},
});
