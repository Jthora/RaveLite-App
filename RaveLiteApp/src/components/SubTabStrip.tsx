import React, {useCallback, useEffect, useRef} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
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
 * Scroll offset that centers a tab (its start and size along the scroll
 * axis) in the visible strip, never before the strip's start. The native
 * ScrollView clamps the far end.
 */
export function revealOffset(
  start: number,
  size: number,
  viewport: number,
): number {
  return Math.max(0, Math.round(start - (viewport - size) / 2));
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
 *
 * On a phone the tabs overflow the strip, so the active tab is scrolled
 * into view — otherwise a tab past the edge leaves no sign of where you are.
 */
export function SubTabRail<TSlug extends string>({
  tabs,
  active,
  color,
  onChange,
  axis = 'horizontal',
}: Props<TSlug>) {
  const isVertical = axis === 'vertical';
  const scrollRef = useRef<ScrollView>(null);
  const viewport = useRef(0);
  const spans = useRef(new Map<string, {start: number; size: number}>());

  const reveal = useCallback(
    (slug: string, animated: boolean) => {
      const span = spans.current.get(slug);
      if (!span || viewport.current <= 0) {
        return;
      }
      const offset = revealOffset(span.start, span.size, viewport.current);
      scrollRef.current?.scrollTo(
        isVertical ? {y: offset, animated} : {x: offset, animated},
      );
    },
    [isVertical],
  );

  useEffect(() => {
    reveal(active, true);
  }, [active, reveal]);

  // Layout events arrive in no fixed order; whichever lands last reveals.
  const onViewportLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    viewport.current = isVertical ? height : width;
    reveal(active, false);
  };

  const onTabLayout = (slug: TSlug) => (e: LayoutChangeEvent) => {
    const {x, y, width, height} = e.nativeEvent.layout;
    spans.current.set(
      slug,
      isVertical ? {start: y, size: height} : {start: x, size: width},
    );
    if (slug === active) {
      reveal(slug, false);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal={!isVertical}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      onLayout={onViewportLayout}
      contentContainerStyle={isVertical ? styles.colContent : styles.rowContent}
      style={isVertical ? styles.vRail : styles.hRail}>
      {tabs.map(({slug, label, Icon}) => {
        const focused = slug === active;
        return (
          <Pressable
            key={slug}
            onPress={() => onChange(slug)}
            onLayout={onTabLayout(slug)}
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
  /** A ScrollView grows by default (flexGrow: 1). In the portrait column it
      split the screen height with the content below, floating the tabs
      mid-screen; pin the strip to its own content height. */
  hRail: {
    flexGrow: 0,
    flexShrink: 0,
  },
  rowContent: {
    paddingHorizontal: spacing.lg,
    /* Room for the bloom (top: -10) — a horizontal ScrollView clips it. */
    paddingTop: spacing.md,
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
