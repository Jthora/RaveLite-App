import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {palette, radius, spacing} from '../../theme';

interface Props {
  /** Things done today per element. */
  counts: Record<ElementId, number>;
  onElementPress?: (id: ElementId) => void;
}

/**
 * Today's balance: one cell per element with its count. A partner drill or
 * a glass of water counts toward its own element, so Fire work lifts the
 * others too. Tap an element to open it.
 */
export function BalanceStrip({counts, onElementPress}: Props) {
  return (
    <View style={styles.row}>
      {ELEMENT_ORDER.map(id => {
        const el = ELEMENTS[id];
        const n = counts[id] ?? 0;
        const lit = n > 0;
        return (
          <Tap
            key={id}
            variant="plain"
            color={el.color}
            onPress={() => onElementPress?.(id)}
            accessibilityRole="button"
            accessibilityLabel={`${el.name}: ${n} today`}
            style={[styles.cell, lit && {borderColor: el.color}]}>
            <Text
              style={[
                styles.glyph,
                {color: lit ? el.color : palette.textMuted},
              ]}>
              {el.glyph}
            </Text>
            <Text style={[styles.count, !lit && styles.countIdle]}>{n}</Text>
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
});
