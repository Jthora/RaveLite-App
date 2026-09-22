/**
 * What the answers so far add up to.
 *
 * Setup asks its questions and then has to prove it was listening. This
 * is the line under every card — `20 chimes a day · 142 drills` —
 * recomputed from the real program each time a tile is tapped, so the
 * preview is the thing itself rather than a description of it. It counts
 * every chime the day will make, not only the Daily Sets rounds: a
 * preview that said 9 for a day of 20 was the first thing a new person
 * would find to be untrue.
 *
 * It exists as its own module because Settings shows the same numbers,
 * and two ways of counting the same day is how a preview starts lying.
 */
import {usableDrills} from './kit';
import {dailyPar, dayRounds, loadFacts, loadPacks} from './repository';
import {groupsFor} from './packs';
import {loadProgram, prescriptionsFor} from '../program/repository';
import {groupIntoRounds} from '../program/rounds';
import {getActiveHours, withinActiveHours} from '../ambient/activeHours';
import {setsToday} from '../ambient/setScheduler';
import {expandPlanToFires, planPulseId} from '../reminders/expandPlan';
import {loadPlan} from '../reminders/repository';

export interface Preview {
  /** Every chime the day makes: rounds and plan chimes inside My day. */
  chimes: number;
  /** Daily Sets rounds, after grouping. */
  rounds: number;
  /** Tracks asking for something today. */
  tracks: number;
  /** Drills this room and these packs can do. */
  drills: number;
  /** Sections the curriculum will teach. */
  lessons: number;
  par: number;
}

/** Plan chimes inside My day that do not ride along with a round. */
function planChimes(date: Date, absorbed: ReadonlySet<string>): number {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const hours = getActiveHours();
  return expandPlanToFires(
    loadPlan(),
    midnight.getTime(),
    midnight.getTime() + 86_399_999,
  ).filter(
    f =>
      withinActiveHours(new Date(f.ts), hours) && !absorbed.has(planPulseId(f)),
  ).length;
}

export function previewDay(date: Date = new Date()): Preview {
  const prescriptions = prescriptionsFor(loadProgram(date), date);
  const rounds = groupIntoRounds(prescriptions, {rounds: dayRounds()}).length;
  // A whole day, whatever the hour setup is answered at.
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  const sets = setsToday(noon.getTime());
  return {
    chimes: sets.fires.length + planChimes(noon, new Set(sets.absorbedPlanIds)),
    rounds,
    tracks: prescriptions.length,
    drills: usableDrills(loadFacts(date.getTime())).length,
    lessons: groupsFor(loadPacks()).length,
    par: dailyPar(),
  };
}

/** "20 chimes a day · 142 drills". Plain words only: no tracks, no par. */
export function previewLine(preview: Preview): string {
  const plural = (n: number, one: string, many = `${one}s`) =>
    `${n} ${n === 1 ? one : many}`;
  return [
    `${plural(preview.chimes, 'chime')} a day`,
    plural(preview.drills, 'drill'),
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
  say(before.chimes, after.chimes, 'chime');
  say(before.tracks, after.tracks, 'track');
  say(before.lessons, after.lessons, 'lesson');
  if (before.par !== after.par) {
    parts.push(`goal ${after.par} points`);
  }
  return parts.join(' · ');
}
