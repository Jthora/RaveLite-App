/**
 * ElementContext — propagates the current element's identity through
 * the component tree so descendant UI (panels, sheets, pickers) can
 * pick up the element's accent color without prop-threading.
 *
 * Default = heart. Element screens (Fire/Air/Earth/Water/Heart) wrap
 * their sub-pages in <ElementProvider element={...}> so any nested
 * Training/Log/Drills/Stats UI auto-themes.
 */
import React, {createContext, useContext} from 'react';
import {ELEMENTS, ElementId, ElementIdentity} from './elements';

const ElementContext = createContext<ElementIdentity>(ELEMENTS.heart);

export function ElementProvider({
  element,
  children,
}: {
  element: ElementIdentity | ElementId;
  children: React.ReactNode;
}) {
  const value = typeof element === 'string' ? ELEMENTS[element] : element;
  return (
    <ElementContext.Provider value={value}>{children}</ElementContext.Provider>
  );
}

export function useElement(): ElementIdentity {
  return useContext(ElementContext);
}

export function useElementAccent(): string {
  return useContext(ElementContext).color;
}
