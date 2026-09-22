/**
 * ElementPage — Fire, Air, Core, Earth or Water on one page, opened over
 * Today from its balance strip.
 *
 * Under the element's name: the day in numbers and the best result of the
 * last 30 days. Then a drill to try now (Done logs it, Swap offers the
 * next, Library opens the rest), on Water the prop, dance and dance
 * combat paths (they open in Practice), the last 14 days as a ribbon to pick a
 * day, and that day's log from every source — chimes and rounds, drill
 * taps, circuit legs, Train entries and max tests. Train entries open for
 * edit; + Log adds one.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {ChevronLeft} from 'lucide-react-native';

import {DayRibbon} from '../../components/element/DayRibbon';
import {DrillCard} from '../../components/element/DrillCard';
import {LibrarySheet} from '../../components/element/LibrarySheet';
import {ElementGlyph} from '../../components/icons/ElementGlyph';
import {Tap} from '../../components/Tap';
import {DayList} from '../../components/today/DayList';
import {LoggedSheet} from '../../components/today/LoggedSheet';
import {MissingSheet} from '../../components/today/MissingSheet';
import {DisciplineCard} from '../../components/today/SkillList';
import {CalendarPicker} from '../../components/training/CalendarPicker';
import {TrainingLogSheet} from '../../components/training/TrainingLogSheet';
import {subscribeActivity} from '../../domain/activity/activity';
import {takeBack} from '../../domain/activity/corrections';
import {skillGroupsFor} from '../../domain/activity/practice';
import {disciplineById} from '../../domain/exercises/disciplines';
import {
  buildDayRibbon,
  elementActivityInRange,
  elementStatLine,
} from '../../domain/activity/elementDay';
import {streakDays, windowStart} from '../../domain/activity/stats';
import type {Target} from '../../domain/exercises/types';
import {entriesForDay} from '../../domain/journal/journal';
import {
  dailyPar,
  loadFacts,
  showsGrades,
} from '../../domain/profile/repository';
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
import {requestPractice} from '../../shell/practiceRequest';
import type {ElementIdentity} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const RIBBON_DAYS = 14;

interface Props {
  element: ElementIdentity;
  /** Back to Today. */
  onBack?: () => void;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function ElementPage({element, onBack}: Props) {
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
  const [logged, setLogged] = useState<DayRow | undefined>();
  /** A Train row whose entry has since been deleted. */
  const [gone, setGone] = useState<string | undefined>();

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
        today: ribbon[ribbon.length - 1].points,
        week: ribbon.slice(-7).reduce((sum, d) => sum + d.points, 0),
        streak: streakDays(now, element.id),
        par: dailyPar(),
      }),
      best: bestResultLine(
        loadEntriesForElement(element.id),
        loadMetricsForElement(element.id),
        now.getTime(),
        showsGrades(),
      ),
    };
    // `version` is the rebuild trigger; the reads go to storage directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, element.id, version]);

  // Water is flow: its page points at the prop, dance and dance combat
  // paths, which live in Practice — the same ones Practice lists.
  const paths = useMemo(
    () =>
      element.id !== 'water'
        ? []
        : skillGroupsFor(loadFacts()).flatMap(group => {
            const path = group.discipline
              ? disciplineById(group.discipline)
              : undefined;
            return path ? [path] : [];
          }),
    [element.id],
  );

  const changeFocus = useCallback(
    (next: Target[]) => {
      setFocus(next);
      setElementPrefs(element.id, {focusTargets: next, focusLocked: true});
    },
    [element.id],
  );

  /**
   * A Train entry opens for edit; anything else logged opens to keep or
   * remove. One at a time, and never silently.
   *
   * Same two faults Today had: each branch set its own state without
   * clearing the other, so two sheets could be open at once; and a Train
   * row whose entry had been deleted did nothing at all, which from the
   * outside is a tap that flashes and is ignored.
   */
  const onRowPress = useCallback((row: DayRow) => {
    setLogged(undefined);
    setEditing(undefined);

    if (row.ref?.store === 'journal') {
      setLogged(row);
      return;
    }
    const id = row.ref?.store === 'train' ? row.ref.id : undefined;
    const entry = id ? loadEntries().find(e => e.id === id) : undefined;
    if (entry) {
      setEditing(entry);
      return;
    }
    setGone(row.label);
  }, []);

  const removeLogged = useCallback(() => {
    const ref = logged?.ref;
    if (logged && ref?.store === 'journal') {
      const entry = entriesForDay(new Date(logged.at)).find(
        e => e.id === ref.id,
      );
      if (entry?.kind === 'completion') {
        takeBack(entry, {announce: true});
      }
    }
    setLogged(undefined);
  }, [logged]);

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
      <View>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {onBack ? (
              <Tap
                testID="page-back"
                variant="plain"
                color={element.accent}
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Back to Today"
                style={styles.back}>
                <ChevronLeft
                  size={26}
                  color={palette.textDim}
                  strokeWidth={2.2}
                />
              </Tap>
            ) : null}
            <ElementGlyph element={element} size={24} />
            <Text
              style={[styles.name, {color: element.color}]}
              numberOfLines={1}>
              {element.name}
            </Text>
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
        <Text testID="element-stats" style={styles.stats}>
          {view.stats}
        </Text>
        {view.best ? (
          <Text style={styles.best} numberOfLines={1}>
            {view.best}
          </Text>
        ) : null}
      </View>

      <DrillCard
        element={element}
        focus={focus}
        version={version}
        onOpenLibrary={() => setLibraryOpen(true)}
      />

      {paths.length > 0 ? (
        <View testID="water-paths" style={styles.paths}>
          <Text accessibilityRole="header" style={styles.eyebrow}>
            PATHS IN PRACTICE
          </Text>
          {paths.map(path => (
            <DisciplineCard
              key={path.id}
              discipline={path}
              version={version}
              onOpen={() => {
                requestPractice(path.id);
                onBack?.();
              }}
            />
          ))}
        </View>
      ) : null}

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

      <LoggedSheet
        row={logged}
        onRemove={removeLogged}
        onClose={() => setLogged(undefined)}
      />
      <MissingSheet name={gone} onClose={() => setGone(undefined)} />
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
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  back: {
    width: 40,
    minHeight: 48,
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  name: {
    ...t.title,
    flexShrink: 1,
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
  paths: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textFaint,
    letterSpacing: 1.5,
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
