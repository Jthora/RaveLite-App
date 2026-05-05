/**
 * `<RibbonControls />` — bottom action bar for the Always-On Ribbon.
 *
 * Three giant buttons (per Always-On Ribbon plan §6):
 *   - ⏸ pause  → opens a 4-option sheet (30m / 2h / until tonight / off)
 *   - +5m      → snoozes the next-upcoming row by 5 minutes
 *   - ↷ skip   → preemptively writes a `reminder.skipped` for the next row
 *
 * Pure delegate-style: this component owns the pause sheet UI, but the
 * mutation goes through the props handed in by the orchestrator. That
 * keeps storage I/O (and the `setTick` re-derive nudge) in one place.
 */
import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export type PauseDurationKey = 'p30' | 'p2h' | 'tonight' | 'off';

export interface RibbonControlsProps {
  /** Live `manualPauseUntil` epoch ms (>now) or undefined. */
  pausedUntil?: number;
  now: number;
  onPause: (key: PauseDurationKey) => void;
  onPlusFive: () => void;
  onSkipNext: () => void;
  /** Has-next flag — disables the +5 / skip-next buttons when false. */
  hasNext: boolean;
}

export function RibbonControls({
  pausedUntil,
  now,
  onPause,
  onPlusFive,
  onSkipNext,
  hasNext,
}: RibbonControlsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isPaused = typeof pausedUntil === 'number' && pausedUntil > now;
  const accent = ELEMENTS.heart.accent;

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPaused ? 'Paused — tap to manage' : 'Pause'}
        style={({pressed}) => [
          styles.btn,
          isPaused && styles.btnActive,
          pressed && styles.btnPressed,
        ]}
        onPress={() => setSheetOpen(true)}>
        <Text
          style={[
            styles.btnGlyph,
            isPaused && {color: accent},
          ]}>
          ⏸
        </Text>
        <Text
          style={[
            styles.btnLabel,
            isPaused && {color: accent},
          ]}>
          {isPaused ? formatPauseRemaining(pausedUntil!, now) : 'pause'}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Snooze next pulse five minutes"
        disabled={!hasNext}
        style={({pressed}) => [
          styles.btn,
          !hasNext && styles.btnDisabled,
          pressed && styles.btnPressed,
        ]}
        onPress={onPlusFive}>
        <Text style={styles.btnGlyph}>+5</Text>
        <Text style={styles.btnLabel}>min</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip next pulse"
        disabled={!hasNext}
        style={({pressed}) => [
          styles.btn,
          !hasNext && styles.btnDisabled,
          pressed && styles.btnPressed,
        ]}
        onPress={onSkipNext}>
        <Text style={styles.btnGlyph}>↷</Text>
        <Text style={styles.btnLabel}>skip</Text>
      </Pressable>

      <PauseSheet
        visible={sheetOpen}
        currentlyPaused={isPaused}
        onSelect={key => {
          setSheetOpen(false);
          onPause(key);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

// ── Pause sheet ────────────────────────────────────────────────────

interface PauseSheetProps {
  visible: boolean;
  currentlyPaused: boolean;
  onSelect: (key: PauseDurationKey) => void;
  onClose: () => void;
}

function PauseSheet({
  visible,
  currentlyPaused,
  onSelect,
  onClose,
}: PauseSheetProps) {
  const options: {key: PauseDurationKey; label: string; sub: string}[] = [
    {key: 'p30', label: '30 minutes', sub: 'short break'},
    {key: 'p2h', label: '2 hours', sub: 'meeting · meal · errand'},
    {key: 'tonight', label: 'until tonight', sub: 'wakes at 06:00 tomorrow'},
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>PAUSE</Text>
              {options.map(opt => (
                <Pressable
                  key={opt.key}
                  style={({pressed}) => [
                    styles.sheetRow,
                    pressed && styles.sheetRowPressed,
                  ]}
                  onPress={() => onSelect(opt.key)}>
                  <Text style={styles.sheetRowLabel}>{opt.label}</Text>
                  <Text style={styles.sheetRowSub}>{opt.sub}</Text>
                </Pressable>
              ))}
              {currentlyPaused ? (
                <Pressable
                  style={({pressed}) => [
                    styles.sheetRow,
                    styles.sheetRowDestructive,
                    pressed && styles.sheetRowPressed,
                  ]}
                  onPress={() => onSelect('off')}>
                  <Text
                    style={[
                      styles.sheetRowLabel,
                      {color: ELEMENTS.heart.accent},
                    ]}>
                    resume now
                  </Text>
                  <Text style={styles.sheetRowSub}>clear pause</Text>
                </Pressable>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function formatPauseRemaining(until: number, now: number): string {
  const ms = Math.max(0, until - now);
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m === 0 ? `${h}h` : `${h}h${m}m`;
  }
  return `${totalMin}m`;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  btnActive: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: ELEMENTS.heart.accent,
  },
  btnPressed: {
    opacity: 0.6,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnGlyph: {
    fontSize: 22,
    color: palette.text,
    lineHeight: 26,
  },
  btnLabel: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sheetTitle: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  sheetRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sheetRowPressed: {
    opacity: 0.6,
  },
  sheetRowDestructive: {
    marginTop: spacing.sm,
    borderColor: ELEMENTS.heart.accent,
  },
  sheetRowLabel: {
    ...t.subtitle,
    color: palette.text,
  },
  sheetRowSub: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
});

export const __test = {formatPauseRemaining};
