/**
 * Tiny formatters for the Always-On surface.
 *
 * Pure, no React, no RN imports — easy to unit-test if we ever need to.
 */
import {formatClock} from '../../domain/settings/clock';

/** "12m 40s" / "1h 4m" / "0s". `ms` may be negative — clamped to 0. */
export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${s}s`;
}

/** "+12m" / "+1h 4m" / "now". For ETA chips. */
export function formatEta(ms: number): string {
  if (ms <= 0) {
    return 'now';
  }
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) {
    return `+${h}h ${m}m`;
  }
  if (m > 0) {
    return `+${m}m`;
  }
  const sec = Math.floor(ms / 1000);
  return `+${sec}s`;
}

/** A clock reading in local time: "14:30", or "2:30 PM" if that is how
 *  this person's phone is set. See domain/settings/clock. */
export function formatHM(epochMs: number): string {
  return formatClock(epochMs);
}
