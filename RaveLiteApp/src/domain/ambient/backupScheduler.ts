/**
 * Backup chime scheduler — keeps the OS holding a backup notification for
 * every upcoming chime (plan cadence + Daily Sets rounds + live snoozed /
 * deferred pulses), so chimes survive the app being killed. Rules live in
 * `backupPlanner`; OS calls live in `notifeeScheduler`.
 *
 * Reconciles every minute and whenever the plan, program or My day
 * changes. Runs are serialized: a request during a run queues one
 * follow-up run.
 */
import {drillForPlanChime, planWithWeather} from '../conditions/weather';
import {entriesForDay, handledPulseIds} from '../journal/journal';
import {subscribeProgram} from '../program/repository';
import {expandPlanToFires, planPulseId} from '../reminders/expandPlan';
import {
  cancelBackupChime,
  exactAlarmsAllowed,
  listBackupChimes,
  scheduleBackupChime,
} from '../reminders/notifeeScheduler';
import {loadPlan, subscribePlan} from '../reminders/repository';
import type {ReminderPayload} from '../reminders/types';
import {
  getActiveHours,
  readPauseUntil,
  subscribeActiveHours,
} from './activeHours';
import {
  BACKUP_HORIZON_MS,
  planBackups,
  type BackupCandidate,
} from './backupPlanner';
import {pulsePayload} from './pulsePayload';
import {queuedPulses} from './pulseRuntime';
import {absorbedWaterCalls, setsToday} from './setScheduler';

export const BACKUP_RECONCILE_MS = 60_000;

/**
 * Every chime due within the horizon, in increasing precedence: plan
 * cadence (minus water calls riding along with a round), today's and
 * tomorrow's rounds, then pulses the runtime holds (a snoozed or deferred
 * pulse's new time overrides its planned one).
 */
export function backupCandidates(
  now: number,
): BackupCandidate<ReminderPayload>[] {
  const out: BackupCandidate<ReminderPayload>[] = [];

  const plan = planWithWeather(loadPlan(), now);
  const riding = absorbedWaterCalls(now);
  for (const fire of expandPlanToFires(plan, now, now + BACKUP_HORIZON_MS)) {
    const pulseId = planPulseId(fire);
    if (riding.has(pulseId)) {
      continue;
    }
    const window = plan.windows.find(w => w.id === fire.windowId);
    const {drill, note, detail} = drillForPlanChime(
      window?.slots[fire.slotIndex],
      pulseId,
      fire.ts,
      window,
    );
    out.push({
      pulseId,
      dueAt: fire.ts,
      payload: pulsePayload({
        pulseId,
        element: drill?.element ?? fire.element,
        exerciseId: drill?.id,
        note: note ?? detail,
      }),
    });
  }

  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const rounds = [
    ...setsToday(now).upcoming,
    ...setsToday(tomorrow.getTime()).upcoming,
  ];
  for (const fire of rounds) {
    out.push({
      pulseId: fire.id,
      dueAt: fire.ts,
      payload: pulsePayload({
        pulseId: fire.id,
        element: fire.element,
        exerciseId: fire.exerciseId,
        prescription: fire.prescription,
      }),
    });
  }

  for (const pulse of queuedPulses()) {
    out.push({
      pulseId: pulse.id,
      dueAt: pulse.fireAt,
      payload: pulsePayload({
        pulseId: pulse.id,
        element: pulse.element,
        exerciseId: pulse.exerciseId,
        prescription: pulse.prescription,
        note: pulse.note,
      }),
    });
  }
  return out;
}

async function run(now: number): Promise<void> {
  const [existing, exact] = await Promise.all([
    listBackupChimes(),
    exactAlarmsAllowed(),
  ]);
  const {create, cancel} = planBackups({
    now,
    candidates: backupCandidates(now),
    firedIds: handledPulseIds(entriesForDay(new Date(now))),
    activeHours: getActiveHours(),
    pauseUntil: readPauseUntil(),
    existing,
  });
  for (const id of cancel) {
    await cancelBackupChime(id).catch(() => {});
  }
  for (const spec of create) {
    await scheduleBackupChime(spec.payload, spec.triggerAt, {
      exact,
      kind: 'backup',
    }).catch(err =>
      console.warn('[backupScheduler] schedule failed', spec.pulseId, err),
    );
  }
}

let inFlight: Promise<void> | null = null;
let rerun = false;

/** Reconcile OS backups with the upcoming chimes. Safe to call often. */
export function reconcileBackupsNow(now: number = Date.now()): Promise<void> {
  if (inFlight) {
    rerun = true;
    return inFlight;
  }
  inFlight = run(now)
    .catch(err => console.warn('[backupScheduler] reconcile failed', err))
    .finally(() => {
      inFlight = null;
      if (rerun) {
        rerun = false;
        reconcileBackupsNow();
      }
    });
  return inFlight;
}

let timer: ReturnType<typeof setInterval> | null = null;
let unsubs: Array<() => void> = [];

/** Idempotent; call once after hydration. */
export function startBackupScheduler(): void {
  if (timer !== null) {
    return;
  }
  reconcileBackupsNow();
  timer = setInterval(() => {
    reconcileBackupsNow();
  }, BACKUP_RECONCILE_MS);
  const onChange = () => {
    reconcileBackupsNow();
  };
  unsubs = [
    subscribePlan(onChange),
    subscribeProgram(onChange),
    subscribeActiveHours(onChange),
  ];
}

export function stopBackupScheduler(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  unsubs.forEach(u => u());
  unsubs = [];
}
