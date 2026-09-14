/**
 * Element screens — Fire, Air, Earth and Water share one shape:
 *   - Drills: a drill to try now, plus the element's library.
 *   - Train: sessions typed in by hand (runs, holds, rep tests).
 *   - History: everything done in this element, day by day.
 *
 * Heart is different (it is home) and lives in `HeartScreen.tsx`.
 */
import React from 'react';

import {ScreenScaffold} from '../components/ScreenScaffold';
import {TrainingLogPanel} from '../components/training/TrainingLogPanel';
import type {ElementScreenProps} from '../shell/ElementShell';
import {ElementProvider} from '../theme/elementContext';
import {ELEMENTS, type ElementId} from '../theme/elements';
import {DrillsPanel} from './element/DrillsPanel';
import {HistoryPanel} from './element/HistoryPanel';

export function makeElementScreen(
  id: Exclude<ElementId, 'heart'>,
): React.FC<ElementScreenProps> {
  const ElementScreen: React.FC<ElementScreenProps> = ({subTab}) => {
    const element = ELEMENTS[id];
    return (
      <ScreenScaffold element={element}>
        <ElementProvider element={element}>
          {subTab === 'train' ? (
            <TrainingLogPanel element={id} />
          ) : subTab === 'history' ? (
            <HistoryPanel element={element} />
          ) : (
            <DrillsPanel element={element} />
          )}
        </ElementProvider>
      </ScreenScaffold>
    );
  };
  ElementScreen.displayName = `${ELEMENTS[id].name}Screen`;
  return ElementScreen;
}
