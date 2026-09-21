/**
 * RaveLite — root.
 *
 * Stack:
 *   - GestureHandlerRootView   (required for gesture-handler in release builds)
 *   - SafeAreaProvider          (for SafeAreaView in screens)
 *   - StatusBar light-content   (rave context = dark UI, light glyphs)
 *   - ElementShell              (orientation-adaptive nav: drops React
 *                                Navigation, hand-rolls a bottom/right
 *                                element rail; one page per element)
 */
import React, {useEffect, useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {palette} from './src/theme';
import {runMigrations} from './src/storage/migrations';
import {ensureHydrated} from './src/storage/persistence';
import {
  bootstrapHeartVariant,
  subscribeHeartVariant,
} from './src/theme/heartVariants';
import {startNotifeeForegroundBridge} from './src/domain/reminders/notifeeScheduler';
import {registerAmbientForegroundService} from './src/domain/ambient/foregroundService';
import {startAmbientLifecycle} from './src/domain/ambient/ambientLifecycle';
import {handleNotificationAction} from './src/domain/ambient/notificationActions';
import {startPulseRuntime} from './src/domain/ambient/pulseRuntime';
import {startPlanScheduler} from './src/domain/ambient/planScheduler';
import {startSetScheduler} from './src/domain/ambient/setScheduler';
import {startBackupScheduler} from './src/domain/ambient/backupScheduler';
import {startWeather} from './src/domain/conditions/weather';
import {ElementShell} from './src/shell/ElementShell';
import {SetupFlow} from './src/screens/setup/SetupFlow';
import {needsSetup} from './src/domain/profile/repository';
import {capTextScaling} from './src/lib/textScaling';
import {guessUnitsOnce} from './src/domain/settings/units';
import {setWeatherPrefs} from './src/domain/conditions/weather';
import {getLocale} from './src/native/raveLiteDevice';
import {NightVeil} from './src/components/alive/NightVeil';
import {CueWash} from './src/components/alive/CueWash';
import {startAliveBridge} from './src/domain/ambient/aliveBridge';
import {touch as aliveTouch} from './src/lib/aliveClock';

// Hook Notifee's foreground events once at boot so notifications actually
// present while RaveLite is the active app (the common case for a training
// companion), and so Done / +5 / Skip buttons answer the live pulse.
startNotifeeForegroundBridge(handleNotificationAction);

// Slice 5 — register the ambient FGS task runner once at app start.
// `startAmbientLifecycle` starts/stops the service itself based on
// active-hours + manual-pause state.
registerAmbientForegroundService();

// Every touch anywhere nudges the alive clock. Touch events bubble, so
// this observes taps without taking them from buttons or scroll views.
function onRootTouch(): void {
  aliveTouch();
}

// Once, before anything renders: the OS font setting may grow this app,
// but not far enough to break the rows it is built around.
capTextScaling();

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
  // First run only. Decided once, after hydration and migrations, so it
  // reads the real stored state rather than defaults — and never again,
  // because a setup screen that can reappear is a setup screen that can
  // reappear over a year of training.
  const [setup, setSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureHydrated();
      // Apply the persisted heart variant to the live ELEMENTS map
      // BEFORE the first render so the shell renders with the right
      // colors/glyph from the start (no flash of magenta on Core users).
      bootstrapHeartVariant();
      // Run migrations AFTER hydration so they see the real persisted
      // schema version.
      runMigrations();
      if (!cancelled) {
        const fresh = needsSetup();
        // Guess miles or kilometres from the phone rather than asking. An
        // install that has been running keeps what it was showing.
        void guessUnitsOnce(fresh, getLocale, units =>
          setWeatherPrefs({units}),
        );
        setSetup(fresh);
        setHydrated(true);
        // Reminders pipeline: now that persisted state is available,
        // start the runtime, both producers (Plan cadence + Daily Sets),
        // OS backup chimes for a killed process, and the background
        // service that keeps them alive. Idempotent.
        startPulseRuntime();
        startPlanScheduler();
        startSetScheduler();
        startBackupScheduler();
        // Sunrise needs no network; the forecast refreshes every few hours.
        startWeather();
        startAmbientLifecycle();
        startAliveBridge();
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
    <GestureHandlerRootView style={styles.root} onTouchStart={onRootTouch}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={palette.bg} />
        {hydrated ? (
          <>
            <ElementShell key={themeEpoch} />
            <CueWash />
            <NightVeil />
            {setup ? <SetupFlow onDone={() => setSetup(false)} /> : null}
          </>
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
