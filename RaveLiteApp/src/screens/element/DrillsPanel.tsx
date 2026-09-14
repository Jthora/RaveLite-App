/**
 * DrillsPanel — an element's Drills tab.
 *
 * A drill to try now at the top (Done logs it; Swap offers the next best),
 * then the focus areas and the element's full library. Focus areas are
 * saved per element and also steer the pick. A tap on a drill that is a
 * Daily Sets track's current rung counts as a set.
 */
import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {CardGrid} from '../../components/CardGrid';
import {ExerciseRow} from '../../components/ExerciseRow';
import {Tap} from '../../components/Tap';
import {TargetFilterStrip} from '../../components/TargetFilterStrip';
import {recordDrillTap} from '../../domain/activity/record';
import {exercisesFor} from '../../domain/exercises/library';
import {rankDrillsFor, type DrillContext} from '../../domain/exercises/scoring';
import type {Target} from '../../domain/exercises/types';
import {completionsTodayEntriesForElement} from '../../domain/journal/stats';
import {
  getElementPrefs,
  setElementPrefs,
} from '../../domain/settings/elementPrefs';
import {pulseHaptic} from '../../lib/elementHaptics';
import type {ElementIdentity} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  element: ElementIdentity;
}

function contextFor(element: ElementIdentity, focus: Target[]): DrillContext {
  const today = completionsTodayEntriesForElement(element.id);
  return {
    element: element.id,
    hour: new Date().getHours(),
    loggedTodayIds: new Set(today.map(e => e.exerciseId)),
    preferredTargets: focus,
    recentPickIds: today.slice(0, 5).map(e => e.exerciseId),
  };
}

export function DrillsPanel({element}: Props) {
  const all = useMemo(() => exercisesFor(element.id), [element.id]);
  const [focus, setFocus] = useState<Target[]>(() => [
    ...getElementPrefs(element.id).focusTargets,
  ]);
  /** Drills swapped past since the last change; the pick skips them. */
  const [passed, setPassed] = useState<string[]>([]);
  const [version, setVersion] = useState(0);

  const pick = useMemo(() => {
    const ranked = rankDrillsFor(contextFor(element, focus)).map(
      r => r.exercise,
    );
    return ranked.find(ex => !passed.includes(ex.id)) ?? ranked[0];
    // `version` re-ranks after a drill is logged (logged drills sink).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element, focus, passed, version]);

  const shown = useMemo(
    () =>
      focus.length === 0
        ? all
        : all.filter(ex => ex.targets.some(tg => focus.includes(tg))),
    [all, focus],
  );

  const changeFocus = (next: Target[]) => {
    setFocus(next);
    setPassed([]);
    setElementPrefs(element.id, {focusTargets: next, focusLocked: true});
  };

  const swap = () => {
    if (!pick) {
      return;
    }
    setPassed(p => (p.length + 1 >= all.length ? [] : [...p, pick.id]));
  };

  const logPick = () => {
    if (!pick) {
      return;
    }
    recordDrillTap(pick);
    pulseHaptic(element.id, 'seal');
    setPassed([]);
    setVersion(v => v + 1);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {pick ? (
        <View style={[styles.pick, {borderColor: element.accent}]}>
          <Text style={[styles.eyebrow, {color: element.accent}]}>
            {element.glyph} TRY THIS NOW
          </Text>
          <Text testID="pick-name" style={styles.pickName}>
            {pick.name}
          </Text>
          <Text style={styles.pickDose}>{pick.dose}</Text>
          <Text style={styles.pickPurpose}>{pick.purpose}</Text>
          {pick.cues?.slice(0, 3).map((cue, i) => (
            <Text key={i} style={styles.cue}>
              · {cue}
            </Text>
          ))}
          <View style={styles.pickActions}>
            <Tap
              testID="pick-done"
              variant="solid"
              color={element.color}
              onPress={logPick}
              accessibilityRole="button"
              style={styles.pickBtn}>
              <Text style={styles.pickBtnText}>Done</Text>
            </Tap>
            <Tap
              testID="pick-swap"
              variant="ghost"
              color={element.accent}
              onPress={swap}
              accessibilityRole="button"
              accessibilityLabel="Show a different drill"
              style={styles.pickBtn}>
              <Text style={[styles.pickBtnText, {color: element.accent}]}>
                ↻ Swap
              </Text>
            </Tap>
          </View>
        </View>
      ) : null}

      <TargetFilterStrip
        active={focus}
        onChange={changeFocus}
        color={element.color}
      />
      <Text style={styles.meta}>
        {shown.length} of {all.length} {element.name.toLowerCase()} drills
        {focus.length > 0
          ? ` · ${focus.length} focus area${focus.length === 1 ? '' : 's'}`
          : ''}
      </Text>
      {shown.length === 0 ? (
        <Text style={styles.empty}>
          No drills match these focus areas. Drop a pill or two.
        </Text>
      ) : (
        <CardGrid>
          {shown.map(ex => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onCompleted={() => setVersion(v => v + 1)}
            />
          ))}
        </CardGrid>
      )}
    </ScrollView>
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
    gap: spacing.sm,
  },
  pick: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...t.caption,
    letterSpacing: 1.4,
  },
  pickName: {
    ...t.title,
    color: palette.text,
    marginTop: spacing.xs,
  },
  pickDose: {
    ...t.subtitle,
    color: palette.textDim,
    marginTop: 2,
  },
  pickPurpose: {
    ...t.body,
    color: palette.text,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  cue: {
    ...t.body,
    color: palette.textDim,
    marginTop: 2,
  },
  pickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pickBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  pickBtnText: {
    ...t.subtitle,
    color: palette.bg,
    fontWeight: '800',
  },
  meta: {
    ...t.caption,
    color: palette.textDim,
  },
  empty: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
});
