/**
 * ScreenScaffold — minimal per-element wrapper.
 *
 * What it provides:
 *   - SafeAreaView (top-edge inset)
 *   - Ambient deep-tone radial glow + corner vignettes (atmosphere — free,
 *     absolute-positioned, costs no layout space)
 *   - Element-wash on focus: a brief 220ms color-bloom that signals
 *     "you've entered this house" + a haptic fingerprint
 *   - A flex container for screen content, capped at 1200dp on tablet
 *
 * What it intentionally does NOT provide:
 *   - A hero banner, sigil glyph, element name, ethos line, or cadence
 *     ribbon. Earlier versions did. They ate ~30–40% of the viewport on
 *     tablet portrait and forced screens to scroll. Now: the element rail
 *     and sub-tab rail communicate location; the screen body owns its
 *     full available space. Every page (and sub-page) can fit content
 *     snugly in both portrait and landscape on phone and tablet without
 *     the global chrome stealing real estate.
 *
 * The component still accepts (and ignores) the legacy props
 * (`subtitle`, `nextFireTs`, `everyMinutes`) so existing callers compile
 * without churn. They are deprecated and will be removed once all
 * screens drop them.
 */
import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ElementIdentity} from '../theme/elements';
import {palette, spacing} from '../theme';
import {useLayout} from '../hooks/useLayout';
import {pulseHaptic} from '../lib/elementHaptics';

interface Props {
  element: ElementIdentity;
  children?: React.ReactNode;
  /** @deprecated Hero removed. Prop retained for source compat. */
  subtitle?: string;
  /** @deprecated Cadence ribbon removed. Prop retained for source compat. */
  nextFireTs?: number;
  /** @deprecated Cadence ribbon removed. Prop retained for source compat. */
  everyMinutes?: number;
}

export const ScreenScaffold: React.FC<Props> = ({element, children}) => {
  const layout = useLayout();
  const tablet = layout.isTablet;

  // Element wash: brief full-screen color-bloom on focus. Says "entered
  // a new chamber" without a hard navigation transition. Re-runs when
  // the element id changes.
  const wash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pulseHaptic(element.id, 'enter');
    wash.setValue(0);
    Animated.sequence([
      Animated.timing(wash, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wash, {
        toValue: 0,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [wash, element.id]);
  const washOpacity = wash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Ambient element-deep glow — absolute, no layout cost. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.glowOuter,
            {backgroundColor: element.deep, opacity: 0.16},
          ]}
        />
        <View
          style={[
            styles.glowInner,
            {backgroundColor: element.color, opacity: 0.08},
          ]}
        />
        {(['TL', 'TR', 'BL', 'BR'] as const).map(corner => (
          <React.Fragment key={corner}>
            <View
              style={[
                styles.vignette,
                styles[`vig_${corner}_a`],
                {opacity: 0.55},
              ]}
            />
            <View
              style={[
                styles.vignette,
                styles[`vig_${corner}_b`],
                {opacity: 0.35},
              ]}
            />
            <View
              style={[
                styles.vignette,
                styles[`vig_${corner}_c`],
                {opacity: 0.18},
              ]}
            />
          </React.Fragment>
        ))}
      </View>

      <View
        style={[
          styles.content,
          {paddingHorizontal: tablet ? spacing.lg : spacing.md},
          tablet && styles.contentTablet,
        ]}>
        {children}
      </View>

      {/* Element-color wash overlay sits above content during the bloom. */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {backgroundColor: element.color, opacity: washOpacity},
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: palette.bg},
  content: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  /** Cap content width on tablets so prose stays readable. */
  contentTablet: {maxWidth: 1200, width: '100%', alignSelf: 'center'},
  glowOuter: {
    position: 'absolute',
    top: -300,
    left: -150,
    right: -150,
    height: 700,
    borderRadius: 500,
  },
  glowInner: {
    position: 'absolute',
    top: -200,
    alignSelf: 'center',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  vignette: {
    position: 'absolute',
    backgroundColor: '#000',
    borderRadius: 999,
  },
  vig_TL_a: {top: -260, left: -260, width: 360, height: 360},
  vig_TL_b: {top: -320, left: -320, width: 480, height: 480},
  vig_TL_c: {top: -400, left: -400, width: 640, height: 640},
  vig_TR_a: {top: -260, right: -260, width: 360, height: 360},
  vig_TR_b: {top: -320, right: -320, width: 480, height: 480},
  vig_TR_c: {top: -400, right: -400, width: 640, height: 640},
  vig_BL_a: {bottom: -260, left: -260, width: 360, height: 360},
  vig_BL_b: {bottom: -320, left: -320, width: 480, height: 480},
  vig_BL_c: {bottom: -400, left: -400, width: 640, height: 640},
  vig_BR_a: {bottom: -260, right: -260, width: 360, height: 360},
  vig_BR_b: {bottom: -320, right: -320, width: 480, height: 480},
  vig_BR_c: {bottom: -400, right: -400, width: 640, height: 640},
});
