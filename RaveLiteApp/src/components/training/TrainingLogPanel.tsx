import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {palette, radius, spacing, type as typeTokens} from '../../theme';
import {ELEMENTS} from '../../theme/elements';
import {useElementAccent} from '../../theme/elementContext';
import {
  bestEntry,
  formatEntryValue,
  formatPace,
  gradeForRun,
  localDayKey,
} from '../../domain/training/grading';
import {
  loadEntries,
  loadEntriesForElement,
  loadMetrics,
  loadMetricsForElement,
  getMetric,
  subscribeTrainingLog,
} from '../../domain/training/repository';
import {MetricKind, TrainingLogEntry} from '../../domain/training/types';
import {TrainingLogSheet} from './TrainingLogSheet';
import {MS_PER_DAY} from '../../lib/constants';
import type {ElementId} from '../../theme/elements';

interface Props {
  /** When true, render in compact one-column mode (e.g. portrait). */
  compact?: boolean;
  /** When set, the panel scopes to a single element — title becomes
   *  e.g. "Fire — Training", and the catalog/entries are filtered. */
  element?: ElementId;
}

const ELEMENT_EMPTY: Record<ElementId, {title: string; body: string}> = {
  fire: {
    title: 'No runs logged yet.',
    body: 'Burn the cage. The B+ goal is 3 mi ≤ 21:00 (7 min/mi).',
  },
  air: {
    title: 'No breath work logged yet.',
    body: 'Crack the seal. Hold to first contraction — that’s the read.',
  },
  water: {
    title: 'No flows logged yet.',
    body: 'Move the water. Every CAR you log is range you keep.',
  },
  earth: {
    title: 'No holds logged yet.',
    body: 'Set the column. Posture is the first weight.',
  },
  heart: {
    title: 'No entries yet',
    body: 'Tap “+ Log Entry” to record your first session.',
  },
};

/**
 * The Training Log surface — header CTA, headline progress, and the
 * recent-entries list. Entries are tappable for edit; long-press
 * deletes via a confirm in the edit sheet.
 *
 * Headline progress prioritizes runs:
 *   - Best 3-mi-equivalent grade (rolling 30 days) across all run kinds.
 *   - Personal best by kind (rolling 30 d) for the most-logged kind.
 *
 * Falls back to "no runs logged yet" copy when empty.
 */
export function TrainingLogPanel({compact, element}: Props) {
  const accent = useElementAccent();
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeTrainingLog(() => setTick(t => t + 1)), []);

  const entries = useMemo(
    () => (element ? loadEntriesForElement(element) : loadEntries()),
    [tick, element],
  );
  const metrics = useMemo(
    () => (element ? loadMetricsForElement(element) : loadMetrics()),
    [tick, element],
  );

  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing] = useState<TrainingLogEntry | undefined>();

  const headline = useMemo(() => buildHeadline(entries, metrics), [entries, metrics]);
  const grouped = useMemo(() => groupByDay(entries), [entries]);
  const elName = element ? ELEMENTS[element].name : undefined;
  const title = elName ? `${elName} — Training` : 'Training Log';
  const empty = element ? ELEMENT_EMPTY[element] : ELEMENT_EMPTY.heart;

  return (
    <ScrollView
      style={{flex: 1}}
      contentContainerStyle={[styles.root, compact && styles.rootCompact]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          style={[styles.addBtn, {backgroundColor: accent}]}
          onPress={() => {
            setEditing(undefined);
            setShowSheet(true);
          }}
          android_ripple={{color: '#ffffff20'}}>
          <Text style={styles.addBtnText}>+ Log Entry</Text>
        </Pressable>
      </View>

      {/* Headline progress card */}
      {headline && (
        <View style={styles.headline}>
          <Text style={styles.headlineKicker}>{headline.kicker}</Text>
          <Text style={[styles.headlineMain, {color: accent}]}>{headline.main}</Text>
          {headline.detail ? (
            <Text style={styles.headlineDetail}>{headline.detail}</Text>
          ) : null}
        </View>
      )}

      {/* Empty state */}
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{empty.title}</Text>
          <Text style={styles.emptyBody}>{empty.body}</Text>
        </View>
      ) : (
        <View style={{gap: spacing.md}}>
          {grouped.map(group => (
            <View key={group.dayKey} style={styles.dayGroup}>
              <Text style={styles.dayHeader}>{group.dayLabel}</Text>
              {group.entries.map(e => {
                const k = getMetric(e.kindId);
                if (!k) return null;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => {
                      setEditing(e);
                      setShowSheet(true);
                    }}
                    style={styles.entryRow}
                    android_ripple={{color: '#ffffff10'}}>
                    <View style={{flex: 1}}>
                      <Text style={styles.entryLabel}>{k.label}</Text>
                      {e.notes ? (
                        <Text style={styles.entryNotes} numberOfLines={1}>
                          {e.notes}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.entryValue}>
                        {formatEntryValue(e, k)}
                      </Text>
                      {renderEntrySub(e, k)}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <TrainingLogSheet
        visible={showSheet}
        editing={editing}
        defaultElement={element}
        onClose={() => {
          setShowSheet(false);
          setEditing(undefined);
        }}
      />
    </ScrollView>
  );
}

function renderEntrySub(entry: TrainingLogEntry, kind: MetricKind) {
  if (kind.inputMode === 'mmss' && kind.defaultDistanceMeters) {
    const grade = gradeForRun(kind.defaultDistanceMeters, entry.value);
    if (!grade) return null;
    return (
      <Text style={styles.entrySub}>
        {grade.grade} · {formatPace(kind.defaultDistanceMeters, entry.value)}
      </Text>
    );
  }
  if (kind.inputMode === 'distance-time' && entry.distanceMeters) {
    const grade = gradeForRun(entry.distanceMeters, entry.value);
    if (!grade) {
      return (
        <Text style={styles.entrySub}>
          {formatPace(entry.distanceMeters, entry.value)}
        </Text>
      );
    }
    return (
      <Text style={styles.entrySub}>
        {grade.grade} · {formatPace(entry.distanceMeters, entry.value)}
      </Text>
    );
  }
  return null;
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
  // Find the best run grade in last 30 days across all distance-bearing kinds.
  const THIRTY = 30 * MS_PER_DAY;
  const cutoff = Date.now() - THIRTY;
  let bestGrade: ReturnType<typeof gradeForRun> | undefined;
  let bestKind: MetricKind | undefined;
  let bestEntryRef: TrainingLogEntry | undefined;
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
    if (!bestGrade || g.equivalent3MiSeconds < bestGrade.equivalent3MiSeconds) {
      bestGrade = g;
      bestKind = k;
      bestEntryRef = e;
    }
  }
  if (bestGrade && bestKind && bestEntryRef) {
    return {
      kicker: 'BEST 3 MI EQUIV (30 D)',
      main: `${bestGrade.grade} · ${mmss(bestGrade.equivalent3MiSeconds)}`,
      detail: `from ${bestKind.label} · ${formatEntryValue(bestEntryRef, bestKind)}`,
    };
  }
  // Fallback: most-logged kind's best in 30 d.
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.kindId, (counts.get(e.kindId) ?? 0) + 1);
  let topKindId: string | undefined;
  let topCount = 0;
  for (const [id, c] of counts) {
    if (c > topCount) {
      topCount = c;
      topKindId = id;
    }
  }
  if (!topKindId) return undefined;
  const kind = metrics.find(m => m.id === topKindId) ?? getMetric(topKindId);
  if (!kind) return undefined;
  const best = bestEntry(entries, topKindId, kind, THIRTY);
  if (!best) return undefined;
  return {
    kicker: `BEST ${kind.label.toUpperCase()} (30 D)`,
    main: formatEntryValue(best, kind),
    detail: `${topCount} entr${topCount === 1 ? 'y' : 'ies'} logged`,
  };
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface DayGroup {
  dayKey: string;
  dayLabel: string;
  entries: TrainingLogEntry[];
}

function groupByDay(entries: TrainingLogEntry[]): DayGroup[] {
  const map = new Map<string, TrainingLogEntry[]>();
  for (const e of entries) {
    const k = localDayKey(e.at);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  }
  const out: DayGroup[] = [];
  const today = localDayKey(Date.now());
  const yesterday = localDayKey(Date.now() - MS_PER_DAY);
  for (const [k, list] of map) {
    out.push({
      dayKey: k,
      dayLabel:
        k === today
          ? 'Today'
          : k === yesterday
            ? 'Yesterday'
            : new Date(list[0].at).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
      entries: list.sort((a, b) => b.at - a.at),
    });
  }
  return out.sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1));
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  rootCompact: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typeTokens.title,
    color: palette.text,
  },
  addBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: ELEMENTS.heart.color,
    minHeight: 44,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  headline: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
  },
  headlineKicker: {
    ...typeTokens.caption,
    color: palette.textDim,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  headlineMain: {
    ...typeTokens.display,
    color: ELEMENTS.heart.color,
  },
  headlineDetail: {
    ...typeTokens.body,
    color: palette.textDim,
    marginTop: spacing.xs,
  },
  empty: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typeTokens.subtitle,
    color: palette.text,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    ...typeTokens.body,
    color: palette.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  dayGroup: {
    gap: spacing.xs,
  },
  dayHeader: {
    ...typeTokens.caption,
    color: palette.textDim,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    minHeight: 56,
    gap: spacing.md,
  },
  entryLabel: {
    ...typeTokens.subtitle,
    color: palette.text,
  },
  entryNotes: {
    ...typeTokens.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  entryValue: {
    ...typeTokens.subtitle,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  entrySub: {
    ...typeTokens.caption,
    color: palette.textDim,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
