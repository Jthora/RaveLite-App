import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {syncAmbientService} from './ambientLifecycle';
import {refreshAlivePause} from './aliveBridge';
import {reconcileBackupsNow} from './backupScheduler';

/**
 * Manual pause — the operator silencing chimes for a while.
 *
 * The pause itself is one stored timestamp that paging checks
 * (`activeHours.pagingAllowedAt`). Setting it also re-checks the
 * foreground service, re-plans the OS backup chimes (a paused chime
 * shouldn't ring from a backup) and rests the alive layer.
 */

export type PauseDurationKey = 'p30' | 'p2h' | 'tonight' | 'off';

/** When a pause chosen at `now` ends; undefined clears the pause. */
export function pauseUntilFor(
  key: PauseDurationKey,
  now: number,
): number | undefined {
  switch (key) {
    case 'p30':
      return now + 30 * 60_000;
    case 'p2h':
      return now + 2 * 60 * 60_000;
    case 'tonight': {
      // Until 06:00 the next morning, local time.
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(6, 0, 0, 0);
      return d.getTime();
    }
    default:
      return undefined;
  }
}

export function setPause(
  key: PauseDurationKey,
  now: number = Date.now(),
): void {
  const until = pauseUntilFor(key, now);
  if (until === undefined) {
    store.delete(KEYS.manualPauseUntil);
  } else {
    store.set(KEYS.manualPauseUntil, String(until));
  }
  syncAmbientService();
  reconcileBackupsNow();
  refreshAlivePause();
}
