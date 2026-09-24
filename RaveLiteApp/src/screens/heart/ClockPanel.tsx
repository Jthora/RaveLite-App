/**
 * ClockPanel — Heart > Settings › The app › Clock.
 *
 * Whether times read 14:30 or 2:30 PM. Display only: My day and the plan
 * keep 24-hour "HH:MM" on disk whatever this says, so an export written
 * on one setting restores on the other and means the same thing.
 *
 * "Follow the phone" is the default and leads, because Android already
 * knows — the person set it once in the system clock settings. The other
 * two are here because the phone's answer is sometimes not the one
 * wanted, and a setting is cheaper than an argument.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  clockOf,
  loadClockFormat,
  setClockFormat,
  type ClockFormat,
} from '../../domain/settings/clock';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const OPTIONS: Array<{value: ClockFormat; label: string; detail: string}> = [
  {
    value: 'auto',
    label: 'Follow the phone',
    detail: 'Whatever the system clock is set to.',
  },
  {value: '24', label: '24-hour', detail: 'Times read 14:30.'},
  {value: '12', label: 'AM / PM', detail: 'Times read 2:30 PM.'},
];

export function ClockPanel() {
  const [format, setFormat] = useState<ClockFormat>(loadClockFormat);
  const accent = ELEMENTS.heart.accent;

  // A live example beats describing it: this is 17:45 drawn the way the
  // current choice draws it.
  const example = clockOf(17, 45);

  return (
    <View style={styles.panel}>
      <Text
        accessibilityRole="header"
        style={[styles.eyebrow, {color: accent}]}>
        ▸ CLOCK
      </Text>
      <Text style={styles.body}>
        How times are shown, everywhere in the app. A quarter to six in the
        evening reads {example}.
      </Text>

      {OPTIONS.map(option => {
        const selected = option.value === format;
        return (
          <Tap
            key={option.value}
            testID={`clock-${option.value}`}
            variant="plain"
            color={accent}
            accessibilityRole="radio"
            accessibilityState={{selected}}
            accessibilityLabel={`${option.label}. ${option.detail}`}
            onPress={() => {
              setClockFormat(option.value);
              setFormat(option.value);
            }}
            style={[styles.option, selected && {borderColor: accent}]}>
            <View style={styles.optionRow}>
              <Text
                style={[
                  styles.radio,
                  {color: selected ? accent : palette.textFaint},
                ]}>
                {selected ? '◉' : '○'}
              </Text>
              <View style={styles.optionCopy}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDetail}>{option.detail}</Text>
              </View>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  body: {
    ...t.body,
    color: palette.textDim,
    marginBottom: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radio: {
    fontSize: 16,
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    ...t.subtitle,
    color: palette.text,
  },
  optionDetail: {
    ...t.caption,
    color: palette.textDim,
  },
});
