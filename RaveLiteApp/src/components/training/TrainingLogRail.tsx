/**
 * TrainingLogRail — compact landscape sidebar surface.
 *
 * Shown on the right edge of the Always-On panel when the device is
 * in landscape on a tablet. Surfaces:
 *   - Headline 30-day best (3-mi-equivalent grade or kind PB).
 *   - Today's logged-entry count.
 *   - "+ Log Entry" CTA that opens the full TrainingLogSheet.
 *   - Last 3 entries (very compact rows) for quick context.
 *
 * Tapping the headline or any entry opens the same sheet pre-loaded
 * for edit, mirroring the full panel's interaction.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {palette, radius, spacing, type as t} from '../../theme';
import {ELEMENTS} from '../../theme/elements';
import {useElementAccent} from '../../theme/elementContext';
import {
  formatEntryValue,
  gradeForRun,
  localDayKey,
} from '../../domain/training/grading';
import {
  getMetric,
  loadEntries,
  loadMetrics,
  subscribeTrainingLog,
} from '../../domain/training/repository';
import {MetricKind, TrainingLogEntry} from '../../domain/training/types';
import {TrainingLogSheet} from './TrainingLogSheet';
import {MS_PER_DAY} from '../../lib/constants';

const PANEL_WIDTH = 280;

export function TrainingLogRail() {
  const accent = useElementAccent();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeTrainingLog(() => setTick(x => x + 1)), []);

  const entries = useMemo(loadEntries, [tick]);
  const metrics = useMemo(loadMetrics, [tick]);
  const headline = useMemo(() => buildHeadline(entries, metrics), [entries, metrics]);

  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing] = useState<TrainingLogEntry | undefined>();

  const todayKey = localDayKey(Date.now());
  const todayCount = entries.filter(e => localDayKey(e.at) === todayKey).length;

  const recent = entries.slice(0, 3);

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>TRAINING LOG</Text>

      {headline ? (
        <View style={styles.headline}>
          <Text style={styles.headlineKicker}>{headline.kicker}</Text>
          <Text style={[styles.headlineMain, {color: accent}]}>{headline.main}</Text>
          {headline.detail ? (
            <Text style={styles.headlineDetail} numberOfLines={2}>
              {headline.detail}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.headline}>
          <Text style={styles.headlineDetail}>
            Tap “+ Log Entry” to begin tracking runs, pushups, plank, etc.
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => {
          setEditing(undefined);
          setShowSheet(true);
        }}
        style={[styles.cta, {backgroundColor: accent}]}
        android_ripple={{color: '#ffffff20'}}>
        <Text style={styles.ctaText}>+ Log Entry</Text>
      </Pressable>

      <Text style={styles.todayLine}>
        {todayCount === 0
          ? 'No entries today'
          : `${todayCount} entr${todayCount === 1 ? 'y' : 'ies'} today`}
      </Text>

      {recent.length > 0 && (
        <View style={styles.recent}>
          <Text style={styles.sectionLabel}>RECENT</Text>
          {recent.map(e => {
            const k = getMetric(e.kindId);
            if (!k) return null;
            return (
              <Pressable
                key={e.id}
                onPress={() => {
                  setEditing(e);
                  setShowSheet(true);
                }}
                style={styles.recentRow}>
                <Text style={styles.recentLabel} numberOfLines={1}>
                  {k.label}
                </Text>
                <Text style={styles.recentValue}>{formatEntryValue(e, k)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <TrainingLogSheet
        visible={showSheet}
        editing={editing}
        onClose={() => {
          setShowSheet(false);
          setEditing(undefined);
        }}
      />
    </View>
  );
}

interface Headline {
  kicker: string;
  main: string;
  detail?: string;
}

function buildHeadline(
  entries: TrainingLogEntry[],
  metrics: MetricKind[],
): Headline | undefined {
  const THIRTY = 30 * MS_PER_DAY;
  const cutoff = Date.now() - THIRTY;
  let best: ReturnType<typeof gradeForRun> | undefined;
  let bestKind: MetricKind | undefined;
  let bestEntry: TrainingLogEntry | undefined;
  for (const e of entries) {
    if (e.at < cutoff) continue;
    const k = metrics.find(m => m.id === e.kindId) ?? getMetric(e.kindId);
    if (!k) continue;
    const dist =
      k.inputMode === 'mmss' && k.defaultDistanceMeters
        ? k.defaultDistanceMeters
        : k.inputMode === 'distance-time'
          ? e.distanceMeters
          : undefined;
    if (!dist) continue;
    const g = gradeForRun(dist, e.value);
    if (!g) continue;
    if (!best || g.equivalent3MiSeconds < best.equivalent3MiSeconds) {
      best = g;
      bestKind = k;
      bestEntry = e;
    }
  }
  if (best && bestKind && bestEntry) {
    return {
      kicker: 'BEST 3 MI EQUIV (30 D)',
      main: `${best.grade} · ${mmss(best.equivalent3MiSeconds)}`,
      detail: `from ${bestKind.label} · ${formatEntryValue(bestEntry, bestKind)}`,
    };
  }
  return undefined;
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const TRAINING_LOG_RAIL_WIDTH = PANEL_WIDTH;

const styles = StyleSheet.create({
  root: {
    width: PANEL_WIDTH,
    padding: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: palette.border,
    backgroundColor: palette.bg,
  },
  kicker: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
  },
  headline: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  headlineKicker: {
    ...t.caption,
    color: palette.textDim,
    marginBottom: spacing.xs,
  },
  headlineMain: {
    ...t.title,
    color: ELEMENTS.heart.color,
  },
  headlineDetail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  cta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: ELEMENTS.heart.color,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  todayLine: {
    ...t.caption,
    color: palette.textDim,
    textAlign: 'center',
  },
  recent: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  recentLabel: {
    ...t.caption,
    color: palette.text,
    flex: 1,
  },
  recentValue: {
    ...t.caption,
    color: palette.textDim,
    fontVariant: ['tabular-nums'],
  },
});
