/**
 * ElementShell — the orientation-adaptive root of RaveLite's UX.
 *
 * Replaces React Navigation's BottomTab.Navigator with a hand-rolled
 * shell that places the 5-element rail and the per-element sub-tab rail
 * into orientation-appropriate positions:
 *
 *   Portrait ───────────────────────────┐
 *   ┌─────────────────────────────────┐ │
 *   │  SubTabRail (axis=horizontal)   │ │ ← top
 *   ├─────────────────────────────────┤ │
 *   │                                 │ │
 *   │   <ScreenComponent subTab=…/>   │ │ ← content
 *   │                                 │ │
 *   ├─────────────────────────────────┤ │
 *   │  ElementRail (axis=horizontal)  │ │ ← bottom
 *   └─────────────────────────────────┘ │
 *                                       │
 *   Landscape ──────────────────────────┘
 *   ┌─────────┬───────────────────┬───┐
 *   │ SubTab- │                   │ E │
 *   │ Rail    │  <ScreenComponent │ l │
 *   │ (vert)  │   subTab=… />     │ R │
 *   │         │                   │ a │
 *   │         │                   │ i │
 *   │         │                   │ l │
 *   └─────────┴───────────────────┴───┘
 *
 * Per-element sub-tab state is held here (not inside the screens) so it
 * survives element switches and rotation. AsyncStorage persistence is
 * deferred to step 4 — for v1 the state is in-memory only.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ElementRail} from './ElementRail';
import {SubTabRail} from '../components/SubTabStrip';
import {useOrientation} from './useOrientation';
import {DEFAULT_SUB_SLUG, SUB_TABS_BY_ELEMENT} from './subTabRegistry';

import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../theme/elements';
import {palette} from '../theme';
import {store} from '../storage';
import {KEYS} from '../storage/keys';

import FireScreen from '../screens/FireScreen';
import AirScreen from '../screens/AirScreen';
import HeartScreen from '../screens/HeartScreen';
import EarthScreen from '../screens/EarthScreen';
import WaterScreen from '../screens/WaterScreen';

/**
 * The contract every element screen now satisfies.
 *
 * `subTab` is the active sub-page slug for THIS element. The screen
 * branches its body on it. `onSubTabChange` is forwarded so screens can
 * deep-link from inline CTAs (e.g. "Open Plan editor" from Dash).
 */
export interface ElementScreenProps {
  subTab: string;
  onSubTabChange: (slug: string) => void;
  /** Cross-element jump. Used by Heart Insights to deep-link to another
   *  element's Now panel, and by Log footer cells when implemented. */
  onElementChange: (next: ElementId) => void;
}

const SCREENS: Record<ElementId, React.ComponentType<ElementScreenProps>> = {
  fire: FireScreen as React.ComponentType<ElementScreenProps>,
  air: AirScreen as React.ComponentType<ElementScreenProps>,
  heart: HeartScreen as React.ComponentType<ElementScreenProps>,
  earth: EarthScreen as React.ComponentType<ElementScreenProps>,
  water: WaterScreen as React.ComponentType<ElementScreenProps>,
};

/** Initial sub-tab map — every element starts on its default slug. */
function initialSubTabMap(): Record<ElementId, string> {
  return {...DEFAULT_SUB_SLUG};
}

// ── Persistence keys ────────────────────────────────────────────────────
// Stored as JSON-encoded primitives so the swap to MMKV is a no-op.
const ACTIVE_KEY = KEYS.setting('shell.activeElement');
const SUBTAB_KEY = KEYS.setting('shell.subTabByElement');

function loadActive(): ElementId {
  const raw = store.getString(ACTIVE_KEY);
  if (raw && (ELEMENT_ORDER as string[]).includes(raw)) {
    return raw as ElementId;
  }
  return 'heart';
}
function loadSubTabMap(): Record<ElementId, string> {
  const raw = store.getString(SUBTAB_KEY);
  if (!raw) {return initialSubTabMap();}
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out = initialSubTabMap();
    for (const id of ELEMENT_ORDER) {
      // Migration: legacy 'aos' slug → 'always-on' (May 2026 rename).
      // Migration: legacy heart 'signal' / 'theme' → 'settings' merge.
      const stored = parsed[id];
      let slug = stored;
      if (stored === 'aos') {slug = 'always-on';}
      else if (id === 'heart' && (stored === 'signal' || stored === 'theme')) {
        slug = 'settings';
      }
      const valid = SUB_TABS_BY_ELEMENT[id].some(t => t.slug === slug);
      if (valid) {out[id] = slug;}
    }
    return out;
  } catch {
    return initialSubTabMap();
  }
}

export function ElementShell(): React.JSX.Element {
  const {orientation, isTablet} = useOrientation();
  const isLandscape = orientation === 'landscape';

  const [activeElement, setActiveElementState] = useState<ElementId>(loadActive);
  const [subTabByElement, setSubTabByElement] = useState<
    Record<ElementId, string>
  >(loadSubTabMap);

  // Persist activeElement.
  useEffect(() => {
    store.set(ACTIVE_KEY, activeElement);
  }, [activeElement]);

  // Persist sub-tab map (one write per change is fine — small payload).
  useEffect(() => {
    store.set(SUBTAB_KEY, JSON.stringify(subTabByElement));
  }, [subTabByElement]);

  // Fade-in opacity keyed on the (element, subTab) pair so swaps feel
  // intentional rather than abrupt. 120ms is short enough not to delay
  // interaction; long enough to register as a transition.
  const fade = useRef(new Animated.Value(1)).current;
  const transitionKey = useMemo(
    () => `${activeElement}.${subTabByElement[activeElement]}`,
    [activeElement, subTabByElement],
  );
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [transitionKey, fade]);

  // The entered screen's ScreenScaffold plays the "enter" haptic; firing
  // it here too buzzed twice on every element switch.
  const setActiveElement = useCallback((next: ElementId) => {
    setActiveElementState(next);
  }, []);

  const setSubTab = useCallback(
    (slug: string) => {
      setSubTabByElement(prev => {
        if (prev[activeElement] === slug) {return prev;}
        return {...prev, [activeElement]: slug};
      });
    },
    [activeElement],
  );

  const Screen = SCREENS[activeElement];
  const tabs = SUB_TABS_BY_ELEMENT[activeElement];
  const activeSub = subTabByElement[activeElement];
  const accent = ELEMENTS[activeElement].color;

  const subTabRail = (
    <SubTabRail
      tabs={tabs}
      active={activeSub}
      color={accent}
      onChange={setSubTab}
      axis={isLandscape ? 'vertical' : 'horizontal'}
    />
  );

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
      <Screen
        subTab={activeSub}
        onSubTabChange={setSubTab}
        onElementChange={setActiveElement}
      />
    </Animated.View>
  );

  if (isLandscape) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.row}>
          {subTabRail}
          {screen}
          {elementRail}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {subTabRail}
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
