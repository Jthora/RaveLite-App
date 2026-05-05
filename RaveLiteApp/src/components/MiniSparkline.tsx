/**
 * Goal-anchored mini-sparkline.
 *
 * Renders N daily counts as small vertical bars. Bar height is fixed-
 * scale: 100% bar height === `dailyTarget`. Bars cap visually at 130%
 * (operator can over-deliver, they just don't keep growing the chart).
 *
 * A horizontal hairline marks the target — instant "did I hit standard
 * today?" read regardless of absolute volume.
 *
 * Below-target bars render dim; at-or-above bars render bright element
 * accent. Today is the rightmost bar.
 */
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {palette} from '../theme';

interface Props {
  /** Per-day counts, oldest → newest. Length determines bar count. */
  data: ReadonlyArray<number>;
  /** Daily target — anchors the goal hairline at 100% bar height. */
  dailyTarget: number;
  /** Element accent for at-or-above bars. */
  color: string;
  /** Total chart height in dp. */
  height?: number;
}

const BAR_WIDTH = 8;
const BAR_GAP = 4;
const VISUAL_MAX_RATIO = 1.3;

export function MiniSparkline({
  data,
  dailyTarget,
  color,
  height = 56,
}: Props) {
  const goal = Math.max(1, dailyTarget);
  const usable = height - 4; // breathing room top/bottom
  const goalY = usable; // bar at 100% reaches this height

  return (
    <View style={[styles.root, {height}]}>
      {/* Goal hairline — sits at the target height from the bottom. */}
      <View
        pointerEvents="none"
        style={[
          styles.goalLine,
          {
            bottom: goalY,
            backgroundColor: color,
          },
        ]}
      />
      <View style={styles.bars}>
        {data.map((count, i) => {
          const ratio = Math.min(VISUAL_MAX_RATIO, count / goal);
          const barH = Math.max(2, Math.round(usable * ratio));
          const reached = count >= goal;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: barH,
                  backgroundColor: reached ? color : palette.textMuted,
                  opacity: reached ? 0.95 : 0.4,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 2,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.45,
  },
});
