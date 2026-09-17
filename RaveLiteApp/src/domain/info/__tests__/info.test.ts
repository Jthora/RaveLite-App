import {store} from '../../../storage';
import type {SetPrescription} from '../../program/types';
import {groupCard, infoFor, partsOf, roundCard} from '../info';

beforeEach(() => store.clearAll());

describe('a drill', () => {
  it('says what it is, how to do it, how much, and where it belongs', () => {
    const card = infoFor({kind: 'drill', id: 'air.chin-tuck'})!;
    expect(card.title).toBe('Chin Tuck');
    expect(card.what).toContain('deep neck flexors');
    expect(card.how?.[0]).toContain('string pulling the crown');
    expect(card.dose).toBe('3 × 10 (5 sec hold)');
    expect(card.meta).toEqual(
      expect.arrayContaining([
        'at the desk · standing anywhere',
        'About 60 sec',
        'Trains Breath and Awareness',
      ]),
    );
    expect(card.related?.[0]).toMatchObject({
      ref: {kind: 'track', id: 'posture'},
      label: 'Posture track',
    });
  });

  it('knows a partner drill rides along with its track', () => {
    const card = infoFor({kind: 'drill', id: 'air.doorway-pec-stretch'})!;
    expect(card.related?.[0].detail).toBe('Rides along after its sets');
  });

  it('has nothing to say about a drill that does not exist', () => {
    expect(infoFor({kind: 'drill', id: 'nope'})).toBeUndefined();
  });
});

it('a track shows its ladder, where you are on it, and what rides along', () => {
  const card = infoFor({kind: 'track', id: 'push'})!;
  expect(card.subtitle).toBe('Fire · a Daily Sets track');
  expect(card.what).toContain('200 a day');
  expect(card.dose).toContain('Now: Push-ups');
  expect(card.parts?.map(p => p.label)).toEqual([
    'Incline push-ups',
    'Push-ups',
  ]);
  // A new program starts on the second rung, so the first is behind it.
  expect(card.parts?.[0].detail).toBe('Climbed');
  expect(card.parts?.[1].detail).toContain('Where you are');
  expect(card.related?.[0].detail).toBe('Rides along · 30 sec');
});

it('an attribute shows its gist, how it grows and its sign', () => {
  const card = infoFor({kind: 'attribute', id: 'toughness'})!;
  expect(card.title).toBe('Toughness');
  expect(card.subtitle).toBe('Earth · fixed');
  expect(card.what).toBe('Holding load.');
  expect(card.meta).toContain('Taurus · the bull');
});

describe('a round', () => {
  const rx: SetPrescription = {
    trackId: 'push',
    label: 'Push-ups',
    unit: 'reps',
    amount: 5,
    setIndex: 2,
    sets: 4,
    roundIndex: 3,
    rounds: 9,
    moves: [
      {
        trackId: 'push',
        exerciseId: 'fire.pushup-groove',
        element: 'fire',
        label: 'Push-ups',
        unit: 'reps',
        amount: 5,
        setIndex: 2,
        sets: 4,
      },
      {
        trackId: 'posture',
        exerciseId: 'air.chin-tuck',
        element: 'air',
        label: 'Chin tucks',
        unit: 'reps',
        amount: 10,
        setIndex: 1,
        sets: 4,
      },
    ],
    partner: {
      exerciseId: 'air.physiological-sigh',
      element: 'air',
      label: 'Physiological sigh',
      seconds: 30,
    },
    water: true,
  };

  it('lists every piece, each one openable', () => {
    const card = roundCard(rx, 'fire');
    expect(card.title).toBe('Round 3 of 9');
    expect(card.parts?.map(p => p.label)).toEqual([
      'Push-ups',
      'Chin tucks',
      'Physiological sigh',
      'A glass of water',
    ]);
    expect(card.parts?.[0]).toMatchObject({
      ref: {kind: 'drill', id: 'fire.pushup-groove'},
      detail: '5 · set 2 of 4 today',
    });
    expect(card.parts?.[2].detail).toBe('30 sec, straight after');
    // The glass is real but there is nothing to open.
    expect(card.parts?.[3].ref).toBeUndefined();
  });

  it('gives a single set its own card, not a list', () => {
    const single: SetPrescription = {
      ...rx,
      moves: undefined,
      partner: undefined,
      water: undefined,
    };
    expect(roundCard(single, 'fire').what).toContain('One small set');
    expect(partsOf(single, 'fire')).toHaveLength(1);
  });

  it('can be built from pieces alone, for a chime still to come', () => {
    const card = groupCard({
      title: 'Round 4 of 9',
      element: 'fire',
      what: 'x',
      parts: partsOf(rx, 'fire'),
    });
    expect(card.partsTitle).toBe('Each part');
    expect(card.parts).toHaveLength(4);
  });
});

it('a measurement says how to take it, and what it counts toward', () => {
  const card = infoFor({kind: 'metric', id: 'builtin.plank'})!;
  expect(card.title).toBe('Plank — max hold');
  expect(card.what).toContain('to the second the hips drop');
  expect(card.meta).toEqual(['Logged as minutes and seconds']);
  expect(card.related?.[0]).toMatchObject({
    ref: {kind: 'event', id: 'plank'},
    label: 'Plank',
  });
});

it('a test event says what it asks and what the marks are', () => {
  const card = infoFor({kind: 'event', id: 'plank'})!;
  expect(card.what).toContain('forearm plank');
  expect(card.meta?.[0]).toMatch(/^USMC: pass \d+ · B\+ \d+ · top \d+$/);
  expect(card.related?.[0].ref).toEqual({kind: 'metric', id: 'builtin.plank'});
});

it('has nothing to say about a measurement or event it does not know', () => {
  expect(infoFor({kind: 'metric', id: 'custom.nope'})).toBeUndefined();
  expect(infoFor({kind: 'event', id: 'nope'})).toBeUndefined();
});
