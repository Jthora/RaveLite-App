/**
 * One line on Today, and only while a mode is running.
 *
 * With nothing on it renders nothing — not a placeholder, not a spacer —
 * because Today is the page that was already right and the whole point of
 * modes is that they are temporary. When one is on, it says so, says when
 * it ends, and ends it in one tap.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {modeLabel, type Mode} from '../../domain/profile/mode';
import type {Region} from '../../domain/profile/kit';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export function ModeChip({
  mode,
  injured,
  now,
  onClear,
}: {
  mode: Mode | undefined;
  /** An injury, which stays on under the mode. */
  injured?: Region;
  now: number;
  /** Ends the mode if there is one, otherwise the injury. */
  onClear: () => void;
}) {
  // A hurt mode stored before injuries stacked is shown as the injury.
  const shown = mode?.id === 'injured' ? undefined : mode;
  if (!shown && !injured) {
    return null;
  }
  const accent = ELEMENTS.heart.accent;
  const label = [
    shown ? modeLabel(shown, now) : undefined,
    injured ? `Hurt · ${injured}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.root}>
      <View style={[styles.chip, {borderColor: accent}]}>
        <Text testID="mode-chip" style={[styles.text, {color: accent}]}>
          {label}
        </Text>
      </View>
      <Tap
        testID="mode-chip-clear"
        variant="ghost"
        color={palette.textDim}
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel={shown ? 'End this mode' : 'End hurt mode'}
        style={styles.btn}>
        <Text style={styles.btnText}>End</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: {
    ...t.caption,
    fontWeight: '600',
  },
  btn: {
    minHeight: 44,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  btnText: {
    ...t.caption,
    color: palette.textDim,
  },
});
