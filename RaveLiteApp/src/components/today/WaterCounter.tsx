import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** Glasses a day: 8 × ~250 ml ≈ 2 L. */
export const WATER_TARGET = 8;

interface Props {
  glasses: number;
  target?: number;
  /** Why the target is above the usual eight — the heat, when it is. */
  reason?: string;
  onAdd: () => void;
}

/** Glasses of water today — chimes, ride-alongs and the +1 all count. */
export function WaterCounter({
  glasses,
  target = WATER_TARGET,
  reason,
  onAdd,
}: Props) {
  const water = ELEMENTS.water;
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <View style={styles.labelRow}>
          <MoveIcon move="drink" color={water.color} size={14} />
          <Text style={styles.label}>Drink</Text>
          {reason ? (
            <Text testID="water-reason" style={styles.reason} numberOfLines={1}>
              {reason}
            </Text>
          ) : null}
        </View>
        {/* The usual eight at full height; anything the heat added sits
            under them as a short stub, so a hot day costs a few pixels
            rather than a whole second row. */}
        <View style={styles.cups}>
          {Array.from({length: Math.min(target, WATER_TARGET)}, (_, i) => (
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
        {target > WATER_TARGET ? (
          <View style={styles.cups}>
            {Array.from({length: target - WATER_TARGET}, (_, i) => (
              <View
                key={i}
                style={[
                  styles.cup,
                  styles.extraCup,
                  {borderColor: water.color},
                  i + WATER_TARGET < glasses && {backgroundColor: water.color},
                ]}
              />
            ))}
          </View>
        ) : null}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    marginTop: 4,
  },
  cup: {
    width: 14,
    height: 18,
    borderWidth: 1,
    borderRadius: 3,
  },
  extraCup: {
    height: 6,
    opacity: 0.75,
  },
  reason: {
    ...t.caption,
    color: palette.textFaint,
    flex: 1,
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
