/**
 * Tap — Pressable with default press feedback.
 *
 * The whole app shares one feel: a quick opacity dip on iOS, a colored
 * ripple on Android, and a hairline scale on long-press. Use this in
 * place of bare `Pressable` for any tappable surface so feedback is
 * uniform without dozens of inline `({pressed}) => …` callbacks.
 *
 * Variants:
 *   solid  — filled element-color button (white text)
 *   ghost  — outlined; transparent fill
 *   pill   — small rounded-pill toggle (used in filter strips)
 *   plain  — no chrome; just the press feedback (rows, links, tiles)
 *
 * Pass `style` to override or extend container styles. Children are
 * rendered as-is, so callers stay in full control of typography.
 */
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  type PressableProps,
} from 'react-native';

type Variant = 'solid' | 'ghost' | 'pill' | 'plain';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  variant?: Variant;
  /** Element accent. Drives ripple color and (for solid) background. */
  color?: string;
  /** Disabled-style override; also blocks onPress. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Tap({
  variant = 'plain',
  color = '#7CF59E',
  disabled,
  style,
  children,
  onPress,
  ...rest
}: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      android_ripple={
        disabled ? undefined : {color: hexWithAlpha(color, 0.18), borderless: false}
      }
      style={({pressed}) => [
        baseStyleFor(variant),
        variant === 'solid' && {backgroundColor: color},
        variant === 'ghost' && {borderColor: color},
        pressed && !disabled && pressedOverlay(variant),
        disabled && styles.disabled,
        style,
      ]}>
      {/* Inner View lets borderRadius clip ripples on Android. */}
      <View pointerEvents="none" style={styles.inner}>
        {children}
      </View>
    </Pressable>
  );
}

function baseStyleFor(v: Variant): ViewStyle {
  switch (v) {
    case 'solid':
      return styles.solid;
    case 'ghost':
      return styles.ghost;
    case 'pill':
      return styles.pill;
    case 'plain':
    default:
      return styles.plain;
  }
}

function pressedOverlay(v: Variant): ViewStyle {
  // Slightly different feedback per variant — solid dims, ghost
  // brightens, plain just fades.
  if (v === 'solid') {return {opacity: 0.78};}
  if (v === 'ghost') {return {opacity: 0.65};}
  return {opacity: 0.6};
}

function hexWithAlpha(hex: string, alpha: number): string {
  // Simple #RRGGBB → rgba(). Falls back to white if shape is unexpected.
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) {return `rgba(255,255,255,${alpha})`;}
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  inner: {flex: 0},
  solid: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ghost: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  plain: {
    overflow: 'hidden',
  },
  disabled: {opacity: 0.4},
});
