/**
 * What the answers so far add up to.
 *
 * Setup asks four questions and then has to prove it was listening. This
 * is the line under every card — `9 chimes · 6 tracks · 142 drills · par
 * 20` — recomputed from the real program each time a tile is tapped, so
 * the preview is the thing itself rather than a description of it.
 *
 * It exists as its own module because Settings shows the same numbers,
 * and two ways of counting the same day is how a preview starts lying.
 */
import {usableDrills} from './kit';
import {dailyPar, dayRounds, loadFacts, loadPacks} from './repository';
import {groupsFor} from './packs';
import {loadProgram, prescriptionsFor} from '../program/repository';
import {groupIntoRounds} from '../program/rounds';

export interface Preview {
  /** Chimes the day will actually carry, after grouping. */
  rounds: number;
  /** Tracks asking for something today. */
  tracks: number;
  /** Drills this room and these packs can do. */
  drills: number;
  /** Sections the curriculum will teach. */
  lessons: number;
  par: number;
}

export function previewDay(date: Date = new Date()): Preview {
  const prescriptions = prescriptionsFor(loadProgram(date), date);
  return {
    rounds: groupIntoRounds(prescriptions, {rounds: dayRounds()}).length,
    tracks: prescriptions.length,
    drills: usableDrills(loadFacts(date.getTime())).length,
    lessons: groupsFor(loadPacks()).length,
    par: dailyPar(),
  };
}

/** "9 chimes · 16 tracks · 142 drills · par 20". */
export function previewLine(preview: Preview): string {
  const plural = (n: number, one: string, many = `${one}s`) =>
    `${n} ${n === 1 ? one : many}`;
  return [
    plural(preview.rounds, 'chime'),
    plural(preview.tracks, 'track'),
    plural(preview.drills, 'drill'),
    `par ${preview.par}`,
  ].join(' · ');
}

/**
 * What changed between two previews, for the diff Settings shows after an
 * edit: "+14 drills · 2 more chimes". Empty when nothing moved, because
 * a strip that always says something stops being read.
 */
export function previewDiff(before: Preview, after: Preview): string {
  const parts: string[] = [];
  const say = (from: number, to: number, one: string, many = `${one}s`) => {
    const delta = to - from;
    if (delta === 0) {
      return;
    }
    const n = Math.abs(delta);
    parts.push(`${delta > 0 ? '+' : '−'}${n} ${n === 1 ? one : many}`);
  };
  say(before.drills, after.drills, 'drill');
  say(before.rounds, after.rounds, 'chime');
  say(before.tracks, after.tracks, 'track');
  say(before.lessons, after.lessons, 'lesson');
  if (before.par !== after.par) {
    parts.push(`par ${after.par}`);
  }
  return parts.join(' · ');
}
