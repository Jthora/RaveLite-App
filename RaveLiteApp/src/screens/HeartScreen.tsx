/**
 * Heart screen — home.
 *
 * Sub-tab state lives in `ElementShell` and arrives as a prop; this screen
 * picks the panel: Today (the day and the chime to answer), Progress
 * (the week and Daily Sets) or Setup. It also owns the circuit chamber, so
 * a circuit started from Today's Practice sheet runs full screen.
 */
import React, {useCallback, useEffect, useState} from 'react';

import {CircuitChamber} from '../components/CircuitChamber';
import {ScreenScaffold} from '../components/ScreenScaffold';
import type {CircuitLeg} from '../domain/circuit/circuit';
import {requestNotificationPermission} from '../domain/reminders/notifeeScheduler';
import type {ElementScreenProps} from '../shell/ElementShell';
import {isHeartSlug} from '../shell/subTabRegistry';
import {ELEMENTS} from '../theme/elements';
import {ProgressPanel} from './heart/ProgressPanel';
import {SetupPanel} from './heart/SetupPanel';
import {TodayPanel} from './heart/TodayPanel';

const HeartScreen: React.FC<ElementScreenProps> = ({
  subTab,
  onSubTabChange,
  onElementChange,
}) => {
  const slug = isHeartSlug(subTab) ? subTab : 'today';
  const [permission, setPermission] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');
  const [chamberOpen, setChamberOpen] = useState(false);
  const [chamberLegs, setChamberLegs] = useState<CircuitLeg[] | undefined>();

  // Ask for notification permission on the first Heart visit, so the
  // prompt arrives in context rather than at cold start.
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
      {slug === 'today' && (
        <TodayPanel
          onOpenProgress={() => onSubTabChange('progress')}
          onElementPress={onElementChange}
          onEngageLegs={engageLegs}
        />
      )}
      {slug === 'progress' && <ProgressPanel />}
      {slug === 'setup' && <SetupPanel permission={permission} />}
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
