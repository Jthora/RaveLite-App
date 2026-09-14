import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** Glasses a day: 8 × ~250 ml ≈ 2 L. */
export const WATER_TARGET = 8;

interface Props {
  glasses: number;
  target?: number;
  onAdd: () => void;
}

/** Glasses of water today — chimes, ride-alongs and the +1 all count. */
export function WaterCounter({glasses, target = WATER_TARGET, onAdd}: Props) {
  const water = ELEMENTS.water;
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.label}>Water</Text>
        <View style={styles.cups}>
          {Array.from({length: target}, (_, i) => (
            <View
              key={i}
              style={[
                styles.cup,
                {borderColor: water.color},
                i < glasses && {backgroundColor: water.color},
              ]}
            />
          ))}
        </View>
      </View>
      <Text testID="water-count" style={styles.count}>
        {glasses}/{target}
      </Text>
      <Tap
        testID="water-add"
        variant="ghost"
        color={water.color}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Log a glass of water"
        style={styles.add}>
        <Text style={[styles.addText, {color: water.color}]}>+1</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  info: {
    flex: 1,
  },
  label: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cups: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.xs,
  },
  cup: {
    width: 14,
    height: 18,
    borderWidth: 1,
    borderRadius: 3,
  },
  count: {
    ...t.subtitle,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  add: {
    minWidth: 56,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  addText: {
    fontSize: 18,
    fontWeight: '800',
  },
});
