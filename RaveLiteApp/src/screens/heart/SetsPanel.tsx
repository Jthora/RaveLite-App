/**
 * SetsPanel — Heart > Sets tab body.
 *
 * Today's Daily Sets at a glance, and the controls that drive the ramp:
 *   - per-track progress (amount done / quota, sets done, next chime)
 *   - "+ set" to log a set done outside a chime
 *   - max test (NumberPad) — the only thing that raises set size
 *   - level up to the next variation once the set size graduates
 *   - track on/off
 *
 * Rounds spread across My day (active hours), so there is no separate set
 * window here. All writes go through the program repository or the
 * journal; the sets scheduler picks them up (program saves re-lay the day,
 * logged sets trim upcoming rounds).
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {NumberPad} from '../../components/training/NumberPad';

import {getActiveHours} from '../../domain/ambient/activeHours';
import {reconcileSetsNow, setsToday} from '../../domain/ambient/setScheduler';
import {subscribe as subscribePulseRuntime} from '../../domain/ambient/pulseRuntime';
import {EXERCISE_LIBRARY} from '../../domain/exercises/library';
import {append, entriesForDay} from '../../domain/journal/journal';
import {doneByTrack, formatSetAmount} from '../../domain/program/progress';
import {movesOf} from '../../domain/program/rounds';
import {
  currentRung,
  isTestDue,
  phaseForWeek,
  programWeek,
  readyToLevelUp,
} from '../../domain/program/progression';
import {
  levelUpTrack,
  loadProgram,
  recordMaxTest,
  setTrackEnabled,
  subscribeProgram,
} from '../../domain/program/repository';
import {TRACKS, trackById} from '../../domain/program/tracks';
import type {DayPrescription, Track, TrackId} from '../../domain/program/types';
import {formatDuration} from '../../domain/training/grading';

import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const REFRESH_MS = 30_000;

export function SetsPanel() {
  const [tick, setTick] = useState(0);
  const [testing, setTesting] = useState<TrackId | null>(null);
  const refresh = useCallback(() => setTick(k => k + 1), []);

  useEffect(() => subscribeProgram(refresh), [refresh]);
  useEffect(() => subscribePulseRuntime(refresh), [refresh]);
  useEffect(() => {
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const view = useMemo(() => {
    const now = Date.now();
    const date = new Date(now);
    const program = loadProgram(date);
    const week = programWeek(program.startDay, date);
    return {
      date,
      program,
      week,
      phase: phaseForWeek(week),
      myDay: getActiveHours(),
      today: setsToday(now),
      done: doneByTrack(entriesForDay(date)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const {program, today, done, week, phase, date, myDay} = view;
  const accent = ELEMENTS.heart.accent;
  const setsTotal = today.prescriptions.reduce((s, p) => s + p.sets, 0);
  const setsDone = today.prescriptions.reduce(
    (s, p) => s + Math.min(p.sets, done[p.trackId]?.sets ?? 0),
    0,
  );
  const restTracks = TRACKS.filter(
    tr =>
      program.tracks[tr.id].enabled &&
      !today.prescriptions.some(p => p.trackId === tr.id),
  );

  const logSet = useCallback(
    (p: DayPrescription) => {
      const drill = EXERCISE_LIBRARY.find(e => e.id === p.exerciseId);
      append({
        kind: 'completion',
        exerciseId: p.exerciseId,
        element: p.element,
        source: 'manual',
        durationSec: drill?.approxSeconds,
        trackId: p.trackId,
        amount: p.setSize,
      });
      reconcileSetsNow();
      refresh();
    },
    [refresh],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, {color: accent}]}>
          ▸  DAILY SETS · WEEK {week} ·{' '}
          {phase === 'deload' ? 'DELOAD + TEST WEEK' : 'BUILD'}
        </Text>
        <Text style={styles.subtitle}>
          {setsDone} of {setsTotal} sets · My day {myDay.start}–{myDay.end}
        </Text>
      </View>

      <View style={styles.ruleCard}>
        <Text style={styles.ruleText}>
          Each chime is a round: a few crisp sets back to back at about half
          your max, then a short stretch. Stop two reps before it gets ugly.{' '}
          {phase === 'deload'
            ? 'Deload week: fewer sets — test your maxes while fresh.'
            : 'Sets climb weekly; a new max test is what grows each set.'}
        </Text>
      </View>

      {today.prescriptions.length === 0 ? (
        <Text style={styles.emptyText}>Rest day — no sets scheduled.</Text>
      ) : (
        today.prescriptions.map(p => {
          const track = trackById(p.trackId);
          const state = program.tracks[p.trackId];
          const d = done[p.trackId] ?? {amount: 0, sets: 0};
          const next = today.upcoming.find(f =>
            movesOf(f.prescription).some(m => m.trackId === p.trackId),
          );
          return (
            <TrackCard
              key={p.trackId}
              track={track}
              prescription={p}
              doneAmount={d.amount}
              doneSets={d.sets}
              nextAt={next?.ts}
              testDue={isTestDue(program, state, date)}
              untested={state.testedAt === undefined}
              testMax={state.testMax}
              canLevelUp={readyToLevelUp(track, state)}
              nextRungLabel={track.ladder[state.rung + 1]?.label}
              onLogSet={() => logSet(p)}
              onTest={() => setTesting(p.trackId)}
              onLevelUp={() => levelUpTrack(p.trackId)}
            />
          );
        })
      )}

      {restTracks.length > 0 ? (
        <Text style={styles.restLine}>
          Rest today: {restTracks.map(tr => tr.name).join(' · ')}
        </Text>
      ) : null}

      <Text style={styles.section}>Tracks</Text>
      {TRACKS.map(tr => {
        const state = program.tracks[tr.id];
        const el = ELEMENTS[tr.element];
        return (
          <View key={tr.id} style={styles.trackRow}>
            <View style={styles.trackInfo}>
              <Text style={[styles.trackName, {color: state.enabled ? el.color : palette.textMuted}]}>
                {el.glyph}  {tr.name} · {currentRung(tr, state).label}
              </Text>
              <Text style={styles.trackMeta}>
                max {formatMax(tr, state.testMax)}
                {state.testedAt === undefined ? ' (assumed)' : ''} ·{' '}
                {tr.days.map(dn => DAY_NAMES[dn]).join(' ')}
              </Text>
              <Text style={styles.trackWhy}>{tr.why}</Text>
            </View>
            <Tap
              variant={state.enabled ? 'solid' : 'ghost'}
              color={state.enabled ? el.color : palette.textDim}
              onPress={() => setTrackEnabled(tr.id, !state.enabled)}
              style={styles.toggle}>
              <Text style={[styles.toggleText, {color: state.enabled ? palette.bg : palette.textDim}]}>
                {state.enabled ? 'On' : 'Off'}
              </Text>
            </Tap>
          </View>
        );
      })}

      <MaxTestSheet
        trackId={testing}
        onClose={() => setTesting(null)}
        onSave={(id, value) => {
          recordMaxTest(id, value);
          setTesting(null);
        }}
      />
    </ScrollView>
  );
}

// ─── Track card ─────────────────────────────────────────────────────

interface TrackCardProps {
  track: Track;
  prescription: DayPrescription;
  doneAmount: number;
  doneSets: number;
  nextAt?: number;
  testDue: boolean;
  untested: boolean;
  testMax: number;
  canLevelUp: boolean;
  nextRungLabel?: string;
  onLogSet: () => void;
  onTest: () => void;
  onLevelUp: () => void;
}

function TrackCard({
  track,
  prescription: p,
  doneAmount,
  doneSets,
  nextAt,
  testDue,
  untested,
  testMax,
  canLevelUp,
  nextRungLabel,
  onLogSet,
  onTest,
  onLevelUp,
}: TrackCardProps) {
  const el = ELEMENTS[track.element];
  const total = p.setSize * p.sets;
  const pct = Math.min(1, total > 0 ? doneAmount / total : 0);
  const complete = doneAmount >= total;
  const unitWord = p.unit === 'seconds' ? 'sec' : 'reps';

  return (
    <View style={[styles.card, {borderColor: complete ? el.color : palette.border}]}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, {color: el.color}]} numberOfLines={1}>
          {el.glyph}  {p.label}
        </Text>
        <Text style={styles.cardCount}>
          {doneAmount}/{total} {unitWord}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, {backgroundColor: el.color, width: `${pct * 100}%`}]} />
      </View>
      <Text style={styles.cardMeta}>
        {Math.min(doneSets, p.sets)} of {p.sets} sets · {formatSetAmount(p.setSize, p.unit)} each
        {complete ? ' · done ✓' : nextAt ? ` · next ${formatHHMM(nextAt)}` : ''}
      </Text>
      {untested ? (
        <Text style={styles.cardNote}>
          Not tested yet — assuming a max of {formatMax(track, testMax)}.
        </Text>
      ) : testDue ? (
        <Text style={styles.cardNote}>Test week: log a fresh max.</Text>
      ) : null}
      <View style={styles.cardActions}>
        <Tap variant="solid" color={el.color} onPress={onLogSet} style={styles.cardBtn}>
          <Text style={styles.cardBtnSolidText}>+ set</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={testDue ? el.color : palette.textDim}
          onPress={onTest}
          style={styles.cardBtn}>
          <Text style={[styles.cardBtnText, {color: testDue ? el.color : palette.text}]}>
            Test max
          </Text>
        </Tap>
        {canLevelUp && nextRungLabel ? (
          <Tap variant="ghost" color={el.accent} onPress={onLevelUp} style={styles.cardBtnWide}>
            <Text style={[styles.cardBtnText, {color: el.accent}]} numberOfLines={1}>
              Level up → {nextRungLabel}
            </Text>
          </Tap>
        ) : null}
      </View>
    </View>
  );
}

// ─── Max test sheet ─────────────────────────────────────────────────

function MaxTestSheet({
  trackId,
  onClose,
  onSave,
}: {
  trackId: TrackId | null;
  onClose: () => void;
  onSave: (id: TrackId, value: number) => void;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
  }, [trackId]);
  if (!trackId) {
    return null;
  }
  const track = trackById(trackId);
  const state = loadProgram().tracks[trackId];
  const el = ELEMENTS[track.element];
  const rung = currentRung(track, state);
  const seconds = track.unit === 'seconds';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, {borderColor: el.color}]}>
          <Text style={[styles.sheetTitle, {color: el.color}]}>Max test · {rung.label}</Text>
          <Text style={styles.sheetBody}>
            {seconds
              ? 'Warm up, then hold until your form breaks. Log the time.'
              : 'Warm up, then one all-out set of clean reps. Log the count.'}{' '}
            Sets become about half of this.
          </Text>
          <NumberPad
            mode={seconds ? 'mmss' : 'integer'}
            value={value}
            onChange={setValue}
            accent={el.color}
            compact
          />
          <View style={styles.sheetActions}>
            <Tap variant="ghost" color={palette.textDim} onPress={onClose} style={styles.sheetBtn}>
              <Text style={styles.cardBtnText}>Cancel</Text>
            </Tap>
            <Tap
              variant="solid"
              color={value > 0 ? el.color : palette.textMuted}
              disabled={value <= 0}
              onPress={() => onSave(trackId, value)}
              style={styles.sheetBtn}>
              <Text style={styles.cardBtnSolidText}>Save max</Text>
            </Tap>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── helpers ────────────────────────────────────────────────────────

function formatMax(track: Track, max: number): string {
  return track.unit === 'seconds' ? formatDuration(max) : `${max} reps`;
}

function formatHHMM(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    ...t.subtitle,
    color: palette.textDim,
  },
  ruleCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ruleText: {
    ...t.body,
    color: palette.textDim,
    lineHeight: 21,
  },
  emptyText: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    ...t.subtitle,
    flexShrink: 1,
  },
  cardCount: {
    ...t.subtitle,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  cardMeta: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.sm,
  },
  cardNote: {
    ...t.caption,
    color: palette.text,
    marginTop: spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cardBtn: {
    minWidth: 88,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  cardBtnWide: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  cardBtnText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBtnSolidText: {
    color: palette.bg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  restLine: {
    ...t.caption,
    color: palette.textDim,
    marginBottom: spacing.md,
  },
  section: {
    ...t.subtitle,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  trackInfo: {flex: 1},
  trackName: {
    ...t.body,
    fontWeight: '700',
  },
  trackMeta: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  trackWhy: {
    ...t.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  toggle: {
    minWidth: 56,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: palette.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  sheetTitle: {
    ...t.title,
  },
  sheetBody: {
    ...t.body,
    color: palette.textDim,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sheetBtn: {
    flex: 1,
    borderRadius: radius.md,
  },
});
