import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import type {PauseDurationKey} from '../../domain/ambient/pause';
import type {ActiveHours} from '../../domain/ambient/types';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  visible: boolean;
  /** A pause is in effect, so offer to resume. */
  paused: boolean;
  onSelect: (key: PauseDurationKey) => void;
  onClose: () => void;
  /** When set with `onEditMyDay`, the sheet leads with My day. */
  myDay?: ActiveHours;
  onEditMyDay?: () => void;
}

const OPTIONS: {key: PauseDurationKey; label: string; sub: string}[] = [
  {key: 'p30', label: '30 minutes', sub: 'short break'},
  {key: 'p2h', label: '2 hours', sub: 'meeting · meal · errand'},
  {key: 'tonight', label: 'until tomorrow', sub: 'wakes at 06:00'},
];

function daysLabel(mask: number): string {
  return mask === 0b1111111
    ? 'every day'
    : DAY_LETTERS.filter((_, i) => (mask & (1 << i)) !== 0).join(' ');
}

/** Bottom sheet for My day and pausing chimes, or resuming them. */
export function PauseSheet({
  visible,
  paused,
  onSelect,
  onClose,
  myDay,
  onEditMyDay,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {myDay && onEditMyDay ? (
                <>
                  <Text style={styles.title}>MY DAY</Text>
                  <Pressable
                    style={({pressed}) => [
                      styles.row,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Edit My day"
                    onPress={onEditMyDay}>
                    <Text style={styles.rowLabel}>
                      {myDay.start}–{myDay.end} · {daysLabel(myDay.daysMask)}
                    </Text>
                    <Text style={styles.rowSub}>
                      chimes ring inside it · tap to edit
                    </Text>
                  </Pressable>
                </>
              ) : null}
              <Text style={[styles.title, myDay && styles.titleAfter]}>
                PAUSE CHIMES
              </Text>
              {OPTIONS.map(opt => (
                <Pressable
                  key={opt.key}
                  style={({pressed}) => [styles.row, pressed && styles.pressed]}
                  onPress={() => onSelect(opt.key)}>
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                  <Text style={styles.rowSub}>{opt.sub}</Text>
                </Pressable>
              ))}
              {paused ? (
                <Pressable
                  style={({pressed}) => [
                    styles.row,
                    styles.resume,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onSelect('off')}>
                  <Text
                    style={[styles.rowLabel, {color: ELEMENTS.heart.accent}]}>
                    resume now
                  </Text>
                  <Text style={styles.rowSub}>clear the pause</Text>
                </Pressable>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
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
  title: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  titleAfter: {
    marginTop: spacing.md,
  },
  row: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pressed: {
    opacity: 0.6,
  },
  resume: {
    marginTop: spacing.sm,
    borderColor: ELEMENTS.heart.accent,
  },
  rowLabel: {
    ...t.subtitle,
    color: palette.text,
  },
  rowSub: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
});
