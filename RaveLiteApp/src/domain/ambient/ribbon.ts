/**
 * Ribbon view-model — the single ordered list that drives the new
 * Always-On surface.
 *
 * Pure function. No React, no storage I/O, no time math beyond joining
 * the inputs. Inputs come from existing surfaces:
 *   - `expandPlanToFires` for the future (and recent past)
 *   - `entriesForDay(...)` for the resolved past
 *   - optional `activePulse` from the (future) pulseQueue reducer
 *
 * Output is always:
 *   - sorted strictly ascending by `at`
 *   - exactly one `now-active` OR `now-idle` row at `at == now`
 *   - clamped to the [now - back, now + forward] window
 *
 * The component layer renders this verbatim. Dispatch (`onSeal`,
 * `onSkip`, `onSnooze`, `onRetroLog`) writes journal entries via the
 * existing `append(...)` write path; on the next rebuild the new entries
 * surface in the list as `past-*` rows.
 */
import {ElementId, ELEMENTS} from '../../theme/elements';
import {Plan} from '../reminders/types';
import {expandPlanToFires} from '../reminders/expandPlan';
import {pickDrillForSlotSeeded} from '../reminders/scheduler';
import {JournalEntry, ReminderFiredEntry} from '../journal/types';
import {EXERCISE_LIBRARY} from '../exercises/library';
import {formatSetAmount} from '../program/progress';
import type {SetPrescription} from '../program/types';

export type RibbonRowKind =
  | 'past-sealed'
  | 'past-skipped'
  | 'past-snoozed'
  | 'past-ignored'
  | 'past-absorbed'
  | 'now-active'
  | 'now-idle'
  | 'future';

export interface RibbonActivePayload {
  drillId: string;
  drillName: string;
  durationSec: number;
  cuesShort: string[];
  /** Window-expiry deadline. */
  expiresAt: number;
  /** Daily Sets: amount + set n of m. */
  prescription?: SetPrescription;
}

export interface RibbonRow {
  /** Stable id. Real pulse id for pulse-derived rows; synthetic id for
   *  plan-derived future rows; the literal 'now' for the synthesized
   *  now-idle / now-active row when none of the above match. */
  id: string;
  /** Anchor time, epoch ms. */
  at: number;
  element: ElementId;
  kind: RibbonRowKind;
  /** Drill name (past) or prescription preview (future). */
  label: string;
  /** Optional sub-line: response time, dose, etc. */
  detail?: string;
  /** Only meaningful for kind === 'now-active'. */
  active?: RibbonActivePayload;
}

export interface ActivePulseSummary {
  pulseId: string;
  fireAt: number;
  expiresAt: number;
  element: ElementId;
  drillId: string;
  drillName: string;
  durationSec: number;
  cuesShort: string[];
  prescription?: SetPrescription;
}

/** A future row from a producer other than the Plan (e.g. Daily Sets). */
export interface RibbonFuture {
  id: string;
  at: number;
  element: ElementId;
  label: string;
  detail?: string;
}

export interface BuildRibbonInput {
  now: number;
  windowBackMs: number;
  windowForwardMs: number;
  plan: Plan;
  /** Today's journal entries — caller passes `entriesForDay(now)`. */
  journal: JournalEntry[];
  /** Optional. Provided once Slice 5 wires the reducer. */
  activePulse?: ActivePulseSummary;
  /** Upcoming non-plan chimes to show as future rows. */
  extraFutures?: RibbonFuture[];
  /** Awareness threshold for synthesizing past-absorbed rows.
   *  Default 5 min. Plan fires older than this without a journal entry
   *  become 'past-absorbed' (resolved-while-away). */
  absorbedThresholdMs?: number;
}

const SYNTH_ID_NOW = 'now';

/**
 * Build the row list. Pure.
 */
export function buildRibbonRows(input: BuildRibbonInput): RibbonRow[] {
  const {
    now,
    windowBackMs,
    windowForwardMs,
    plan,
    journal,
    activePulse,
    extraFutures = [],
    absorbedThresholdMs = 5 * 60_000,
  } = input;

  const fromTs = now - windowBackMs;
  const toTs = now + windowForwardMs;

  // ── 1. Index journal by pulseId so we can join firings to resolutions.
  const firedById = new Map<string, ReminderFiredEntry>();
  /** Map pulseId → the resolution entry kind when one exists. */
  const resolvedByPulseId = new Map<
    string,
    {kind: RibbonRowKind; entry: JournalEntry}
  >();
  /** Map pulseId → completion entry (joined via pulseId on completions). */
  const completedByPulseId = new Map<string, JournalEntry>();

  for (const e of journal) {
    if (e.kind === 'reminder.fired') {
      firedById.set(e.pulseId, e);
    } else if (e.kind === 'reminder.skipped') {
      resolvedByPulseId.set(e.pulseId, {kind: 'past-skipped', entry: e});
    } else if (e.kind === 'reminder.snoozed') {
      resolvedByPulseId.set(e.pulseId, {kind: 'past-snoozed', entry: e});
    } else if (e.kind === 'reminder.ignored') {
      // Absorbed-by-absence ignores are presentationally absorbed. Otherwise
      // they're a hard miss the operator should see.
      resolvedByPulseId.set(e.pulseId, {
        kind: e.absorbedBy ? 'past-absorbed' : 'past-ignored',
        entry: e,
      });
    } else if (e.kind === 'completion' && e.pulseId) {
      completedByPulseId.set(e.pulseId, e);
    }
  }

  const rows: RibbonRow[] = [];
  const seenPulseIds = new Set<string>();

  // ── 2. Past rows: for every reminder.fired in window, emit one row.
  for (const fired of firedById.values()) {
    if (fired.at < fromTs || fired.at > now) {
      continue;
    }
    seenPulseIds.add(fired.pulseId);

    const completion = completedByPulseId.get(fired.pulseId);
    if (completion && completion.kind === 'completion') {
      const ttR = completion.respondedAfterMs;
      rows.push({
        id: fired.pulseId,
        at: fired.at,
        element: fired.element,
        kind: 'past-sealed',
        label: drillName(completion.exerciseId),
        detail: joinDetail(
          completion.trackId && typeof completion.amount === 'number'
            ? `${completion.amount}`
            : undefined,
          typeof ttR === 'number' ? `+${formatTtr(ttR)}` : undefined,
        ),
      });
      continue;
    }

    const resolved = resolvedByPulseId.get(fired.pulseId);
    if (resolved) {
      const detail = detailForResolution(resolved);
      rows.push({
        id: fired.pulseId,
        at: fired.at,
        element: fired.element,
        kind: resolved.kind,
        label: ELEMENTS[fired.element].domain,
        detail,
      });
      continue;
    }

    // No resolution and no completion. The pulse fired but the operator
    // has not (yet) acted. Two interpretations:
    //   - It's the currently-active pulse (handled below by activePulse).
    //   - It's an unresolved past pulse — stale ignored. Render as
    //     'past-ignored' so the gap shows up.
    if (activePulse && activePulse.pulseId === fired.pulseId) {
      // Will be replaced by the active row below.
      continue;
    }
    rows.push({
      id: fired.pulseId,
      at: fired.at,
      element: fired.element,
      kind: 'past-ignored',
      label: ELEMENTS[fired.element].domain,
    });
  }

  // ── 3. Future rows: expand the plan into the forward window.
  //    We also expand a small back-slice [now - absorbedThresholdMs, now]
  //    so we can synthesize past-absorbed rows for plan fires the operator
  //    missed *while the app was backgrounded* (no `reminder.fired` was
  //    written). Once Slice 5 lands, the foreground service will write
  //    those firings and this synthesis becomes a no-op.
  const planFires = expandPlanToFires(
    plan,
    Math.min(fromTs, now - absorbedThresholdMs),
    toTs,
  );
  for (const f of planFires) {
    const synthId = `plan:${f.windowId}:${f.slotIndex}:${f.ts}`;
    // Skip if a real pulse with matching window/slot already covers this.
    // Heuristic: pulses' fired.at is the actual fire time which may differ
    // by ms from the planned ts. We dedupe instead by pulseId presence on
    // the same window/slot at near-equal time.
    const matchingFired = findFiredAt(firedById, f.windowId, f.slotIndex, f.ts);
    if (matchingFired) {
      continue;
    }

    if (f.ts > now) {
      // Future preview row.
      const drill = pickDrillForSlotSeeded(
        {element: f.element, everyMinutes: f.everyMinutes},
        synthId,
      );
      rows.push({
        id: synthId,
        at: f.ts,
        element: f.element,
        kind: 'future',
        label: drill?.name ?? ELEMENTS[f.element].domain,
        detail: drill?.dose,
      });
    } else if (now - f.ts >= absorbedThresholdMs) {
      // Plan fire in recent past with NO matching reminder.fired and the
      // gap exceeds the absorbed threshold → synthesize an absorbed row
      // the operator can retro-log.
      rows.push({
        id: synthId,
        at: f.ts,
        element: f.element,
        kind: 'past-absorbed',
        label: ELEMENTS[f.element].domain,
        detail: 'tap to log',
      });
    }
    // else: very recent plan fire (within absorbedThresholdMs) — skip.
    // It's likely the active pulse just hasn't been journal-written yet,
    // or the surface has only just mounted. Let the next rebuild catch it.
  }

  // ── 3b. Non-plan future rows (Daily Sets chimes).
  for (const f of extraFutures) {
    if (f.at <= now || firedById.has(f.id)) {
      continue;
    }
    rows.push({
      id: f.id,
      at: f.at,
      element: f.element,
      kind: 'future',
      label: f.label,
      detail: f.detail,
    });
  }

  // ── 4. Synthesize the now-row.
  if (activePulse) {
    rows.push({
      id: activePulse.pulseId,
      at: now,
      element: activePulse.element,
      kind: 'now-active',
      label: activePulse.drillName,
      detail: !activePulse.prescription
        ? `${activePulse.durationSec}s`
        : activePulse.prescription.moves
        ? `round ${activePulse.prescription.roundIndex}/${activePulse.prescription.rounds}`
        : `${formatSetAmount(activePulse.prescription.amount, activePulse.prescription.unit)} · set ${activePulse.prescription.setIndex}/${activePulse.prescription.sets}`,
      active: {
        drillId: activePulse.drillId,
        drillName: activePulse.drillName,
        durationSec: activePulse.durationSec,
        cuesShort: activePulse.cuesShort,
        expiresAt: activePulse.expiresAt,
        prescription: activePulse.prescription,
      },
    });
  } else {
    rows.push({
      id: SYNTH_ID_NOW,
      at: now,
      element: 'heart',
      kind: 'now-idle',
      label: 'standby',
    });
  }

  // ── 5. Sort + clamp + stabilize.
  rows.sort((a, b) => a.at - b.at || rowSortRank(a) - rowSortRank(b));
  return rows.filter(r => r.at >= fromTs && r.at <= toTs);
}

/** Tiebreaker so 'now-active' / 'now-idle' sort stably at exactly `now`. */
function rowSortRank(r: RibbonRow): number {
  switch (r.kind) {
    case 'past-sealed':
    case 'past-skipped':
    case 'past-snoozed':
    case 'past-ignored':
    case 'past-absorbed':
      return 0;
    case 'now-active':
      return 1;
    case 'now-idle':
      return 2;
    case 'future':
      return 3;
  }
}

function detailForResolution(r: {
  kind: RibbonRowKind;
  entry: JournalEntry;
}): string | undefined {
  if (
    r.entry.kind === 'reminder.skipped' ||
    r.entry.kind === 'reminder.snoozed' ||
    r.entry.kind === 'reminder.ignored'
  ) {
    const ttR = r.entry.respondedAfterMs;
    if (typeof ttR === 'number') {
      return `+${formatTtr(ttR)}`;
    }
  }
  return undefined;
}

function drillName(exerciseId: string): string {
  return EXERCISE_LIBRARY.find(e => e.id === exerciseId)?.name ?? exerciseId;
}

function joinDetail(...parts: Array<string | undefined>): string | undefined {
  const kept = parts.filter((p): p is string => !!p);
  return kept.length ? kept.join(' · ') : undefined;
}

function formatTtr(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const s = Math.round(ms / 1000);
  if (s < 60) {
    return `${s}s`;
  }
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs.toString().padStart(2, '0')}s`;
}

/**
 * Find a `reminder.fired` entry whose pulseId encodes the same
 * (windowId, slotIndex) and whose `at` is within ±90s of `expectedTs`.
 *
 * We don't have a persisted (windowId, slotIndex) → pulseId map, so we
 * look it up off the fired entry itself: ReminderFiredEntry exposes
 * `windowId`. The slotIndex isn't stored on the journal entry today —
 * we accept that minor lossiness and just match on (windowId, time).
 */
function findFiredAt(
  firedById: Map<string, ReminderFiredEntry>,
  windowId: string,
  _slotIndex: number,
  expectedTs: number,
): ReminderFiredEntry | undefined {
  const tolMs = 90_000;
  for (const f of firedById.values()) {
    if (f.windowId !== windowId) {
      continue;
    }
    if (Math.abs(f.at - expectedTs) <= tolMs) {
      return f;
    }
  }
  return undefined;
}
