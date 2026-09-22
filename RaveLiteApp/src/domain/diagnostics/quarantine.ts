import {store} from '../../storage';
import {logError} from './errorLog';

/**
 * Keep a copy of saved data that would not read, before anything
 * replaces it.
 *
 * The Train log, the program, the profile and the plan each fall back to
 * a default when their blob will not parse — and the next save then
 * writes that default over the only copy there was. So the first
 * unreadable copy is kept under `quarantine.<key>`: it travels with every
 * export, and a year of runs can still be recovered by hand from it.
 */
export function quarantine(key: string, raw: string, error: unknown): void {
  const copy = `quarantine.${key}`;
  if (store.getString(copy) === undefined) {
    store.set(copy, raw);
  }
  logError(`storage.unreadable.${key}`, error);
}
