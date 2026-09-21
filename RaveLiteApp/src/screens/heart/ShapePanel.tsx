/**
 * How much day there is to train in.
 *
 * The app assumes the author's day — at a desk, nine chimes between waking
 * and dinner. For anyone else that assumption is the difference between a
 * program and a reproach: the ramp reads share of prescribed sets done, so
 * a four-chime life measured against a nine-chime day sits at 40% for ever
 * and never levels up.
 *
 * So the question is not "how hard do you want it" — it is "how much day
 * do you have". The answer scales the sets, the chimes and par together,
 * and the preview line says what that means before it is chosen.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {DAILY_PAR} from '../../domain/activity/par';
import {DAY_SHAPES, densityFor, parFor} from '../../domain/program/density';
import type {DayShapeId} from '../../domain/program/types';
import {loadShape, setShape} from '../../domain/profile/repository';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** "6 chimes a day · par 15" — what picking this shape would mean. */
function shapeMeans(id: DayShapeId, rounds: number): string {
  const par = parFor(densityFor(id), DAILY_PAR);
  return `${rounds} ${rounds === 1 ? 'chime' : 'chimes'} a day · par ${par}`;
}

export function ShapePanel() {
  const [shape, setLocal] = useState<DayShapeId>(loadShape);
  const accent = ELEMENTS.heart.accent;

  const pick = (id: DayShapeId) => {
    setShape(id);
    setLocal(id);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>HOW MUCH DAY YOU HAVE</Text>
      <Text style={styles.caption}>
        Not how hard you want it — how many times a day you can stop and move.
        Everything is sized from this, so a short day is a full day's training,
        not a failed one.
      </Text>
      {DAY_SHAPES.map(option => {
        const on = shape === option.id;
        return (
          <Tap
            key={option.id}
            testID={`shape-${option.id}`}
            variant="plain"
            onPress={() => pick(option.id)}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            accessibilityLabel={`${option.name}. ${shapeMeans(
              option.id,
              option.rounds,
            )}`}
            style={[
              styles.row,
              on && {borderColor: accent, backgroundColor: `${accent}14`},
            ]}>
            <View style={styles.rowInner}>
              <View style={styles.rowText}>
                <Text style={[styles.rowName, on && {color: accent}]}>
                  {option.name}
                </Text>
                <Text style={styles.rowDetail}>{option.detail}</Text>
              </View>
              <Text style={[styles.means, on && {color: accent}]}>
                {option.rounds}×
              </Text>
            </View>
          </Tap>
        );
      })}
      <Text testID="shape-means" style={styles.means}>
        {shapeMeans(shape, DAY_SHAPES.find(s => s.id === shape)?.rounds ?? 9)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  caption: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  rowText: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  rowName: {
    ...t.subtitle,
    color: palette.text,
  },
  rowDetail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  means: {
    ...t.caption,
    color: palette.textMuted,
  },
});
