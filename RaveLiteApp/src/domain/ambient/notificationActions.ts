/**
 * Notification buttons → pulse answers.
 *
 * Handles Done / +5 / Skip pressed on a pulse notification (live or OS
 * backup), whether the app is foregrounded (via
 * `startNotifeeForegroundBridge`) or not (via `notifee.onBackgroundEvent`
 * in `index.js`).
 *
 * If the runtime still holds the pulse as active, the answer goes through
 * it exactly like a tap on the Always-On screen. If it doesn't (the pulse
 * expired, or the process was started just to handle the press), the
 * answer is written straight to the journal so the set still counts — and
 * a +5 is handed to the OS as a snooze chime.
 */
import {append, entriesForDay} from '../journal/journal';
import {
  cancelPulseNotification,
  exactAlarmsAllowed,
  scheduleBackupChime,
  type NotificationAction,
} from '../reminders/notifeeScheduler';
import type {ElementId} from '../../theme/elements';
import {prescriptionFromData, pulsePayload} from './pulsePayload';
import {answerActivePulse} from './pulseRuntime';
import {reconcileSetsNow} from './setScheduler';

/** +5 on a notification the runtime no longer holds. */
export const DETACHED_SNOOZE_MS = 5 * 60_000;

export async function handleNotificationAction(
  action: NotificationAction,
  now: number = Date.now(),
): Promise<void> {
  const {pulseId, trackId} = action.data;
  if (!pulseId) {
    return;
  }
  const handled = answerActivePulse(pulseId, action.actionId, now);
  // Clear the notification (and any backup sharing its id) before a
  // detached snooze schedules a fresh one under the same id.
  await cancelPulseNotification(pulseId).catch(() => {});
  if (!handled) {
    if (action.actionId === 'snooze') {
      await snoozeDetached(action, now);
    } else {
      recordDetachedAnswer(action, now);
    }
  }
  if (trackId && action.actionId === 'seal') {
    reconcileSetsNow(now);
  }
}

function recordDetachedAnswer(action: NotificationAction, now: number): void {
  const {pulseId, trackId, amount, element, exerciseId} = action.data;
  const today = entriesForDay(new Date(now));
  const answered = today.some(
    e =>
      (e.kind === 'completion' && e.pulseId === pulseId) ||
      (e.kind === 'reminder.skipped' && e.pulseId === pulseId),
  );
  if (answered) {
    return;
  }
  if (action.actionId === 'seal') {
    const parsed = Number(amount);
    append({
      kind: 'completion',
      at: now,
      exerciseId: exerciseId ?? 'unknown',
      element: (element ?? 'heart') as ElementId,
      source: 'notification',
      pulseId,
      ...(trackId && Number.isFinite(parsed) ? {trackId, amount: parsed} : {}),
    });
  } else if (action.actionId === 'skip') {
    append({
      kind: 'reminder.skipped',
      at: now,
      pulseId,
      respondedAfterMs: null,
    });
  }
}

/** No live pulse to re-queue: let the OS chime the same pulse in 5 min. */
async function snoozeDetached(
  action: NotificationAction,
  now: number,
): Promise<void> {
  const {pulseId, element, exerciseId} = action.data;
  const payload = pulsePayload({
    pulseId,
    element: (element ?? 'heart') as ElementId,
    exerciseId,
    prescription: prescriptionFromData(action.data),
  });
  await scheduleBackupChime(payload, now + DETACHED_SNOOZE_MS, {
    exact: await exactAlarmsAllowed(),
    kind: 'snooze',
  }).catch(err =>
    // eslint-disable-next-line no-console
    console.warn('[notificationActions] snooze schedule failed', err),
  );
}
