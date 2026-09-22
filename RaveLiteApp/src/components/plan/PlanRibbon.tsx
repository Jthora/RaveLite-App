/**
 * PlanRibbon — 24-hour coverage strip.
 *
 * Renders one horizontal SVG row representing midnight→midnight. Each
 * window appears as a tinted band; bands stack vertically when they
 * overlap. Hour gridlines mark 6/12/18 for quick orientation.
 *
 * The element accent for a band is the dominant element in that
 * window's slot list (most-frequent; ties favour Heart). This keeps the
 * ribbon legible at a glance — "the morning band is mostly air".
 */
import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {Line, Rect, Text as SvgText} from 'react-native-svg';

import type {Plan, Window} from '../../domain/reminders/types';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, spacing} from '../../theme';

interface Props {
  plan: Plan;
  height?: number;
}

const RIBBON_HEIGHT = 28;
const HOUR_LABELS = ['0', '6', '12', '18', '24'];

export function PlanRibbon({plan, height = RIBBON_HEIGHT}: Props) {
  // Pre-compute band positions so the render is O(windows) of arithmetic.
  const bands = useMemo(() => plan.windows.map(w => buildBand(w)), [plan]);

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={height + 14} viewBox={`0 0 100 ${height + 14}`}>
        {/* Hour gridlines (every 6h). */}
        {[0, 25, 50, 75, 100].map(x => (
          <Line
            key={`g-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={palette.border}
            strokeWidth={0.4}
          />
        ))}

        {/* Bands. */}
        {bands.map((b, i) => (
          <Rect
            key={i}
            x={b.x}
            y={2 + (i % 3) * ((height - 4) / 3)}
            width={b.w}
            height={(height - 4) / 3 - 1}
            rx={1.2}
            fill={b.color}
            opacity={0.85}
          />
        ))}

        {/* Hour labels. */}
        {HOUR_LABELS.map((label, i) => (
          <SvgText
            key={label}
            x={i * 25}
            y={height + 11}
            fill={palette.textMuted}
            fontSize={6}
            textAnchor={
              i === 0
                ? 'start'
                : i === HOUR_LABELS.length - 1
                ? 'end'
                : 'middle'
            }>
            {label}
          </SvgText>
        ))}
      </Svg>
      <Text style={styles.legend}>24h coverage</Text>
    </View>
  );
}

interface Band {
  x: number;
  w: number;
  color: string;
}

function buildBand(w: Window): Band {
  const start = parseHM(w.startTime);
  const end = parseHM(w.endTime);
  // Wrap edge case (end <= start) — clamp to end-of-day. Cross-midnight
  // is rare in this app (no shift workers in the default plan).
  const safeEnd = end > start ? end : 24 * 60;
  const x = (start / (24 * 60)) * 100;
  const wPct = ((safeEnd - start) / (24 * 60)) * 100;
  return {x, w: Math.max(1, wPct), color: dominantColor(w)};
}

function parseHM(hm: string): number {
  const [h, m] = hm.split(':').map(n => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

function dominantColor(w: Window): string {
  if (w.slots.length === 0) {
    return palette.border;
  }
  const counts: Partial<Record<ElementId, number>> = {};
  for (const s of w.slots) {
    counts[s.element] = (counts[s.element] ?? 0) + 1;
  }
  let best: ElementId = 'heart';
  let bestN = -1;
  for (const id of Object.keys(counts) as ElementId[]) {
    const n = counts[id]!;
    // Heart wins ties to feel "centered".
    if (n > bestN || (n === bestN && id === 'heart')) {
      best = id;
      bestN = n;
    }
  }
  return ELEMENTS[best].color;
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
  },
  legend: {
    color: palette.textFaint,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
