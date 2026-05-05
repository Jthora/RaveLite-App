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

const EarthScreen: React.FC<Props> = ({subTab, onSubTabChange}) => {
  const next = nextFireForElement(loadPlan(), 'earth');
  return (
    <ScreenScaffold
      element={ELEMENTS.earth}
      nextFireTs={next?.ts}
      everyMinutes={next?.everyMinutes}>
      <ElementSubPages
        element={ELEMENTS.earth}
        subTab={subTab}
        onSubTabChange={onSubTabChange}
      />
    </ScreenScaffold>
  );
};

export default EarthScreen;
