import React, {useMemo} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../theme/elements';
import {palette, spacing} from '../theme';
import {useAliveBreath} from '../hooks/useAlive';
import {steppedBreath} from '../lib/aliveMath';

export type ElementRailAxis = 'horizontal' | 'vertical';

interface Props {
  active: ElementId;
  onChange: (id: ElementId) => void;
  /**
   * `horizontal`: portrait — bottom dock, indicator above glyph.
   * `vertical`: landscape — right rail, indicator on inner (left) edge.
   */
  axis: ElementRailAxis;
  isTablet: boolean;
}

/** Resting opacity of the focused element's bloom. */
const BLOOM_OPACITY = 0.32;
/** Visible opacity steps per breath for the bloom. */
const BLOOM_LEVELS = 6;

/**
 * The 5-element nav rail. Portable to bottom (portrait) or right side
 * (landscape) by flipping `axis`. Visual language matches the prior
 * BottomTab implementation: bloom + 2px indicator + glyph + label.
 *
 * Heart keeps its 1.3× glyph privilege — it's the conductor.
 *
 * The focused element's bloom breathes with the shared alive clock
 * (opacity only, stepped); it holds steady when motion is resting.
 */
export function ElementRail({active, onChange, axis, isTablet}: Props) {
  const isVertical = axis === 'vertical';
  const glyphSize = isTablet ? 30 : 22;
  const labelSize = isTablet ? 13 : 11;

  const {phase, budget} = useAliveBreath();
  const bloomOpacity = useMemo(() => {
    if (budget.breathMax <= 0) {
      return BLOOM_OPACITY;
    }
    const swing = budget.breathMax * 1.5;
    return phase.interpolate(
      steppedBreath(BLOOM_OPACITY - swing, BLOOM_OPACITY + swing, BLOOM_LEVELS),
    );
  }, [phase, budget]);

  return (
    <View
      style={[
        isVertical ? styles.vRail : styles.hRail,
        isTablet && (isVertical ? styles.vRailTablet : styles.hRailTablet),
      ]}>
      {ELEMENT_ORDER.map(id => {
        const el = ELEMENTS[id];
        const focused = id === active;
        const isHeart = id === 'heart';
        const fs = isHeart ? Math.round(glyphSize * 1.3) : glyphSize;
        const tint = focused ? el.color : palette.textMuted;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={({pressed}) => [
              styles.tab,
              {opacity: pressed ? 0.7 : 1},
            ]}
            accessibilityRole="tab"
            accessibilityState={{selected: focused}}
            accessibilityLabel={el.name}>
            <View style={styles.iconWrap}>
              {focused && (
                <>
                  <Animated.View
                    style={[
                      isVertical ? styles.vBloom : styles.hBloom,
                      {backgroundColor: el.color, opacity: bloomOpacity},
                    ]}
                  />
                  <View
                    style={[
                      isVertical ? styles.vBar : styles.hBar,
                      {backgroundColor: el.color},
                    ]}
                  />
                </>
              )}
              <Text
                style={{
                  fontSize: fs,
                  lineHeight: fs + 4,
                  color: tint,
                  opacity: focused ? 1 : 0.7,
                  marginTop: 2,
                }}>
                {el.glyph}
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                {
                  fontSize: labelSize,
                  color: tint,
                  opacity: focused ? 1 : 0.85,
                },
              ]}>
              {el.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const RAIL_THICKNESS = 64;
const RAIL_THICKNESS_TABLET = 80;

const styles = StyleSheet.create({
  // ---- Horizontal (portrait, bottom) -----------------------------------
  hRail: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: RAIL_THICKNESS,
    paddingTop: 6,
    paddingBottom: 8,
  },
  hRailTablet: {height: RAIL_THICKNESS_TABLET},
  // ---- Vertical (landscape, right) -------------------------------------
  vRail: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderLeftColor: palette.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    width: RAIL_THICKNESS + 16,
    paddingHorizontal: 6,
    paddingVertical: spacing.md,
  },
  vRailTablet: {width: RAIL_THICKNESS_TABLET + 16},
  // ---- Tab cluster (shared between axes) --------------------------------
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 56,
    overflow: 'visible',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    overflow: 'visible',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // ---- Indicators -------------------------------------------------------
  // Bloom opacity comes from the alive clock (BLOOM_OPACITY at rest).
  hBloom: {
    position: 'absolute',
    top: -16,
    width: 44,
    height: 10,
    borderRadius: 5,
  },
  hBar: {
    position: 'absolute',
    top: -12,
    width: 28,
    height: 2,
    borderRadius: 1,
  },
  /** Vertical: bloom + bar live on the LEFT (inner) edge of the rail —
      the edge facing content, not the bezel. */
  vBloom: {
    position: 'absolute',
    left: -16,
    width: 10,
    height: 44,
    borderRadius: 5,
  },
  vBar: {
    position: 'absolute',
    left: -12,
    width: 2,
    height: 28,
    borderRadius: 1,
  },
});
