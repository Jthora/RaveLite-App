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
  formatCount,
  skillDrill,
  skillGroupsFor,
  tallyPractice,
  unitFor,
} from '../../domain/activity/practice';
import {loadFacts} from '../../domain/profile/repository';
import type {Exercise} from '../../domain/exercises/types';
import {moveForExercise} from '../../domain/exercises/moves';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const WEEK_DAYS = 7;

export function SkillList({
  onPick,
  version = 0,
}: {
  onPick: (exercise: Exercise) => void;
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
        Drill one and count it. The count is the record; the minutes are what
        the attributes hear about.
      </Text>
      {skillGroupsFor(loadFacts()).map(group => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title.toUpperCase()}</Text>
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
      ))}
    </View>
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
    color: palette.textMuted,
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
  },
});
