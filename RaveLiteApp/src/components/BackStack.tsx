/**
 * Android Back inside one sheet, innermost first.
 *
 * A React Native Modal receives the hardware Back itself (onRequestClose),
 * so an editor shown inside a sheet cannot catch it: Back in the circuit
 * editor used to close all of Practice. A sheet provides this stack; an
 * editor registers while it is open; the sheet's onRequestClose asks the
 * stack first and only closes when nothing inside wants Back.
 */
import React, {createContext, useContext, useEffect, useRef} from 'react';

type Handler = () => void;

interface Stack {
  push: (handler: Handler) => () => void;
}

const BackContext = createContext<Stack | null>(null);

/** For the sheet: a provider, and `back()` that runs the innermost handler. */
export function useBackStack(): {
  Provider: React.FC<{children: React.ReactNode}>;
  back: () => boolean;
} {
  const handlers = useRef<Handler[]>([]);
  const stack = useRef<Stack>({
    push: handler => {
      handlers.current.push(handler);
      return () => {
        handlers.current = handlers.current.filter(h => h !== handler);
      };
    },
  });
  const Provider = useRef<React.FC<{children: React.ReactNode}>>(
    ({children}) => (
      <BackContext.Provider value={stack.current}>
        {children}
      </BackContext.Provider>
    ),
  ).current;
  return {
    Provider,
    back: () => {
      const last = handlers.current[handlers.current.length - 1];
      if (!last) {
        return false;
      }
      last();
      return true;
    },
  };
}

/** For an editor: take Back while `active`. A no-op outside a stack. */
export function useBackHandler(active: boolean, handler: Handler): void {
  const stack = useContext(BackContext);
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!stack || !active) {
      return;
    }
    return stack.push(() => latest.current());
  }, [stack, active]);
}
