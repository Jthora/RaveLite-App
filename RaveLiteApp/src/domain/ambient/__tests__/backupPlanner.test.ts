import {
  BACKUP_CAP,
  BACKUP_HORIZON_MS,
  BACKUP_OFFSET_MS,
  planBackups,
  type BackupCandidate,
  type BackupPlanInput,
} from '../backupPlanner';
import {DEFAULT_ACTIVE_HOURS} from '../types';

// Monday 14 Sep 2026, 10:00 local. Default active hours are 05:00–22:00.
const NOW = new Date(2026, 8, 14, 10, 0).getTime();
const MIN = 60_000;

const inMin = (pulseId: string, minutes: number): BackupCandidate<string> => ({
  pulseId,
  dueAt: NOW + minutes * MIN,
  payload: pulseId,
});

const plan = (
  candidates: BackupCandidate<string>[],
  extra: Partial<BackupPlanInput<string>> = {},
) =>
  planBackups({
    now: NOW,
    candidates,
    firedIds: new Set(),
    activeHours: DEFAULT_ACTIVE_HOURS,
    existing: new Map(),
    ...extra,
  });

describe('planBackups', () => {
  it('holds a backup 90 s after each upcoming chime, soonest first', () => {
    const {create, cancel} = plan([inMin('b', 30), inMin('a', 10)]);
    expect(create.map(s => [s.pulseId, s.triggerAt])).toEqual([
      ['a', NOW + 10 * MIN + BACKUP_OFFSET_MS],
      ['b', NOW + 30 * MIN + BACKUP_OFFSET_MS],
    ]);
    expect(cancel).toEqual([]);
  });

  it('skips chimes that are due, already fired, or beyond the horizon', () => {
    const {create} = plan(
      [
        inMin('due', 0),
        inMin('past', -5),
        inMin('fired', 20),
        inMin('far', BACKUP_HORIZON_MS / MIN + 1),
        inMin('ok', 15),
      ],
      {firedIds: new Set(['fired'])},
    );
    expect(create.map(s => s.pulseId)).toEqual(['ok']);
  });

  it('holds nothing where the chime would be suppressed', () => {
    const lateNight: BackupCandidate<string> = {
      pulseId: 'late',
      dueAt: new Date(2026, 8, 14, 23, 30).getTime(),
      payload: 'late',
    };
    const {create} = plan(
      [lateNight, inMin('paused', 20), inMin('after-pause', 40)],
      {pauseUntil: NOW + 30 * MIN},
    );
    expect(create.map(s => s.pulseId)).toEqual(['after-pause']);
  });

  it('caps how many backups the OS holds', () => {
    const many = Array.from({length: BACKUP_CAP + 10}, (_, i) =>
      inMin(`p${i}`, i + 1),
    );
    expect(plan(many).create).toHaveLength(BACKUP_CAP);
  });

  it("a later candidate for the same pulse wins (a snoozed pulse's new time)", () => {
    const {create} = plan([inMin('p', 10), inMin('p', 15)]);
    expect(create).toEqual([
      expect.objectContaining({
        pulseId: 'p',
        triggerAt: NOW + 15 * MIN + BACKUP_OFFSET_MS,
      }),
    ]);
  });

  it('a later due candidate drops an earlier planned backup', () => {
    // e.g. the runtime already holds this pulse waiting behind an active one.
    expect(plan([inMin('p', 10), inMin('p', 0)]).create).toEqual([]);
  });

  it('diffs against what the OS already holds', () => {
    const existing = new Map([
      ['same', NOW + 10 * MIN + BACKUP_OFFSET_MS],
      ['moved', NOW + 20 * MIN + BACKUP_OFFSET_MS],
      ['stale', NOW + 40 * MIN + BACKUP_OFFSET_MS],
    ]);
    const {create, cancel} = plan(
      [inMin('same', 10), inMin('moved', 25), inMin('new', 30)],
      {existing},
    );
    expect(create.map(s => s.pulseId)).toEqual(['moved', 'new']);
    expect([...cancel].sort()).toEqual(['moved', 'stale']);
  });
});
