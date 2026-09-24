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
import {Linking, StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {palette} from './src/theme';
import {runMigrations} from './src/storage/migrations';
import {ensureHydrated, persistenceHealth} from './src/storage/persistence';
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
import {__resetProfileCache, needsSetup} from './src/domain/profile/repository';
import {beginSetup} from './src/domain/profile/setup';
import {
  clearSetupRequest,
  subscribeSetupRequest,
} from './src/domain/profile/setupRequest';
import {store} from './src/storage';
import {CURRENT_SCHEMA_VERSION, KEYS} from './src/storage/keys';
import './src/domain/diagnostics/errorLog';
import {resetPlanToDefault} from './src/domain/reminders/repository';
import {capTextScaling} from './src/lib/textScaling';
import {loadDeviceFacts} from './src/native/deviceFacts';
import {handleDemoLink} from './src/domain/demo/demo';
import {guessUnitsOnce} from './src/domain/settings/units';
import {loadPhoneClockOnce} from './src/domain/settings/clock';
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
        // A disk that could not be read looks exactly like a new install.
        // Setup would then save over it; Today says what happened instead.
        const fresh = needsSetup() && !persistenceHealth().readFailed;
        // Guess miles or kilometres from the phone rather than asking. An
        // install that has been running keeps what it was showing.
        void guessUnitsOnce(fresh, getLocale, units =>
          setWeatherPrefs({units}),
        );
        // 14:30 or 2:30 PM — the phone already knows which this person
        // reads, so the app follows it unless they say otherwise.
        void loadPhoneClockOnce(getLocale);
        // What phone this is, so a bug report says so. Nothing waits on
        // it; it is read once and kept for the report.
        void loadDeviceFacts();
        if (fresh) {
          // Before anything reads the profile: Skip must land on these.
          beginSetup();
        }
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

  // Settings cannot show the walkthrough itself: both are full-screen
  // Modals, and a modal over a modal breaks Back on Android. It asks,
  // closes itself, and the flow opens here with nothing underneath.
  useEffect(
    () =>
      subscribeSetupRequest(reason => {
        if (reason === 'fresh') {
          store.clearAll();
          // Written now, or the next launch runs every migration from v0
          // over whatever setup is about to be answered with.
          store.set(KEYS.schemaVersion, CURRENT_SCHEMA_VERSION);
          __resetProfileCache();
          // A read would seed the default quietly; this says so, so the
          // chime schedulers drop the old plan's chimes now.
          resetPlanToDefault();
        }
        setSetup(reason !== undefined);
      }),
    [],
  );

  // Demo mode (ravelite://demo/on) swaps the whole store, so every screen
  // has to be built again from the new one — the same remount the theme
  // uses, for the same reason.
  useEffect(() => {
    const apply = (url: string | null) => {
      if (handleDemoLink(url)) {
        setThemeEpoch(e => e + 1);
      }
    };
    void Linking.getInitialURL().then(apply);
    const sub = Linking.addEventListener('url', ({url}) => apply(url));
    // The test environment's Linking mock returns no subscription.
    return () => sub?.remove();
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
            {setup ? (
              <SetupFlow
                onDone={() => {
                  clearSetupRequest();
                  setSetup(false);
                  // A wipe took the whole tree's state with it.
                  setThemeEpoch(e => e + 1);
                }}
              />
            ) : null}
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
