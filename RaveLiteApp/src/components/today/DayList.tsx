import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {formatHM} from '../ambient/format';
import type {DayRow, DayRowStatus} from '../../domain/today/dayList';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';

const MARK: Record<DayRowStatus, string> = {
  done: '✓',
  active: '●',
  upcoming: '○',
  skipped: '–',
  missed: '·',
};

interface Props {
  rows: readonly DayRow[];
}

/**
 * The whole day in one list. Rows take their natural height inside the
 * Today scroll view. Skipped and missed rows are dimmed, never red.
 */
export function DayList({rows}: Props) {
  if (rows.length === 0) {
    return <Text style={styles.empty}>Nothing on today's list yet.</Text>;
  }
  return (
    <View>
      {rows.map(row => {
        const el = ELEMENTS[row.element];
        const quiet = row.status === 'skipped' || row.status === 'missed';
        const lit = row.status === 'done' || row.status === 'active';
        return (
          <View key={row.id} style={[styles.row, quiet && styles.quiet]}>
            <Text style={styles.time}>{formatHM(row.at)}</Text>
            <Text
              style={[
                styles.mark,
                {color: lit ? el.color : palette.textMuted},
              ]}>
              {MARK[row.status]}
            </Text>
            <Text style={[styles.glyph, {color: el.color}]}>{el.glyph}</Text>
            <View style={styles.body}>
              <Text
                style={[
                  styles.label,
                  row.status === 'upcoming' && styles.labelSoft,
                ]}
                numberOfLines={1}>
                {row.label}
              </Text>
              {row.detail ? (
                <Text style={styles.detail} numberOfLines={1}>
                  {row.detail}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  quiet: {
    opacity: 0.5,
  },
  time: {
    ...t.caption,
    color: palette.textDim,
    width: 44,
    fontVariant: ['tabular-nums'],
  },
  mark: {
    width: 14,
    fontSize: 14,
    textAlign: 'center',
  },
  glyph: {
    width: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    ...t.body,
    color: palette.text,
  },
  labelSoft: {
    color: palette.textDim,
  },
  detail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 1,
  },
});
