/**
 * Notification buttons → pulse answers.
 *
 * Handles Done / +5 / Skip pressed on a pulse notification, whether the
 * app is foregrounded (via `startNotifeeForegroundBridge`) or not (via
 * `notifee.onBackgroundEvent` in `index.js`).
 *
 * If the runtime still holds the pulse as active, the answer goes through
 * it exactly like a tap on the Always-On screen. If it doesn't (the pulse
 * expired, or the process was restarted to handle the press), the answer
 * is written straight to the journal so the set still counts.
 */
import {append, entriesForDay} from '../journal/journal';
import {
  cancelPulseNotification,
  type NotificationAction,
} from '../reminders/notifeeScheduler';
import type {ElementId} from '../../theme/elements';
import {answerActivePulse} from './pulseRuntime';
import {reconcileSetsNow} from './setScheduler';

export async function handleNotificationAction(
  action: NotificationAction,
  now: number = Date.now(),
): Promise<void> {
  const {pulseId, trackId} = action.data;
  if (!pulseId) {
    return;
  }
  const handled = answerActivePulse(pulseId, action.actionId, now);
  if (!handled) {
    recordDetachedAnswer(action, now);
  }
  await cancelPulseNotification(pulseId).catch(() => {});
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
  // A snooze with no live pulse has nothing to re-queue; the
  // notification is simply dismissed.
}
