/**
 * NightVeil — outside active hours the UI rests under a dark veil (the
 * backlight is already dropped by `screenPolicy`). The veil swallows the
 * first tap and wakes the screen for two minutes, so a sleepy tap never
 * presses a button underneath.
 *
 * Mounted once at the app root, above the shell.
 */
import React, {useEffect, useState} from 'react';
import {AppState, Pressable, StyleSheet, Text} from 'react-native';

import {
  getScreenMode,
  subscribeScreenMode,
  syncScreenPolicy,
  wakeScreen,
  type ScreenMode,
} from '../../domain/ambient/screenPolicy';
import {palette} from '../../theme';

export function NightVeil() {
  const [mode, setMode] = useState<ScreenMode>(getScreenMode);

  useEffect(() => subscribeScreenMode(setMode), []);

  useEffect(() => {
    // Coming back to the foreground: the window may have dropped its
    // brightness override, and the hour may have changed while away.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncScreenPolicy(Date.now(), {force: true});
      }
    });
    return () => sub.remove();
  }, []);

  if (mode !== 'night') {
    return null;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Wake the screen"
      style={styles.veil}
      onPress={() => wakeScreen()}>
      <Text style={styles.hint}>tap to wake</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
  hint: {
    color: palette.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
