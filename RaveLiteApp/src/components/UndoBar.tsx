import React, {useEffect, useReducer} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from './Tap';
import {
  bringBack,
  subscribeUndo,
  takeBack,
  type UndoNotice,
} from '../domain/activity/corrections';
import {ELEMENTS} from '../theme/elements';
import {palette, radius, spacing, type as t} from '../theme';

/** How long a notice offers Undo. */
export const UNDO_MS = 8000;

// One notice for every bar. A sheet is its own window, drawn over the
// page's bar, so each sheet that can log carries a bar too; only the
// newest bar (the top sheet's) shows it, and Undo in one clears them all.
let current: UndoNotice | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let undoOff: (() => void) | undefined;
/** Mounted bars, oldest first. */
const bars: Array<() => void> = [];

function show(next: UndoNotice | undefined): void {
  current = next;
  if (timer) {
    clearTimeout(timer);
  }
  timer = next ? setTimeout(() => show(undefined), UNDO_MS) : undefined;
  bars.forEach(redraw => redraw());
}

/**
 * A quiet bar along the bottom of every page after something is logged or
 * removed: "Logged Push-ups · Undo". It leaves on its own after a few
 * seconds, or as soon as Undo is tapped.
 */
export function UndoBar() {
  const [, redraw] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    bars.push(redraw);
    if (!undoOff) {
      undoOff = subscribeUndo(show);
    }
    bars.forEach(r => r());
    return () => {
      bars.splice(bars.indexOf(redraw), 1);
      if (bars.length === 0) {
        undoOff?.();
        undoOff = undefined;
        show(undefined);
      }
      bars.forEach(r => r());
    };
  }, []);

  const notice = current;
  if (!notice || bars[bars.length - 1] !== redraw) {
    return null;
  }

  const el = ELEMENTS[notice.entry.element];
  const logged = notice.kind === 'logged';
  const undo = () => {
    if (logged) {
      takeBack(notice.entry);
    } else {
      bringBack(notice.entry);
    }
    show(undefined);
  };

  return (
    <View
      testID="undo-bar"
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={styles.wrap}>
      <View style={[styles.bar, {borderColor: el.deep}]}>
        <Text style={[styles.mark, {color: el.color}]}>
          {logged ? '✓' : '–'}
        </Text>
        <Text style={styles.text} numberOfLines={1}>
          {logged ? 'Logged' : 'Removed'} {notice.label}
        </Text>
        <Tap
          testID="undo-action"
          variant="plain"
          color={el.color}
          onPress={undo}
          accessibilityRole="button"
          accessibilityLabel={
            logged
              ? `Undo: take back ${notice.label}`
              : `Undo: put back ${notice.label}`
          }
          style={styles.undo}>
          <Text style={[styles.undoText, {color: el.accent}]}>Undo</Text>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: '#141720',
    elevation: 6,
  },
  mark: {
    fontSize: 16,
    fontWeight: '800',
  },
  text: {
    ...t.body,
    color: palette.text,
    flex: 1,
  },
  undo: {
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  undoText: {
    ...t.subtitle,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
