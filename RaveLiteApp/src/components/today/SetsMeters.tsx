import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import type {SetsSummary} from '../../domain/program/setsSummary';
import {attributeById, type DayFocus} from '../../domain/program/week';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  sets: SetsSummary;
  onPress: () => void;
  /** Today's focus, beside the count; a Saturday shows its test. */
  focus?: DayFocus;
}

interface FocusPart {
  name: string;
  color: string;
}

/** "Power · Mobility · Presence" in element colors, or Saturday's test. */
function focusParts(focus: DayFocus): FocusPart[] {
  if (focus.test) {
    return [{name: focus.test.name, color: ELEMENTS.fire.color}];
  }
  return focus.focus.map(id => {
    const attribute = attributeById(id);
    return {name: attribute.name, color: ELEMENTS[attribute.element].color};
  });
}

/**
 * Daily Sets at a glance: sets done today and today's focus, then one small
 * meter per track (amount done against the day's quota) in its element's
 * color. Tap for tracks, max tests, level ups and Goals.
 */
export function SetsMeters({sets, onPress, focus}: Props) {
  const parts = focus ? focusParts(focus) : [];
  const label = [
    sets.total === 0
      ? 'Daily Sets, rest day'
      : `Daily Sets, ${sets.done} of ${sets.total} sets`,
    parts.length > 0
      ? `Today: ${parts.map(p => p.name).join(', ')}`
      : undefined,
    'Open',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Tap
      testID="sets-open"
      variant="plain"
      color={ELEMENTS.heart.accent}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
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
          {parts.length > 0 ? (
            <Text
              testID="sets-focus"
              style={styles.focus}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {parts.flatMap((part, i) => [
                i > 0 ? (
                  <Text key={`dot-${part.name}`} style={styles.dot}>
                    {'\u2009·\u2009'}
                  </Text>
                ) : null,
                <Text key={part.name} style={{color: part.color}}>
                  {part.name}
                </Text>,
              ])}
            </Text>
          ) : (
            <View style={styles.spacer} />
          )}
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
                  </View>
                  {/* The count sits beside the bar so the name keeps its room. */}
                  <View style={styles.barRow}>
                    <View style={styles.bar}>
                      <View
                        style={[
                          styles.fill,
                          {width: `${tr.fill * 100}%`, backgroundColor: color},
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.meterCount, tr.fill >= 1 && {color}]}
                      numberOfLines={1}>
                      {tr.done}/{tr.total}
                    </Text>
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
    gap: spacing.xs,
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
  // Smaller than the title so three names fit beside the count
  // ("Agility · Mobility · Presence" is the longest).
  focus: {
    ...t.caption,
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  dot: {
    color: palette.textDim,
  },
  spacer: {
    flex: 1,
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
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: palette.border,
  },
  fill: {
    height: 3,
  },
});
