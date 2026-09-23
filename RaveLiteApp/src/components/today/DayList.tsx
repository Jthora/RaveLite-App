import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../icons/ElementGlyph';

import {formatHM} from '../ambient/format';
import {MoveIcon} from '../icons/MoveIcon';
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
  unsounded: '·',
};

interface Props {
  rows: readonly DayRow[];
  /** When set, Train entries open to edit, missed or skipped chimes open
   *  to be logged, and other logged rows open to keep or remove. */
  onRowPress?: (row: DayRow) => void;
  /** Shown when there are no rows. */
  emptyText?: string;
}

/** How a row's state is said out loud; the marks alone are only seen. */
const STATUS_WORD: Record<DayRowStatus, string> = {
  done: 'Done',
  active: 'Now',
  upcoming: 'Coming up',
  skipped: 'Skipped',
  missed: 'Missed',
  unsounded: 'Did not sound',
};

/** "09:30, Missed, Water Call, 1 glass". Upcoming rows used to be read as
 *  "Keep or remove Water Call". */
function spoken(row: DayRow): string {
  return [formatHM(row.at), STATUS_WORD[row.status], row.label, row.detail]
    .filter(Boolean)
    .join(', ');
}

/**
 * The whole day in one list. Rows take their natural height inside the
 * page's scroll view. Skipped and missed rows are dimmed, never red.
 */
function DayListInner({
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
        const quiet =
          row.status === 'skipped' ||
          row.status === 'missed' ||
          row.status === 'unsounded';
        const lit = row.status === 'done' || row.status === 'active';
        const late =
          row.status === 'missed' ||
          row.status === 'skipped' ||
          row.status === 'unsounded';
        const train = row.ref?.store === 'train';
        // Logged completions open to keep or remove; max tests don't.
        const removable =
          row.status === 'done' &&
          row.ref?.store === 'journal' &&
          row.source !== 'test';
        // Upcoming chimes open their info card; the rest open to be logged.
        const upcoming = row.status === 'upcoming';
        const editable =
          onRowPress !== undefined && (train || late || removable || upcoming);
        const body = (
          <>
            <Text style={styles.time}>{formatHM(row.at)}</Text>
            <Text
              style={[
                styles.mark,
                {color: lit ? el.color : palette.textFaint},
              ]}>
              {MARK[row.status]}
            </Text>
            {row.move ? (
              <View style={styles.icon}>
                <MoveIcon move={row.move} color={el.color} size={18} />
              </View>
            ) : (
              <View style={styles.icon}>
                <ElementGlyph element={el} size={16} style={styles.glyph} />
              </View>
            )}
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
            {editable && (train || late) ? (
              <Text style={styles.chevron}>›</Text>
            ) : null}
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
            accessibilityLabel={spoken(row)}
            accessibilityHint={
              upcoming
                ? 'Shows what it is'
                : late
                ? 'Log it if you did it'
                : train
                ? 'Edit this entry'
                : 'Keep or remove it'
            }
            style={[styles.rowTap, quiet && styles.quiet]}>
            <View style={styles.rowInner}>{body}</View>
          </Tap>
        ) : (
          <View
            key={row.id}
            accessible
            accessibilityLabel={spoken(row)}
            style={[styles.row, quiet && styles.quiet]}>
            {body}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Memoised: the day's list is the biggest thing on the screen — every
 * chime of the day, sounded or not — and it does not change when a sheet
 * opens over it. Without this, opening Settings re-rendered every row
 * before the sheet could appear, which on the phone was over a second of
 * nothing happening.
 */
export const DayList = React.memo(DayListInner);

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
  icon: {
    width: 20,
    alignItems: 'center',
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
