/**
 * 14:30 or 2:30 PM.
 *
 * The app was written in 24-hour time and assumed everybody read it that
 * way. Plenty of people do not, and a chime at "17:45" is a small piece
 * of arithmetic every single time it appears — on the card, in the day
 * list, in My day, in the plan.
 *
 * The same two rules as units:
 *
 * **Guess, don't ask.** Android already knows: the person set it once in
 * the system clock settings, and `DateFormat.is24HourFormat` reports it.
 * Asking again in setup would be a question the app could have answered.
 *
 * **Never move the ground under somebody already standing on it** — with
 * one difference from units, and it is why the default here is the guess
 * for *everybody*, not only for fresh installs. 20 miles and 20 km are
 * different distances; 14:30 and 2:30 PM are the same moment written two
 * ways. Nothing can be misread, so following the phone costs nobody
 * anything and spares the person who has been doing the arithmetic.
 *
 * What is stored never changes. My day and the plan keep their canonical
 * "HH:MM" on disk, 24-hour, always — this module is display only. An
 * export written on a 12-hour phone restores on a 24-hour one and means
 * the same thing.
 */
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

/** 'auto' follows the phone; the other two are the person overriding it. */
export type ClockFormat = 'auto' | '24' | '12';

/**
 * What the app showed before it could be asked, and what it falls back to
 * when nothing has told it otherwise — a build with no native module, or
 * the moment before the phone has answered.
 */
export const LEGACY_CLOCK_IS_24 = true;

let phoneIs24 = LEGACY_CLOCK_IS_24;

export function loadClockFormat(): ClockFormat {
  const stored = store.getString(KEYS.clock);
  return stored === '12' || stored === '24' || stored === 'auto'
    ? stored
    : 'auto';
}

export function setClockFormat(format: ClockFormat): void {
  store.set(KEYS.clock, format);
}

/**
 * Remember what the phone is set to, so the formatters can stay
 * synchronous — they are called in render, and a promise there would
 * mean every clock on screen flickering through a first paint.
 */
export function rememberPhoneClock(is24: boolean | undefined): void {
  if (typeof is24 === 'boolean') {
    phoneIs24 = is24;
  }
}

/** Read once at boot, beside the units guess. Never throws. */
export async function loadPhoneClockOnce(
  read: () => Promise<{is24Hour?: boolean} | null>,
): Promise<void> {
  try {
    rememberPhoneClock((await read())?.is24Hour);
  } catch {
    // The fallback is what the app always showed.
  }
}

/** Whether a time should be drawn 24-hour, right now. */
export function is24Hour(format: ClockFormat = loadClockFormat()): boolean {
  return format === 'auto' ? phoneIs24 : format === '24';
}

/**
 * Hours and minutes as a clock reading.
 *
 * Midnight and noon are where twelve-hour clocks go wrong: hour 0 is
 * 12 AM and hour 12 is 12 PM, and `h % 12` gives 0 for both.
 */
export function clockOf(hours: number, minutes: number): string {
  const mm = String(minutes).padStart(2, '0');
  if (is24Hour()) {
    return `${String(hours).padStart(2, '0')}:${mm}`;
  }
  const suffix = hours < 12 ? 'AM' : 'PM';
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${h}:${mm} ${suffix}`;
}

/** A moment in time, as a clock reading. */
export function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  return clockOf(d.getHours(), d.getMinutes());
}

/**
 * A stored "HH:MM" as a clock reading. The argument is always canonical
 * 24-hour, because that is what is on disk; only the answer changes.
 */
export function formatClockHHMM(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return hhmm;
  }
  return clockOf(h, m);
}

/** Only for tests. */
export function __resetClock(): void {
  phoneIs24 = LEGACY_CLOCK_IS_24;
}
