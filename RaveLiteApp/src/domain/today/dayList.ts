import type {ElementId} from '../../theme/elements';
import type {InfoLink} from '../info/info';
import type {MoveId} from '../exercises/moves';
import type {ActivityItem, ActivitySource} from '../activity/activity';
import type {JournalEntry} from '../journal/types';

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
 * counted or used as a headline.
 */

export type DayRowStatus =
  | 'done'
  | 'active'
  | 'upcoming'
  | 'skipped'
  | 'missed';

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
}

const STATUS_ORDER: Record<DayRowStatus, number> = {
  done: 0,
  skipped: 1,
  missed: 2,
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
  const {now, activity, journal, scheduled, active, queuedAt} = input;
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
  const chimes = [...scheduled];
  if (active && !chimes.some(c => c.id === active.id)) {
    chimes.push(active);
  }
  for (const chime of chimes) {
    if (answered.has(chime.id)) {
      continue;
    }
    const at = queuedAt?.get(chime.id) ?? chime.ts;
    const status: DayRowStatus =
      chime.id === active?.id
        ? 'active'
        : skipped.has(chime.id)
        ? 'skipped'
        : queuedAt?.has(chime.id) || at > now
        ? 'upcoming'
        : 'missed';
    rows.push({
      id: chime.id,
      at,
      element: chime.element,
      status,
      label: chime.label,
      detail: chime.detail,
      move: chime.move,
      exerciseId: chime.exerciseId,
      parts: chime.parts,
    });
  }

  return rows.sort(
    (a, b) => a.at - b.at || STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
}
