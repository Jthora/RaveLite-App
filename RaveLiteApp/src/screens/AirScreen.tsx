import React from 'react';
import {ScreenScaffold} from '../components/ScreenScaffold';
import {ELEMENTS} from '../theme/elements';
import {loadPlan} from '../domain/reminders/repository';
import {nextFireForElement} from '../domain/reminders/nextFire';
import {ElementSubPages} from './shared/ElementSubPages';

interface Props {
  subTab: string;
  onSubTabChange: (slug: string) => void;
}

const AirScreen: React.FC<Props> = ({subTab, onSubTabChange}) => {
  const next = nextFireForElement(loadPlan(), 'air');
  return (
    <ScreenScaffold
      element={ELEMENTS.air}
      nextFireTs={next?.ts}
      everyMinutes={next?.everyMinutes}>
      <ElementSubPages
        element={ELEMENTS.air}
        subTab={subTab}
        onSubTabChange={onSubTabChange}
      />
    </ScreenScaffold>
  );
};

export default AirScreen;
