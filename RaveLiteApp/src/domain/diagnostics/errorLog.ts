/**
 * The last fifty things that went wrong.
 *
 * There are 36 silent `catch` blocks and 19 `console.warn` calls in this
 * app. Between them they handle a corrupt plan, a failed forecast, a
 * listener that threw and a dozen other things — and every one of them
 * currently tells nobody. On a phone there is no console to read, so a
 * failure looks exactly like a number being slightly wrong.
 *
 * This is the cheapest possible fix: a ring buffer in storage that the
 * export already carries. A tester's bug report then arrives with the
 * stack in it, rather than with "it just stopped working".
 *
 * Rules it has to keep, because a logger that hurts is a logger that gets
 * turned off:
 *
 * - **Never throw.** A logger that can fail while recording a failure is
 *   worse than no logger.
 * - **Never grow.** Fifty entries, oldest dropped, so a crash loop cannot
 *   fill somebody's phone.
 * - **Never carry training data.** Messages only, no journal entries, no
 *   places, no values.
 */
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';

export const MAX_ENTRIES = 50;
/** Longer than this and it is a stack, not a message. */
const MAX_TEXT = 600;

export interface LoggedError {
  at: number;
  /** Where it happened: 'weather', 'restore', 'render:CharacterSheet'. */
  where: string;
  what: string;
  /** First few frames, when there were any. */
  stack?: string;
}

const clip = (text: string, max = MAX_TEXT) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

/** What an unknown throw actually said. */
export function describe(error: unknown): {what: string; stack?: string} {
  if (error instanceof Error) {
    return {
      what: clip(`${error.name}: ${error.message}`, 200),
      stack: error.stack ? clip(error.stack) : undefined,
    };
  }
  if (typeof error === 'string') {
    return {what: clip(error, 200)};
  }
  try {
    return {what: clip(JSON.stringify(error) ?? String(error), 200)};
  } catch {
    return {what: 'an error that could not be described'};
  }
}

export function readErrors(): LoggedError[] {
  try {
    const raw = store.getString(KEYS.errorLog);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as LoggedError[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Record something that went wrong. Returns the entry so a caller can
 * show it; swallows everything, because this is the last place that
 * should ever be the cause of a crash.
 */
export function logError(
  where: string,
  error: unknown,
  now: number = Date.now(),
): LoggedError | undefined {
  try {
    const {what, stack} = describe(error);
    const entry: LoggedError = {
      at: now,
      where,
      what,
      ...(stack ? {stack} : {}),
    };
    const next = [...readErrors(), entry].slice(-MAX_ENTRIES);
    store.set(KEYS.errorLog, JSON.stringify(next));
    // Still shout, for anyone with a cable attached.
    console.warn(`[${where}] ${what}`);
    return entry;
  } catch {
    return undefined;
  }
}

export function clearErrors(): void {
  try {
    store.delete(KEYS.errorLog);
  } catch {
    // Nothing sensible to do if even clearing fails.
  }
}

/** "3 in the last day, 11 in all" — for the Settings row. */
export function errorSummary(
  errors: readonly LoggedError[] = readErrors(),
  now: number = Date.now(),
): string {
  if (errors.length === 0) {
    return 'Nothing has gone wrong that the app noticed.';
  }
  const day = errors.filter(e => now - e.at < 86_400_000).length;
  const all = errors.length;
  const capped = all >= MAX_ENTRIES ? `${MAX_ENTRIES}+` : `${all}`;
  return day > 0
    ? `${day} in the last day, ${capped} kept.`
    : `${capped} kept, none in the last day.`;
}
