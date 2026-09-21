/**
 * WindowRow — one collapsed row in the Plan overview list.
 *
 * Shows: an element-tinted dot (dominant element) · label · time range
 * · day pattern · slot count. Tap → opens the window editor.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import type {Window} from '../../domain/reminders/types';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing} from '../../theme';

interface Props {
  window: Window;
  onPress?: () => void;
}

export function WindowRow({window: w, onPress}: Props) {
  const dom = dominantElement(w);
  const accent = ELEMENTS[dom].color;
  const dayLabel = formatDays(w.daysOfWeek);

  return (
    <Tap
      variant="plain"
      color={accent}
      onPress={onPress}
      style={[styles.row, {borderColor: palette.border}]}>
      <View style={[styles.dot, {backgroundColor: accent}]} />
      <View style={styles.body}>
        <Text style={styles.label}>{w.label}</Text>
        <Text style={styles.meta}>
          {dayLabel} · {w.startTime}–{w.endTime} · {w.slots.length} slot
          {w.slots.length === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={[styles.chevron, {color: accent}]}>›</Text>
    </Tap>
  );
}

function dominantElement(
  w: import('../../domain/reminders/types').Window,
): ElementId {
  if (w.slots.length === 0) {
    return 'heart';
  }
  const counts: Partial<Record<ElementId, number>> = {};
  for (const s of w.slots) {
    counts[s.element] = (counts[s.element] ?? 0) + 1;
  }
  let best: ElementId = 'heart';
  let bestN = -1;
  for (const id of Object.keys(counts) as ElementId[]) {
    const n = counts[id]!;
    if (n > bestN || (n === bestN && id === 'heart')) {
      best = id;
      bestN = n;
    }
  }
  return best;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function formatDays(days: number[]): string {
  const set = new Set(days);
  if (set.size === 7) {
    return 'Daily';
  }
  if (
    set.size === 5 &&
    [1, 2, 3, 4, 5].every(d => set.has(d)) &&
    !set.has(0) &&
    !set.has(6)
  ) {
    return 'Mon–Fri';
  }
  if (set.size === 2 && set.has(0) && set.has(6)) {
    return 'Weekends';
  }
  return DAY_LETTERS.map((l, i) => (set.has(i) ? l : '·')).join(' ');
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: palette.surface,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {flex: 1},
  label: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  meta: {
    color: palette.textDim,
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    paddingHorizontal: spacing.xs,
  },
});
