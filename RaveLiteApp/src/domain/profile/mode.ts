/**
 * What is true right now, over the top of everything else.
 *
 * Facts gate what is possible; the day shape sizes it. A mode is the third
 * thing: a hotel room, a bad shoulder, a festival weekend, a day off. All
 * of them are temporary, and every one of them is a moment where a program
 * built for a normal week starts lying — asking for a pull-up bar that is
 * 300 miles away, or reading three days of doctor's orders as failure and
 * cutting the sets you had earned.
 *
 * So modes expire by themselves. There is exactly one at a time, it says
 * when it ends when it starts, and nothing here is a setting anyone has to
 * remember to undo.
 */
import {DEFAULT_FACTS, type Facts, type KitItem, type Region} from './kit';

export type ModeId = 'travelling' | 'injured' | 'festival' | 'rest';

export interface Mode {
  id: ModeId;
  startedAt: number;
  /** When it lifts on its own. An injury with no end is `undefined`. */
  expiresAt?: number;
  /** Injured: the part that must not be loaded. */
  region?: Region;
  /** Travelling: what the room actually has. */
  kit?: KitItem[];
}

export interface ModeSpec {
  id: ModeId;
  /** Completes "Today I'm…". */
  name: string;
  detail: string;
  /** Days it runs for, or undefined when it is cleared by hand. */
  days?: number;
  /** Share of a normal day's volume while it is on. */
  density: number;
  /** Whether Daily Sets ask for anything at all. */
  trains: boolean;
  /**
   * Whether the ramp stops reading these days. True wherever the mode is
   * itself the reason for doing less — otherwise the app punishes you for
   * following its own advice.
   */
  pausesRamp: boolean;
}

/**
 * A hotel room is the honest default kit: somewhere to stand and a wall.
 * Anything more is a bonus the traveller can add back.
 */
export const TRAVEL_KIT: readonly KitItem[] = ['floor', 'wall'];

export const MODES: readonly ModeSpec[] = [
  {
    id: 'travelling',
    name: 'away from home',
    detail: 'A room, a floor and a wall. Quiet hours, nothing outdoors.',
    days: 7,
    density: 0.67,
    trains: true,
    pausesRamp: true,
  },
  {
    id: 'injured',
    name: 'hurt somewhere',
    detail: 'Nothing that loads it. The ramp waits until you clear it.',
    density: 1,
    trains: true,
    pausesRamp: true,
  },
  {
    id: 'festival',
    name: 'at a festival',
    detail: 'Water, feet and sleep. The dancing is the training.',
    days: 3,
    density: 0.33,
    trains: true,
    pausesRamp: true,
  },
  {
    id: 'rest',
    name: 'taking the day off',
    detail: 'Water and the evening review. Your streak survives it.',
    days: 1,
    density: 0,
    trains: false,
    pausesRamp: true,
  },
];

const BY_ID = new Map(MODES.map(spec => [spec.id, spec]));

export function modeSpec(id: ModeId): ModeSpec | undefined {
  return BY_ID.get(id);
}

const MS_PER_DAY = 86_400_000;

/** A mode starting now, expiring on its own where it should. */
export function startMode(
  id: ModeId,
  now: number,
  opts: {region?: Region; kit?: KitItem[]} = {},
): Mode | undefined {
  const spec = BY_ID.get(id);
  if (!spec) {
    return undefined;
  }
  return {
    id,
    startedAt: now,
    ...(spec.days !== undefined
      ? {expiresAt: endOfDayAfter(now, spec.days - 1)}
      : {}),
    ...(opts.region ? {region: opts.region} : {}),
    ...(opts.kit ? {kit: [...opts.kit]} : {}),
  };
}

/**
 * Modes end at the end of a day, not at the hour they were started. A rest
 * day begun at 09:00 is a day off, not until 09:00 tomorrow.
 */
function endOfDayAfter(now: number, days: number): number {
  const end = new Date(now);
  end.setDate(end.getDate() + Math.max(0, days));
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

/** The mode in force, or undefined once it has expired. */
export function activeMode(
  mode: Mode | undefined,
  now: number,
): Mode | undefined {
  if (!mode) {
    return undefined;
  }
  if (mode.expiresAt !== undefined && now > mode.expiresAt) {
    return undefined;
  }
  return mode;
}

/**
 * The room, as the mode says it is. Travelling replaces the kit rather
 * than trimming it, because a bar at home is not a bar in a hotel; it also
 * drops to quiet, since the floor below belongs to a stranger.
 */
export function factsUnder(facts: Facts, mode: Mode | undefined): Facts {
  if (!mode) {
    return facts;
  }
  if (mode.id === 'injured') {
    return mode.region ? {...facts, injured: mode.region} : facts;
  }
  if (mode.id !== 'travelling') {
    return facts;
  }
  // One room, not your places: a hotel has no yard, whatever home has.
  return {
    ...facts,
    kit: [...(mode.kit ?? TRAVEL_KIT)],
    places: undefined,
    limits: undefined,
    noise: 'quiet',
  };
}

/** The part that must not be loaded, if any. */
export function injuredRegion(mode: Mode | undefined): Region | undefined {
  return mode?.id === 'injured' ? mode.region : undefined;
}

/** A day's density once the mode has had its say. */
export function densityUnder(density: number, mode: Mode | undefined): number {
  const spec = mode ? BY_ID.get(mode.id) : undefined;
  return spec ? density * spec.density : density;
}

/** Whether Daily Sets ask for anything today. */
export function trainsUnder(mode: Mode | undefined): boolean {
  const spec = mode ? BY_ID.get(mode.id) : undefined;
  return spec ? spec.trains : true;
}

/** Whether the ramp should stop reading these days as a verdict. */
export function rampPaused(mode: Mode | undefined): boolean {
  const spec = mode ? BY_ID.get(mode.id) : undefined;
  return spec ? spec.pausesRamp : false;
}

/** "Away from home · 4 days left", for the chip and the settings row. */
export function modeLabel(mode: Mode, now: number): string {
  const spec = BY_ID.get(mode.id);
  const name = spec ? spec.name : mode.id;
  const head = name.charAt(0).toUpperCase() + name.slice(1);
  const part = mode.region ? `${head} · ${mode.region}` : head;
  if (mode.expiresAt === undefined) {
    return part;
  }
  const left = Math.max(0, Math.ceil((mode.expiresAt - now) / MS_PER_DAY));
  if (left <= 1) {
    return `${part} · today`;
  }
  return `${part} · ${left} days left`;
}

/** The facts a fresh traveller starts from, when nothing else is known. */
export const TRAVEL_FACTS: Facts = {
  ...DEFAULT_FACTS,
  kit: [...TRAVEL_KIT],
  noise: 'quiet',
};
