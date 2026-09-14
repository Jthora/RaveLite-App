import React from 'react';
import {StyleSheet, Text} from 'react-native';

import {Tap} from '../Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export interface SetsSummary {
  /** Sets done today, capped per track at its quota. */
  done: number;
  total: number;
  tracks: Array<{trackId: string; name: string; done: number; total: number}>;
}

interface Props {
  sets: SetsSummary;
  onPress: () => void;
}

/** One line of Daily Sets progress; tap for the full Progress tab. */
export function SetsSummaryLine({sets, onPress}: Props) {
  return (
    <Tap
      variant="plain"
      color={ELEMENTS.heart.accent}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open Daily Sets progress"
      style={styles.row}>
      {sets.total === 0 ? (
        <Text style={styles.title}>Daily Sets · rest day</Text>
      ) : (
        <>
          <Text style={styles.title}>
            Daily Sets{' '}
            <Text style={styles.count}>
              {sets.done}/{sets.total}
            </Text>
          </Text>
          <Text style={styles.tracks} numberOfLines={2}>
            {sets.tracks
              .map(tr => `${tr.name} ${tr.done}/${tr.total}`)
              .join(' · ')}
          </Text>
        </>
      )}
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  tracks: {
    ...t.body,
    color: palette.text,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
