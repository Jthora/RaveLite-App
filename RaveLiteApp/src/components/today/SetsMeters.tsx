import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import type {SetsSummary} from '../../domain/program/setsSummary';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  sets: SetsSummary;
  onPress: () => void;
}

/**
 * Daily Sets at a glance: sets done today, then one small meter per track
 * (amount done against the day's quota) in its element's color. Tap for
 * tracks, max tests and level ups.
 */
export function SetsMeters({sets, onPress}: Props) {
  return (
    <Tap
      testID="sets-open"
      variant="plain"
      color={ELEMENTS.heart.accent}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        sets.total === 0
          ? 'Daily Sets, rest day. Open'
          : `Daily Sets, ${sets.done} of ${sets.total} sets. Open`
      }
      style={styles.card}>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Daily Sets
            {sets.total === 0 ? (
              ' · rest day'
            ) : (
              <Text style={styles.count}>
                {' '}
                {sets.done}/{sets.total}
              </Text>
            )}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
        {sets.tracks.length > 0 ? (
          <View style={styles.grid}>
            {sets.tracks.map(tr => {
              const color = ELEMENTS[tr.element].color;
              return (
                <View key={tr.trackId} style={styles.meter}>
                  <View style={styles.meterText}>
                    <MoveIcon move={tr.move} color={color} size={14} />
                    <Text style={styles.meterName} numberOfLines={1}>
                      {tr.name}
                    </Text>
                    <Text
                      style={[styles.meterCount, tr.fill >= 1 && {color}]}
                      numberOfLines={1}>
                      {tr.done}/{tr.total}
                    </Text>
                  </View>
                  <View style={styles.bar}>
                    <View
                      style={[
                        styles.fill,
                        {width: `${tr.fill * 100}%`, backgroundColor: color},
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 48,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Tap wraps its children in one view; the gap lives inside it.
  body: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  count: {
    color: palette.text,
    fontWeight: '700',
  },
  chevron: {
    ...t.subtitle,
    color: palette.textDim,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  meter: {
    width: '33.333%',
    paddingRight: spacing.sm,
  },
  meterText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meterName: {
    ...t.caption,
    color: palette.text,
    flexShrink: 1,
  },
  meterCount: {
    ...t.caption,
    color: palette.textDim,
    fontVariant: ['tabular-nums'],
  },
  bar: {
    height: 3,
    marginTop: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: palette.border,
  },
  fill: {
    height: 3,
  },
});
