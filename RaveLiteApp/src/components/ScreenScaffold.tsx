/**
 * ScreenScaffold — minimal per-element wrapper.
 *
 * What it provides:
 *   - SafeAreaView (top-edge inset)
 *   - AliveAura: the element's radial glow, breathing on the shared alive
 *     clock, plus corner vignettes (atmosphere — absolute-positioned, costs
 *     no layout space, always behind content)
 *   - Element-wash on focus: a brief color-bloom (drawn by the root
 *     CueWash) that signals "you've entered this house" + a haptic
 *     fingerprint
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
 */
import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ElementIdentity} from '../theme/elements';
import {palette, spacing} from '../theme';
import {useLayout} from '../hooks/useLayout';
import {washWith} from '../lib/aliveClock';
import {pulseHaptic} from '../lib/elementHaptics';
import {AliveAura} from './alive/AliveAura';

interface Props {
  element: ElementIdentity;
  children?: React.ReactNode;
}

export const ScreenScaffold: React.FC<Props> = ({element, children}) => {
  const layout = useLayout();
  const tablet = layout.isTablet;

  // Entering an element's house: a brief wash in its color (drawn by the
  // root CueWash, sized by the motion budget) plus its haptic fingerprint.
  useEffect(() => {
    pulseHaptic(element.id, 'enter');
    washWith(element.color, 'enter');
  }, [element.id, element.color]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Ambient atmosphere — absolute, behind content, no layout cost. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <AliveAura color={element.color} deep={element.deep} />
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
