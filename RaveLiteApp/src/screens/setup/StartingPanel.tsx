/**
 * Where you're starting from — the one setup question that is not also a
 * Settings panel, because it is only answerable once.
 *
 * Every track ships a starting max. Those numbers are one person's, and
 * for a beginner three pull-ups is not a starting point, it is a wall.
 * Phase 1 taught the program to ask the room what it can do; this asks
 * the body the same question, once, and then never again: after the first
 * week the ramp knows more than any answer here could have told it.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  DEFAULT_STARTING,
  STARTING_POINTS,
  type StartingPoint,
} from '../../domain/profile/starting';
import {loadStarting} from '../../domain/profile/repository';
import {chooseStarting} from '../../domain/profile/setup';
import {Symbol, hueOf, type SymbolName} from '../../components/icons/Symbol';
import {tint} from '../../theme/hues';
import {palette, radius, spacing, type as t} from '../../theme';

/** A seedling, a tree, a weight: where the body is starting from. */
const STARTING_SYMBOL: Record<StartingPoint, SymbolName> = {
  new: 'new',
  returning: 'returning',
  training: 'training',
};

export function StartingPanel() {
  const [chosen, setChosen] = useState<StartingPoint>(
    () => loadStarting() ?? DEFAULT_STARTING,
  );
  /** True once anything has been logged: the maxes are its own by then. */
  const [settled, setSettled] = useState(false);

  const pick = (id: StartingPoint) => {
    if (!chooseStarting(id)) {
      setSettled(true);
      return;
    }
    setChosen(id);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>WHERE YOU'RE STARTING</Text>
      <Text style={styles.caption}>
        Only used to pick the first numbers. Get it wrong and it costs about a
        week — the app follows what you actually do from there.
      </Text>
      {STARTING_POINTS.map(option => {
        const on = chosen === option.id;
        return (
          <Tap
            key={option.id}
            testID={`starting-${option.id}`}
            variant="plain"
            onPress={() => pick(option.id)}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            accessibilityLabel={`I'm ${option.name}. ${option.detail}`}
            style={[
              styles.row,
              on && {
                borderColor: hueOf(STARTING_SYMBOL[option.id]),
                backgroundColor: tint(hueOf(STARTING_SYMBOL[option.id])),
              },
            ]}>
            <View style={styles.rowInner}>
              <View
                style={[
                  styles.badge,
                  {backgroundColor: tint(hueOf(STARTING_SYMBOL[option.id]))},
                ]}>
                <Symbol name={STARTING_SYMBOL[option.id]} size={20} />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[
                    styles.rowName,
                    on && {color: hueOf(STARTING_SYMBOL[option.id])},
                  ]}>
                  {option.name}
                </Text>
                <Text style={styles.rowDetail}>{option.detail}</Text>
              </View>
            </View>
          </Tap>
        );
      })}
      {settled ? (
        <Text testID="starting-settled" style={styles.caption}>
          You have already trained against these numbers, so they are yours now.
          Take a max test to set one exactly.
        </Text>
      ) : null}
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
    minHeight: 60,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
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
});
