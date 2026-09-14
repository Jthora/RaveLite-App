import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Settings} from 'lucide-react-native';

import {formatEta, formatHM} from '../ambient/format';
import {Tap} from '../Tap';
import {PauseSheet} from './PauseSheet';
import type {PauseDurationKey} from '../../domain/ambient/pause';
import type {ActiveHours} from '../../domain/ambient/types';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WARN = '#FFD60A';

interface Props {
  now: number;
  myDay: ActiveHours;
  pauseUntil?: number;
  onEditMyDay: () => void;
  onPause: (key: PauseDurationKey) => void;
  onOpenSettings: () => void;
  /** Something in Settings needs attention (notifications off, a warning). */
  settingsAlert?: boolean;
}

/**
 * Top of Today, one line: a chip that is both live/paused and My day (tap
 * to pause or edit My day), the clock, and the way into Settings.
 */
export function StatusLine({
  now,
  myDay,
  pauseUntil,
  onEditMyDay,
  onPause,
  onOpenSettings,
  settingsAlert = false,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const paused = pauseUntil !== undefined && pauseUntil > now;
  const accent = ELEMENTS.heart.accent;
  const days =
    myDay.daysMask === 0b1111111
      ? ''
      : DAY_LETTERS.filter((_, i) => (myDay.daysMask & (1 << i)) !== 0).join(
          '',
        );

  return (
    <View style={styles.bar}>
      <Tap
        testID="status-chip"
        variant="plain"
        color={accent}
        onPress={() => setSheetOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          paused
            ? 'Chimes paused. Resume, or edit My day'
            : `Chimes live, My day ${myDay.start} to ${myDay.end}. Pause, or edit My day`
        }
        style={[styles.chip, paused && styles.chipPaused]}>
        <View style={styles.chipRow}>
          <Text
            style={[styles.dot, {color: paused ? palette.textDim : accent}]}>
            ●
          </Text>
          <Text style={[styles.chipText, paused && styles.chipTextPaused]}>
            {paused
              ? `Paused ${formatEta(pauseUntil - now).replace('+', '')}`
              : `${myDay.start}–${myDay.end}`}
          </Text>
          {days && !paused ? <Text style={styles.days}>{days}</Text> : null}
        </View>
      </Tap>
      <View style={styles.spacer} />
      <Text style={styles.clock}>{formatHM(now)}</Text>
      <Tap
        testID="settings-open"
        variant="plain"
        color={accent}
        onPress={onOpenSettings}
        accessibilityRole="button"
        accessibilityLabel={
          settingsAlert ? 'Settings, something needs attention' : 'Settings'
        }
        style={styles.gear}>
        <Settings size={22} color={palette.textDim} strokeWidth={2} />
        {settingsAlert ? <View style={styles.alert} /> : null}
      </Tap>
      <PauseSheet
        visible={sheetOpen}
        paused={paused}
        myDay={myDay}
        onEditMyDay={() => {
          setSheetOpen(false);
          onEditMyDay();
        }}
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
    paddingTop: spacing.sm,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
  },
  chipPaused: {
    borderColor: palette.textDim,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    fontSize: 10,
  },
  chipText: {
    ...t.caption,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  chipTextPaused: {
    color: palette.textDim,
  },
  days: {
    ...t.caption,
    color: palette.textMuted,
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
  gear: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  // Sits on the icon's corner: Tap wraps the icon in a view of its size.
  alert: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WARN,
  },
});
