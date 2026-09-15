/**
 * Element screens — Fire, Air, Core, Earth and Water share one page: the
 * day in points, a drill to try now, the last 14 days and a day's log (see
 * `element/ElementPage`). They open over Today from its balance strip.
 */
import React from 'react';

import {ScreenScaffold} from '../components/ScreenScaffold';
import type {ElementScreenProps} from '../shell/ElementShell';
import {ElementProvider} from '../theme/elementContext';
import {ELEMENTS, type ElementId} from '../theme/elements';
import {ElementPage} from './element/ElementPage';

export function makeElementScreen(id: ElementId): React.FC<ElementScreenProps> {
  const ElementScreen: React.FC<ElementScreenProps> = ({onBack}) => {
    // Read at render: Core's name and colors follow the theme.
    const element = ELEMENTS[id];
    return (
      <ScreenScaffold element={element}>
        <ElementProvider element={element}>
          <ElementPage element={element} onBack={onBack} />
        </ElementProvider>
      </ScreenScaffold>
    );
  };
  ElementScreen.displayName = `ElementScreen(${id})`;
  return ElementScreen;
}
