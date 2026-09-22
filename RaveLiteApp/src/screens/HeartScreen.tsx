/**
 * Heart screen — home, one page: Today.
 *
 * It asks for notification permission once setup is done, so the prompt
 * arrives in context rather than over setup, and owns the circuit
 * chamber, so a circuit started from Today's Practice sheet runs full
 * screen.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';

import {CircuitChamber} from '../components/CircuitChamber';
import {ScreenScaffold} from '../components/ScreenScaffold';
import {Guard} from '../components/Guard';
import type {CircuitLeg} from '../domain/circuit/circuit';
import {
  notificationsAllowed,
  requestNotificationPermission,
} from '../domain/reminders/notifeeScheduler';
import {needsSetup, subscribeProfile} from '../domain/profile/repository';
import type {ElementScreenProps} from '../shell/ElementShell';
import {ELEMENTS} from '../theme/elements';
import {TodayPanel} from './heart/TodayPanel';

const HeartScreen: React.FC<ElementScreenProps> = ({onElementChange}) => {
  const [permission, setPermission] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');
  const [chamberOpen, setChamberOpen] = useState(false);
  const [chamberLegs, setChamberLegs] = useState<CircuitLeg[] | undefined>();

  useEffect(() => {
    let asked = false;
    const ask = () => {
      // Not while setup is on screen: the prompt used to land on top of
      // the disclaimer, and again when setup closed. Once, after it.
      if (asked || needsSetup()) {
        return;
      }
      asked = true;
      requestNotificationPermission().then(ok =>
        setPermission(ok ? 'granted' : 'denied'),
      );
    };
    ask();
    const offProfile = subscribeProfile(ask);
    // Turned on in Android's settings and back again: pick it up.
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active' && asked) {
        notificationsAllowed().then(ok => {
          if (ok !== null) {
            setPermission(ok ? 'granted' : 'denied');
          }
        });
      }
    });
    return () => {
      offProfile();
      sub?.remove();
    };
  }, []);

  const engageLegs = useCallback((legs: CircuitLeg[]) => {
    setChamberLegs(legs);
    setChamberOpen(true);
  }, []);

  return (
    <ScreenScaffold element={ELEMENTS.heart}>
      {/* Today is the app. A bad row in the day's list used to take the
          chime, the water counter and the whole page with it. */}
      <Guard name="Today">
        <TodayPanel
          permission={permission}
          onElementPress={onElementChange}
          onEngageLegs={engageLegs}
        />
      </Guard>
      <CircuitChamber
        visible={chamberOpen}
        legs={chamberLegs}
        onClose={() => {
          setChamberOpen(false);
          setChamberLegs(undefined);
        }}
      />
    </ScreenScaffold>
  );
};

export default HeartScreen;
