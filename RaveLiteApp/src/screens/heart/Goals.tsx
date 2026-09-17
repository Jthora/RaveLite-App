/**
 * Goals — today's push-ups, the military fitness tests the operator trains
 * toward (a B+ on the Space Force, Air Force and Marine tests), then goals
 * for Air, Core, Earth and Water on RaveLite's own marks. Shown inside the
 * Daily Sets page rather than as a sheet of its own: on Android, Back stops
 * reaching a sheet opened over another once it has been touched.
 *
 * Each goal shows its target (the operator's own, or a B+), the best result
 * from the Train log with its grade and a bar toward the target, its D−, B+
 * and A+ marks (per test for the fitness tests, on the chosen table), and
 * "Log a test". Last week's sets done comes from Daily Sets itself. Tap a
 * target to change it.
 *
 * Dates are projections: each goal's straight-line trend through recent
 * tests (`standards/projection.ts`), and for push-ups how soon today's
 * sets could reach 200 a day keeping up every week (`program/ramp.ts`).
 */
import React, {useEffect, useMemo, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import type {InfoRef} from '../../domain/info/info';
import {NumberPad} from '../../components/training/NumberPad';
import {TrainingLogSheet} from '../../components/training/TrainingLogSheet';
import {
  ACTIVE_FLOOR_MINUTES,
  ACTIVE_GOAL_MINUTES,
  activeMinutes,
} from '../../domain/activity/active';
import {
  activityForDay,
  activityInRange,
  subscribeActivity,
} from '../../domain/activity/activity';
import {windowStart} from '../../domain/activity/stats';
import {setsToday} from '../../domain/ambient/setScheduler';
import {lastWeekDone} from '../../domain/program/adapt';
import {PUSHUP_GOAL, pushupDay} from '../../domain/program/pushups';
import {pushupRamp, type PushupRamp} from '../../domain/program/ramp';
import {runFor} from '../../domain/program/morning';
import {
  formatPerMile,
  nextCheckpoint,
  pacesFor,
  runFitness,
  splitTime,
} from '../../domain/run/plan';
import {loadProgram, subscribeProgram} from '../../domain/program/repository';
import {
  GOAL_GROUPS,
  MARKS_NOTE,
  STANDARDS_NOTE,
  STANDARD_EVENTS,
  TEST_NAMES,
  bestResult,
  formatGrades,
  getHeightInches,
  getPrimarySex,
  goalFor,
  gradesFor,
  hasOwnTarget,
  markFor,
  progressToward,
  resultsFor,
  setHeightInches,
  setPrimarySex,
  setTarget,
  targetFor,
  type EventScale,
  type GoalGroup,
  type Sex,
  type StandardEvent,
  type StandardResult,
} from '../../domain/standards/standards';
import {projectGoal, type Projection} from '../../domain/standards/projection';
import {formatDuration, type Grade} from '../../domain/training/grading';
import {
  getMetric,
  loadEntries,
  subscribeTrainingLog,
} from '../../domain/training/repository';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const LETTER: Record<Sex, string> = {male: 'M', female: 'F'};

const formatValue = (event: StandardEvent, value: number) =>
  event.unit === 'seconds'
    ? formatDuration(value)
    : event.unit === 'percent'
    ? `${Math.round(value)}%`
    : event.unit === 'ratio'
    ? value.toFixed(2)
    : String(Math.round(value));

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});

/** "Nov 20", with the year when it isn't this year's. */
function futureDate(at: number): string {
  const date = new Date(at);
  const thisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(
    undefined,
    thisYear
      ? {month: 'short', day: 'numeric'}
      : {month: 'short', day: 'numeric', year: 'numeric'},
  );
}

/** How soon today's push-up sets could reach 200 a day. */
function rampLine(ramp: PushupRamp): string {
  switch (ramp.kind) {
    case 'reached':
      return `Today's sets already reach ${PUSHUP_GOAL} a day.`;
    case 'on-pace':
      return `Keeping up every week, the sets reach ${PUSHUP_GOAL} a day around ${futureDate(
        ramp.at,
      )} (${ramp.weeks} weeks).`;
    case 'capped':
      return `At today's push-up max the sets top out at ${ramp.most} a day; a tested max of ${ramp.needMax} reaches ${PUSHUP_GOAL}.`;
  }
}

/** "USMC: D− 5 · B+ 17 · A+ 21" on the chosen table; RaveLite marks have no test name. */
function scaleLine(event: StandardEvent, scale: EventScale, sex: Sex): string {
  const mark = (grade: Grade) =>
    formatValue(event, markFor(event, scale, sex, grade));
  const line = `D− ${mark('D−')} · B+ ${mark('B+')} · A+ ${mark('A+')}`;
  return scale.test ? `${TEST_NAMES[scale.test]}: ${line}` : line;
}

/** "M 21 · F 10", the chosen table first. */
function topScores(event: StandardEvent, first: Sex): string {
  const second: Sex = first === 'male' ? 'female' : 'male';
  return `${LETTER[first]} ${formatValue(event, event.top[first])} · ${
    LETTER[second]
  } ${formatValue(event, event.top[second])}`;
}

const groupTitle = (group: GoalGroup) =>
  group === 'tests' ? 'Fitness tests' : ELEMENTS[group].name;

/** A goal the app measures itself rather than one that's logged. */
const measured = (event: StandardEvent) => !event.kindId;

const groupColor = (group: GoalGroup) =>
  group === 'tests' ? ELEMENTS.fire.color : ELEMENTS[group].color;

interface GoalRow {
  event: StandardEvent;
  target: number;
  own: boolean;
  /** The best logged result, or last week's share for the measured goal. */
  result?: StandardResult;
  grades: string;
  progress: number;
  /** Where recent tests are heading. */
  projection: Projection;
}

/** Where a goal's tests are heading, in a sentence; nothing before a first test. */
function projectionLine(row: GoalRow): string | undefined {
  const goal = row.own ? 'your target' : 'the B+';
  switch (row.projection.kind) {
    case 'reached':
      return `Reached ${goal}.`;
    case 'on-pace':
      return `On pace for ${goal} around ${futureDate(row.projection.at)}.`;
    case 'close':
      return `The trend is at ${goal}: test again to make it count.`;
    case 'not-yet':
      return `Not on pace for ${goal} yet: keep testing every week or two.`;
    case 'need-more':
      return row.result
        ? 'Test again in a week or more to see a date.'
        : undefined;
  }
}

export function Goals({onInfo}: {onInfo?: (ref: InfoRef) => void} = {}) {
  const [version, setVersion] = useState(0);
  const [logKindId, setLogKindId] = useState<string | undefined>();
  const [editing, setEditing] = useState<StandardEvent | undefined>();
  const [heightOpen, setHeightOpen] = useState(false);
  const bump = () => setVersion(v => v + 1);
  useEffect(() => subscribeActivity(bump), []);
  useEffect(() => subscribeTrainingLog(bump), []);
  useEffect(() => subscribeProgram(() => bump()), []);

  const accent = ELEMENTS.heart.accent;
  const fire = ELEMENTS.fire.color;

  const view = useMemo(() => {
    const now = Date.now();
    const entries = loadEntries();
    const sex = getPrimarySex();
    const program = loadProgram(new Date(now));
    const done = lastWeekDone(Object.values(program.tracks));
    const height = getHeightInches();
    const rows: GoalRow[] = STANDARD_EVENTS.map(event => {
      const target = targetFor(event);
      // The one goal without a Train kind is measured from Daily Sets.
      const result = event.kindId
        ? bestResult(event, entries, getMetric, height)
        : done !== undefined
        ? {value: Math.round(done * 100), at: now}
        : undefined;
      return {
        event,
        target,
        own: hasOwnTarget(event),
        result,
        grades: result ? formatGrades(gradesFor(event, sex, result.value)) : '',
        progress: result ? progressToward(event, result.value, target) : 0,
        projection: projectGoal(
          event,
          resultsFor(event, entries, getMetric, height),
          target,
          now,
        ),
      };
    });
    const date = new Date(now);
    const today = activityForDay(date);
    return {
      sex,
      pushups: pushupDay(today, setsToday(now).prescriptions),
      rows,
      height,
      ramp: pushupRamp(program, now),
      active: {
        today: activeMinutes(today),
        // Today counts as one of the seven, finished or not.
        week: Math.round(
          activeMinutes(activityInRange(windowStart(7, date), date)) / 7,
        ),
      },
      run: (() => {
        const fitness = runFitness(entries, getMetric, now);
        const checkpoint = nextCheckpoint(fitness.threeMile);
        return {
          fitness,
          checkpoint,
          paces: pacesFor(fitness.threeMile, checkpoint),
          week: Array.from({length: 7}, (_, i) => {
            const day = new Date(date);
            day.setHours(6, 0, 0, 0);
            day.setDate(day.getDate() + i);
            return {day, run: runFor(day, now)};
          }).filter(d => d.run),
        };
      })(),
    };
    // `version` is the rebuild trigger; reads go to storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const {pushups, ramp, active, run} = view;
  // Today's sets are the day's target; 200 a day is where the ramp leads.
  const dayTarget = pushups.planned > 0 ? pushups.planned : PUSHUP_GOAL;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>PUSH-UPS TODAY</Text>
          <Text style={styles.big}>
            {pushups.total}
            <Text style={styles.bigGoal}>
              {' '}
              / {dayTarget}
              {pushups.planned > 0 ? ' today' : ''}
            </Text>
          </Text>
          <View style={styles.bar}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(1, pushups.total / dayTarget) * 100}%`,
                  backgroundColor: fire,
                },
              ]}
            />
          </View>
          <Text style={styles.caption}>
            {pushups.standard} standard · {pushups.variants} variants
            {pushups.bestSet > 0 ? ` · best set ${pushups.bestSet}` : ''}
          </Text>
          <Text style={styles.caption}>
            {pushups.planned > 0
              ? `Today's sets add up to ${pushups.planned}. They grow as you keep up with them and your tested max rises, toward ${PUSHUP_GOAL} a day.`
              : `The long-term goal is ${PUSHUP_GOAL} a day.`}
          </Text>
          <Text testID="pushups-ramp" style={styles.projection}>
            {rampLine(ramp)}
          </Text>
        </View>

        <View testID="active-card" style={styles.card}>
          <Text style={styles.eyebrow}>ACTIVE TODAY</Text>
          <Text style={styles.big}>
            {active.today}
            <Text style={styles.bigGoal}> / {ACTIVE_GOAL_MINUTES} min</Text>
          </Text>
          <View style={styles.bar}>
            <View
              style={[
                styles.fill,
                {
                  width: `${
                    Math.min(1, active.today / ACTIVE_GOAL_MINUTES) * 100
                  }%`,
                  backgroundColor:
                    active.today >= ACTIVE_FLOOR_MINUTES ? accent : fire,
                },
              ]}
            />
          </View>
          <Text style={styles.caption}>
            Two and a half hours is the ideal; {ACTIVE_FLOOR_MINUTES} minutes
            keeps a busy day on track. Sessions, runs, drills and sets count;
            water, breathing and stillness don't. Last 7 days: {active.week} min
            a day.
          </Text>
        </View>

        <View testID="run-card" style={styles.card}>
          <Text style={styles.eyebrow}>RUNNING</Text>
          <Text style={styles.big}>
            {formatDuration(run.fitness.threeMile)}
            <Text style={styles.bigGoal}> 3-mile estimate</Text>
          </Text>
          <Text style={styles.caption}>
            {run.fitness.from
              ? `From ${run.fitness.from.label} on ${shortDate(
                  run.fitness.from.at,
                )}${
                  run.fitness.stale
                    ? ', over four months ago: a run soon updates it.'
                    : ', carried to 3 miles.'
                }`
              : 'Assumed until you log a run of a mile or more.'}
          </Text>
          <Text style={styles.projection}>
            Next: {formatDuration(run.checkpoint.seconds)}
            {run.checkpoint.label === 'the next checkpoint'
              ? ', a minute at a time toward B+ (20:54)'
              : ` for ${run.checkpoint.label}`}
            . Easy {formatPerMile(run.paces.easy)}, tempo{' '}
            {formatPerMile(run.paces.tempo)}, 400 m in{' '}
            {formatDuration(splitTime(run.paces.goal, 400))}.
          </Text>
          {run.week.length > 0 ? (
            <Text style={styles.caption}>
              This week:{' '}
              {run.week
                .map(
                  d =>
                    `${d.day.toLocaleDateString(undefined, {
                      weekday: 'short',
                    })} ${d.run!.title.toLowerCase()} (${d.run!.short})`,
                )
                .join(' · ')}
            </Text>
          ) : null}
        </View>

        {GOAL_GROUPS.map((group, index) => (
          <View key={group} testID={`goals-${group}`} style={styles.section}>
            <Text style={[styles.sectionTitle, {color: groupColor(group)}]}>
              {groupTitle(group)}
            </Text>
            {group === 'tests' ? (
              <>
                <View style={styles.tableRow}>
                  {(['male', 'female'] as const).map(sex => {
                    const on = view.sex === sex;
                    return (
                      <Tap
                        key={sex}
                        testID={`table-${sex}`}
                        variant="ghost"
                        color={on ? accent : palette.textDim}
                        onPress={() => {
                          setPrimarySex(sex);
                          bump();
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{selected: on}}
                        style={styles.pill}>
                        <Text style={[styles.pillText, on && {color: accent}]}>
                          {sex === 'male' ? 'Male first' : 'Female first'}
                        </Text>
                      </Tap>
                    );
                  })}
                </View>
                <Text style={styles.note}>{STANDARDS_NOTE}</Text>
              </>
            ) : index === 1 ? (
              <Text style={styles.note}>{MARKS_NOTE}</Text>
            ) : null}
            {view.rows
              .filter(row => row.event.group === group)
              .map(row => (
                <GoalCard
                  key={row.event.id}
                  row={row}
                  sex={view.sex}
                  onEdit={() => setEditing(row.event)}
                  onInfo={
                    onInfo
                      ? () => onInfo({kind: 'event', id: row.event.id})
                      : undefined
                  }
                  height={view.height}
                  onHeight={() => setHeightOpen(true)}
                  onLog={
                    row.event.kindId
                      ? () => setLogKindId(row.event.kindId)
                      : undefined
                  }
                />
              ))}
          </View>
        ))}
      </ScrollView>

      <TargetEditor
        event={editing}
        sex={view.sex}
        onClose={() => setEditing(undefined)}
        onSave={value => {
          if (editing) {
            setTarget(editing.id, value);
          }
          setEditing(undefined);
          bump();
        }}
      />
      <HeightEditor
        visible={heightOpen}
        onClose={() => setHeightOpen(false)}
        onSave={inches => {
          setHeightInches(inches);
          setHeightOpen(false);
          bump();
        }}
      />
      <TrainingLogSheet
        visible={logKindId !== undefined}
        defaultKindId={logKindId}
        onClose={() => {
          setLogKindId(undefined);
          bump();
        }}
      />
    </>
  );
}

/** One goal: target, best result and grade, a bar, its marks and Log a test. */
function GoalCard({
  row,
  sex,
  onEdit,
  onLog,
  onInfo,
  height,
  onHeight,
}: {
  row: GoalRow;
  sex: Sex;
  onEdit: () => void;
  /** Unset for a goal the app measures itself. */
  onLog?: () => void;
  /** "What is this?" for the event. */
  onInfo?: () => void;
  /** The operator's height in inches, for a per-height goal. */
  height?: number;
  onHeight?: () => void;
}) {
  const {event, target, own, result, grades, progress} = row;
  const projection = measured(event) ? undefined : projectionLine(row);
  const accent = ELEMENTS.heart.accent;
  const isMeasured = measured(event);
  const resultLine = result
    ? [
        `${isMeasured ? 'Last week' : 'Best'} ${formatValue(
          event,
          result.value,
        )}`,
        isMeasured ? undefined : shortDate(result.at),
        grades || undefined,
        result.from ? `from ${result.from}` : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : isMeasured
    ? 'After a week of Daily Sets'
    : event.perHeight && !height
    ? 'Set your height to see the ratio'
    : 'No test yet';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Tap
          testID={`event-info-${event.id}`}
          variant="plain"
          onPress={onInfo}
          disabled={onInfo === undefined}
          accessibilityRole="button"
          accessibilityLabel={`${event.name}. What is this?`}
          style={styles.cardTitle}>
          <View>
            <Text style={styles.eventName}>
              {event.name}
              {onInfo ? <Text style={styles.cardInfo}> ⓘ</Text> : null}
            </Text>
            <Text style={styles.caption}>{event.subtitle}</Text>
          </View>
        </Tap>
        <Tap
          testID={`target-${event.id}`}
          variant="plain"
          color={accent}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`${event.name} target ${formatValue(
            event,
            target,
          )}. Change`}
          style={styles.targetTap}>
          <View style={styles.targetBox}>
            <Text style={styles.target}>{formatValue(event, target)}</Text>
            <Text style={styles.caption}>
              {own
                ? 'your target'
                : event.targetCaption ??
                  (event.scales ? 'B+ goal' : topScores(event, sex))}
            </Text>
          </View>
        </Tap>
      </View>
      <View style={styles.bar}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: progress >= 1 ? accent : groupColor(event.group),
            },
          ]}
        />
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.best} numberOfLines={2}>
          {resultLine}
        </Text>
        {onLog ? (
          <Tap
            testID={`log-${event.id}`}
            variant="ghost"
            color={accent}
            onPress={onLog}
            accessibilityRole="button"
            accessibilityLabel={
              event.perHeight ? 'Log your waist' : `Log a ${event.name} test`
            }
            style={styles.logBtn}>
            <Text style={[styles.logText, {color: accent}]}>
              {event.perHeight ? 'Log waist' : 'Log a test'}
            </Text>
          </Tap>
        ) : null}
      </View>
      {projection ? <Text style={styles.projection}>{projection}</Text> : null}
      {(event.scales ?? []).map((scale, i) => (
        <Text key={scale.test ?? i} style={styles.caption}>
          {scaleLine(event, scale, sex)}
        </Text>
      ))}
      {own && !event.scales && !event.targetCaption ? (
        <Text style={styles.caption}>Top score {topScores(event, sex)}</Text>
      ) : null}
      {event.note ? <Text style={styles.caption}>{event.note}</Text> : null}
      {event.perHeight && onHeight ? (
        <Tap
          testID="height-open"
          variant="plain"
          color={accent}
          onPress={onHeight}
          accessibilityRole="button"
          style={styles.heightTap}>
          <Text style={[styles.caption, {color: accent}]}>
            {height ? `Height ${height} in · change` : 'Set your height'}
          </Text>
        </Tap>
      ) : null}
    </View>
  );
}

/** Change a target on a number pad, or go back to the B+ (or top score). */
function TargetEditor({
  event,
  sex,
  onClose,
  onSave,
}: {
  event?: StandardEvent;
  sex: Sex;
  onClose: () => void;
  /** `undefined` goes back to the default target. */
  onSave: (value: number | undefined) => void;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (event) {
      // Ratios work in hundredths on the pad: 0.49 is 49.
      setValue(
        event.unit === 'ratio'
          ? Math.round(targetFor(event) * 100)
          : targetFor(event),
      );
    }
  }, [event]);
  if (!event) {
    return null;
  }
  const accent = ELEMENTS.heart.accent;
  const goal = goalFor(event, sex);
  const onTests = event.scales?.some(scale => scale.test) ?? false;
  const caption =
    goal === undefined
      ? `Top score for ages 35–40: ${topScores(event, sex)}`
      : onTests
      ? `A B+ on every test: ${formatValue(
          event,
          goal,
        )}. Top score: ${topScores(event, sex)}`
      : `B+ mark: ${formatValue(event, goal)}. A+: ${formatValue(
          event,
          event.top[sex],
        )}`;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.editor, {borderColor: accent}]}>
          <Text style={[styles.editorTitle, {color: accent}]}>
            {event.name} target
          </Text>
          <Text style={styles.caption}>{caption}</Text>
          <NumberPad
            mode={
              event.unit === 'seconds'
                ? 'mmss'
                : event.unit === 'ratio'
                ? 'decimal-2dp'
                : 'integer'
            }
            value={value}
            onChange={setValue}
            accent={accent}
            compact
          />
          <View style={styles.editorActions}>
            <Tap
              variant="ghost"
              color={palette.textDim}
              onPress={onClose}
              accessibilityRole="button"
              style={styles.editorBtn}>
              <Text style={styles.pillText}>Cancel</Text>
            </Tap>
            {hasOwnTarget(event) ? (
              <Tap
                variant="ghost"
                color={palette.textDim}
                onPress={() => onSave(undefined)}
                accessibilityRole="button"
                style={styles.editorBtn}>
                <Text style={styles.pillText}>
                  {event.scales ? 'B+ goal' : 'Top score'}
                </Text>
              </Tap>
            ) : null}
            <Tap
              testID="target-save"
              variant="solid"
              color={accent}
              onPress={() =>
                onSave(
                  value > 0
                    ? event.unit === 'ratio'
                      ? value / 100
                      : value
                    : undefined,
                )
              }
              accessibilityRole="button"
              style={styles.editorBtn}>
              <Text style={styles.saveText}>Save</Text>
            </Tap>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** The operator's height in inches, for waist-to-height. */
function HeightEditor({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (inches: number) => void;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (visible) {
      setValue(getHeightInches() ?? 0);
    }
  }, [visible]);
  if (!visible) {
    return null;
  }
  const accent = ELEMENTS.heart.accent;
  const valid = value >= 36;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.editor, {borderColor: accent}]}>
          <Text style={[styles.editorTitle, {color: accent}]}>Your height</Text>
          <Text style={styles.caption}>
            In inches, for waist-to-height: 5 ft 10 in is 70.
          </Text>
          <NumberPad
            mode="integer"
            value={value}
            onChange={setValue}
            accent={accent}
            compact
          />
          <View style={styles.editorActions}>
            <Tap
              variant="ghost"
              color={palette.textDim}
              onPress={onClose}
              accessibilityRole="button"
              style={styles.editorBtn}>
              <Text style={styles.pillText}>Cancel</Text>
            </Tap>
            <Tap
              testID="height-save"
              variant="solid"
              color={valid ? accent : palette.textMuted}
              disabled={!valid}
              onPress={() => onSave(value)}
              accessibilityRole="button"
              style={styles.editorBtn}>
              <Text style={styles.saveText}>Save</Text>
            </Tap>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  heightTap: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  big: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  bigGoal: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.textDim,
  },
  bar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  fill: {
    height: 5,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  note: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
  projection: {
    ...t.caption,
    color: palette.text,
    lineHeight: 17,
  },
  tableRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
  },
  pillText: {
    ...t.subtitle,
    fontSize: 15,
    color: palette.text,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: {
    flex: 1,
  },
  cardInfo: {
    color: palette.textDim,
  },
  eventName: {
    ...t.subtitle,
    color: palette.text,
  },
  targetTap: {
    minHeight: 48,
    minWidth: 72,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  targetBox: {
    alignItems: 'flex-end',
  },
  target: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  best: {
    ...t.body,
    flex: 1,
    color: palette.text,
  },
  logBtn: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  logText: {
    ...t.subtitle,
    fontSize: 15,
  },
  scrim: {
    flex: 1,
    backgroundColor: '#000000B3',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  editor: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  editorTitle: {
    ...t.subtitle,
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editorBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  saveText: {
    ...t.subtitle,
    color: palette.bg,
  },
});
