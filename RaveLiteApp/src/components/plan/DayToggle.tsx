/**
 * DayToggle — 7-button S/M/T/W/T/F/S row for picking days of week.
 * Indices follow JS Date.getDay() convention: 0 = Sunday, 6 = Saturday.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {palette, radius, spacing} from '../../theme';

interface Props {
  value: number[];
  onChange: (next: number[]) => void;
  accent: string;
}

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DayToggle({value, onChange, accent}: Props) {
  const set = new Set(value);

  const toggle = (i: number) => {
    const next = new Set(set);
    if (next.has(i)) {next.delete(i);} else {next.add(i);}
    onChange(Array.from(next).sort((a, b) => a - b));
  };

  return (
    <View style={styles.row}>
      {LETTERS.map((letter, i) => {
        const active = set.has(i);
        return (
          <Tap
            key={i}
            variant="plain"
            color={accent}
            onPress={() => toggle(i)}
            style={[
              styles.cell,
              {
                backgroundColor: active ? accent : palette.surface,
                borderColor: active ? accent : palette.border,
              },
            ]}>
            <Text
              style={[
                styles.letter,
                {color: active ? palette.bg : palette.textDim},
              ]}>
              {letter}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
