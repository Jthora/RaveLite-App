import type {ElementId} from '../../theme/elements';
import type {InfoLink} from '../info/info';
import type {MoveId} from '../exercises/moves';
import type {ActivityItem, ActivitySource} from '../activity/activity';
import type {JournalEntry, SuppressionReason} from '../journal/types';

/**
 * Today's list — pure. One list for the whole day from every source:
 * what was done (chimes answered, drill taps, circuit legs, Train log
 * entries, max tests) and what the day's chimes are doing (active,
 * upcoming, skipped, missed).
 *
 * A done record is one row even when it expands into several activity
 * items: a round reads as its moves, with its partner drill and glass of
 * water as the detail; a drill with a ride-along (a water call's eye break)
 * reads as the drill. A chime that was answered shows only as that done
 * row. Missed chimes stay in the list, dimmed by the view, and are never
 * counted or used as a headline. A chime that never sounded — paused, or
 * outside My day — is not missed: it is its own quiet row and stays out of
 * Catch up.
 */

export type DayRowStatus =
  | 'done'
  | 'active'
  | 'upcoming'
  | 'skipped'
  | 'missed'
  /** It never sounded: paused, outside My day, battery saver. Not missed. */
  | 'unsounded';

export interface DayRow {
  id: string;
  at: number;
  element: ElementId;
  status: DayRowStatus;
  label: string;
  detail?: string;
  /** For done rows: where the record came from. */
  source?: ActivitySource;
  /** For done rows: the stored record, so a Train entry can be edited. */
  ref?: ActivityItem['ref'];
  /** The movement, for its pictogram. */
  move?: MoveId;
  /** For chime rows: the drill the chime asked for. */
  exerciseId?: string;
  /** For a chime that is several things: each piece, to explain one by one. */
  parts?: readonly InfoLink[];
}

/** A chime on today's schedule (plan chime or Daily Sets round). */
export interface ScheduledChime {
  id: string;
  ts: number;
  element: ElementId;
  label: string;
  detail?: string;
  move?: MoveId;
  exerciseId?: string;
  /** A round's moves, partner and glass. */
  parts?: readonly InfoLink[];
}

export interface DayListInput {
  now: number;
  /** Today's activity (see `activityForDay`). */
  activity: readonly ActivityItem[];
  /** Today's journal, for skips. */
  journal: readonly JournalEntry[];
  /** Today's chimes still on the schedule or already chimed. */
  scheduled: readonly ScheduledChime[];
  /** The chime sounding right now, if any. */
  active?: ScheduledChime;
  /** Current fire time of queued chimes (a +5 moves a chime later). */
  queuedAt?: ReadonlyMap<string, number>;
  /**
   * When the day started for this person — setup, on its day. A chime
   * from before it is left out: it was never theirs to miss.
   */
  from?: number;
  /** When the app was not running (`ambient/heartbeat.ts`). */
  closed?: readonly {from: number; to: number}[];
}

/** Why a chime did not sound, as the row says it. */
const UNSOUNDED: Record<SuppressionReason, string> = {
  'manual-pause': 'Paused, did not sound',
  'outside-active-hours': 'Outside My day, did not sound',
  'battery-saver': 'Battery saver, did not sound',
  'app-closed': 'RaveLite was closed, did not sound',
};

const STATUS_ORDER: Record<DayRowStatus, number> = {
  done: 0,
  skipped: 1,
  missed: 2,
  unsounded: 2,
  active: 3,
  upcoming: 4,
};

function doneRow(items: ActivityItem[]): DayRow {
  const [first] = items;
  const base = {
    id: `${first.ref.store}:${first.ref.id}`,
    at: first.at,
    element: first.element,
    status: 'done' as const,
    source: first.source,
    ref: first.ref,
    move: first.move,
  };
  if (items.length === 1) {
    return {...base, label: first.label, detail: first.detail};
  }
  const moves = items.filter(i => i.trackId);
  const extras = items.filter(i => !i.trackId);
  if (moves.length === 0) {
    const [, ...rest] = items;
    return {
      ...base,
      label: first.label,
      detail:
        [first.detail, ...rest.map(i => i.label)].filter(Boolean).join(' · ') ||
        undefined,
    };
  }
  return {
    ...base,
    label: moves
      .map(m => (m.detail ? `${m.label} ${m.detail}` : m.label))
      .join(' + '),
    detail: extras.map(i => i.label).join(' · ') || undefined,
  };
}

export function buildDayList(input: DayListInput): DayRow[] {
  const {now, activity, journal, scheduled, active, queuedAt, from, closed} =
    input;
  const rows: DayRow[] = [];

  const records = new Map<string, ActivityItem[]>();
  for (const item of activity) {
    const key = `${item.ref.store}:${item.ref.id}`;
    records.set(key, [...(records.get(key) ?? []), item]);
  }
  for (const items of records.values()) {
    rows.push(doneRow(items));
  }

  const answered = new Set(
    activity.map(i => i.pulseId).filter((id): id is string => !!id),
  );
  const skipped = new Set(
    journal.flatMap(e => (e.kind === 'reminder.skipped' ? [e.pulseId] : [])),
  );
  const unsounded = new Map(
    journal.flatMap(e =>
      e.kind === 'reminder.suppressed' ? [[e.pulseId, e.reason] as const] : [],
    ),
  );
  // A chime the journal saw sound is not one the app was closed for.
  const sounded = new Set(
    journal.flatMap(e => (e.kind === 'reminder.fired' ? [e.pulseId] : [])),
  );
  const chimes = [...scheduled];
  if (active && !chimes.some(c => c.id === active.id)) {
    chimes.push(active);
  }
  for (const chime of chimes) {
    if (answered.has(chime.id)) {
      continue;
    }
    const at = queuedAt?.get(chime.id) ?? chime.ts;
    if (from !== undefined && at < from && chime.id !== active?.id) {
      continue;
    }
    const why =
      unsounded.get(chime.id) ??
      (!sounded.has(chime.id) && closed?.some(g => at > g.from && at < g.to)
        ? 'app-closed'
        : undefined);
    const status: DayRowStatus =
      chime.id === active?.id
        ? 'active'
        : skipped.has(chime.id)
        ? 'skipped'
        : queuedAt?.has(chime.id) || at > now
        ? 'upcoming'
        : why
        ? 'unsounded'
        : 'missed';
    rows.push({
      id: chime.id,
      at,
      element: chime.element,
      status,
      label: chime.label,
      detail:
        status === 'unsounded' && why
          ? [UNSOUNDED[why], chime.detail].filter(Boolean).join(' · ')
          : chime.detail,
      move: chime.move,
      exerciseId: chime.exerciseId,
      parts: chime.parts,
    });
  }

  return rows.sort(
    (a, b) => a.at - b.at || STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
}
