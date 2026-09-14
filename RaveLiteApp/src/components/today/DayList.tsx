import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {formatHM} from '../ambient/format';
import {Tap} from '../Tap';
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
  /** Train entries become pressable (to edit) when this is set. */
  onRowPress?: (row: DayRow) => void;
  /** Shown when there are no rows. */
  emptyText?: string;
}

/**
 * The whole day in one list. Rows take their natural height inside the
 * page's scroll view. Skipped and missed rows are dimmed, never red.
 */
export function DayList({
  rows,
  onRowPress,
  emptyText = "Nothing on today's list yet.",
}: Props) {
  if (rows.length === 0) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }
  return (
    <View>
      {rows.map(row => {
        const el = ELEMENTS[row.element];
        const quiet = row.status === 'skipped' || row.status === 'missed';
        const lit = row.status === 'done' || row.status === 'active';
        const editable = onRowPress !== undefined && row.ref?.store === 'train';
        const body = (
          <>
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
            {editable ? <Text style={styles.chevron}>›</Text> : null}
          </>
        );
        return editable ? (
          <Tap
            key={row.id}
            testID={`day-row-${row.id}`}
            variant="plain"
            color={el.color}
            onPress={() => onRowPress(row)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${row.label}`}
            style={styles.rowTap}>
            <View style={styles.rowInner}>{body}</View>
          </Tap>
        ) : (
          <View key={row.id} style={[styles.row, quiet && styles.quiet]}>
            {body}
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
  // Tap wraps its children in one view, so the row layout sits inside it.
  rowTap: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
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
  chevron: {
    ...t.subtitle,
    color: palette.textDim,
    paddingHorizontal: spacing.xs,
  },
});
