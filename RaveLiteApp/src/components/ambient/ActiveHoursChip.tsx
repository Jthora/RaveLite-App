/**
 * `<ActiveHoursChip />` — status-strip chip showing the current
 * active-hours range. Phase 1A: read-only display. Long-press editor
 * lands in Phase 2 (AOS-104).
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import type {ActiveHours} from '../../domain/ambient/types';
import {palette, radius, spacing, type as t} from '../../theme';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export interface ActiveHoursChipProps {
  range: ActiveHours;
  /** Epoch ms; if in the future, the chip renders the pause indicator. */
  manualPauseUntil?: number;
  /** Live `Date.now()`; used to test pause expiry. */
  now: number;
  onEdit?: () => void;
  onTogglePause?: () => void;
}

export function ActiveHoursChip({
  range,
  manualPauseUntil,
  now,
  onEdit,
}: ActiveHoursChipProps) {
  const paused =
    typeof manualPauseUntil === 'number' && manualPauseUntil > now;
  const allDays = range.daysMask === 0b1111111;
  const dayLabel = allDays
    ? 'all days'
    : DAY_LETTERS.filter((_, i) => (range.daysMask & (1 << i)) !== 0).join('');

  return (
    <Tap
      variant="ghost"
      color={paused ? palette.danger : palette.textDim}
      onPress={onEdit}
      style={[
        styles.chip,
        {borderColor: paused ? palette.danger : palette.border},
      ]}>
      <View style={styles.row}>
        <Text style={[styles.range, paused && {color: palette.danger}]}>
          {range.start}–{range.end}
        </Text>
        <Text style={styles.days}>{dayLabel}</Text>
        {paused ? <Text style={styles.pauseBadge}>PAUSED</Text> : null}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: palette.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  range: {
    ...t.caption,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  days: {
    ...t.caption,
    color: palette.textMuted,
  },
  pauseBadge: {
    ...t.caption,
    color: palette.danger,
    letterSpacing: 1,
  },
});
