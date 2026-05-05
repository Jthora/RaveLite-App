/**
 * Shared sub-page renderer for Fire / Air / Earth / Water.
 *
 * One dispatcher + five small panel components. Each non-Heart element
 * screen mounts this with its own `ELEMENTS[id]`, and the shell drives
 * the active sub-tab via the `subTab` prop.
 *
 * Heart has its own sub-page set (Dash/Plan/Circuits/Signal/Insights)
 * and lives in `HeartScreen.tsx`. This file is shared shape only.
 */

import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {CardGrid} from '../../components/CardGrid';
import {ExerciseRow} from '../../components/ExerciseRow';
import {MiniSparkline} from '../../components/MiniSparkline';
import {PulseStrip} from '../../components/PulseStrip';
import {Tap} from '../../components/Tap';
import {
  TargetFilterStrip,
} from '../../components/TargetFilterStrip';

import type {ElementIdentity} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

import {exercisesFor} from '../../domain/exercises/library';
import type {Exercise, Target} from '../../domain/exercises/types';
import {
  alternateDrillsFor,
  pickDrillFor,
  type DrillContext,
} from '../../domain/exercises/scoring';

import {
  completionsByDayForElement,
  completionsTodayEntriesForElement,
  completionsTodayForElement,
  completionsTodayByElement,
  currentStreakDaysForElement,
} from '../../domain/journal/stats';
import {
  applyPreset,
  getElementPrefs,
  resetElementPrefs,
  setElementPrefs,
  type ElementPrefs,
  type SignalPreset,
} from '../../domain/settings/elementPrefs';
import {recordCompletion} from '../../domain/journal/recordCompletion';
import {pulseHaptic} from '../../lib/elementHaptics';
import {ELEMENTS, ELEMENT_ORDER} from '../../theme/elements';
import {ElementProvider} from '../../theme/elementContext';
import {TrainingLogPanel} from '../../components/training/TrainingLogPanel';

export type ElementSubSlug = 'now' | 'drills' | 'log' | 'stats' | 'tune' | 'train';

interface Props {
  element: ElementIdentity;
  subTab: string;
  onSubTabChange: (slug: string) => void;
}

export function ElementSubPages({element, subTab, onSubTabChange}: Props) {
  return (
    <ElementProvider element={element}>
      {renderSubPage({element, subTab, onSubTabChange})}
    </ElementProvider>
  );
}

function renderSubPage({element, subTab, onSubTabChange}: Props) {
  switch (subTab) {
    case 'now':
      return (
        <NowPanel
          element={element}
          onOpenLibrary={() => onSubTabChange('drills')}
        />
      );
    case 'drills':
      return <DrillsPanel element={element} />;
    case 'train':
      return <TrainingLogPanel />;
    case 'log':
      return (
        <LogPanel element={element} onJumpElement={onSubTabChange} />
      );
    case 'stats':
      return <StatsPanel element={element} />;
    case 'tune':
      return <TunePanel element={element} />;
    default:
      return <DrillsPanel element={element} />;
  }
}

// ─── NowPanel ───────────────────────────────────────────────────────────

interface NowProps {
  element: ElementIdentity;
  onOpenLibrary: () => void;
}

function buildContext(
  element: ElementIdentity,
  prefs: ElementPrefs,
): DrillContext {
  const todayEntries = completionsTodayEntriesForElement(element.id);
  return {
    element: element.id,
    hour: new Date().getHours(),
    loggedTodayIds: new Set(todayEntries.map(e => e.exerciseId)),
    preferredTargets: prefs.focusTargets,
    recentPickIds: todayEntries.slice(0, 5).map(e => e.exerciseId),
  };
}

function NowPanel({element, onOpenLibrary}: NowProps) {
  const [prefs] = useState(() => getElementPrefs(element.id));
  const [swapTick, setSwapTick] = useState(0);
  const [showAlternates, setShowAlternates] = useState(false);

  // Re-evaluate hero pick on swap. Variety pressure pushes recent picks
  // down, so each swap should yield a fresh face.
  const hero = useMemo(
    () => pickDrillFor(buildContext(element, prefs)),
    // swapTick re-runs the memo; recent journal entries also matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [element.id, swapTick, prefs.focusTargets.join(',')],
  );

  const alternates = useMemo(
    () =>
      alternateDrillsFor(buildContext(element, prefs), 3) as Exercise[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [element.id, swapTick, prefs.focusTargets.join(',')],
  );

  if (!hero) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No drills wired for {element.name} yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <PulseStrip element={element.id} refreshKey={swapTick} />
      <View
        style={[
          styles.heroCard,
          {borderColor: element.accent, backgroundColor: '#0E1015'},
        ]}>
        <Text style={[styles.eyebrow, {color: element.accent}]}>
          {element.glyph}  NOW · {element.name.toUpperCase()}
        </Text>
        <Text style={styles.heroName}>{hero.name}</Text>
        <Text style={styles.heroDose}>{hero.dose}</Text>
        <Text style={styles.heroPurpose}>{hero.purpose}</Text>
        {hero.cues && hero.cues.length > 0 && (
          <View style={styles.cueList}>
            {hero.cues.slice(0, 3).map((c, i) => (
              <Text key={i} style={styles.cue}>
                ◦  {c}
              </Text>
            ))}
          </View>
        )}
        <View style={styles.heroBtnRow}>
          <Tap
            variant="solid"
            color={element.color}
            onPress={() => {
              recordCompletion(hero, 'manual');
              pulseHaptic(element.id, 'seal');
              setSwapTick(n => n + 1);
            }}
            style={styles.btnFlex}>
            <Text style={styles.btnText}>{element.verbDone}</Text>
          </Tap>
          <Tap
            variant="ghost"
            color={element.accent}
            onPress={() => setSwapTick(n => n + 1)}
            style={styles.btnFlex}>
            <Text style={[styles.btnText, {color: element.accent}]}>
              ↻ Swap
            </Text>
          </Tap>
        </View>
      </View>

      <Tap
        variant="plain"
        color={element.accent}
        onPress={() => setShowAlternates(s => !s)}
        style={styles.alternatesToggle}>
        <Text style={[styles.alternatesToggleText, {color: palette.textDim}]}>
          {showAlternates ? '▾  hide alternates' : '▸  show 3 alternates'}
        </Text>
      </Tap>
      {showAlternates && (
        <CardGrid>
          {alternates.map(ex => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onCompleted={() => setSwapTick(n => n + 1)}
            />
          ))}
        </CardGrid>
      )}

      <Tap
        variant="plain"
        color={element.accent}
        onPress={onOpenLibrary}
        style={styles.linkRow}>
        <Text style={[styles.linkText, {color: element.accent}]}>
          See full library →
        </Text>
      </Tap>
    </View>
  );
}

// ─── DrillsPanel ────────────────────────────────────────────────────────

interface DrillsProps {
  element: ElementIdentity;
}

function DrillsPanel({element}: DrillsProps) {
  const all = useMemo(() => exercisesFor(element.id), [element.id]);
  // Default filter = saved focusTargets for this element.
  const [filter, setFilter] = useState<Target[]>(
    () => [...getElementPrefs(element.id).focusTargets],
  );

  const filtered = useMemo(() => {
    if (filter.length === 0) {return all;}
    return all.filter(ex => ex.targets.some(t => filter.includes(t)));
  }, [all, filter]);

  return (
    <View style={styles.body}>
      <TargetFilterStrip
        active={filter}
        onChange={setFilter}
        color={element.color}
      />
      <Text style={styles.metaLine}>
        {filtered.length} of {all.length} {element.name.toLowerCase()} drills
        {filter.length > 0 ? ` · ${filter.length} focus area${filter.length === 1 ? '' : 's'}` : ''}
      </Text>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No drills match this focus combo. Drop a pill or two.
          </Text>
        </View>
      ) : (
        <CardGrid>
          {filtered.map(ex => (
            <ExerciseRow key={ex.id} exercise={ex} />
          ))}
        </CardGrid>
      )}
    </View>
  );
}

// ─── LogPanel ───────────────────────────────────────────────────────────

interface LogProps {
  element: ElementIdentity;
  /** Sub-tab change handler — used by element cross-references in the
   *  footer. We can only switch sub-tabs within the current element from
   *  here; to jump to ANOTHER element's log, the shell would need to do
   *  it. So the footer currently shows counts only, no jump. */
  onJumpElement: (slug: string) => void;
}

const ELEMENT_EMPTY: Record<string, string> = {
  fire: 'No fire today. Time to burn the cage.',
  air: 'Breath untouched. Crack the seal.',
  earth: 'Frame not set today.',
  water: 'Flow hasn’t moved today.',
  heart: 'No conductor pulses today.',
};

function LogPanel({element}: LogProps) {
  const entries = useMemo(
    () => completionsTodayEntriesForElement(element.id),
    [element.id],
  );
  const allLib = useMemo(() => exercisesFor(element.id), [element.id]);
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const ex of allLib) {m.set(ex.id, ex.name);}
    return m;
  }, [allLib]);
  const byElement = useMemo(() => completionsTodayByElement(), [
    // recompute on element switch — cheap.
    element.id,
  ]);

  return (
    <View style={styles.body}>
      <Text style={[styles.metaLine, {color: element.accent}]}>
        {entries.length} sealed today · {element.name}
      </Text>
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{ELEMENT_EMPTY[element.id]}</Text>
        </View>
      ) : (
        <View style={styles.logList}>
          {entries.map(e => (
            <View key={e.id} style={styles.logRow}>
              <Text style={[styles.logTime, {color: element.accent}]}>
                {fmtTime(e.at)}
              </Text>
              <View style={styles.logBody}>
                <Text style={styles.logName}>
                  {nameById.get(e.exerciseId) ?? e.exerciseId}
                </Text>
                <Text style={styles.logSource}>
                  {sourceLabel(e.source)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Cross-element awareness — quiet footer line. */}
      <View style={styles.crossRow}>
        {ELEMENT_ORDER.filter(id => id !== element.id).map(id => {
          const el = ELEMENTS[id];
          const count = byElement[id] ?? 0;
          return (
            <View key={id} style={styles.crossCell}>
              <Text style={[styles.crossGlyph, {color: el.color}]}>
                {el.glyph}
              </Text>
              <Text style={styles.crossCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function sourceLabel(s: 'manual' | 'notification' | 'auto'): string {
  if (s === 'notification') {return 'pulse';}
  if (s === 'auto') {return 'circuit';}
  return 'manual';
}

// ─── StatsPanel ─────────────────────────────────────────────────────────

interface StatsProps {
  element: ElementIdentity;
}

function StatsPanel({element}: StatsProps) {
  const today = completionsTodayForElement(element.id);
  const last14 = useMemo(
    () => completionsByDayForElement(element.id, 14),
    [element.id],
  );
  const sevenDay = last14.slice(-7).reduce((a, b) => a + b, 0);
  const streak = currentStreakDaysForElement(element.id);
  const prefs = getElementPrefs(element.id);

  return (
    <View style={styles.body}>
      <View style={styles.statRow}>
        <StatTile label="Today" value={today} accent={element.color} />
        <StatTile label="7-day" value={sevenDay} accent={element.color} />
        <StatTile label="Streak" value={streak} accent={element.color} suffix="d" />
      </View>
      <Text style={[styles.metaLine, {marginTop: spacing.lg}]}>
        Last 14 days · target {prefs.dailyTarget}/day
      </Text>
      <View style={styles.sparkWrap}>
        <MiniSparkline
          data={last14}
          dailyTarget={prefs.dailyTarget}
          color={element.color}
        />
      </View>
    </View>
  );
}

function StatTile({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, {color: accent}]}>
        {value}
        {suffix ? <Text style={styles.statSuffix}>{suffix}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── TunePanel ──────────────────────────────────────────────────────────

interface TuneProps {
  element: ElementIdentity;
}

const PRESETS: ReadonlyArray<{
  id: SignalPreset;
  label: string;
  desc: string;
}> = [
  {id: 'stealth', label: 'Stealth', desc: 'Low haptic. Silent operator.'},
  {id: 'standard', label: 'Standard', desc: 'High haptic. Banners on.'},
  {id: 'beacon', label: 'Beacon', desc: 'Loud. Sound + banners + haptic.'},
];

function TunePanel({element}: TuneProps) {
  const [prefs, setPrefs] = useState<ElementPrefs>(() =>
    getElementPrefs(element.id),
  );

  const update = (patch: Partial<ElementPrefs>) =>
    setPrefs(setElementPrefs(element.id, patch));

  const handlePreset = (p: SignalPreset) => setPrefs(applyPreset(element.id, p));
  const handleReset = () => setPrefs(resetElementPrefs(element.id));

  const setFocus = (next: Target[]) =>
    update({focusTargets: next, focusLocked: true});

  return (
    <View style={styles.body}>
      <Text style={styles.section}>Operating mode</Text>
      <View style={styles.presetRow}>
        {PRESETS.map(p => {
          const active = prefs.preset === p.id;
          return (
            <Tap
              key={p.id}
              variant="plain"
              color={element.color}
              onPress={() => handlePreset(p.id)}
              style={[
                styles.presetTile,
                active && {borderColor: element.color, backgroundColor: '#0E1015'},
              ]}>
              <Text
                style={[
                  styles.presetLabel,
                  {color: active ? element.color : palette.text},
                ]}>
                {p.label}
              </Text>
              <Text style={styles.presetDesc}>{p.desc}</Text>
            </Tap>
          );
        })}
      </View>

      <Text style={styles.section}>Focus areas</Text>
      <Text style={styles.helperText}>
        {prefs.focusLocked
          ? 'Locked — these drive Now picks and the Drills filter default.'
          : 'Defaults shown. Toggle any pill to lock your own set.'}
      </Text>
      <TargetFilterStrip
        active={prefs.focusTargets}
        onChange={setFocus}
        color={element.color}
      />

      <Text style={styles.section}>Daily target</Text>
      <View style={styles.targetRow}>
        {[1, 2, 3, 5, 7].map(n => {
          const active = prefs.dailyTarget === n;
          return (
            <Tap
              key={n}
              variant="pill"
              color={element.color}
              onPress={() => update({dailyTarget: n})}
              style={[
                styles.targetPill,
                active && {borderColor: element.color, backgroundColor: element.color},
              ]}>
              <Text
                style={[
                  styles.targetPillText,
                  {color: active ? palette.bg : palette.textDim},
                ]}>
                {n}/day
              </Text>
            </Tap>
          );
        })}
      </View>

      <Tap
        variant="plain"
        color={palette.danger}
        onPress={handleReset}
        style={styles.resetRow}>
        <Text style={styles.resetText}>Reset {element.name} to defaults</Text>
      </Tap>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Hero (Now)
  heroCard: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroName: {
    ...t.title,
    color: palette.text,
    marginBottom: 2,
  },
  heroDose: {
    ...t.subtitle,
    color: palette.textDim,
    marginBottom: spacing.sm,
  },
  heroPurpose: {
    ...t.body,
    color: palette.text,
    lineHeight: 21,
  },
  cueList: {
    marginTop: spacing.md,
    gap: 4,
  },
  cue: {
    ...t.body,
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    flex: 1,
  },
  btnFlex: {flex: 1},
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  btnText: {
    color: palette.bg,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontSize: 14,
  },
  alternatesToggle: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  alternatesToggleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  linkRow: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Drills
  metaLine: {
    ...t.caption,
    color: palette.textDim,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },

  // Log
  logList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  logTime: {
    ...t.subtitle,
    fontVariant: ['tabular-nums'],
  },
  logBody: {flex: 1},
  logName: {
    ...t.body,
    color: palette.text,
    fontWeight: '600',
  },
  logSource: {
    ...t.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  crossRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  crossCell: {
    alignItems: 'center',
    gap: 2,
  },
  crossGlyph: {
    fontSize: 18,
  },
  crossCount: {
    ...t.caption,
    color: palette.textDim,
  },

  // Stats
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statTile: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statSuffix: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  sparkWrap: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  // Tune
  section: {
    ...t.subtitle,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  helperText: {
    ...t.caption,
    color: palette.textMuted,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: 'transparent',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  presetDesc: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 4,
    lineHeight: 16,
  },
  targetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  targetPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
  },
  targetPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resetRow: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetText: {
    ...t.caption,
    color: palette.danger,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
