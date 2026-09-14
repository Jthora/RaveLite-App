import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ActiveHoursChip} from '../ambient/ActiveHoursChip';
import {formatEta, formatHM} from '../ambient/format';
import {Tap} from '../Tap';
import {PauseSheet} from './PauseSheet';
import type {PauseDurationKey} from '../../domain/ambient/pause';
import type {ActiveHours} from '../../domain/ambient/types';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  now: number;
  myDay: ActiveHours;
  pauseUntil?: number;
  onEditMyDay: () => void;
  onPause: (key: PauseDurationKey) => void;
}

/** Top of Today: live or paused (tap to change), My day (tap to edit), clock. */
export function StatusLine({
  now,
  myDay,
  pauseUntil,
  onEditMyDay,
  onPause,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const paused = pauseUntil !== undefined && pauseUntil > now;

  return (
    <View style={styles.bar}>
      <Tap
        variant="plain"
        color={ELEMENTS.heart.accent}
        onPress={() => setSheetOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Chimes paused — change' : 'Pause chimes'}
        style={[styles.badge, paused && styles.badgePaused]}>
        <Text style={[styles.badgeText, paused && styles.badgeTextPaused]}>
          {paused
            ? `PAUSED ${formatEta(pauseUntil - now).replace('+', '')}`
            : 'LIVE'}
        </Text>
      </Tap>
      <ActiveHoursChip
        range={myDay}
        manualPauseUntil={pauseUntil}
        now={now}
        onEdit={onEditMyDay}
      />
      <View style={styles.spacer} />
      <Text style={styles.clock}>{formatHM(now)}</Text>
      <PauseSheet
        visible={sheetOpen}
        paused={paused}
        onClose={() => setSheetOpen(false)}
        onSelect={key => {
          setSheetOpen(false);
          onPause(key);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  badge: {
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgePaused: {
    borderWidth: 1,
    borderColor: palette.textDim,
  },
  badgeText: {
    ...t.caption,
    color: ELEMENTS.heart.accent,
    letterSpacing: 1.2,
  },
  badgeTextPaused: {
    color: palette.textDim,
  },
  spacer: {
    flex: 1,
  },
  clock: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
});
