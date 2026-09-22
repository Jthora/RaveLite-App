import {startAmbientLifecycle} from '../domain/ambient/ambientLifecycle';
import {startBackupScheduler} from '../domain/ambient/backupScheduler';
import {startPlanScheduler} from '../domain/ambient/planScheduler';
import {startPulseRuntime} from '../domain/ambient/pulseRuntime';
import {startSetScheduler} from '../domain/ambient/setScheduler';
import {startWeather} from '../domain/conditions/weather';
import {needsSetup} from '../domain/profile/repository';
import {runMigrations} from '../storage/migrations';
import {ensureHydrated, persistenceHealth} from '../storage/persistence';

/** How long the task waits for the foreground service to take over. */
export const HANDOVER_MS = 8_000;

/**
 * `RaveLiteBoot`: started by `BootReceiver` after a reboot or an update,
 * with no screen. It does what opening the app does for chimes — load
 * storage, migrate, start the runtime, both schedulers, the backups and
 * the foreground service — and then waits a moment, because the service's
 * own long-lived task is what keeps the JS runtime running after this one
 * returns. Opening the app later starts the same things again; each start
 * is a no-op when already running.
 *
 * It starts nothing when the data could not be read, or before setup:
 * a new install has no day to chime through yet.
 */
export async function bootTask(
  wait: (ms: number) => Promise<void> = ms =>
    new Promise(resolve => setTimeout(resolve, ms)),
): Promise<boolean> {
  await ensureHydrated();
  if (persistenceHealth().readFailed) {
    return false;
  }
  runMigrations();
  if (needsSetup()) {
    return false;
  }
  startPulseRuntime();
  startPlanScheduler();
  startSetScheduler();
  startBackupScheduler();
  startWeather();
  startAmbientLifecycle();
  await wait(HANDOVER_MS);
  return true;
}
