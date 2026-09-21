/**
 * What state this install is actually in.
 *
 * Nothing here is computed for the first time — it is the numbers the app
 * already has, gathered into one place so a bug report can carry them and
 * a person can look. "It stopped chiming" is unanswerable; "it stopped
 * chiming, schema 8, notifications denied, last forecast failed four days
 * ago because the location switch is off" answers itself.
 */
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {getFetchReport, getPlace} from '../conditions/weather';
import {hasDeviceModule} from '../../native/raveLiteDevice';
import {loadUnits} from '../settings/units';
import {
  loadArchetype,
  loadPacks,
  loadShape,
  loadMode,
} from '../profile/repository';
import {readErrors, type LoggedError} from './errorLog';

export interface Diagnostic {
  label: string;
  value: string;
  /** Worth looking at, rather than merely true. */
  concern?: boolean;
}

const when = (at: number | undefined, now: number): string => {
  if (!at) {
    return 'never';
  }
  const mins = Math.round((now - at) / 60_000);
  if (mins < 1) {
    return 'just now';
  }
  if (mins < 60) {
    return `${mins} min ago`;
  }
  const hours = Math.round(mins / 60);
  if (hours < 48) {
    return `${hours} h ago`;
  }
  return `${Math.round(hours / 24)} days ago`;
};

/** Everything worth knowing, in the order somebody would ask. */
export function diagnostics(now: number = Date.now()): Diagnostic[] {
  const errors: LoggedError[] = readErrors();
  const recent = errors.filter(e => now - e.at < 7 * 86_400_000).length;
  const fetch = getFetchReport();
  const keys = store.keysWithPrefix('').length;
  const journal = store.keysWithPrefix(KEYS.journalPrefix).length;
  const mode = loadMode(now);

  return [
    {
      label: 'Problems recorded',
      value:
        errors.length === 0
          ? 'none'
          : `${errors.length} kept, ${recent} in the last week`,
      concern: recent > 0,
    },
    {
      label: 'Storage',
      value: `${keys} keys, ${journal} logged things`,
    },
    {
      label: 'Schema',
      value: `v${store.getNumber(KEYS.schemaVersion) ?? '?'}`,
    },
    {
      label: 'Program',
      value: [
        loadArchetype() ?? 'no archetype',
        loadShape(),
        `${loadPacks().length} packs`,
        mode ? `mode: ${mode.id}` : 'no mode',
      ].join(' · '),
    },
    {
      label: 'Units',
      value: loadUnits(),
    },
    {
      label: 'Place',
      value: getPlace()?.name ?? 'not set',
      concern: getPlace() === undefined,
    },
    {
      label: 'Last forecast',
      value: fetch
        ? `${when(fetch.at, now)}${
            fetch.ok ? '' : ` — ${fetch.why ?? 'failed'}`
          }`
        : 'never',
      concern: fetch !== undefined && !fetch.ok,
    },
    {
      label: 'Device features',
      value: hasDeviceModule()
        ? 'cues, location and sharing available'
        : 'not available on this build',
      concern: !hasDeviceModule(),
    },
  ];
}

/** The same thing as text, for pasting into an issue. */
export function diagnosticsText(now: number = Date.now()): string {
  return diagnostics(now)
    .map(d => `${d.label}: ${d.value}`)
    .join('\n');
}
