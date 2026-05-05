/**
 * `<RibbonStatusBar />` — single-line status bar for the Always-On
 * Ribbon. Renders, left-to-right:
 *   - LIVE / PAUSED mode badge
 *   - Active-hours chip (delegated to `<ActiveHoursChip />`)
 *   - Today's adherence summary (sealed/scheduled)
 *   - Wall clock
 *
 * Pure stateless. The orchestrator owns the polled values.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ActiveHoursChip} from './ActiveHoursChip';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import type {ActiveHours} from '../../domain/ambient/types';

export interface RibbonStatusBarProps {
  now: number;
  activeHours: ActiveHours;
  manualPauseUntil?: number;
  adherence: {sealed: number; scheduled: number};
}

export function RibbonStatusBar({
  now,
  activeHours,
  manualPauseUntil,
  adherence,
}: RibbonStatusBarProps) {
  const paused =
    typeof manualPauseUntil === 'number' && manualPauseUntil > now;

  return (
    <View style={styles.bar}>
      <Text
        style={[
          styles.modeBadge,
          paused && styles.modeBadgePaused,
        ]}>
        {paused ? 'PAUSED' : 'LIVE'}
      </Text>
      <ActiveHoursChip
        range={activeHours}
        manualPauseUntil={manualPauseUntil}
        now={now}
      />
      <View style={styles.spacer} />
      <Text style={styles.adherence}>
        {adherence.sealed}
        <Text style={styles.adherenceDim}>/{adherence.scheduled}</Text>
      </Text>
      <Text style={styles.clock}>{formatClock(now)}</Text>
    </View>
  );
}

function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  modeBadge: {
    ...t.caption,
    color: ELEMENTS.heart.accent,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    letterSpacing: 1.2,
    overflow: 'hidden',
  },
  modeBadgePaused: {
    color: palette.textDim,
  },
  spacer: {
    flex: 1,
  },
  adherence: {
    ...t.subtitle,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  adherenceDim: {
    color: palette.textDim,
    fontWeight: '400',
  },
  clock: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
});
