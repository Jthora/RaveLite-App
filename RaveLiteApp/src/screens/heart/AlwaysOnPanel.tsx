/**
 * AlwaysOnPanel — orchestrator for the Heart > Always-On sub-tab.
 *
 * Phase 1A scope (Ribbon overhaul):
 *   - One ordered list of journal+plan-derived rows (the Ribbon).
 *   - One thin status bar above (LIVE/PAUSED, active-hours chip,
 *     today's adherence, wall clock).
 *   - Single 1-second poll. `now` refreshes every tick; the row list
 *     refreshes every 5 ticks (cheap walk over today's journal).
 *
 * No ScrollView — the layout fits the viewport on phone & tablet,
 * portrait & landscape, by sizing rows with flex.
 *
 * Legacy components (NowCard / UpcomingStrip / AdherenceRings /
 * ActivityLog) remain on disk; we no longer mount them. They will be
 * deleted in Step 7 of the Ribbon plan once the new surface settles.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Ribbon, type RetroOutcome} from '../../components/ambient/Ribbon';
import {RibbonStatusBar} from '../../components/ambient/RibbonStatusBar';
import {
  RibbonControls,
  type PauseDurationKey,
} from '../../components/ambient/RibbonControls';
import {WelcomeBackBanner} from '../../components/ambient/WelcomeBackBanner';

import {palette, spacing, type as t} from '../../theme';

import {loadPlan} from '../../domain/reminders/repository';
import {entriesForDay, append} from '../../domain/journal/journal';
import {adherenceForDay} from '../../domain/ambient/stats';
import {getActiveHours} from '../../domain/ambient/activeHours';
import {buildRibbonRows, type RibbonRow} from '../../domain/ambient/ribbon';
import {syncAmbientService} from '../../domain/ambient/ambientLifecycle';
import {reconcileBackupsNow} from '../../domain/ambient/backupScheduler';
import {reconcileSetsNow, setsToday} from '../../domain/ambient/setScheduler';
import {formatSetAmount} from '../../domain/program/progress';
import {
  cancelQueued as runtimeCancelQueued,
  deferQueued as runtimeDeferQueued,
  getActivePulseSummary,
  resolveActive as runtimeResolve,
  sealActive as runtimeSeal,
  snoozeActive as runtimeSnooze,
  subscribe as subscribePulseRuntime,
} from '../../domain/ambient/pulseRuntime';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {TrainingLogRail} from '../../components/training/TrainingLogRail';
import {useOrientation} from '../../shell/useOrientation';

const POLL_INTERVAL_MS = 1000;
const DERIVE_EVERY_TICKS = 5;
const WINDOW_BACK_MS = 4 * 60 * 60 * 1000;
const WINDOW_FORWARD_MS = 4 * 60 * 60 * 1000;
/** Threshold for showing the welcome-back banner on mount. */
const WELCOME_BACK_THRESHOLD_MS = 5 * 60_000;
/** How often the last-seen stamp is persisted (it's an absence detector,
 *  not a clock — writing it every second was wasted storage churn). */
const LAST_SEEN_WRITE_MS = 30_000;
/** +5 on the next chime pushes it back by this much. */
const PLUS_FIVE_MS = 5 * 60_000;

export function AlwaysOnPanel() {
  const {orientation, isTablet} = useOrientation();
  const showRail = orientation === 'landscape' && isTablet;
  const phoneLandscape = orientation === 'landscape' && !isTablet;
  const [now, setNow] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  // Welcome-back state — captured ONCE on mount before we stamp
  // `ambientLastSeenAt`, so re-mounts within the session don't
  // re-trigger the banner. `null` means "don't show".
  const [welcomeBack, setWelcomeBack] = useState<
    {awayMs: number} | null
  >(() => {
    const raw = store.getString(KEYS.ambientLastSeenAt);
    const lastSeen = raw ? Number(raw) : NaN;
    const stamp = Date.now();
    store.set(KEYS.ambientLastSeenAt, String(stamp));
    if (!Number.isFinite(lastSeen)) {
      return null;
    }
    const awayMs = stamp - lastSeen;
    return awayMs > WELCOME_BACK_THRESHOLD_MS ? {awayMs} : null;
  });

  const lastSeenWriteRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setTick(k => k + 1);
      // Keep `ambientLastSeenAt` warm so a foregrounded session
      // doesn't accumulate stale absence on the next mount.
      if (t - lastSeenWriteRef.current >= LAST_SEEN_WRITE_MS) {
        store.set(KEYS.ambientLastSeenAt, String(t));
        lastSeenWriteRef.current = t;
      }
      // The pulse runtime self-ticks at app boot (see App.tsx →
      // startPulseRuntime), so no per-screen tick is needed here.
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Slice 5 — re-derive whenever the pulse runtime emits a state
  // change (e.g. a queued pulse promoted to active, or a resolution
  // committed). This keeps the active-row and journal-derived rows in
  // lockstep without waiting for the next 5-tick derive cycle.
  useEffect(() =>
    subscribePulseRuntime(() => setTick(k => k + DERIVE_EVERY_TICKS)),
  []);

  // Bucket of state that we recompute every DERIVE_EVERY_TICKS ticks.
  const deriveBucket = Math.floor(tick / DERIVE_EVERY_TICKS);

  const rows = useMemo<RibbonRow[]>(() => {
    const plan = loadPlan();
    const journal = entriesForDay(new Date(now));
    return buildRibbonRows({
      now,
      windowBackMs: WINDOW_BACK_MS,
      windowForwardMs: WINDOW_FORWARD_MS,
      plan,
      journal,
      activePulse: getActivePulseSummary(),
      extraFutures: setsToday(now).upcoming.map(f => ({
        id: f.id,
        at: f.ts,
        element: f.element,
        label: f.prescription.label,
        detail: `${formatSetAmount(f.prescription.amount, f.prescription.unit)} · set ${f.prescription.setIndex}/${f.prescription.sets}`,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deriveBucket]);

  const activeHours = useMemo(() => getActiveHours(), [deriveBucket]);
  const manualPauseUntil = useMemo(() => {
    const raw = store.getString(KEYS.manualPauseUntil);
    if (!raw) {
      return undefined;
    }
    const v = Number(raw);
    return Number.isFinite(v) && v > now ? v : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deriveBucket]);

  const adherence = useMemo(() => {
    const a = adherenceForDay(new Date(now));
    return {sealed: a.completed, scheduled: a.scheduled};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deriveBucket]);

  // ── Row dispatch ────────────────────────────────────────────────
  // Each handler appends a journal entry; the next derive cycle picks
  // it up and the row visibly updates kind. Slice 5 will replace the
  // RetroLog handler with a real "log past completion" sheet.

  const onSeal = useCallback((row: RibbonRow, amount?: number) => {
    if (!row.active) {
      return;
    }
    // The runtime resolves the pulse, writes the CompletionEntry (with
    // track + amount for Daily Sets) and dismisses the notification.
    runtimeSeal({amount});
    reconcileSetsNow();
    setTick(k => k + DERIVE_EVERY_TICKS);
  }, []);

  const onSkip = useCallback((row: RibbonRow) => {
    const at = Date.now();
    if (row.active) {
      runtimeResolve('skipped', at);
    } else {
      append({
        kind: 'reminder.skipped',
        pulseId: row.id,
        respondedAfterMs: at - row.at,
      });
    }
    setTick(k => k + DERIVE_EVERY_TICKS);
  }, []);

  const onSnooze = useCallback((row: RibbonRow) => {
    const at = Date.now();
    if (row.active) {
      runtimeSnooze(at);
    } else {
      append({
        kind: 'reminder.snoozed',
        pulseId: row.id,
        respondedAfterMs: at - row.at,
      });
    }
    setTick(k => k + DERIVE_EVERY_TICKS);
  }, []);

  const onRetroLog = useCallback(
    (row: RibbonRow, outcome: RetroOutcome) => {
      // Synthesize a `reminder.fired` + outcome pair anchored at the
      // plan-derived ts. Next derive converts the row from
      // 'past-absorbed' to 'past-sealed' / 'past-skipped' / 'past-ignored'.
      append({
        kind: 'reminder.fired',
        at: row.at,
        pulseId: row.id,
        element: row.element,
      });
      if (outcome === 'sealed') {
        append({
          kind: 'completion',
          at: row.at + 1, // monotonic after fired
          exerciseId: 'retro',
          element: row.element,
          source: 'manual',
          pulseId: row.id,
          respondedAfterMs: Math.max(0, Date.now() - row.at),
        });
      } else if (outcome === 'skipped') {
        append({
          kind: 'reminder.skipped',
          at: row.at + 1,
          pulseId: row.id,
          respondedAfterMs: 0,
        });
      } else {
        append({
          kind: 'reminder.ignored',
          at: row.at + 1,
          pulseId: row.id,
          respondedAfterMs: null,
        });
      }
      setTick(k => k + DERIVE_EVERY_TICKS);
    },
    [],
  );

  // ── Controls bar dispatch ────────────────────────────────────────

  const onPause = useCallback((key: PauseDurationKey) => {
    if (key === 'off') {
      store.delete(KEYS.manualPauseUntil);
    } else {
      const until = computePauseUntil(key, Date.now());
      store.set(KEYS.manualPauseUntil, String(until));
    }
    syncAmbientService();
    // A pause suppresses chimes, so re-plan the OS backups right away.
    reconcileBackupsNow();
    setTick(k => k + DERIVE_EVERY_TICKS);
  }, []);

  /** The next future row (used by +5 / skip-next). */
  const nextFuture = useMemo<RibbonRow | undefined>(
    () => rows.find(r => r.kind === 'future'),
    [rows],
  );

  /** Count of absorbed rows currently visible — drives banner copy. */
  const absorbedCount = useMemo(
    () => rows.filter(r => r.kind === 'past-absorbed').length,
    [rows],
  );

  const onPlusFive = useCallback(() => {
    if (!nextFuture) {
      return;
    }
    // Snooze == journal write. The future row will surface as
    // 'past-snoozed' on the next derive once `now` passes its `at`.
    // Same pattern as the active-row snooze handler.
    append({
      kind: 'reminder.fired',
      at: nextFuture.at,
      pulseId: nextFuture.id,
      element: nextFuture.element,
    });
    append({
      kind: 'reminder.snoozed',
      pulseId: nextFuture.id,
      respondedAfterMs: 0,
    });
    // Actually move the queued chime, not just the ribbon row.
    runtimeDeferQueued(nextFuture.id, PLUS_FIVE_MS);
    setTick(k => k + DERIVE_EVERY_TICKS);
  }, [nextFuture]);

  const onSkipNext = useCallback(() => {
    if (!nextFuture) {
      return;
    }
    // Preemptive skip — write the fired+skipped pair using the future
    // row's planned ts so the row anchors at the right point in the
    // ribbon when it converts to 'past-skipped'.
    append({
      kind: 'reminder.fired',
      at: nextFuture.at,
      pulseId: nextFuture.id,
      element: nextFuture.element,
    });
    append({
      kind: 'reminder.skipped',
      pulseId: nextFuture.id,
      respondedAfterMs: 0,
    });
    // Actually drop the queued chime, not just mark the ribbon row.
    runtimeCancelQueued([nextFuture.id]);
    setTick(k => k + DERIVE_EVERY_TICKS);
  }, [nextFuture]);

  return (
    <View style={styles.outer}>
      <View style={styles.container}>
      <RibbonStatusBar
        now={now}
        activeHours={activeHours}
        manualPauseUntil={manualPauseUntil}
        adherence={adherence}
      />
      {welcomeBack && absorbedCount > 0 ? (
        <WelcomeBackBanner
          awayMs={welcomeBack.awayMs}
          absorbedCount={absorbedCount}
          onDismiss={() => setWelcomeBack(null)}
        />
      ) : null}
      {phoneLandscape ? (
        <View style={styles.phoneLandRow}>
          <View style={styles.phoneLandRibbon}>
            {rows.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>no cadence</Text>
              </View>
            ) : (
              <Ribbon
                rows={rows}
                now={now}
                onSeal={onSeal}
                onSkip={onSkip}
                onSnooze={onSnooze}
                onRetroLog={onRetroLog}
              />
            )}
          </View>
          <RibbonControls
            vertical
            pausedUntil={manualPauseUntil}
            now={now}
            onPause={onPause}
            onPlusFive={onPlusFive}
            onSkipNext={onSkipNext}
            hasNext={!!nextFuture}
          />
        </View>
      ) : (
        <>
          {rows.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>no cadence</Text>
            </View>
          ) : (
            <Ribbon
              rows={rows}
              now={now}
              onSeal={onSeal}
              onSkip={onSkip}
              onSnooze={onSnooze}
              onRetroLog={onRetroLog}
            />
          )}
          <RibbonControls
            pausedUntil={manualPauseUntil}
            now={now}
            onPause={onPause}
            onPlusFive={onPlusFive}
            onSkipNext={onSkipNext}
            hasNext={!!nextFuture}
          />
        </>
      )}
      </View>
      {showRail ? <TrainingLogRail /> : null}
    </View>
  );
}

/** Compute `manualPauseUntil` epoch ms for a sheet selection. */
function computePauseUntil(key: PauseDurationKey, now: number): number {
  if (key === 'p30') {
    return now + 30 * 60_000;
  }
  if (key === 'p2h') {
    return now + 2 * 60 * 60_000;
  }
  // 'tonight' — until 06:00 next morning local time.
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(6, 0, 0, 0);
  return d.getTime();
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...t.body,
    color: palette.textDim,
    letterSpacing: 1.4,
  },
  phoneLandRow: {
    flex: 1,
    flexDirection: 'row',
  },
  phoneLandRibbon: {
    flex: 1,
  },
});
