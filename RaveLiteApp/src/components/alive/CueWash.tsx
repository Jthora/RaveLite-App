/**
 * CueWash — a soft full-screen wash in an element's color, at the app
 * root: the visual half of a chime, and the bloom when entering an
 * element's screen. Peak opacity comes from the motion budget (≤ 14 %),
 * and it fades out within about a second.
 *
 * Mounted once, above the shell and below the night veil.
 */
import React, {useMemo} from 'react';
import {Animated, StyleSheet} from 'react-native';

import {useAliveWash} from '../../hooks/useAlive';

export function CueWash() {
  const {value, color, peak} = useAliveWash();
  const opacity = useMemo(
    () => value.interpolate({inputRange: [0, 1], outputRange: [0, peak]}),
    [value, peak],
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, {backgroundColor: color, opacity}]}
    />
  );
}
