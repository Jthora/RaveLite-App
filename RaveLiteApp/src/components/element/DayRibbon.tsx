import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {RibbonDay} from '../../domain/activity/elementDay';
import {dailyPar} from '../../domain/profile/repository';
import {palette, radius, spacing, type as t} from '../../theme';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
/** Height of the tallest bar. */
const BAR_MAX = 40;

interface Props {
  days: readonly RibbonDay[];
  /** Local midnight of the day shown below the ribbon. */
  selected: number;
  color: string;
  onSelect: (dayStart: number) => void;
}

function spoken(day: RibbonDay): string {
  return new Date(day.dayStart).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The last days as bars, today on the right; a dot marks days with a Train
 * entry. The bars are too narrow to hit one by one, so the whole ribbon is
 * one press target and a tap picks the day under the finger.
 */
export function DayRibbon({days, selected, color, onSelect}: Props) {
  const [width, setWidth] = useState(0);
  // Bars share one scale that always reaches par, so the par line stays put.
  const par = dailyPar();
  const most = Math.max(par, ...days.map(d => d.points));
  const parHeight = 6 + Math.round((par / most) * (BAR_MAX - 6));
  const selectedIndex = days.findIndex(d => d.dayStart === selected);

  const pickAt = (x: number) => {
    if (width <= 0 || days.length === 0) {
      return;
    }
    const i = Math.floor((x / width) * days.length);
    onSelect(days[Math.min(days.length - 1, Math.max(0, i))].dayStart);
  };

  const step = (delta: number) => {
    const from = selectedIndex < 0 ? days.length - 1 : selectedIndex;
    const next = days[Math.min(days.length - 1, Math.max(0, from + delta))];
    if (next) {
      onSelect(next.dayStart);
    }
  };

  const current = selectedIndex >= 0 ? days[selectedIndex] : undefined;

  return (
    <Pressable
      testID="day-ribbon"
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      onPress={e => pickAt(e.nativeEvent.locationX)}
      accessibilityRole="adjustable"
      accessibilityLabel={`Last ${days.length} days`}
      accessibilityValue={{
        text: current
          ? `${spoken(current)}, ${current.points} points`
          : 'an earlier day',
      }}
      accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
      onAccessibilityAction={e =>
        step(e.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      style={styles.ribbon}>
      {/* Children take no touches, so locationX is measured on the ribbon. */}
      <View style={styles.row} pointerEvents="none">
        {days.map((d, i) => {
          const on = i === selectedIndex;
          const height =
            d.points === 0
              ? 2
              : 6 + Math.round((d.points / most) * (BAR_MAX - 6));
          return (
            <View key={d.dayStart} style={[styles.col, on && styles.colOn]}>
              <View style={styles.slot}>
                <View style={[styles.par, {bottom: parHeight - 1}]} />
                {d.hasTrain ? (
                  <View style={[styles.trainDot, {backgroundColor: color}]} />
                ) : null}
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: d.points > 0 ? color : palette.border,
                      opacity: on || d.isToday || d.points === 0 ? 1 : 0.6,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.letter, (on || d.isToday) && styles.letterOn]}>
                {LETTERS[new Date(d.dayStart).getDay()]}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    minHeight: 64,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.sm,
    paddingVertical: 2,
  },
  colOn: {
    backgroundColor: palette.border,
  },
  slot: {
    height: BAR_MAX + 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  par: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.textMuted,
  },
  trainDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  bar: {
    width: 8,
    borderRadius: 2,
  },
  letter: {
    ...t.caption,
    fontSize: 10,
    color: palette.textFaint,
    marginTop: 2,
  },
  letterOn: {
    color: palette.text,
  },
});
