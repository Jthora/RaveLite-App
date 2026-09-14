/**
 * AlivePanel — Heart > Settings › Alive.
 *
 * How much RaveLite breathes while it sits beside the operator: Whisper
 * (default), Glow, or Still. Also says when motion is resting because of
 * night mode, a pause, or Android's "Remove animations".
 */
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  getAliveIntensity,
  setAliveIntensity,
} from '../../domain/ambient/aliveBridge';
import {getMotionMode, subscribeAlive} from '../../lib/aliveClock';
import type {AliveIntensity} from '../../lib/aliveMath';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const OPTIONS: Array<{value: AliveIntensity; label: string; detail: string}> = [
  {
    value: 'whisper',
    label: 'Whisper',
    detail:
      'A faint glow breathing behind every screen, and a tiny swell when you touch.',
  },
  {
    value: 'glow',
    label: 'Glow',
    detail: 'The same breath, a little brighter. More rave, more pull on the eye.',
  },
  {
    value: 'still',
    label: 'Still',
    detail: 'No idle breathing. Touches and chimes still move.',
  },
];

export function AlivePanel() {
  const [intensity, setIntensityState] =
    useState<AliveIntensity>(getAliveIntensity);
  const [mode, setMode] = useState(getMotionMode);

  useEffect(() => subscribeAlive(() => setMode(getMotionMode())), []);

  const accent = ELEMENTS.heart.accent;

  return (
    <View style={styles.panel}>
      <Text style={[styles.eyebrow, {color: accent}]}>⏵  ALIVE</Text>
      <Text style={styles.body}>
        How much RaveLite breathes while it sits beside you.
      </Text>
      {mode === 'off' ? (
        <Text style={styles.meta}>
          Resting right now — night, a pause, or Android's "Remove animations"
          is on. Chimes still show a soft fade.
        </Text>
      ) : null}

      {OPTIONS.map(option => {
        const selected = option.value === intensity;
        return (
          <Tap
            key={option.value}
            variant="plain"
            color={accent}
            accessibilityRole="radio"
            accessibilityState={{selected}}
            onPress={() => {
              setAliveIntensity(option.value);
              setIntensityState(option.value);
            }}
            style={[styles.option, selected && {borderColor: accent}]}>
            <View style={styles.optionRow}>
              <Text
                style={[
                  styles.radio,
                  {color: selected ? accent : palette.textMuted},
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
    lineHeight: 21,
  },
  meta: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.xs,
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
    gap: spacing.md,
  },
  radio: {
    fontSize: 16,
    lineHeight: 22,
  },
  optionCopy: {flex: 1},
  optionLabel: {
    ...t.subtitle,
    color: palette.text,
  },
  optionDetail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
    lineHeight: 17,
  },
});
