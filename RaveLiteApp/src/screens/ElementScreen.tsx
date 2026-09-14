/**
 * Element screens — Fire, Air, Earth and Water share one page: a drill to
 * try now, the last 14 days and a day's log (see `element/ElementPage`).
 *
 * Heart is different (it is home) and lives in `HeartScreen.tsx`.
 */
import React from 'react';

import {ScreenScaffold} from '../components/ScreenScaffold';
import type {ElementScreenProps} from '../shell/ElementShell';
import {ElementProvider} from '../theme/elementContext';
import {ELEMENTS, type ElementId} from '../theme/elements';
import {ElementPage} from './element/ElementPage';

export function makeElementScreen(
  id: Exclude<ElementId, 'heart'>,
): React.FC<ElementScreenProps> {
  const ElementScreen: React.FC<ElementScreenProps> = () => {
    const element = ELEMENTS[id];
    return (
      <ScreenScaffold element={element}>
        <ElementProvider element={element}>
          <ElementPage element={element} />
        </ElementProvider>
      </ScreenScaffold>
    );
  };
  ElementScreen.displayName = `${ELEMENTS[id].name}Screen`;
  return ElementScreen;
}
