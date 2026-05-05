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

const FireScreen: React.FC<Props> = ({subTab, onSubTabChange}) => {
  const next = nextFireForElement(loadPlan(), 'fire');
  return (
    <ScreenScaffold
      element={ELEMENTS.fire}
      nextFireTs={next?.ts}
      everyMinutes={next?.everyMinutes}>
      <ElementSubPages
        element={ELEMENTS.fire}
        subTab={subTab}
        onSubTabChange={onSubTabChange}
      />
    </ScreenScaffold>
  );
};

export default FireScreen;
