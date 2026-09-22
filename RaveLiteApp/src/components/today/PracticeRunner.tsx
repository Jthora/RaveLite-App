/**
 * Drilling one skill, counted. A clock starts on the first count and runs
 * until you log it: the count is the record, the minutes are what earn
 * points, so twenty minutes of toprock finally reaches the attributes.
 *
 * A plain view, not a sheet: it shows inside the Practice sheet, because
 * on Android Back stops reaching a sheet opened over another.
 */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {
  formatCount,
  recordPractice,
  unitFor,
  type CountUnit,
} from '../../domain/activity/practice';
import type {Exercise} from '../../domain/exercises/types';
import {CHART_BY_ID, type ChartId} from '../../domain/program/charts';
import {moveForExercise} from '../../domain/exercises/moves';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(
    2,
    '0',
  )}`;

export function PracticeRunner({
  exercise,
  chart,
  dose = exercise.dose,
  onDone,
  onCancel,
}: {
  exercise: Exercise;
  /** A curriculum move's chart, and the dose it asks for at it. */
  chart?: ChartId;
  dose?: string;
  /** Logged: the count and how long it took. */
  onDone: (summary: string) => void;
  onCancel: () => void;
}) {
  const el = ELEMENTS[exercise.element];
  // Counted in whatever this chart's dose is counted in: Beginner's
  // "1 min each side" is a clock even when Standard is reps.
  const unit: CountUnit = useMemo(
    () => unitFor({...exercise, dose}),
    [exercise, dose],
  );
  const step = unit === 'eights' ? 1 : unit === 'sec' ? 15 : 1;
  const [count, setCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | undefined>();
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (startedAt === undefined) {
      return;
    }
    timer.current = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(timer.current);
  }, [startedAt]);

  const bump = (by: number) => {
    setStartedAt(at => at ?? Date.now());
    setCount(c => Math.max(0, c + by));
  };

  // A hold is counted by the clock itself; nothing to tap but the seconds.
  const amount = unit === 'sec' ? elapsed : count;
  const canLog = amount > 0;

  const log = () => {
    recordPractice({
      exercise,
      amount,
      unit,
      seconds: Math.max(elapsed, unit === 'sec' ? amount : 1),
      chart,
    });
    const at = chart ? ` · ${CHART_BY_ID.get(chart)?.name}` : '';
    onDone(`${exercise.name}${at} · ${formatCount(amount, unit)}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={[styles.tile, {backgroundColor: `${el.color}29`}]}>
            <MoveIcon
              move={moveForExercise(exercise.id) ?? 'activity'}
              color={el.color}
              size={26}
            />
          </View>
          <View style={styles.headText}>
            <Text style={[styles.title, {color: el.color}]} numberOfLines={2}>
              {exercise.name}
            </Text>
            {chart ? (
              <Text
                style={[
                  styles.chart,
                  {color: CHART_BY_ID.get(chart)?.color ?? el.color},
                ]}>
                {CHART_BY_ID.get(chart)?.name.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.caption}>{dose}</Text>
          </View>
        </View>

        <View style={styles.counter}>
          <Text testID="practice-count" style={styles.count}>
            {formatCount(amount, unit)}
          </Text>
          <Text style={styles.clock}>{clock(elapsed)}</Text>
        </View>

        {unit === 'sec' ? (
          <Tap
            testID="practice-start"
            variant={startedAt === undefined ? 'solid' : 'ghost'}
            color={el.color}
            onPress={() => setStartedAt(at => at ?? Date.now())}
            accessibilityRole="button"
            style={styles.wide}>
            <Text
              style={[
                styles.wideText,
                startedAt === undefined ? styles.onSolid : {color: el.color},
              ]}>
              {startedAt === undefined ? 'Start the clock' : 'Running…'}
            </Text>
          </Tap>
        ) : (
          <View style={styles.row}>
            <Tap
              testID="practice-minus"
              variant="ghost"
              color={palette.textDim}
              onPress={() => bump(-step)}
              accessibilityRole="button"
              accessibilityLabel="One less"
              style={styles.small}>
              <Text style={styles.smallText}>−</Text>
            </Tap>
            <Tap
              testID="practice-plus"
              variant="solid"
              color={el.color}
              onPress={() => bump(step)}
              accessibilityRole="button"
              accessibilityLabel={
                unit === 'eights' ? 'One more eight-count' : 'One more rep'
              }
              style={styles.big}>
              <Text style={styles.bigText}>
                {unit === 'eights' ? '+ one 8' : '+ 1'}
              </Text>
            </Tap>
            <Tap
              testID="practice-plus-ten"
              variant="ghost"
              color={el.color}
              onPress={() => bump(unit === 'eights' ? 4 : 10)}
              accessibilityRole="button"
              accessibilityLabel={
                unit === 'eights' ? 'Four more eight-counts' : 'Ten more reps'
              }
              style={styles.small}>
              <Text style={[styles.smallText, {color: el.color}]}>
                {unit === 'eights' ? '+4' : '+10'}
              </Text>
            </Tap>
          </View>
        )}

        {exercise.cues?.length ? (
          <View style={styles.cues}>
            {exercise.cues.map(cue => (
              <Text key={cue} style={styles.cue}>
                · {cue}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Tap
            testID="practice-log"
            variant="solid"
            color={el.color}
            onPress={log}
            disabled={!canLog}
            accessibilityRole="button"
            style={styles.wide}>
            <Text style={[styles.wideText, styles.onSolid]}>Log it</Text>
          </Tap>
          <Tap
            variant="ghost"
            color={palette.textDim}
            onPress={onCancel}
            accessibilityRole="button"
            style={styles.wide}>
            <Text style={styles.wideText}>Not now</Text>
          </Tap>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    ...t.caption,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
  },
  title: {
    ...t.title,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
  },
  counter: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontSize: 44,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  clock: {
    ...t.caption,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  big: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigText: {
    ...t.title,
    color: palette.bg,
  },
  small: {
    width: 72,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallText: {
    ...t.title,
    color: palette.textDim,
  },
  cues: {
    gap: 4,
  },
  cue: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  wide: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  onSolid: {
    color: palette.bg,
    fontWeight: '700',
  },
});
