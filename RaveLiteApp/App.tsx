/**
 * RaveLite — root.
 *
 * Stack:
 *   - GestureHandlerRootView   (required for gesture-handler in release builds)
 *   - SafeAreaProvider          (for SafeAreaView in screens)
 *   - StatusBar light-content   (rave context = dark UI, light glyphs)
 *   - ElementShell              (orientation-adaptive nav: drops React
 *                                Navigation, hand-rolls bottom/right rail
 *                                + top/left sub-tab rail)
 */
import React, {useEffect, useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {palette} from './src/theme';
import {runMigrations} from './src/storage/migrations';
import {hydratePersistence} from './src/storage/persistence';
import {
  bootstrapHeartVariant,
  subscribeHeartVariant,
} from './src/theme/heartVariants';
import {startNotifeeForegroundBridge} from './src/domain/reminders/notifeeScheduler';
import {registerAmbientForegroundService} from './src/domain/ambient/foregroundService';
import {startPulseRuntime} from './src/domain/ambient/pulseRuntime';
import {startPlanScheduler} from './src/domain/ambient/planScheduler';
import {ElementShell} from './src/shell/ElementShell';

// Hook Notifee's foreground event listener once at boot so notifications
// actually present while RaveLite is the active app (the common case for
// a training companion).
startNotifeeForegroundBridge();

// Slice 5 — register the ambient FGS task runner once at app start.
// The service itself is started/stopped by AlwaysOnPanel based on
// active-hours + manual-pause state.
registerAmbientForegroundService();

function App(): React.JSX.Element {
  // Gate the first render until persisted state has been loaded into
  // memoryStore. Without this gate, ElementShell's initial state would
  // come from defaults and overwrite the persisted values via its
  // useEffect write-through. ~10–30ms one-shot.
  const [hydrated, setHydrated] = useState(false);
  // Bumped whenever the heart variant changes. Used as a key on the
  // shell so the entire screen tree re-mounts with the new theme —
  // simplest possible invalidation, since `ELEMENTS.heart` is mutated
  // in place and we want every captured value (StyleSheet creations,
  // useMemo results, etc.) to refresh.
  const [themeEpoch, setThemeEpoch] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydratePersistence();
      // Apply the persisted heart variant to the live ELEMENTS map
      // BEFORE the first render so the shell renders with the right
      // colors/glyph from the start (no flash of magenta on Core users).
      bootstrapHeartVariant();
      // Run migrations AFTER hydration so they see the real persisted
      // schema version.
      runMigrations();
      if (!cancelled) {
        setHydrated(true);
        // Phase B reminders pipeline: now that the persisted Plan is
        // available, start the rolling 24h enqueue. Idempotent.
        startPulseRuntime();
        startPlanScheduler();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeHeartVariant(() => {
      setThemeEpoch(e => e + 1);
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={palette.bg} />
        {hydrated ? (
          <ElementShell key={themeEpoch} />
        ) : (
          <View style={styles.root} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.bg},
});

export default App;
