/**
 * Heart screen — home, one page: Today.
 *
 * It asks for notification permission on the first visit, so the prompt
 * arrives in context rather than at cold start, and owns the circuit
 * chamber, so a circuit started from Today's Practice sheet runs full
 * screen.
 */
import React, {useCallback, useEffect, useState} from 'react';

import {CircuitChamber} from '../components/CircuitChamber';
import {ScreenScaffold} from '../components/ScreenScaffold';
import type {CircuitLeg} from '../domain/circuit/circuit';
import {requestNotificationPermission} from '../domain/reminders/notifeeScheduler';
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
    requestNotificationPermission().then(ok =>
      setPermission(ok ? 'granted' : 'denied'),
    );
  }, []);

  const engageLegs = useCallback((legs: CircuitLeg[]) => {
    setChamberLegs(legs);
    setChamberOpen(true);
  }, []);

  return (
    <ScreenScaffold element={ELEMENTS.heart}>
      <TodayPanel
        permission={permission}
        onElementPress={onElementChange}
        onEngageLegs={engageLegs}
      />
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
