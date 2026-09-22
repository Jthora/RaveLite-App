/**
 * Which charts grade the military tests: the men's or the women's. The
 * tests pack used to assume male; now it asks, and holds grades back
 * until it knows. Shown in Goals, and under the pack when it is turned on.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {gradingTable} from '../../domain/profile/repository';
import {
  AGE_GROUP,
  setPrimarySex,
  type Sex,
} from '../../domain/standards/standards';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const LABEL: Record<Sex, string> = {
  male: "Men's charts",
  female: "Women's charts",
};

export function TablePicker({onPick}: {onPick?: () => void}) {
  const [table, setTable] = useState(gradingTable);
  const accent = ELEMENTS.heart.accent;

  return (
    <View testID="table-picker" style={styles.root}>
      {table === undefined ? (
        <Text style={styles.ask}>Which charts grade your tests?</Text>
      ) : null}
      <View style={styles.row}>
        {(['male', 'female'] as const).map(sex => {
          const on = table === sex;
          return (
            <Tap
              key={sex}
              testID={`table-${sex}`}
              variant="ghost"
              color={on ? accent : palette.textDim}
              onPress={() => {
                setPrimarySex(sex);
                setTable(sex);
                onPick?.();
              }}
              accessibilityRole="radio"
              accessibilityState={{selected: on}}
              style={styles.pill}>
              <Text style={[styles.pillText, on && {color: accent}]}>
                {LABEL[sex]}
              </Text>
            </Tap>
          );
        })}
      </View>
      <Text style={styles.note}>
        {`The app has the charts for ages ${AGE_GROUP} only.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  ask: {
    ...t.subtitle,
    color: palette.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  pillText: {
    ...t.subtitle,
    fontSize: 15,
    color: palette.text,
  },
  note: {
    ...t.caption,
    color: palette.textFaint,
    lineHeight: 17,
  },
});
