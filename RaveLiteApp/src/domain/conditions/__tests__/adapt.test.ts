import {EXERCISE_LIBRARY} from '../../exercises/library';
import {
  DEFAULT_WEATHER_PREFS,
  adaptDrill,
  canGoInside,
  indoorAlternative,
  needsOutside,
} from '../adapt';
import type {Conditions} from '../conditions';

const drill = (id: string) => {
  const found = EXERCISE_LIBRARY.find(e => e.id === id);
  if (!found) {
    throw new Error(`no drill ${id}`);
  }
  return found;
};

const clear: Conditions = {
  known: true,
  dark: false,
  rain: false,
  rainChance: 0,
  storm: false,
  tempC: 18,
  feelsC: 18,
  heat: 'none',
  cold: false,
  icy: false,
  bugs: 'low',
};
const prefs = DEFAULT_WEATHER_PREFS;
const seed = 'plan:backyard-session:0:1789379100000';

const run = drill('fire.zone2-run');
const staff = drill('water.figure-8');
const stretch = drill('water.worlds-greatest-stretch');

describe('what fits the basement', () => {
  it('no running, jumping, hanging or staff flow inside; stretches and Fire Rounds fit', () => {
    expect(needsOutside(run)).toBe(true);
    expect(needsOutside(staff)).toBe(true);
    expect(needsOutside(drill('fire.burpee'))).toBe(true);
    expect(canGoInside(drill('earth.porch-dead-hang'))).toBe(false);
    expect(canGoInside(drill('fire.fire-rounds'))).toBe(true);
    expect(canGoInside(stretch)).toBe(true);
  });

  it('every indoor stand-in fits inside and keeps its element', () => {
    for (const d of EXERCISE_LIBRARY.filter(e => e.venues.includes('yard'))) {
      const alt = indoorAlternative(d, seed);
      if (alt) {
        expect(canGoInside(alt)).toBe(true);
        expect(alt.element).toBe(d.element);
      }
    }
    expect(indoorAlternative(run, seed)).toBeDefined();
    expect(indoorAlternative(staff, seed)).toBeDefined();
  });
});

describe('adaptDrill', () => {
  it('leaves a clear day alone', () => {
    expect(adaptDrill(run, clear, prefs, seed)).toEqual({
      drill: run,
      swapped: false,
    });
  });

  it('rain: the run becomes indoor Fire conditioning, staff flow becomes Water mobility', () => {
    const wet = {...clear, rain: true, rainChance: 80};
    const out = adaptDrill(run, wet, prefs, seed);
    expect(out.swapped).toBe(true);
    expect(out.drill.element).toBe('fire');
    expect(out.drill.targets).toContain('Conditioning');
    expect(out.note).toBe(`Rain 80% — ${out.drill.name} inside instead`);

    const flow = adaptDrill(staff, wet, prefs, seed);
    expect(flow.swapped).toBe(true);
    expect(flow.drill.targets).toContain('Mobility');
    expect(canGoInside(flow.drill)).toBe(true);
  });

  it('rain moves a stretch inside; porch and mat work stay as they are', () => {
    const wet = {...clear, rain: true, rainChance: 80};
    expect(adaptDrill(stretch, wet, prefs, seed)).toEqual({
      drill: stretch,
      note: 'Rain 80% — do it inside',
      swapped: false,
    });
    const hang = drill('earth.porch-dead-hang');
    expect(adaptDrill(hang, wet, prefs, seed)).toEqual({
      drill: hang,
      swapped: false,
    });
  });

  it('dark: the run waits for first light, unless the operator runs with a headlamp', () => {
    const dark = {
      ...clear,
      dark: true,
      firstLight: new Date(2026, 8, 14, 6, 12).getTime(),
    };
    const out = adaptDrill(run, dark, prefs, seed);
    expect(out.swapped).toBe(true);
    expect(out.note).toBe(
      `Dark till 06:12 — ${out.drill.name} inside; run after first light`,
    );
    expect(adaptDrill(run, dark, {...prefs, runInDark: true}, seed)).toEqual({
      drill: run,
      note: 'Dark till 06:12 — headlamp and reflective gear',
      swapped: false,
    });
    expect(adaptDrill(staff, dark, prefs, seed).note).toBeUndefined();
  });

  it('bugs: static work goes inside, the run stays out with repellent', () => {
    const buggy = {...clear, bugs: 'high' as const};
    expect(adaptDrill(stretch, buggy, prefs, seed).note).toBe(
      'Bugs likely — do it inside',
    );
    expect(adaptDrill(run, buggy, prefs, seed).note).toBe(
      'Bugs likely — repellent first',
    );
    expect(
      adaptDrill(stretch, buggy, {...prefs, bugsMoveInside: false}, seed).note,
    ).toBeUndefined();
  });

  it('heat: easy pace in caution, indoors in danger; cold and ice', () => {
    const warm = {...clear, heat: 'caution' as const, feelsC: 34};
    expect(adaptDrill(run, warm, prefs, seed).note).toBe(
      'Feels 34° — easy pace, drink first',
    );
    expect(adaptDrill(run, warm, {...prefs, units: 'F'}, seed).note).toBe(
      'Feels 93° — easy pace, drink first',
    );
    const hot = adaptDrill(
      run,
      {...clear, heat: 'danger', feelsC: 40},
      prefs,
      seed,
    );
    expect(hot.swapped).toBe(true);
    expect(hot.note).toMatch(/^Feels 40° — .+ inside instead$/);
    expect(
      adaptDrill(run, {...clear, cold: true, feelsC: -3}, prefs, seed).note,
    ).toBe('Feels -3° — warm up inside first');
    const icy = adaptDrill(run, {...clear, cold: true, icy: true}, prefs, seed);
    expect(icy.swapped).toBe(true);
    expect(icy.note).toMatch(/^Icy out — /);
  });

  it('the same chime always gets the same stand-in', () => {
    const wet = {...clear, rain: true, rainChance: 90};
    expect(adaptDrill(staff, wet, prefs, seed)).toEqual(
      adaptDrill(staff, wet, prefs, seed),
    );
  });
});

describe('training in the rain, by choice', () => {
  const wet = {...clear, rain: true, rainChance: 80};

  it('runs stay out when you run in it; the rest still moves in', () => {
    const runs = {...prefs, rain: 'runs' as const};
    const out = adaptDrill(run, wet, runs, seed);
    expect(out.drill.id).toBe(run.id);
    expect(out.note).toBe(
      'Rain 80% — take shorter strides, wear something bright',
    );
    expect(adaptDrill(staff, wet, runs, seed).drill.id).not.toBe(staff.id);
  });

  it('nothing moves when you train in it', () => {
    const train = {...prefs, rain: 'train' as const};
    expect(adaptDrill(run, wet, train, seed).drill.id).toBe(run.id);
    const flow = adaptDrill(staff, wet, train, seed);
    expect(flow.drill.id).toBe(staff.id);
    expect(flow.note).toContain('watch your footing');
  });

  it('thunder sends everybody in, whatever they chose', () => {
    const train = {...prefs, rain: 'train' as const};
    const storm = {...wet, storm: true};
    const out = adaptDrill(run, storm, train, seed);
    expect(out.drill.id).not.toBe(run.id);
    expect(out.note).toMatch(/^Thunder — /);
  });

  it('still waits for light on a dark wet morning, unless you run in the dark', () => {
    const runs = {...prefs, rain: 'runs' as const};
    const darkWet = {...wet, dark: true};
    expect(adaptDrill(run, darkWet, runs, seed).drill.id).not.toBe(run.id);
    expect(
      adaptDrill(run, darkWet, {...runs, runInDark: true}, seed).drill.id,
    ).toBe(run.id);
  });
});
