/**
 * App-wide numeric constants.
 *
 * These were previously duplicated across grading, builtin metrics, the
 * training log sheet/panel/rail, etc. Centralising them avoids unit-conversion
 * drift and makes greps trivial.
 */

/** Milliseconds in a single calendar day (ignoring DST). */
export const MS_PER_DAY = 86_400_000;

/** Meters in one statute mile. */
export const METERS_PER_MILE = 1609.344;
