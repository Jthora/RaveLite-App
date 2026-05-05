/**
 * `<WelcomeBackBanner />` — one-shot strip rendered just below the
 * status bar when the operator returns from a session-long absence
 * with absorbed rows on the ribbon.
 *
 * Pure stateless renderer. The orchestrator decides whether to mount
 * it at all (computed once on mount; see `AlwaysOnPanel`). Dismissal
 * is parent-controlled.
 */
import React, {useEffect} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const AUTO_DISMISS_MS = 30_000;

export interface WelcomeBackBannerProps {
  awayMs: number;
  absorbedCount: number;
  onDismiss: () => void;
}

export function WelcomeBackBanner({
  awayMs,
  absorbedCount,
  onDismiss,
}: WelcomeBackBannerProps) {
  useEffect(() => {
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Welcome back; tap to dismiss"
      style={({pressed}) => [styles.banner, pressed && styles.bannerPressed]}
      onPress={onDismiss}>
      <Text style={styles.title}>welcome back</Text>
      <Text style={styles.body}>
        {formatAway(awayMs)} away · {absorbedCount} absorbed · tap any to log
      </Text>
    </Pressable>
  );
}

function formatAway(ms: number): string {
  const totalMin = Math.max(1, Math.floor(ms / 60_000));
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  return `${totalMin}m`;
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: ELEMENTS.heart.accent,
    backgroundColor: palette.surface,
  },
  bannerPressed: {
    opacity: 0.6,
  },
  title: {
    ...t.caption,
    color: ELEMENTS.heart.accent,
    letterSpacing: 1.4,
  },
  body: {
    ...t.body,
    color: palette.text,
    marginTop: 2,
  },
});

export const __test = {formatAway};
