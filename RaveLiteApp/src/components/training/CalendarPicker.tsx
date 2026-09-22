/**
 * CalendarPicker — full-month grid date picker with arbitrary navigation.
 *
 * Used by TrainingLogSheet for dates older than the quick chips. Caller
 * passes the currently selected epoch and an `onPick` callback; the
 * picker renders a dialog with month-paging arrows, year jump, and a
 * 7×6 grid. Selecting a day fires `onPick` with the start-of-day epoch
 * for that local date.
 */
import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SheetLayer} from '../SheetLayer';
import {palette, radius, spacing, type as t} from '../../theme';
import {ELEMENTS} from '../../theme/elements';
import {useElementAccent} from '../../theme/elementContext';

interface Props {
  visible: boolean;
  selected: number;
  onPick: (epoch: number) => void;
  onClose: () => void;
  /** Override the contextual element accent. */
  accent?: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarPicker = React.memo(function CalendarPicker({
  visible,
  selected,
  onPick,
  onClose,
  accent: accentProp,
}: Props) {
  const ctxAccent = useElementAccent();
  const accent = accentProp ?? ctxAccent;
  const initial = new Date(selected);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth()); // 0-indexed

  // Reset to selected month each time the modal opens.
  React.useEffect(() => {
    if (visible) {
      const d = new Date(selected);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  }, [visible, selected]);

  const today = startOfDay(Date.now());
  const selectedDay = startOfDay(selected);

  const days = buildMonthGrid(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  function step(delta: number) {
    let m = month + delta;
    let y = year;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    // In a sheet that hosts dialogs (the Train log) it is drawn in that
    // sheet's window; elsewhere, a Modal as before.
    visible ? (
      <SheetLayer onClose={onClose}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.header}>
              <Pressable
                onPress={() => step(-12)}
                style={styles.navBtn}
                hitSlop={12}>
                <Text style={styles.navText}>‹‹</Text>
              </Pressable>
              <Pressable
                onPress={() => step(-1)}
                style={styles.navBtn}
                hitSlop={12}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <Pressable
                onPress={() => step(1)}
                style={styles.navBtn}
                hitSlop={12}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
              <Pressable
                onPress={() => step(12)}
                style={styles.navBtn}
                hitSlop={12}>
                <Text style={styles.navText}>››</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} style={styles.weekLabel}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((d, i) => {
                const inMonth = d.getMonth() === month;
                const dayEpoch = startOfDay(d.getTime());
                const isSel = dayEpoch === selectedDay;
                const isToday = dayEpoch === today;
                const isFuture = dayEpoch > today;
                return (
                  <Pressable
                    key={i}
                    disabled={isFuture}
                    onPress={() => {
                      onPick(dayEpoch);
                      onClose();
                    }}
                    style={[
                      styles.cell,
                      isSel && styles.cellSel,
                      isSel && {backgroundColor: accent},
                      isToday && !isSel && styles.cellToday,
                      isToday && !isSel && {borderColor: accent},
                    ]}>
                    <Text
                      style={[
                        styles.cellText,
                        !inMonth && styles.cellTextOut,
                        isFuture && styles.cellTextDisabled,
                        isSel && styles.cellTextSel,
                      ]}>
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={() => {
                  onPick(today);
                  onClose();
                }}
                style={styles.footerBtn}>
                <Text style={styles.footerBtnText}>Today</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.footerBtn}>
                <Text style={styles.footerBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </SheetLayer>
    ) : null
  );
});

function startOfDay(epoch: number): number {
  const d = new Date(epoch);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0=Sun
  const grid: Date[] = [];
  // 6 weeks × 7 = 42 cells, starting from the Sunday on/before the 1st.
  const start = new Date(year, month, 1 - startOffset);
  for (let i = 0; i < 42; i++) {
    grid.push(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    );
  }
  return grid;
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: '#000000B0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: 320,
    maxWidth: '100%',
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  monthLabel: {
    ...t.subtitle,
    color: palette.text,
    flex: 1,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekLabel: {
    ...t.caption,
    color: palette.textDim,
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  cellSel: {
    backgroundColor: ELEMENTS.heart.color,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: ELEMENTS.heart.color,
  },
  cellText: {
    ...t.body,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  cellTextOut: {
    color: palette.textFaint,
  },
  cellTextDisabled: {
    color: palette.textFaint,
    opacity: 0.4,
  },
  cellTextSel: {
    color: '#000',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  footerBtnText: {
    ...t.caption,
    color: palette.text,
  },
});
