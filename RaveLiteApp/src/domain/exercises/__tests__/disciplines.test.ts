import {DISCIPLINES, disciplineOf, tierOf} from '../disciplines';
import {EXERCISE_LIBRARY, exercisesFor, isCurriculum} from '../library';
import {moveForExercise} from '../moves';
import {CURRICULUM_DRILLS} from '../curricula';
import {ELEMENT_ORDER} from '../../../theme/elements';
import {chartDose, CHARTS} from '../../program/charts';

const BY_ID = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
const TIER_RANK = {basic: 0, intermediate: 1, advanced: 2} as const;

describe('every path', () => {
  it.each(DISCIPLINES.map(d => [d.id, d] as const))(
    '%s has moves at every tier, in order, and all of them real',
    (_id, d) => {
      const tiers = d.ids.map(id => tierOf(id)!);
      for (const tier of ['basic', 'intermediate', 'advanced'] as const) {
        expect({tier, n: tiers.filter(x => x === tier).length >= 3}).toEqual({
          tier,
          n: true,
        });
      }
      const ranks = tiers.map(tier => TIER_RANK[tier]);
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
      expect(d.ids.filter(id => !BY_ID.has(id))).toEqual([]);
    },
  );

  it('puts every curriculum move on exactly one path', () => {
    const seen = new Map<string, number>();
    for (const d of DISCIPLINES) {
      for (const id of d.ids) {
        seen.set(id, (seen.get(id) ?? 0) + 1);
      }
    }
    expect([...seen].filter(([, n]) => n > 1).map(([id]) => id)).toEqual([]);
    expect(
      CURRICULUM_DRILLS.filter(d => disciplineOf(d.id) === undefined).map(
        d => d.id,
      ),
    ).toEqual([]);
  });

  it('gives every curriculum move a pictogram and honest cues', () => {
    expect(
      CURRICULUM_DRILLS.filter(d => moveForExercise(d.id) === undefined).map(
        d => d.id,
      ),
    ).toEqual([]);
    expect(
      CURRICULUM_DRILLS.filter(
        d => (d.cues?.length ?? 0) < 3 || (d.cues?.length ?? 0) > 5,
      ).map(d => d.id),
    ).toEqual([]);
  });

  it('keeps fighting off the flow and dance paths', () => {
    // Fighting as training, not as a figure of speech ("don't fight the hips").
    const FIGHT = /\b(strikes?|punch(es)?|combat|fighting|sparring)\b/i;
    const peaceful = DISCIPLINES.filter(d => d.id !== 'danceCombat');
    const offenders = peaceful.flatMap(d =>
      d.ids.filter(id => {
        const e = BY_ID.get(id)!;
        return FIGHT.test([e.name, e.purpose, ...(e.cues ?? [])].join(' '));
      }),
    );
    expect(offenders).toEqual([]);
  });
});

describe('curriculum moves stay in Practice', () => {
  it('are never in an element’s everyday list', () => {
    for (const el of ELEMENT_ORDER) {
      expect(exercisesFor(el).filter(isCurriculum)).toEqual([]);
    }
  });

  it('while the moves that came first keep their place', () => {
    // Staff figure-8s were chimed before paths existed, and still are.
    expect(isCurriculum(BY_ID.get('water.figure-8')!)).toBe(false);
    expect(tierOf('water.figure-8')).toBe('basic');
  });
});

describe('charts', () => {
  const move = BY_ID.get('water.figure-8')!;

  it('plays Standard as the move’s own dose, and bends the rest', () => {
    expect(chartDose(move, 'standard', 'flow')).toBe(move.dose);
    expect(chartDose(move, 'heavy', 'flow').startsWith(move.dose)).toBe(true);
    expect(chartDose(move, 'beginner', 'flow')).toMatch(/half tempo/);
    expect(chartDose(move, 'challenge', 'dance')).toMatch(/whole track/);
    expect(CHARTS.map(c => c.name)).toEqual([
      'Beginner',
      'Light',
      'Standard',
      'Heavy',
      'Challenge',
    ]);
  });
});
