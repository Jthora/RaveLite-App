/**
 * DailySetsSection — the body of the Daily Sets sheet.
 *
 * Today's sets per track, and the controls that drive the ramp:
 *   - per-track progress (amount done / quota, sets done, next round)
 *   - "+ set" to log a set done outside a chime
 *   - max test (NumberPad) — the only thing that raises set size
 *   - level up to the next variation once the set size graduates
 *   - track on/off
 *   - today's focus and morning block, and the week ahead (`FocusWeek`)
 *   - why each track asks for the sets it does: the daily review reads
 *     the last week and adds a set, holds, or eases off (`program/adapt.ts`)
 *
 * Renders as a plain section; the sheet owns the scroll. Rounds
 * spread across My day. All writes go through the program repository or
 * the journal; the sets scheduler picks them up.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../../components/icons/ElementGlyph';

import {MoveIcon} from '../../components/icons/MoveIcon';
import {SheetLayer} from '../../components/SheetLayer';
import {Tap} from '../../components/Tap';
import {NumberPad} from '../../components/training/NumberPad';

import {getActiveHours} from '../../domain/ambient/activeHours';
import {reconcileSetsNow, setsToday} from '../../domain/ambient/setScheduler';
import {subscribe as subscribePulseRuntime} from '../../domain/ambient/pulseRuntime';
import {EXERCISE_LIBRARY} from '../../domain/exercises/library';
import {moveForTrack} from '../../domain/exercises/moves';
import {append} from '../../domain/journal/journal';
import {doneOnDay, formatSetAmount} from '../../domain/program/progress';
import {movesOf} from '../../domain/program/rounds';
import {
  currentRung,
  isTestDue,
  neighbourStep,
  phaseForWeek,
  programWeek,
  readyToLevelUp,
} from '../../domain/program/progression';
import {
  focusFor,
  levelDownTrack,
  levelUpTrack,
  loadProgram,
  recordMaxTest,
  setTrackEnabled,
  subscribeProgram,
} from '../../domain/program/repository';
import {TRACKS, trackById} from '../../domain/program/tracks';
import {UP_AT, lastWeekDone} from '../../domain/program/adapt';
import type {
  DayPrescription,
  Track,
  TrackId,
  TrackReview,
} from '../../domain/program/types';
import {formatDuration} from '../../domain/training/grading';
import type {InfoRef} from '../../domain/info/info';
import {loadBlockPhase, loadFacts} from '../../domain/profile/repository';
import {blockLine, testsHeldBack} from '../../domain/profile/blocks';
import {TodayFocus, WeekFocus} from './FocusWeek';
import {blockPieces, runFor, blockTitle} from '../../domain/program/morning';

import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import {STOP_LINE} from '../../domain/exercises/safety';
import {owedToday} from '../../domain/program/setsSummary';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const REFRESH_MS = 30_000;

export function DailySetsSection({
  onOpenAttributes,
  onInfo,
}: {
  onOpenAttributes?: () => void;
  onInfo?: (ref: InfoRef) => void;
} = {}) {
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
      done: doneOnDay(date),
      // Today and the six days after it, for the focus wheel.
      focusDays: Array.from({length: 7}, (_, i) => {
        const day = new Date(date);
        day.setHours(12, 0, 0, 0);
        day.setDate(day.getDate() + i);
        const focus = focusFor(day);
        return {
          date: day,
          focus,
          run: runFor(day, now),
          title: blockTitle(focus.block, blockPieces(day, now)),
        };
      }),
      pieces: blockPieces(date, now),
      facts: loadFacts(now),
      block: loadBlockPhase(now),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const {
    program,
    today,
    done,
    week,
    phase,
    date,
    myDay,
    focusDays,
    pieces,
    facts,
    block,
  } = view;
  // No max tests while ramping back in or tapering for a festival.
  const heldBack = testsHeldBack(block);
  const accent = ELEMENTS.heart.accent;
  // What is still owed: a skipped round or one that never sounded is let
  // go, so the day can still be finished.
  const owed = today.prescriptions.map(p => owedToday(p, today.released));
  const setsTotal = owed.reduce((s, p) => s + p.sets, 0);
  const setsDone = owed.reduce(
    (s, p) => s + Math.min(p.sets, done[p.trackId]?.sets ?? 0),
    0,
  );
  const restTracks = TRACKS.filter(
    tr =>
      program.tracks[tr.id].enabled &&
      !today.prescriptions.some(p => p.trackId === tr.id),
  );
  const lastWeek = lastWeekDone(TRACKS.map(tr => program.tracks[tr.id]));

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
    <View>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.eyebrow, {color: accent}]}>
          ▸ WEEK {week} ·{' '}
          {phase === 'deload' ? 'EASY WEEK + MAX TESTS' : 'BUILD'}
        </Text>
        <Text style={styles.subtitle}>
          {setsDone} of {setsTotal} sets · My day {myDay.start}–{myDay.end}
        </Text>
        {lastWeek !== undefined ? (
          <Text testID="sets-last-week" style={styles.lastWeek}>
            Last week: {Math.round(lastWeek * 100)}% of sets done
          </Text>
        ) : null}
        {blockLine(block) ? (
          <Text testID="sets-block" style={styles.lastWeek}>
            {blockLine(block)}
          </Text>
        ) : null}
      </View>

      <TodayFocus
        focus={focusDays[0].focus}
        pieces={pieces}
        onOpen={onOpenAttributes}
      />

      {today.prescriptions.length === 0 ? (
        <Text style={styles.emptyText}>Rest day. No sets scheduled.</Text>
      ) : (
        owed.map(p => {
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
              testDue={!heldBack && isTestDue(program, state, date)}
              untested={state.testedAt === undefined}
              testMax={state.testMax}
              canLevelUp={readyToLevelUp(track, state, facts)}
              nextRungLabel={neighbourStep(track, state, 1, facts)?.rung.label}
              easierRungLabel={
                neighbourStep(track, state, -1, facts)?.rung.label
              }
              review={state.lastReview}
              onInfo={
                onInfo
                  ? () => onInfo({kind: 'track', id: p.trackId})
                  : undefined
              }
              onLogSet={() => logSet(p)}
              onTest={() => setTesting(p.trackId)}
              onLevelUp={() => levelUpTrack(p.trackId)}
              onStepDown={() => levelDownTrack(p.trackId)}
            />
          );
        })
      )}

      {restTracks.length > 0 ? (
        <Text style={styles.restLine}>
          Rest today: {restTracks.map(tr => tr.name).join(' · ')}
        </Text>
      ) : null}

      <WeekFocus days={focusDays} />

      <Text accessibilityRole="header" style={styles.section}>
        Tracks
      </Text>
      {TRACKS.map(tr => {
        const state = program.tracks[tr.id];
        const el = ELEMENTS[tr.element];
        return (
          <View key={tr.id} style={styles.trackRow}>
            <View style={styles.trackInfo}>
              <View style={styles.trackTitle}>
                <ElementGlyph
                  element={el}
                  size={15}
                  color={state.enabled ? el.color : palette.textMuted}
                />
                <Text
                  style={[
                    styles.trackName,
                    styles.trackNameText,
                    {color: state.enabled ? el.color : palette.textFaint},
                  ]}>
                  {tr.name} ·{' '}
                  {currentRung(tr, state, loadFacts())?.label ?? '—'}
                </Text>
              </View>
              <Text style={styles.trackMeta}>
                max {formatMax(tr, state.testMax)}
                {state.testedAt === undefined ? ' (assumed)' : ''} ·{' '}
                {tr.days.map(dn => DAY_NAMES[dn]).join(' ')}
              </Text>
              <Text style={styles.trackWhy}>{tr.why}</Text>
            </View>
            <Tap
              testID={`track-toggle-${tr.id}`}
              variant={state.enabled ? 'solid' : 'ghost'}
              color={state.enabled ? el.color : palette.textDim}
              onPress={() => setTrackEnabled(tr.id, !state.enabled)}
              accessibilityRole="switch"
              accessibilityState={{checked: state.enabled}}
              accessibilityLabel={`${tr.name} track`}
              style={styles.toggle}>
              <Text
                style={[
                  styles.toggleText,
                  {color: state.enabled ? palette.bg : palette.textDim},
                ]}>
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
    </View>
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
  /** The easier step this room can do, if there is one. */
  easierRungLabel?: string;
  /** Why today asks for these sets. */
  review?: TrackReview;
  onLogSet: () => void;
  onTest: () => void;
  onLevelUp: () => void;
  onStepDown: () => void;
  /** "What is this?" for the track. */
  onInfo?: () => void;
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
  easierRungLabel,
  review,
  onLogSet,
  onTest,
  onLevelUp,
  onStepDown,
  onInfo,
}: TrackCardProps) {
  const el = ELEMENTS[track.element];
  const total = p.setSize * p.sets;
  const pct = Math.min(1, total > 0 ? doneAmount / total : 0);
  const complete = doneAmount >= total;
  const unitWord = p.unit === 'seconds' ? 'sec' : 'reps';

  return (
    <View
      style={[
        styles.card,
        {borderColor: complete ? el.color : palette.border},
      ]}>
      <View style={styles.cardTop}>
        <Tap
          testID={`track-info-${track.id}`}
          variant="plain"
          onPress={onInfo}
          disabled={onInfo === undefined}
          accessibilityRole="button"
          accessibilityLabel={onInfo ? `${p.label}. What is this?` : undefined}
          style={styles.cardNameTap}>
          <View style={styles.cardName}>
            <MoveIcon
              move={moveForTrack(track.id) ?? 'activity'}
              color={el.color}
              size={20}
            />
            <Text
              style={[styles.cardTitle, {color: el.color}]}
              numberOfLines={1}>
              {p.label}
            </Text>
            {onInfo ? (
              <Text style={[styles.cardInfo, {color: el.color}]}>ⓘ</Text>
            ) : null}
          </View>
        </Tap>
        <Text style={styles.cardCount}>
          {doneAmount}/{total} {unitWord}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {backgroundColor: el.color, width: `${pct * 100}%`},
          ]}
        />
      </View>
      <Text style={styles.cardMeta}>
        {Math.min(doneSets, p.sets)} of {p.sets} sets ·{' '}
        {formatSetAmount(p.setSize, p.unit)} each
        {complete ? ' · done ✓' : nextAt ? ` · next ${formatHHMM(nextAt)}` : ''}
      </Text>
      {review ? (
        <Text style={styles.cardReview}>{reviewLine(review)}</Text>
      ) : null}
      {untested ? (
        <Text style={styles.cardNote}>
          Not tested yet. Using a max of {formatMax(track, testMax)} for now.
        </Text>
      ) : testDue ? (
        <Text style={styles.cardNote}>Test week: test and log a new max.</Text>
      ) : null}
      <View style={styles.cardActions}>
        <Tap
          variant="solid"
          color={el.color}
          onPress={onLogSet}
          style={styles.cardBtn}>
          <Text style={styles.cardBtnSolidText}>+ set</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={testDue ? el.color : palette.textDim}
          onPress={onTest}
          style={styles.cardBtn}>
          <Text
            style={[
              styles.cardBtnText,
              {color: testDue ? el.color : palette.text},
            ]}>
            Test max
          </Text>
        </Tap>
        {canLevelUp && nextRungLabel ? (
          <Tap
            variant="ghost"
            color={el.accent}
            onPress={onLevelUp}
            style={styles.cardBtnWide}>
            <Text
              style={[styles.cardBtnText, {color: el.accent}]}
              numberOfLines={1}>
              Level up → {nextRungLabel}
            </Text>
          </Tap>
        ) : null}
      </View>
      {easierRungLabel ? (
        <Tap
          testID={`track-down-${track.id}`}
          variant="plain"
          onPress={onStepDown}
          accessibilityRole="button"
          accessibilityLabel={`Too hard? Step down to ${easierRungLabel}`}
          style={styles.stepDown}>
          <Text style={styles.stepDownText} numberOfLines={1}>
            Too hard? Step down → {easierRungLabel}
          </Text>
        </Tap>
      ) : null}
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
  const rung = currentRung(track, state, loadFacts());
  const seconds = track.unit === 'seconds';
  if (!rung) {
    // Nothing on this ladder suits the room, so there is nothing to test.
    return null;
  }

  return (
    <SheetLayer onClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, {borderColor: el.color}]}>
          <Text
            accessibilityRole="header"
            style={[styles.sheetTitle, {color: el.color}]}>
            Max test · {rung.label}
          </Text>
          <Text style={styles.sheetStop}>{STOP_LINE}.</Text>
          <Text style={styles.sheetBody}>
            {seconds
              ? 'Warm up, then hold until your form breaks. Log the time.'
              : 'Warm up, then do one set of as many clean reps as you can. Log the count.'}{' '}
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
            <Tap
              variant="ghost"
              color={palette.textDim}
              onPress={onClose}
              style={styles.sheetBtn}>
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
    </SheetLayer>
  );
}

// ─── helpers ────────────────────────────────────────────────────────

function formatMax(track: Track, max: number): string {
  return track.unit === 'seconds' ? formatDuration(max) : `${max} reps`;
}

/** Why a track asks for its sets, from its latest daily review. */
export function reviewLine(review: TrackReview): string {
  const pct =
    review.ratio !== undefined ? `${Math.round(review.ratio * 100)}%` : '';
  const upAt = `${Math.round(UP_AT * 100)}%`;
  const sets = `${review.sets} ${review.sets === 1 ? 'set' : 'sets'} a day`;
  switch (review.change) {
    case 'new':
      return `Starting at ${sets}. Do ${upAt} or more for a week to add a set.`;
    case 'up':
      return `Up to ${sets}: ${pct} of last week's sets done.`;
    case 'down':
      return `Down to ${sets}: ${pct} of last week's sets done. Do ${upAt} for a week to add one back.`;
    case 'top':
      return `At the maximum: ${sets}. A new max test makes each set bigger.`;
    case 'rebuild':
      return `Back from a break at ${sets}. One more set every 3 good days.`;
    case 'deload':
      return 'Easy week: lighter sets on purpose. They go back up after it.';
    case 'paused':
      return `Held at ${sets} while a mode is on. These days don't count.`;
    case 'hold':
      if (review.ratio === undefined) {
        return `Holding at ${sets} until there are a few days of results.`;
      }
      return review.ratio >= UP_AT
        ? `Holding at ${sets}: ${pct} last week. A set is added a week after the last increase.`
        : `Holding at ${sets}: ${pct} of last week's sets done. Do ${upAt} to add a set.`;
  }
}

function formatHHMM(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const styles = StyleSheet.create({
  trackTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackNameText: {
    flexShrink: 1,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardNameTap: {
    flex: 1,
  },
  cardInfo: {
    ...t.caption,
  },
  cardName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
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
  cardReview: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.xs,
  },
  lastWeek: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
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
  stepDown: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  stepDownText: {
    ...t.caption,
    color: palette.textDim,
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
    color: palette.textFaint,
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
  sheetStop: {
    ...t.body,
    color: palette.text,
    fontWeight: '700',
    marginTop: spacing.xs,
    lineHeight: 21,
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
