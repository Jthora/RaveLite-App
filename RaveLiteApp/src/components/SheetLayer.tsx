/**
 * A dialog inside a sheet, drawn in the sheet's own window.
 *
 * On the Redmi, a React Native Modal opened over another Modal stops
 * receiving Android's Back once it has been touched — and so does the
 * sheet under it, until something is tapped. So a sheet that has dialogs
 * wraps its content in <SheetLayerHost>, and a dialog renders
 * <SheetLayer onClose>: it is drawn over the sheet's content, in the same
 * window, and takes Back through the sheet's BackStack. Outside a host it
 * is an ordinary transparent Modal, so the same dialog works anywhere.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Modal, StyleSheet, View} from 'react-native';

import {useBackHandler} from './BackStack';

interface Host {
  set: (id: number, node: React.ReactNode | null) => void;
}

const HostContext = createContext<Host | null>(null);

/** Wrap a sheet's content; its dialogs draw here, over it. */
export function SheetLayerHost({children}: {children: React.ReactNode}) {
  const [layers, setLayers] = useState<ReadonlyMap<number, React.ReactNode>>(
    () => new Map(),
  );
  const host = useMemo<Host>(
    () => ({
      set: (id, node) =>
        setLayers(prev => {
          const next = new Map(prev);
          if (node === null) {
            next.delete(id);
          } else {
            next.set(id, node);
          }
          return next;
        }),
    }),
    [],
  );
  const covered = layers.size > 0;
  return (
    <HostContext.Provider value={host}>
      <View
        style={styles.fill}
        // Under a dialog, the sheet takes no touches and TalkBack skips it.
        pointerEvents={covered ? 'none' : 'auto'}
        importantForAccessibility={covered ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={covered}>
        {children}
      </View>
      {[...layers.entries()].map(([id, node]) => (
        <View key={id} style={StyleSheet.absoluteFill}>
          {node}
        </View>
      ))}
    </HostContext.Provider>
  );
}

let nextId = 0;

/** True inside a sheet that hosts its own dialogs. */
export function useInSheet(): boolean {
  return useContext(HostContext) !== null;
}

/** A dialog: in the sheet's window when there is a host, else a Modal. */
export function SheetLayer({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const host = useContext(HostContext);
  const id = useRef(0);
  if (id.current === 0) {
    id.current = ++nextId;
  }
  useBackHandler(host !== null, onClose);
  // Every render hands the host the latest content, so the dialog's own
  // state (a stepper, a text field) shows as it changes — before paint,
  // so typed text never shows a frame behind.
  useLayoutEffect(() => {
    host?.set(id.current, children);
  });
  useEffect(() => {
    const mine = id.current;
    return () => host?.set(mine, null);
  }, [host]);
  if (host) {
    return null;
  }
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1},
});
