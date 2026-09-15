/**
 * Standards — today's push-ups and the military fitness tests the operator
 * trains toward (USAF, USSF, USMC, MARSOC). Opened from the push-up row in
 * Today's Daily Sets card.
 *
 * Each event shows its target (the operator's own, or the top score for
 * ages 35–40, both tables with the chosen one first), the best test from
 * the Train log with a bar toward the target, and "Log a test". Tap a
 * target to change it.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {NumberPad} from '../../components/training/NumberPad';
import {TrainingLogSheet} from '../../components/training/TrainingLogSheet';
import {
  activityForDay,
  subscribeActivity,
} from '../../domain/activity/activity';
import {setsToday} from '../../domain/ambient/setScheduler';
import {PUSHUP_GOAL, pushupDay} from '../../domain/program/pushups';
import {
  STANDARDS_NOTE,
  STANDARD_EVENTS,
  bestResult,
  getPrimarySex,
  hasOwnTarget,
  progressToward,
  setPrimarySex,
  setTarget,
  targetFor,
  type Sex,
  type StandardEvent,
} from '../../domain/standards/standards';
import {formatDuration} from '../../domain/training/grading';
import {
  getMetric,
  loadEntries,
  subscribeTrainingLog,
} from '../../domain/training/repository';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LETTER: Record<Sex, string> = {male: 'M', female: 'F'};

const formatValue = (event: StandardEvent, value: number) =>
  event.unit === 'seconds' ? formatDuration(value) : String(Math.round(value));

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});

/** "M 21 · F 10", the chosen table first. */
function topScores(event: StandardEvent, first: Sex): string {
  const second: Sex = first === 'male' ? 'female' : 'male';
  return `${LETTER[first]} ${formatValue(event, event.top[first])} · ${
    LETTER[second]
  } ${formatValue(event, event.top[second])}`;
}

export function StandardsSheet({visible, onClose}: Props) {
  const [version, setVersion] = useState(0);
  const [logKindId, setLogKindId] = useState<string | undefined>();
  const [editing, setEditing] = useState<StandardEvent | undefined>();
  const bump = () => setVersion(v => v + 1);
  useEffect(() => subscribeActivity(bump), []);
  useEffect(() => subscribeTrainingLog(bump), []);

  const accent = ELEMENTS.heart.accent;
  const fire = ELEMENTS.fire.color;

  const view = useMemo(() => {
    const now = Date.now();
    const entries = loadEntries();
    return {
      sex: getPrimarySex(),
      pushups: pushupDay(
        activityForDay(new Date(now)),
        setsToday(now).prescriptions,
      ),
      events: STANDARD_EVENTS.map(event => {
        const target = targetFor(event);
        const best = bestResult(event, entries, getMetric);
        return {
          event,
          target,
          own: hasOwnTarget(event),
          best,
          progress: best ? progressToward(event, best.value, target) : 0,
        };
      }),
    };
    // `version` and `visible` are the rebuild triggers; reads go to storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, visible]);

  const {pushups} = view;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>Standards</Text>
          <Tap
            variant="plain"
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Tap>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>PUSH-UPS TODAY</Text>
            <Text style={styles.big}>
              {pushups.total}
              <Text style={styles.bigGoal}> / {PUSHUP_GOAL}</Text>
            </Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(1, pushups.total / PUSHUP_GOAL) * 100}%`,
                    backgroundColor: fire,
                  },
                ]}
              />
            </View>
            <Text style={styles.caption}>
              {pushups.standard} standard · {pushups.variants} variants
              {pushups.bestSet > 0 ? ` · best set ${pushups.bestSet}` : ''}
              {pushups.planned > 0
                ? ` · today's sets add up to ${pushups.planned}`
                : ''}
            </Text>
          </View>

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

          {view.events.map(({event, target, own, best, progress}) => (
            <View key={event.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitle}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.caption}>{event.tests}</Text>
                </View>
                <Tap
                  testID={`target-${event.id}`}
                  variant="plain"
                  color={accent}
                  onPress={() => setEditing(event)}
                  accessibilityRole="button"
                  accessibilityLabel={`${event.name} target ${formatValue(
                    event,
                    target,
                  )}. Change`}
                  style={styles.targetTap}>
                  <View style={styles.targetBox}>
                    <Text style={styles.target}>
                      {formatValue(event, target)}
                    </Text>
                    <Text style={styles.caption}>
                      {own ? 'your target' : topScores(event, view.sex)}
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
                      backgroundColor: progress >= 1 ? accent : fire,
                    },
                  ]}
                />
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.best} numberOfLines={2}>
                  {best
                    ? `Best ${formatValue(event, best.value)} · ${shortDate(
                        best.at,
                      )}${best.from ? ` · from ${best.from}` : ''}`
                    : 'No test yet'}
                </Text>
                <Tap
                  testID={`log-${event.id}`}
                  variant="ghost"
                  color={accent}
                  onPress={() => setLogKindId(event.kindId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Log a ${event.name} test`}
                  style={styles.logBtn}>
                  <Text style={[styles.logText, {color: accent}]}>
                    Log a test
                  </Text>
                </Tap>
              </View>
              {own ? (
                <Text style={styles.caption}>
                  Top score {topScores(event, view.sex)}
                </Text>
              ) : null}
              {event.note ? (
                <Text style={styles.caption}>{event.note}</Text>
              ) : null}
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
        <TrainingLogSheet
          visible={logKindId !== undefined}
          defaultKindId={logKindId}
          onClose={() => {
            setLogKindId(undefined);
            bump();
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

/** Change a target on a number pad, or go back to the top score. */
function TargetEditor({
  event,
  sex,
  onClose,
  onSave,
}: {
  event?: StandardEvent;
  sex: Sex;
  onClose: () => void;
  /** `undefined` goes back to the top score. */
  onSave: (value: number | undefined) => void;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (event) {
      setValue(targetFor(event));
    }
  }, [event]);
  if (!event) {
    return null;
  }
  const accent = ELEMENTS.heart.accent;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.editor, {borderColor: accent}]}>
          <Text style={[styles.editorTitle, {color: accent}]}>
            {event.name} target
          </Text>
          <Text style={styles.caption}>
            Top score for ages 35–40: {topScores(event, sex)}
          </Text>
          <NumberPad
            mode={event.unit === 'seconds' ? 'mmss' : 'integer'}
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
                <Text style={styles.pillText}>Top score</Text>
              </Tap>
            ) : null}
            <Tap
              testID="target-save"
              variant="solid"
              color={accent}
              onPress={() => onSave(value > 0 ? value : undefined)}
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
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: {
    ...t.title,
  },
  close: {
    minHeight: 48,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
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
