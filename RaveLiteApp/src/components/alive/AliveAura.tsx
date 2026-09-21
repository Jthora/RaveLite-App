/**
 * AliveAura — the element's glow behind a screen, breathing.
 *
 * Two layers, both behind content so text is never tinted:
 *   - a static radial glow in the element's colors (the atmosphere the
 *     screen scaffold always had)
 *   - the same glow on the shared alive clock: breathing between the
 *     motion budget's floor and ceiling (stepped, to limit redraws), plus
 *     a small swell from touch energy and beat kicks
 *
 * Opacity only, native driver, cached as a hardware texture.
 */
import React, {useMemo} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';

import {useAliveBreath} from '../../hooks/useAlive';
import {steppedBreath} from '../../lib/aliveMath';

/** Visible opacity steps per breath. */
const BREATH_LEVELS = 8;
/** Center opacity of the always-on static glow. */
const STATIC_STRENGTH = 0.14;

interface Props {
  color: string;
  deep: string;
}

function Glow({
  id,
  color,
  deep,
  strength,
}: {
  id: string;
  color: string;
  deep: string;
  strength: number;
}) {
  return (
    <Svg width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient
          id={id}
          cx="50%"
          cy="0%"
          rx="85%"
          ry="60%"
          fx="50%"
          fy="0%">
          <Stop offset="0" stopColor={color} stopOpacity={strength} />
          <Stop offset="0.45" stopColor={deep} stopOpacity={strength * 0.6} />
          <Stop offset="1" stopColor={deep} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function AliveAura({color, deep}: Props) {
  const {phase, energy, kick, budget} = useAliveBreath();

  const opacity = useMemo(() => {
    const breath =
      budget.breathMax > 0
        ? phase.interpolate(
            steppedBreath(budget.breathMin, budget.breathMax, BREATH_LEVELS),
          )
        : new Animated.Value(0);
    const swell = Animated.add(energy, kick).interpolate({
      inputRange: [0, 1],
      outputRange: [0, budget.energyMax],
      extrapolate: 'clamp',
    });
    return Animated.add(breath, swell);
  }, [phase, energy, kick, budget]);

  const moving = budget.breathMax > 0 || budget.energyMax > 0;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Glow
        id="aura-static"
        color={color}
        deep={deep}
        strength={STATIC_STRENGTH}
      />
      {moving ? (
        <Animated.View
          renderToHardwareTextureAndroid
          style={[StyleSheet.absoluteFill, {opacity}]}>
          <Glow id="aura-live" color={color} deep={deep} strength={1} />
        </Animated.View>
      ) : null}
    </View>
  );
}
