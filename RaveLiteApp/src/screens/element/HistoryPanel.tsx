/**
 * HistoryPanel — an element's History tab.
 *
 * Everything done in this element on a chosen day, from every source:
 * chimes and rounds (a round's moves land in their own elements), drill
 * taps, circuit legs, Train log entries and max tests. Above the list, the
 * day's count, the trailing week and the streak; below it, the last two
 * weeks against the usual day.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {MiniSparkline} from '../../components/MiniSparkline';
import {Tap} from '../../components/Tap';
import {DayList} from '../../components/today/DayList';
import {CalendarPicker} from '../../components/training/CalendarPicker';
import {
  activityForDay,
  subscribeActivity,
} from '../../domain/activity/activity';
import {countsByDay, streakDays} from '../../domain/activity/stats';
import {buildDayList} from '../../domain/today/dayList';
import {MS_PER_DAY} from '../../lib/constants';
import type {ElementIdentity} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const TREND_DAYS = 14;

interface Props {
  element: ElementIdentity;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function HistoryPanel({element}: Props) {
  const [day, setDay] = useState(() => startOfDay(Date.now()));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeActivity(() => setVersion(v => v + 1)), []);

  const today = startOfDay(Date.now());
  const isToday = day === today;

  const view = useMemo(() => {
    const date = new Date(day);
    const items = activityForDay(date).filter(i => i.element === element.id);
    const trend = countsByDay(TREND_DAYS, date, element.id);
    const activeDays = trend.filter(n => n > 0);
    return {
      rows: buildDayList({
        now: Date.now(),
        activity: items,
        journal: [],
        scheduled: [],
      }),
      count: items.length,
      week: trend.slice(-7).reduce((a, b) => a + b, 0),
      trend,
      usual: activeDays.length
        ? Math.round(activeDays.reduce((a, b) => a + b, 0) / activeDays.length)
        : 1,
      streak: day === startOfDay(Date.now()) ? streakDays(date, element.id) : 0,
    };
    // `version` is the rebuild trigger; the reads go to storage directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, element.id, version]);

  const dayLabel = isToday
    ? 'Today'
    : day === today - MS_PER_DAY
    ? 'Yesterday'
    : new Date(day).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  const stepDay = (delta: number) => {
    const next = startOfDay(day + delta * MS_PER_DAY + MS_PER_DAY / 2);
    if (next <= today) {
      setDay(next);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.dateRow}>
        <Tap
          variant="ghost"
          color={element.accent}
          onPress={() => stepDay(-1)}
          accessibilityLabel="Previous day"
          style={styles.dateStep}>
          <Text style={[styles.dateStepText, {color: element.accent}]}>‹</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={element.accent}
          onPress={() => setPickerOpen(true)}
          accessibilityLabel="Pick a day"
          style={styles.dateLabel}>
          <Text style={styles.dateLabelText}>{dayLabel}</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={element.accent}
          disabled={isToday}
          onPress={() => stepDay(1)}
          accessibilityLabel="Next day"
          style={styles.dateStep}>
          <Text style={[styles.dateStepText, {color: element.accent}]}>›</Text>
        </Tap>
      </View>

      <View style={styles.tiles}>
        <Tile
          label={isToday ? 'Today' : 'That day'}
          value={view.count}
          accent={element.color}
        />
        <Tile label="7 days" value={view.week} accent={element.color} />
        {isToday ? (
          <Tile
            label="Streak"
            value={view.streak}
            suffix="d"
            accent={element.color}
          />
        ) : null}
      </View>

      {view.rows.length === 0 ? (
        <Text style={styles.empty}>
          Nothing logged for {element.name} {isToday ? 'yet today' : 'that day'}
          .
        </Text>
      ) : (
        <DayList rows={view.rows} />
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last {TREND_DAYS} days</Text>
        <MiniSparkline
          data={view.trend}
          dailyTarget={view.usual}
          color={element.color}
        />
        <Text style={styles.caption}>The line marks your usual day.</Text>
      </View>

      <CalendarPicker
        visible={pickerOpen}
        selected={day}
        accent={element.accent}
        onPick={epoch => {
          const picked = startOfDay(epoch);
          if (picked <= today) {
            setDay(picked);
          }
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </ScrollView>
  );
}

function Tile({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, {color: accent}]}>
        {value}
        {suffix ? <Text style={styles.tileSuffix}>{suffix}</Text> : null}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateStep: {
    width: 56,
    minHeight: 48,
    borderRadius: radius.md,
  },
  dateStepText: {
    fontSize: 22,
    fontWeight: '700',
  },
  dateLabel: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  dateLabelText: {
    ...t.subtitle,
    color: palette.text,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  tileSuffix: {
    fontSize: 14,
    fontWeight: '700',
  },
  tileLabel: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  empty: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
  },
});
