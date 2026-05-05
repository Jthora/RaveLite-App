import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {palette, radius, spacing} from '../theme';

export interface SubTab<TSlug extends string = string> {
  slug: TSlug;
  label: string;
  Icon: LucideIcon;
}

export type SubTabAxis = 'horizontal' | 'vertical';

interface Props<TSlug extends string> {
  /** All sub-tabs to render, in order. */
  tabs: ReadonlyArray<SubTab<TSlug>>;
  /** Currently active slug. */
  active: TSlug;
  /** Element accent color — drives the active indicator + bloom. */
  color: string;
  onChange: (slug: TSlug) => void;
  /**
   * Layout axis.
   * - `horizontal`: portrait — strip at top of screen, bloom/bar above tab.
   * - `vertical`: landscape — left rail, bloom/bar on inner (right) edge.
   * Defaults to `horizontal` for backward compatibility.
   */
  axis?: SubTabAxis;
}

/**
 * Sub-tab rail used at the top (portrait) or left side (landscape) of an
 * element screen.
 *
 * Mirrors the bottom element rail's visual language: when active, a tab
 * gets a bloom (soft wide rectangle of element color) plus a sharp 2px
 * indicator bar adjacent to the icon+label cluster. Inactive tabs are
 * quiet.
 *
 * Lucide icons render at 18px (active) / 16px (inactive) — small enough
 * that this rail doesn't fight the hero card for attention.
 */
export function SubTabRail<TSlug extends string>({
  tabs,
  active,
  color,
  onChange,
  axis = 'horizontal',
}: Props<TSlug>) {
  const isVertical = axis === 'vertical';
  return (
    <ScrollView
      horizontal={!isVertical}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={isVertical ? styles.colContent : styles.rowContent}
      style={isVertical ? styles.vRail : undefined}>
      {tabs.map(({slug, label, Icon}) => {
        const focused = slug === active;
        return (
          <Pressable
            key={slug}
            onPress={() => onChange(slug)}
            style={({pressed}) => [
              isVertical ? styles.vTab : styles.hTab,
              {opacity: pressed ? 0.7 : 1},
            ]}>
            {focused && (
              <>
                <View
                  style={[
                    isVertical ? styles.vBloom : styles.hBloom,
                    {backgroundColor: color},
                  ]}
                />
                <View
                  style={[
                    isVertical ? styles.vBar : styles.hBar,
                    {backgroundColor: color},
                  ]}
                />
              </>
            )}
            <Icon
              size={focused ? 18 : 16}
              color={focused ? color : palette.textMuted}
              strokeWidth={focused ? 2.25 : 2}
            />
            <Text
              style={[
                styles.label,
                {
                  color: focused ? color : palette.textMuted,
                  opacity: focused ? 1 : 0.85,
                },
              ]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Backward-compat alias — older call sites use `<SubTabStrip ... />`. */
export const SubTabStrip = SubTabRail;

const styles = StyleSheet.create({
  // ---- Horizontal (portrait, top) ---------------------------------------
  rowContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  /** overflow:visible so the bloom + indicator bar above the tab content
      aren't clipped. Same trick as the bottom element rail. */
  hTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    overflow: 'visible',
  },
  hBloom: {
    position: 'absolute',
    top: -10,
    left: -2,
    right: -2,
    height: 8,
    borderRadius: 4,
    opacity: 0.32,
  },
  hBar: {
    position: 'absolute',
    top: -8,
    left: 4,
    right: 4,
    height: 2,
    borderRadius: 1,
  },
  // ---- Vertical (landscape, left rail) ----------------------------------
  /** Container width is fixed so the rail doesn't fight content for space. */
  vRail: {
    width: 88,
    flexGrow: 0,
  },
  colContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    gap: spacing.lg,
    alignItems: 'center',
  },
  /** Vertical tab stacks icon over label, centered. Bloom/indicator are
      anchored to the RIGHT edge — the inner edge facing content — so the
      focus marker points into the screen, not into the bezel. */
  vTab: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    overflow: 'visible',
    minWidth: 64,
  },
  vBloom: {
    position: 'absolute',
    right: -10,
    top: -2,
    bottom: -2,
    width: 8,
    borderRadius: 4,
    opacity: 0.32,
  },
  vBar: {
    position: 'absolute',
    right: -8,
    top: 4,
    bottom: 4,
    width: 2,
    borderRadius: 1,
  },
  // ---- Shared -----------------------------------------------------------
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

// Re-export common palette tokens used by callers (avoid extra imports).
export {radius};
