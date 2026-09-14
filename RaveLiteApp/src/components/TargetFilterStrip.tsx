/**
 * Toggle row of focus-area pills for filtering drills.
 *
 * Empty selection means "no filter — show all". The default state is
 * the operator's three active corrections (UCS / Hourglass / APT),
 * surfaced via a quick-toggle "MY CORRECTIONS" pill at the head of the
 * row.
 *
 * Used by DrillsPanel (live filter) and TunePanel (persisted prefs).
 */
import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {Target} from '../domain/exercises/types';
import {palette, radius, spacing} from '../theme';

/** Focus areas offered as pills — corrections first, then training
 *  goals, then daily-care calls. Order matters — these render in this
 *  order in the strip. PFT-* tags are not offered here. */
export const FOCUS_TARGETS: ReadonlyArray<Target> = [
  'UCS',
  'Hourglass',
  'APT',
  'Core',
  'Strength',
  'Conditioning',
  'Grip',
  'Agility',
  'Mobility',
  'Breath',
  'Coordination',
  'Flow',
  'Presence',
  'Hydration',
  'Fuel',
  'NoFloor',
];

/** The operator's three active corrections — the "MY CORRECTIONS" preset. */
export const CORRECTIONS_PRESET: ReadonlyArray<Target> = [
  'UCS',
  'Hourglass',
  'APT',
];

interface Props {
  active: ReadonlyArray<Target>;
  onChange: (next: Target[]) => void;
  /** Element accent — drives active pill color. */
  color: string;
}

export function TargetFilterStrip({active, onChange, color}: Props) {
  const allCorrectionsOn = CORRECTIONS_PRESET.every(t => active.includes(t));

  const toggle = (t: Target) => {
    if (active.includes(t)) {
      onChange(active.filter(x => x !== t));
    } else {
      onChange([...active, t]);
    }
  };

  const togglePreset = () => {
    if (allCorrectionsOn) {
      onChange(active.filter(t => !CORRECTIONS_PRESET.includes(t)));
    } else {
      const without = active.filter(t => !CORRECTIONS_PRESET.includes(t));
      onChange([...without, ...CORRECTIONS_PRESET]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      <Pill
        label="⌖  MY CORRECTIONS"
        active={allCorrectionsOn}
        onPress={togglePreset}
        color={color}
        accent
      />
      {FOCUS_TARGETS.map(t => (
        <Pill
          key={t}
          label={t}
          active={active.includes(t)}
          onPress={() => toggle(t)}
          color={color}
        />
      ))}
    </ScrollView>
  );
}

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
  accent?: boolean;
}

function Pill({label, active, onPress, color, accent}: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.pill,
        active && {backgroundColor: color, borderColor: color},
        accent && !active && {borderColor: color, borderStyle: 'dashed'},
        {opacity: pressed ? 0.7 : 1},
      ]}>
      <Text
        style={[
          styles.pillText,
          {
            color: active
              ? palette.bg
              : accent
              ? color
              : palette.textDim,
          },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'transparent',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
