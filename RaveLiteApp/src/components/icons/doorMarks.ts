import {hues} from '../../theme/hues';
import {MARK_GRID, type MarkShape} from './elementMarks';

/**
 * Marks for Today's four doors — + Log, Session, Practice, Settings — on
 * the element marks' 24-unit grid and line (`MARK_STROKE`), so they sit
 * with the balance strip's marks as one family.
 *
 *   log       a logbook page with a plus: add what you did
 *   session   a stopwatch: time what you are doing now
 *   practice  a spinning staff with its trails: drill a move
 *   settings  three sliders: tune the day
 *
 * Each door has its own colour, chosen for what it opens rather than from
 * the elements, which own training: the heart's chartreuse for logging
 * (the app's colour for acting), time's cyan for the session clock, the
 * rave pink dance and flow already use for practice, and metal's silver
 * for the settings tools.
 */

export type DoorId = 'log' | 'session' | 'practice' | 'settings';

export const DOOR_COLOR: Readonly<Record<Exclude<DoorId, 'log'>, string>> = {
  session: hues.time,
  practice: hues.dance,
  settings: hues.metal,
};

const n = (v: number) => Number(v.toFixed(3));

const circle = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(
    -2 * r,
  )} 0Z`;

const C = MARK_GRID / 2;
const TRAIL = 8.5;
const onTrail = (deg: number): string => {
  const a = (deg * Math.PI) / 180;
  return `${n(C + TRAIL * Math.cos(a))} ${n(C + TRAIL * Math.sin(a))}`;
};
/** A trail a quarter-turn behind each end of the staff, with gaps. */
const trail = (from: number, to: number) =>
  `M${onTrail(from)}A${TRAIL} ${TRAIL} 0 0 1 ${onTrail(to)}`;

export const DOOR_MARKS: Readonly<Record<DoorId, readonly MarkShape[]>> = {
  log: [
    {d: 'M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'},
    {d: 'M14 3v5h5'},
    {d: 'M12 11.5v6'},
    {d: 'M9 14.5h6'},
  ],
  session: [
    {d: circle(12, 13.5, 7.25)},
    {d: 'M10 2.75h4'},
    {d: 'M12 2.75v3.5'},
    {d: 'M12 13.5l3.2-3.2'},
    {d: 'M18.25 6.75l1.5-1.5'},
  ],
  practice: [
    {d: 'M6.4 17.6L17.6 6.4'},
    {d: circle(6.4, 17.6, 1.9), fill: true},
    {d: circle(17.6, 6.4, 1.9), fill: true},
    {d: trail(190, 260)},
    {d: trail(10, 80)},
  ],
  settings: [
    {d: 'M4 5h8.75'},
    {d: 'M17.25 5H20'},
    {d: circle(15, 5, 2.25)},
    {d: 'M4 12h2.75'},
    {d: 'M11.25 12H20'},
    {d: circle(9, 12, 2.25)},
    {d: 'M4 19h9.75'},
    {d: 'M18.25 19H20'},
    {d: circle(16, 19, 2.25)},
  ],
};
