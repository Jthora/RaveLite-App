import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../icons/ElementGlyph';

import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {recordDrillTap} from '../../domain/activity/record';
import {moveForExercise} from '../../domain/exercises/moves';
import {loadFacts} from '../../domain/profile/repository';
import {rankDrillsFor, type DrillContext} from '../../domain/exercises/scoring';
import type {Target} from '../../domain/exercises/types';
import {completionsTodayEntriesForElement} from '../../domain/journal/stats';
import {pulseHaptic} from '../../lib/elementHaptics';
import type {ElementIdentity} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  element: ElementIdentity;
  /** Focus areas that steer the pick. */
  focus: readonly Target[];
  /** Bumped when activity changes, so logged drills sink. */
  version: number;
  onOpenLibrary: () => void;
}

function contextFor(
  element: ElementIdentity,
  focus: readonly Target[],
): DrillContext {
  const today = completionsTodayEntriesForElement(element.id);
  return {
    element: element.id,
    hour: new Date().getHours(),
    loggedTodayIds: new Set(today.map(e => e.exerciseId)),
    preferredTargets: [...focus],
    recentPickIds: today.slice(0, 5).map(e => e.exerciseId),
    facts: loadFacts(),
  };
}

/**
 * A drill to try now: name and dose, with the why and the cues folded
 * under "How". Done logs it (and counts as a set when it is a Daily Sets
 * track's current rung), Swap offers the next best, Library opens the rest.
 */
export function DrillCard({element, focus, version, onOpenLibrary}: Props) {
  /** Drills swapped past since the last change; the pick skips them. */
  const [passed, setPassed] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => setPassed([]), [focus]);

  // Only what this person can do where they train: the card is the one
  // place that says "now", so it must never name a band nobody owns.
  const ranked = useMemo(
    () => rankDrillsFor(contextFor(element, focus)).map(r => r.exercise),
    // `version` re-ranks after a drill is logged (logged drills sink).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [element, focus, version],
  );
  const total = ranked.length;
  const pick = ranked.find(ex => !passed.includes(ex.id)) ?? ranked[0];

  if (!pick) {
    return null;
  }

  const swap = () => {
    setPassed(p => (p.length + 1 >= total ? [] : [...p, pick.id]));
    setOpen(false);
  };

  const logPick = () => {
    recordDrillTap(pick);
    pulseHaptic(element.id, 'seal');
    setPassed([]);
    setOpen(false);
  };

  return (
    <View style={[styles.card, {borderColor: element.accent}]}>
      <View style={styles.eyebrowRow}>
        <ElementGlyph element={element} size={13} color={element.accent} />
        <Text
          accessibilityRole="header"
          style={[styles.eyebrow, {color: element.accent}]}>
          TRY THIS NOW
        </Text>
      </View>
      <Tap
        variant="plain"
        color={element.accent}
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        accessibilityLabel={`${pick.name}, ${pick.dose}. ${
          open ? 'Hide how' : 'Show how'
        }`}
        style={styles.titleTap}>
        <View style={styles.titleRow}>
          <MoveIcon
            move={moveForExercise(pick.id) ?? 'activity'}
            color={element.color}
            size={32}
          />
          <View style={styles.titleText}>
            <Text testID="pick-name" style={styles.name}>
              {pick.name}
            </Text>
            <Text style={styles.dose}>{pick.dose}</Text>
          </View>
          <Text style={[styles.how, {color: element.accent}]}>
            {open ? 'How ▴' : 'How ▾'}
          </Text>
        </View>
      </Tap>
      {open ? (
        <View style={styles.details}>
          <Text style={styles.purpose}>{pick.purpose}</Text>
          {pick.cues?.map((cue, i) => (
            <Text key={i} style={styles.cue}>
              · {cue}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.actions}>
        <Tap
          testID="pick-done"
          variant="solid"
          color={element.color}
          onPress={logPick}
          accessibilityRole="button"
          style={styles.btn}>
          <Text style={styles.doneText}>Done</Text>
        </Tap>
        <Tap
          testID="pick-swap"
          variant="ghost"
          color={element.accent}
          onPress={swap}
          accessibilityRole="button"
          accessibilityLabel="Show a different drill"
          style={styles.btn}>
          <Text style={[styles.btnText, {color: element.accent}]}>↻ Swap</Text>
        </Tap>
        <Tap
          testID="library-open"
          variant="ghost"
          color={palette.textDim}
          onPress={onOpenLibrary}
          accessibilityRole="button"
          accessibilityLabel={`All ${total} ${element.name} drills`}
          style={styles.btn}>
          <Text style={styles.btnText}>Library</Text>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  eyebrow: {
    ...t.caption,
    letterSpacing: 1.4,
  },
  titleTap: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleText: {
    flex: 1,
  },
  name: {
    ...t.subtitle,
    fontSize: 18,
    color: palette.text,
  },
  dose: {
    ...t.body,
    color: palette.textDim,
    marginTop: 2,
  },
  how: {
    ...t.caption,
    letterSpacing: 0.6,
  },
  details: {
    marginTop: spacing.xs,
    gap: 2,
  },
  purpose: {
    ...t.body,
    color: palette.text,
    lineHeight: 21,
    marginBottom: spacing.xs,
  },
  cue: {
    ...t.body,
    color: palette.textDim,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  // No side padding: three buttons share a 360 dp phone's row.
  btn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 0,
    borderRadius: radius.pill,
  },
  doneText: {
    ...t.subtitle,
    color: palette.bg,
    fontWeight: '800',
  },
  btnText: {
    ...t.subtitle,
    color: palette.text,
  },
});
