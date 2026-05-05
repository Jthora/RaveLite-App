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

const WaterScreen: React.FC<Props> = ({subTab, onSubTabChange}) => {
  const next = nextFireForElement(loadPlan(), 'water');
  return (
    <ScreenScaffold
      element={ELEMENTS.water}
      nextFireTs={next?.ts}
      everyMinutes={next?.everyMinutes}>
      <ElementSubPages
        element={ELEMENTS.water}
        subTab={subTab}
        onSubTabChange={onSubTabChange}
      />
    </ScreenScaffold>
  );
};

export default WaterScreen;
