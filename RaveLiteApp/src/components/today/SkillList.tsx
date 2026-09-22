/**
 * The curriculum: what there is to drill, and what you have actually
 * drilled this week. Tapping one opens the counter.
 */
import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {activityInRange} from '../../domain/activity/activity';
import {
  allClears,
  levelFor,
  formatCount,
  skillDrill,
  skillGroupsFor,
  tallyPractice,
  unitFor,
} from '../../domain/activity/practice';
import {loadFacts} from '../../domain/profile/repository';
import type {Exercise} from '../../domain/exercises/types';
import {moveForExercise} from '../../domain/exercises/moves';
import {
  TIERS,
  disciplineById,
  type Discipline,
  type DisciplineId,
} from '../../domain/exercises/disciplines';
import {CHART_BY_ID} from '../../domain/program/charts';
import {Symbol, hueOf} from '../icons/Symbol';
import {disciplineSymbol} from './DisciplineView';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const WEEK_DAYS = 7;

export function SkillList({
  onPick,
  onOpenDiscipline,
  version = 0,
}: {
  onPick: (exercise: Exercise) => void;
  /** A flow prop, dance or dance combat: its whole path, on a page. */
  onOpenDiscipline?: (id: DisciplineId) => void;
  /** Bumped after a practice is logged, to re-read the week. */
  version?: number;
}) {
  const tally = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - (WEEK_DAYS - 1));
    return tallyPractice(activityInRange(from, to));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <View style={styles.root}>
      <Text style={styles.intro}>
        Pick a skill and count it. The count is your record. The minutes earn
        attribute points.
      </Text>
      {skillGroupsFor(loadFacts()).map(group => {
        const path = group.discipline
          ? disciplineById(group.discipline)
          : undefined;
        if (path && onOpenDiscipline) {
          return (
            <DisciplineCard
              key={group.title}
              discipline={path}
              version={version}
              onOpen={() => onOpenDiscipline(path.id)}
            />
          );
        }
        return (
          <View key={group.title} style={styles.group}>
            <Text accessibilityRole="header" style={styles.groupTitle}>
              {group.title.toUpperCase()}
            </Text>
            {group.ids.map(id => {
              const drill = skillDrill(id);
              if (!drill) {
                return null;
              }
              const el = ELEMENTS[drill.element];
              const week = tally.get(id);
              return (
                <Tap
                  key={id}
                  testID={`skill-${id}`}
                  variant="plain"
                  onPress={() => onPick(drill)}
                  accessibilityRole="button"
                  accessibilityLabel={`Drill ${drill.name}`}
                  style={styles.row}>
                  <View style={styles.rowInner}>
                    <View
                      style={[styles.tile, {backgroundColor: `${el.color}29`}]}>
                      <MoveIcon
                        move={moveForExercise(id) ?? 'activity'}
                        color={el.color}
                        size={18}
                      />
                    </View>
                    <View style={styles.body}>
                      <Text style={[styles.name, {color: el.color}]}>
                        {drill.name}
                      </Text>
                      <Text style={styles.caption}>
                        {week
                          ? `${formatCount(
                              week.amount,
                              unitFor(drill),
                            )} this week · ${week.times}×`
                          : drill.dose}
                      </Text>
                    </View>
                    <Text style={[styles.chevron, {color: el.color}]}>›</Text>
                  </View>
                </Tap>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/** A path as one row: its name, how far it goes, how much is cleared. */
export function DisciplineCard({
  discipline,
  version,
  onOpen,
}: {
  discipline: Discipline;
  version: number;
  onOpen: () => void;
}) {
  const cleared = useMemo(() => {
    const clears = allClears();
    return discipline.ids.filter(id => (clears[id] ?? []).length > 0).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipline, version]);
  const level = levelFor(discipline.id);
  const chart = CHART_BY_ID.get(level.chart);
  return (
    <Tap
      testID={`discipline-${discipline.id}`}
      variant="plain"
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${discipline.name}: ${discipline.ids.length} moves`}
      style={[styles.row, styles.card]}>
      <View style={styles.rowInner}>
        <Symbol name={disciplineSymbol(discipline)} size={22} />
        <View style={styles.body}>
          <Text
            style={[styles.name, {color: hueOf(disciplineSymbol(discipline))}]}>
            {discipline.name}
          </Text>
          <Text style={styles.caption}>
            {discipline.ids.length} moves in three tiers · {cleared} cleared
          </Text>
          <Text style={[styles.caption, {color: chart?.color}]}>
            {TIERS.find(tr => tr.id === level.tier)?.name} · {chart?.name}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  intro: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  group: {
    gap: 4,
    marginTop: spacing.sm,
  },
  groupTitle: {
    ...t.caption,
    color: palette.textFaint,
    letterSpacing: 1.5,
  },
  row: {
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    minHeight: 52,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  tile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingVertical: 6,
  },
  name: {
    ...t.body,
    fontWeight: '600',
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
  },
  chevron: {
    ...t.subtitle,
    color: palette.textDim,
  },
  card: {
    marginTop: spacing.sm,
    minHeight: 64,
  },
});
