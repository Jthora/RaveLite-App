/**
 * A validator is only worth having if its messages are worth reading.
 * These tests check what a contributor would actually be told, not that
 * a count of problems is non-zero.
 */
import {readFileSync} from 'fs';
import {join} from 'path';

import {explainProblems, validatePack, type PackFile} from '../validate';
import {PACKS, drillsOf} from '../../profile/packs';

/** A pack that is fine, as a baseline to break in each test. */
function goodPack(): PackFile {
  return {
    id: 'capoeira',
    name: 'Capoeira basics',
    detail: 'Ginga, esquiva and the low game. Needs room to move.',
    drills: [
      {
        id: 'fire.ginga',
        element: 'fire',
        name: 'Ginga',
        purpose: 'The step everything else in capoeira comes out of.',
        dose: '3 × 60 sec',
        cues: ['Stay low', 'Cross the arm that matches the back foot'],
        targets: ['Coordination', 'Agility'],
        venues: ['standing', 'yard'],
        approxSeconds: 60,
        move: 'kick',
      },
    ],
    groups: [{title: 'Capoeira', ids: ['fire.ginga']}],
  };
}

const problems = (pack: unknown) => explainProblems(validatePack(pack));

it('the worked example in the docs is a pack that really validates', () => {
  // docs/example-pack.json is what a contributor copies. If it drifts
  // from the rules, the first thing anybody writes is already wrong.
  const example = JSON.parse(
    readFileSync(
      join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        'docs',
        'example-pack.json',
      ),
      'utf8',
    ),
  );
  expect(explainProblems(validatePack(example))).toEqual([]);
});

it('passes a pack that is actually fine', () => {
  expect(problems(goodPack())).toEqual([]);
});

it('holds every pack this app ships to the same rules', () => {
  for (const pack of PACKS) {
    const asFile: PackFile = {
      id: pack.id,
      name: pack.name,
      detail: pack.detail,
      groups: pack.groups.map(g => ({title: g.title, ids: [...g.ids]})),
      extras: [...(pack.extras ?? [])],
      tracks: [...(pack.tracks ?? [])],
    };
    expect({pack: pack.id, problems: problems(asFile)}).toEqual({
      pack: pack.id,
      problems: [],
    });
    expect(drillsOf(pack).length).toBeGreaterThan(0);
  }
});

it('says which drill is wrong, and what to do about it', () => {
  const pack = goodPack();
  pack.drills = [{...(pack.drills![0] as object), purpose: ''}];
  const said = problems(pack);
  expect(said).toHaveLength(1);
  expect(said[0]).toContain('fire.ginga');
  expect(said[0]).toContain('has no purpose');
  expect(said[0]).toContain('why am I doing this');
});

it('refuses a drill filed under the wrong element, and names the fix', () => {
  const pack = goodPack();
  pack.drills = [{...(pack.drills![0] as object), element: 'water'}];
  const said = problems(pack).join('\n');
  expect(said).toContain('does not start with its element');
  expect(said).toContain('water.ginga');
});

it('refuses an id somebody else already has', () => {
  const pack = goodPack();
  pack.drills = [{...(pack.drills![0] as object), id: 'fire.pushups'}];
  const said = problems(pack).join('\n');
  expect(said).toContain('already taken');
  expect(said).toContain('Ids are global');
});

it('refuses drills this app cannot promise anybody can do', () => {
  const pack = goodPack();
  pack.drills = [
    {
      ...(pack.drills![0] as object),
      purpose: 'Builds the shoulders on a bench press.',
    },
  ];
  const said = problems(pack).join('\n');
  expect(said).toContain('bench press');
  expect(said).toContain('no gym, no weights, no pool');
});

it('refuses a curriculum that points at nothing', () => {
  const pack = goodPack();
  pack.groups = [{title: 'Capoeira', ids: ['fire.ginga', 'fire.not-a-drill']}];
  const said = problems(pack).join('\n');
  expect(said).toContain('fire.not-a-drill');
  expect(said).toContain('does not exist');
});

it('refuses a pictogram this app cannot draw, and lists the real ones', () => {
  const pack = goodPack();
  pack.drills = [{...(pack.drills![0] as object), move: 'backflip'}];
  const said = problems(pack).join('\n');
  expect(said).toContain('not one this app draws');
  expect(said).toContain('Pick from:');
});

it('asks for a pictogram when a new drill brings none', () => {
  const pack = goodPack();
  const noMove = {...(pack.drills![0] as object)} as {move?: string};
  delete noMove.move;
  pack.drills = [noMove];
  const said = problems(pack).join('\n');
  expect(said).toContain('has no pictogram');
  expect(said).toContain('"move"');
});

it('refuses a track that is not a track', () => {
  const pack = goodPack();
  pack.tracks = ['shoulders'];
  const said = problems(pack).join('\n');
  expect(said).toContain('does not exist');
  expect(said).toContain('Tracks are:');
});

it('refuses a pack that brings nothing at all', () => {
  const said = problems({
    id: 'empty',
    name: 'Empty',
    detail: 'It does not do anything at all, really.',
  });
  expect(said.join('\n')).toContain('brings nothing');
});

it('says something useful about rubbish, rather than throwing', () => {
  expect(problems(null)).toEqual(['pack: is not an object']);
  expect(problems({})).not.toHaveLength(0);
  expect(problems({id: 'x', drills: [42]}).join('\n')).toContain(
    'is not an object',
  );
});

it('survives a pack written to break it', () => {
  // Pass 3: the validator is good, and had never been fed anything
  // hostile. Every one of these must come back as problems, not a throw.
  const circular: Record<string, unknown> = {id: 'loop', name: 'Loop'};
  circular.self = circular;
  const hostile: [name: string, pack: unknown][] = [
    ['null', null],
    ['a string', 'a pack, honest'],
    ['a number', 7],
    ['an array', []],
    ['empty', {}],
    ['a pack of nulls', {id: null, name: null, detail: null, drills: null}],
    [
      'drills as an object',
      {id: 'x', name: 'X', detail: 'x'.repeat(20), drills: {}},
    ],
    [
      'a drill that is a string',
      {id: 'x', name: 'X', detail: 'x'.repeat(20), drills: ['just a name']},
    ],
    [
      'a group of nothing',
      {
        id: 'x',
        name: 'X',
        detail: 'x'.repeat(20),
        groups: [{title: null, ids: null}],
      },
    ],
    ['a circular reference', circular],
    [
      'ten thousand ids in one group',
      {
        id: 'big',
        name: 'Big',
        detail: 'A pack with far too much in it, for the test.',
        groups: [
          {
            title: 'Everything',
            ids: Array.from({length: 10_000}, (_, i) => `made.up.${i}`),
          },
        ],
      },
    ],
    [
      'an id trying to be a path',
      {
        id: '../../etc/passwd',
        name: 'X',
        detail: 'A pack whose id is trying to be somewhere else.',
        drills: [],
      },
    ],
  ];
  for (const [name, pack] of hostile) {
    let problems: ReturnType<typeof validatePack> = [];
    expect({name, threw: false}).toEqual({
      name,
      threw: (() => {
        try {
          problems = validatePack(pack);
          return false;
        } catch {
          return true;
        }
      })(),
    });
    expect({name, said: problems.length > 0}).toEqual({name, said: true});
    // And it can be told to somebody, in words.
    expect({
      name,
      lines: explainProblems(problems).every(l => l.length > 5),
    }).toEqual({name, lines: true});
  }
});
