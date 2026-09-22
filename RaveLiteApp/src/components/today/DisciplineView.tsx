/**
 * One discipline's path — a flow prop, dance, or dance combat — the way
 * DDR lays out a song list: pick a tier, pick a chart, pick a move.
 *
 * Every move can be played at every chart, so the chart pills change the
 * dose shown beside each move rather than the list. The dots beside a
 * move are the charts it has been cleared at, in the charts' own colours.
 * This renders inside the Practice sheet, never as a sheet over it.
 */
import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {MoveIcon} from '../icons/MoveIcon';
import {Symbol, type SymbolName} from '../icons/Symbol';
import {Tap} from '../Tap';
import {allClears, levelFor, setLevelFor} from '../../domain/activity/practice';
import {
  TIERS,
  tierOf,
  type Discipline,
} from '../../domain/exercises/disciplines';
import {EXERCISE_LIBRARY} from '../../domain/exercises/library';
import {moveForExercise} from '../../domain/exercises/moves';
import type {Exercise, Tier} from '../../domain/exercises/types';
import {whyNot} from '../../domain/profile/kit';
import {loadFacts} from '../../domain/profile/repository';
import {
  CHARTS,
  CHART_BY_ID,
  chartDose,
  type ChartId,
} from '../../domain/program/charts';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const BY_ID = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));

/** What each chart does, in a line, for the family's own rules. */
const CHART_LINE: Readonly<Record<ChartId, string>> = {
  beginner: 'Half tempo, short, and a reset after every slip.',
  light: 'Easy tempo, both sides, a little longer.',
  standard: 'Each move’s own dose — the one written for it.',
  heavy: 'The Standard dose, weak side first, linked to another move.',
  challenge: 'A whole track at tempo. Linked, both sides, clean.',
};

export function disciplineSymbol(d: Discipline): SymbolName {
  if (d.prop) {
    return d.prop as SymbolName;
  }
  return d.id === 'danceCombat' ? 'danceCombat' : 'dance';
}

export function DisciplineView({
  discipline,
  version,
  onPick,
  onBack,
}: {
  discipline: Discipline;
  /** Bumped after a practice is logged, so the dots catch up. */
  version: number;
  onPick: (exercise: Exercise, chart: ChartId, dose: string) => void;
  onBack: () => void;
}) {
  const [level, setLevel] = useState(() => levelFor(discipline.id));
  const choose = (next: Partial<typeof level>) => {
    const merged = {...level, ...next};
    setLevel(merged);
    setLevelFor(discipline.id, merged);
  };

  const facts = useMemo(() => loadFacts(), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clears = useMemo(() => allClears(), [version]);

  const moves = discipline.ids
    .map(id => BY_ID.get(id))
    .filter((d): d is Exercise => d !== undefined);
  const inTier = (tier: Tier) => moves.filter(m => tierOf(m.id) === tier);
  const shown = inTier(level.tier);
  const chart = CHART_BY_ID.get(level.chart)!;
  const clearedHere = shown.filter(m =>
    (clears[m.id] ?? []).includes(level.chart),
  ).length;
  const accent = ELEMENTS[moves[0]?.element ?? 'water'].color;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Tap
        testID="discipline-back"
        variant="plain"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to Practice"
        style={styles.back}>
        <Text style={styles.backText}>‹ Practice</Text>
      </Tap>

      <View style={styles.titleRow}>
        <Symbol name={disciplineSymbol(discipline)} size={26} />
        <View style={styles.titleText}>
          <Text style={[styles.title, {color: accent}]}>{discipline.name}</Text>
          <Text style={styles.caption}>
            {moves.length} moves · {clearedHere} of {shown.length} here cleared
            at {chart.name}
          </Text>
        </View>
      </View>

      <Text style={styles.eyebrow}>TIER</Text>
      <View style={styles.pills}>
        {TIERS.map(tier => {
          const on = level.tier === tier.id;
          return (
            <Tap
              key={tier.id}
              testID={`tier-${tier.id}`}
              variant={on ? 'solid' : 'ghost'}
              color={on ? accent : palette.textDim}
              onPress={() => choose({tier: tier.id})}
              accessibilityRole="button"
              accessibilityState={{selected: on}}
              accessibilityLabel={`${tier.name}, ${
                inTier(tier.id).length
              } moves`}
              style={styles.pill}>
              <Text style={[styles.pillText, on && styles.pillOn]}>
                {tier.name}
              </Text>
              <Text style={[styles.pillCount, on && styles.pillOn]}>
                {inTier(tier.id).length}
              </Text>
            </Tap>
          );
        })}
      </View>

      <Text style={styles.eyebrow}>CHART</Text>
      <View style={styles.pills}>
        {CHARTS.map(c => {
          const on = level.chart === c.id;
          return (
            <Tap
              key={c.id}
              testID={`chart-${c.id}`}
              variant={on ? 'solid' : 'ghost'}
              color={c.color}
              onPress={() => choose({chart: c.id})}
              accessibilityRole="button"
              accessibilityState={{selected: on}}
              accessibilityLabel={`${c.name} chart`}
              style={styles.chartPill}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.chartText, {color: on ? palette.bg : c.color}]}>
                {c.name}
              </Text>
            </Tap>
          );
        })}
      </View>
      <Text style={[styles.caption, {color: chart.color}]}>
        {CHART_LINE[level.chart]}
      </Text>

      {shown.map(move => {
        const dose = chartDose(move, level.chart, discipline.family);
        const cleared = clears[move.id] ?? [];
        const why = whyNot(move, facts);
        const el = ELEMENTS[move.element];
        return (
          <Tap
            key={move.id}
            testID={`move-${move.id}`}
            variant="plain"
            onPress={() => onPick(move, level.chart, dose)}
            accessibilityRole="button"
            accessibilityLabel={`${move.name}, ${chart.name}: ${dose}`}
            style={styles.row}>
            <View style={styles.rowInner}>
              <View style={[styles.tile, {backgroundColor: `${el.color}29`}]}>
                <MoveIcon
                  move={moveForExercise(move.id) ?? 'activity'}
                  color={el.color}
                  size={18}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.name, {color: el.color}]}>
                  {move.name}
                </Text>
                <Text style={styles.caption}>{dose}</Text>
                {why ? <Text style={styles.why}>{why}</Text> : null}
              </View>
              <View style={styles.dots}>
                {CHARTS.map(c => (
                  <View
                    key={c.id}
                    style={[
                      styles.dot,
                      {borderColor: c.color},
                      cleared.includes(c.id) && {backgroundColor: c.color},
                    ]}
                  />
                ))}
              </View>
            </View>
          </Tap>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  back: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleText: {
    flex: 1,
  },
  title: {
    ...t.title,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
  },
  why: {
    ...t.caption,
    color: '#FF9F0A',
  },
  eyebrow: {
    ...t.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    ...t.caption,
    color: palette.textDim,
  },
  pillCount: {
    ...t.caption,
    color: palette.textMuted,
  },
  pillOn: {
    color: palette.bg,
    fontWeight: '700',
  },
  chartPill: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // A column card: Tap wraps its children in one inner view, and a row
  // container would shrink that view to nothing.
  row: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  name: {
    ...t.subtitle,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
});
