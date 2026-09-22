/**
 * When your day runs — the setup question behind Settings › My day.
 *
 * The fields are the same ones the My day sheet shows. Each change that
 * makes a real day is saved at once, like every other setup panel, and
 * moves the default plan with it (`moveMyDay`).
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {MyDayFields, myDayProblem} from '../../components/today/MyDaySheet';
import {getActiveHours} from '../../domain/ambient/activeHours';
import type {ActiveHours} from '../../domain/ambient/types';
import {moveMyDay} from '../../domain/reminders/moveDay';
import {palette, spacing, type as t} from '../../theme';

export function MyDayPanel() {
  const [value, setValue] = useState<ActiveHours>(getActiveHours);

  const change = (next: ActiveHours) => {
    setValue(next);
    if (myDayProblem(next) === null) {
      moveMyDay(next);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>MY DAY</Text>
      <Text style={styles.caption}>
        Set the start to when you get up. It can end after midnight.
      </Text>
      <MyDayFields value={value} onChange={change} />
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
});
