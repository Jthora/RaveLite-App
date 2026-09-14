/**
 * ElementPage — Fire, Air, Earth or Water on one page.
 *
 * Under the element's name: the day in numbers and the best result of the
 * last 30 days. Then a drill to try now (Done logs it, Swap offers the
 * next, Library opens the rest), the last 14 days as a ribbon to pick a
 * day, and that day's log from every source — chimes and rounds, drill
 * taps, circuit legs, Train entries and max tests. Train entries open for
 * edit; + Log adds one.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {DayRibbon} from '../../components/element/DayRibbon';
import {DrillCard} from '../../components/element/DrillCard';
import {LibrarySheet} from '../../components/element/LibrarySheet';
import {Tap} from '../../components/Tap';
import {DayList} from '../../components/today/DayList';
import {CalendarPicker} from '../../components/training/CalendarPicker';
import {TrainingLogSheet} from '../../components/training/TrainingLogSheet';
import {subscribeActivity} from '../../domain/activity/activity';
import {
  buildDayRibbon,
  elementActivityInRange,
  elementStatLine,
} from '../../domain/activity/elementDay';
import {streakDays, windowStart} from '../../domain/activity/stats';
import type {Target} from '../../domain/exercises/types';
import {
  getElementPrefs,
  setElementPrefs,
} from '../../domain/settings/elementPrefs';
import {buildDayList, type DayRow} from '../../domain/today/dayList';
import {bestResultLine} from '../../domain/training/headline';
import {
  loadEntries,
  loadEntriesForElement,
  loadMetricsForElement,
} from '../../domain/training/repository';
import type {TrainingLogEntry} from '../../domain/training/types';
import {MS_PER_DAY} from '../../lib/constants';
import type {ElementIdentity} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const RIBBON_DAYS = 14;

interface Props {
  element: ElementIdentity;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function ElementPage({element}: Props) {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeActivity(() => setVersion(v => v + 1)), []);

  const [day, setDay] = useState(() => startOfDay(Date.now()));
  const [focus, setFocus] = useState<Target[]>(() => [
    ...getElementPrefs(element.id).focusTargets,
  ]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingLogEntry | undefined>();

  const today = startOfDay(Date.now());
  const isToday = day === today;

  const view = useMemo(() => {
    const now = new Date();
    const windowItems = elementActivityInRange(
      windowStart(RIBBON_DAYS, now),
      now,
      element.id,
    );
    const ribbon = buildDayRibbon({items: windowItems, days: RIBBON_DAYS, now});
    const dayItems =
      day >= ribbon[0].dayStart
        ? windowItems.filter(i => startOfDay(i.at) === day)
        : elementActivityInRange(new Date(day), new Date(day), element.id);
    return {
      ribbon,
      rows: buildDayList({
        now: now.getTime(),
        activity: dayItems,
        journal: [],
        scheduled: [],
      }),
      stats: elementStatLine({
        today: ribbon[ribbon.length - 1].count,
        week: ribbon.slice(-7).reduce((sum, d) => sum + d.count, 0),
        streak: streakDays(now, element.id),
      }),
      best: bestResultLine(
        loadEntriesForElement(element.id),
        loadMetricsForElement(element.id),
        now.getTime(),
      ),
    };
    // `version` is the rebuild trigger; the reads go to storage directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, element.id, version]);

  const changeFocus = useCallback(
    (next: Target[]) => {
      setFocus(next);
      setElementPrefs(element.id, {focusTargets: next, focusLocked: true});
    },
    [element.id],
  );

  // A Train entry in the log opens for edit; others aren't pressable.
  const onRowPress = useCallback((row: DayRow) => {
    const id = row.ref?.store === 'train' ? row.ref.id : undefined;
    const entry = id ? loadEntries().find(e => e.id === id) : undefined;
    if (entry) {
      setEditing(entry);
    }
  }, []);

  const dayLabel = isToday
    ? 'Today'
    : day === startOfDay(today - MS_PER_DAY / 2)
    ? 'Yesterday'
    : new Date(day).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.name, {color: element.color}]}>
            {element.glyph} {element.name}
          </Text>
          <Text testID="element-stats" style={styles.stats}>
            {view.stats}
          </Text>
          {view.best ? (
            <Text style={styles.best} numberOfLines={1}>
              {view.best}
            </Text>
          ) : null}
        </View>
        <Tap
          testID="log-open"
          variant="ghost"
          color={element.accent}
          onPress={() => setLogOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Log a ${element.name} session`}
          style={styles.logBtn}>
          <Text style={[styles.logText, {color: element.accent}]}>+ Log</Text>
        </Tap>
      </View>

      <DrillCard
        element={element}
        focus={focus}
        version={version}
        onOpenLibrary={() => setLibraryOpen(true)}
      />

      <DayRibbon
        days={view.ribbon}
        selected={day}
        color={element.color}
        onSelect={setDay}
      />

      <View style={styles.dayRow}>
        <Tap
          variant="plain"
          color={element.accent}
          onPress={() => setCalendarOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Pick a day"
          style={styles.dayTap}>
          <Text testID="day-label" style={styles.dayLabel}>
            {`${dayLabel} ▾`}
          </Text>
        </Tap>
        {isToday ? null : (
          <Tap
            variant="plain"
            color={element.accent}
            onPress={() => setDay(today)}
            accessibilityRole="button"
            style={styles.dayTap}>
            <Text style={[styles.backText, {color: element.accent}]}>
              Back to today
            </Text>
          </Tap>
        )}
      </View>
      <DayList
        rows={view.rows}
        onRowPress={onRowPress}
        emptyText={`Nothing logged for ${element.name} ${
          isToday ? 'yet today' : 'that day'
        }.`}
      />

      <LibrarySheet
        visible={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        element={element}
        focus={focus}
        onFocusChange={changeFocus}
      />
      <CalendarPicker
        visible={calendarOpen}
        selected={day}
        accent={element.accent}
        onPick={epoch => {
          const picked = startOfDay(epoch);
          if (picked <= today) {
            setDay(picked);
          }
          setCalendarOpen(false);
        }}
        onClose={() => setCalendarOpen(false)}
      />
      <TrainingLogSheet
        visible={logOpen || editing !== undefined}
        editing={editing}
        defaultElement={element.id}
        onClose={() => {
          setLogOpen(false);
          setEditing(undefined);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...t.title,
  },
  stats: {
    ...t.body,
    color: palette.text,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  best: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  logBtn: {
    minWidth: 72,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  logText: {
    ...t.subtitle,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -spacing.sm,
  },
  dayTap: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  dayLabel: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  backText: {
    ...t.caption,
    letterSpacing: 0.6,
  },
});
