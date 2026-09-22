import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {activityForDay, activityInRange} from '../activity/activity';
import type {ActivityItem} from '../activity/activity';
import {loadProgram} from '../program/repository';
import {phaseForWeek, programWeek} from '../program/progression';
import {
  STANDARD_EVENTS,
  bestResult,
  getHeightInches,
  getPrimarySex,
} from '../standards/standards';
import {localDayKey} from '../training/grading';
import {getMetric, loadEntries} from '../training/repository';
import {ATTRIBUTES, type Attribute, type AttributeId} from './attributes';
import {
  PRACTICE_CAP,
  characterLevel,
  focusMultiplier,
  gainXp,
  levelFromResult,
  losesLevelAfter,
  xpToNext,
  type CharacterLevel,
  type Progress,
} from './levels';
import {xpFromActivity} from './trains';
import {restDaySet} from '../profile/restDays';

/**
 * Attributes over time. One stored blob, rolled forward a day at a time
 * from the same activity list every count on screen reads, so the levels
 * can never disagree with the day list.
 *
 * Today is never stored: it's added live on top of what's saved, so a set
 * done a minute ago already shows. The roll-up only ever closes days that
 * are finished.
 */

/** Days of history a first roll-up reaches back through. */
const CATCH_UP_DAYS = 35;

export interface AttributeProgress extends Progress {
  /** Local day key this attribute last earned anything. */
  lastFedDay?: string;
}

export interface AttributesState {
  version: 1;
  byId: Partial<Record<AttributeId, AttributeProgress>>;
  /** Local day key the roll-up has counted through. */
  throughDay?: string;
  /** Every point of XP ever poured in — the character's level. */
  totalXp: number;
}

export function defaultAttributes(): AttributesState {
  return {version: 1, byId: {}, totalXp: 0};
}

export function loadAttributes(): AttributesState {
  const raw = store.getString(KEYS.attributesState);
  if (!raw) {
    return defaultAttributes();
  }
  try {
    const parsed = JSON.parse(raw) as AttributesState;
    return {...defaultAttributes(), ...parsed, byId: parsed.byId ?? {}};
  } catch {
    return defaultAttributes();
  }
}

export function saveAttributes(state: AttributesState): void {
  store.set(KEYS.attributesState, JSON.stringify(state));
}

const progressOf = (
  state: AttributesState,
  id: AttributeId,
): AttributeProgress => state.byId[id] ?? {level: 0, xp: 0};

const dayAt = (now: number, back: number): Date => {
  const day = new Date(now);
  day.setHours(12, 0, 0, 0);
  day.setDate(day.getDate() - back);
  return day;
};

const daysApart = (from: string, to: string): number =>
  Math.round(
    (new Date(`${to}T12:00:00`).getTime() -
      new Date(`${from}T12:00:00`).getTime()) /
      86_400_000,
  );

const nextDay = (key: string): string =>
  localDayKey(new Date(`${key}T12:00:00`).getTime() + 86_400_000);

/**
 * One day's work, poured in. Pure but for the phase test: `deload` weeks
 * are rest by design, so nothing slides during them. A rest day (a mode,
 * an injury, My day off — `profile/restDays.ts`) is not a day idle at
 * all: the neglect clock stands still, so an injury does not cost levels
 * on top of the injury.
 */
function applyDay(
  state: AttributesState,
  key: string,
  items: readonly ActivityItem[],
  deload: boolean,
  rest = false,
): void {
  const focus = progressOf(state, 'focus').level;
  const multiplier = focusMultiplier(focus);
  const earned = xpFromActivity(items);
  for (const attribute of ATTRIBUTES) {
    const before = progressOf(state, attribute.id);
    const xp = (earned[attribute.id] ?? 0) * multiplier;
    if (xp > 0) {
      const after = gainXp(before, xp);
      state.byId[attribute.id] = {...after, lastFedDay: key};
      state.totalXp += xp;
      continue;
    }
    if (deload || !before.lastFedDay) {
      continue;
    }
    if (rest) {
      state.byId[attribute.id] = {
        ...before,
        lastFedDay: nextDay(before.lastFedDay),
      };
      continue;
    }
    if (losesLevelAfter(daysApart(before.lastFedDay, key))) {
      state.byId[attribute.id] = {
        level: Math.max(0, before.level - 1),
        xp: 0,
        lastFedDay: before.lastFedDay,
      };
    }
  }
}

/**
 * Close every finished day since the last roll-up. Cheap after the first
 * run: one pass, and nothing to do at all on a day already counted.
 */
export function reviewAttributes(now: number = Date.now()): AttributesState {
  const state = loadAttributes();
  const yesterday = dayAt(now, 1);
  const through = localDayKey(yesterday.getTime());
  if (state.throughDay !== undefined && state.throughDay >= through) {
    return state;
  }

  const program = loadProgram(new Date(now));
  const earliest = localDayKey(dayAt(now, CATCH_UP_DAYS).getTime());
  const startKey =
    state.throughDay !== undefined
      ? localDayKey(
          new Date(`${state.throughDay}T12:00:00`).getTime() + 86_400_000,
        )
      : program.startDay > earliest
      ? program.startDay
      : earliest;
  if (startKey > through) {
    state.throughDay = through;
    saveAttributes(state);
    return state;
  }

  const from = new Date(`${startKey}T12:00:00`);
  const byDay = new Map<string, ActivityItem[]>();
  for (const item of activityInRange(from, yesterday)) {
    const key = localDayKey(item.at);
    const list = byDay.get(key);
    if (list) {
      list.push(item);
    } else {
      byDay.set(key, [item]);
    }
  }

  const rest = restDaySet();
  for (const day = new Date(from); ; day.setDate(day.getDate() + 1)) {
    const key = localDayKey(day.getTime());
    if (key > through) {
      break;
    }
    const deload =
      phaseForWeek(programWeek(program.startDay, day)) === 'deload';
    applyDay(state, key, byDay.get(key) ?? [], deload, rest.has(key));
  }

  state.throughDay = through;
  saveAttributes(state);
  return state;
}

export interface AttributeStanding {
  attribute: Attribute;
  /** What the app shows: the better of practice and a passed test. */
  level: number;
  /** Where doing the work has carried it, capped at 85. */
  practice: number;
  /** Set by a test result, when there is one. */
  tested?: number;
  /** The event and result behind `tested`. */
  testedBy?: {eventId: string; name: string; value: number; at: number};
  /** XP banked toward the next practice level, and what it needs. */
  xp: number;
  toNext: number;
  /** Earned today, already counted in the numbers above. */
  today: number;
  /** Days since it last earned anything; undefined if it never has. */
  idleDays?: number;
}

export interface AttributeSheet {
  standings: AttributeStanding[];
  character: CharacterLevel;
  /** Focus's learning bonus, as it applies right now. */
  multiplier: number;
}

const EVENTS = new Map(STANDARD_EVENTS.map(e => [e.id, e]));

/** The best level any of an attribute's tests has earned it. */
function testedLevel(
  attribute: Attribute,
): Pick<AttributeStanding, 'tested' | 'testedBy'> {
  if (attribute.events.length === 0) {
    return {};
  }
  const entries = loadEntries();
  const sex = getPrimarySex();
  const height = getHeightInches();
  let out: Pick<AttributeStanding, 'tested' | 'testedBy'> = {};
  for (const eventId of attribute.events) {
    const event = EVENTS.get(eventId);
    if (!event) {
      continue;
    }
    const best = bestResult(event, entries, getMetric, height);
    if (!best) {
      continue;
    }
    const level = levelFromResult(best.value, event.top[sex], event.better);
    if (out.tested === undefined || level > out.tested) {
      out = {
        tested: level,
        testedBy: {
          eventId: event.id,
          name: event.name,
          value: best.value,
          at: best.at,
        },
      };
    }
  }
  return out;
}

/** Where every attribute stands right now, today's work included. */
export function attributeSheet(now: number = Date.now()): AttributeSheet {
  const state = reviewAttributes(now);
  const today = localDayKey(now);
  const multiplier = focusMultiplier(progressOf(state, 'focus').level);
  const done = activityForDay(new Date(now));
  const earnedToday = xpFromActivity(done);
  const live: AttributesState = {
    ...state,
    byId: {...state.byId},
  };
  // Today is still open, so nothing slides for it: `deload` here means
  // "don't let an idle attribute lose a level on a day that isn't over".
  applyDay(live, today, done, true);

  const standings = ATTRIBUTES.map<AttributeStanding>(attribute => {
    const at = progressOf(live, attribute.id);
    const tested = testedLevel(attribute);
    const practice = Math.min(at.level, PRACTICE_CAP);
    return {
      attribute,
      level: Math.max(practice, tested.tested ?? 0),
      practice,
      ...tested,
      xp: Math.round(at.xp),
      toNext: xpToNext(at.level),
      today: Math.round((earnedToday[attribute.id] ?? 0) * multiplier),
      idleDays:
        at.lastFedDay === undefined
          ? undefined
          : daysApart(at.lastFedDay, today),
    };
  });

  return {standings, character: characterLevel(live.totalXp), multiplier};
}
