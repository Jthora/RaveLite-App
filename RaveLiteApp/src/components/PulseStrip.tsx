/**
 * PulseStrip — small status line above the Now hero card.
 *
 * Renders "● Pulse fired Nm ago" while a recent pulse is in window.
 * Self-ticking once per minute so the elapsed text stays fresh without
 * NowPanel having to manage a timer. Returns null when there's no
 * recent pulse so the layout collapses gracefully.
 */
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {
  getRecentPulse,
  RECENT_PULSE_WINDOW_MS,
} from '../domain/journal/lastPulse';
import type {ElementId} from '../theme/elements';
import {palette, radius, spacing} from '../theme';

interface Props {
  element: ElementId;
  /** Bump this from the parent when a pulse just fired locally
   *  (e.g. user tapped Test Pulse) so the strip refreshes immediately. */
  refreshKey?: number;
}

export function PulseStrip({element, refreshKey}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Re-read on element switch / external bump.
  const pulse = getRecentPulse(element, now);

  // Read refreshKey to satisfy linter — its value is unused, only the
  // identity change matters for the surrounding effect/render cycle.
  void refreshKey;

  if (!pulse) {return null;}

  const ageMs = now - pulse.at;
  const label = formatAge(ageMs);
  const fadingOut = ageMs > RECENT_PULSE_WINDOW_MS * 0.75;

  return (
    <View style={[styles.row, fadingOut && styles.fading]}>
      <View style={[styles.dot, {backgroundColor: accentFor(element)}]} />
      <Text style={[styles.text, {color: accentFor(element)}]}>
        Pulse fired {label} ago
      </Text>
    </View>
  );
}

function formatAge(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes === 0) {return 'just now';}
  if (minutes === 1) {return '1m';}
  return `${minutes}m`;
}

// Local accent map — avoids importing ELEMENTS just for one color.
const ACCENTS: Record<ElementId, string> = {
  fire: '#FF8A3D',
  air: '#FFF275',
  earth: '#7CF59E',
  water: '#5DBBFF',
  heart: '#C6FF00',
};
function accentFor(element: ElementId): string {
  return ACCENTS[element];
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: '#0A0C10',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    alignSelf: 'flex-start',
  },
  fading: {opacity: 0.55},
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
