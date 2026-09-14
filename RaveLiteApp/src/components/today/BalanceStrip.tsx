import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {palette, radius, spacing} from '../../theme';

interface Props {
  /** Things done today per element. */
  counts: Record<ElementId, number>;
  /** Per element, the last 7 days (today last): anything done that day. */
  week?: Record<ElementId, readonly boolean[]>;
  onElementPress?: (id: ElementId) => void;
}

/**
 * Today's balance: one cell per element with its count, and a row of dots
 * for the week so a neglected element shows before it becomes a habit. A
 * partner drill or a glass of water counts toward its own element, so Fire
 * work lifts the others too. Tap an element to open it.
 */
export function BalanceStrip({counts, week, onElementPress}: Props) {
  return (
    <View style={styles.row}>
      {ELEMENT_ORDER.map(id => {
        const el = ELEMENTS[id];
        const n = counts[id] ?? 0;
        const lit = n > 0;
        const days = week?.[id] ?? [];
        const active = days.filter(Boolean).length;
        return (
          <Tap
            key={id}
            variant="plain"
            color={el.color}
            onPress={() => onElementPress?.(id)}
            accessibilityRole="button"
            accessibilityLabel={`${el.name}: ${n} today, ${active} of the last 7 days`}
            style={[styles.cell, lit && {borderColor: el.color}]}>
            <Text
              style={[
                styles.glyph,
                {color: lit ? el.color : palette.textMuted},
              ]}>
              {el.glyph}
            </Text>
            <Text style={[styles.count, !lit && styles.countIdle]}>{n}</Text>
            {days.length > 0 ? (
              <View style={styles.dots}>
                {days.map((on, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {backgroundColor: on ? el.color : palette.border},
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  glyph: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  countIdle: {
    color: palette.textMuted,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
