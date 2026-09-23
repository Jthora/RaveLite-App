import {store} from '../../../storage';
import {authorProfile, saveProfile} from '../../profile/repository';
import type {SetPrescription} from '../../program/types';
import {groupCard, infoFor, partsOf, roundCard} from '../info';
import {STANDARD_EVENTS} from '../../standards/standards';
import {BUILTIN_METRICS} from '../../training/builtinMetrics';

beforeEach(() => {
  store.clearAll();
  // These are the author's program; a fresh store is now a stranger's.
  saveProfile(authorProfile());
});

describe('a drill', () => {
  it('says what it is, how to do it, how much, and where it belongs', () => {
    const card = infoFor({kind: 'drill', id: 'air.chin-tuck'})!;
    expect(card.title).toBe('Chin Tuck');
    expect(card.what).toContain('deep neck muscles');
    expect(card.how?.[0]).toContain('top of your head');
    expect(card.dose).toBe('3 × 10 (5 sec hold)');
    expect(card.meta).toEqual(
      expect.arrayContaining([
        'sitting · standing anywhere',
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
    expect(card.related?.[0].detail).toBe('Partner drill, done after its sets');
  });

  it('has nothing to say about a drill that does not exist', () => {
    expect(infoFor({kind: 'drill', id: 'nope'})).toBeUndefined();
  });
});

it('a track shows its ladder, where you are on it, and what rides along', () => {
  const card = infoFor({kind: 'track', id: 'push'})!;
  expect(card.subtitle).toBe('Fire · a Daily Sets track');
  expect(card.what).toContain('your daily goal');
  expect(card.dose).toContain('Now: Push-ups');
  expect(card.parts?.map(p => p.label)).toEqual([
    'Incline push-ups',
    'Push-ups',
  ]);
  // A new program starts on the second rung, so the first is behind it.
  expect(card.parts?.[0].detail).toBe('Done');
  expect(card.parts?.[1].detail).toContain('You are here');
  // A number on a card without its unit says nothing.
  expect(card.parts?.[1].detail).toContain('reps');
  expect(card.related?.[0].detail).toBe('Done after its sets · 30 sec');
});

it('an attribute shows its gist and how it grows, and no astrology', () => {
  const card = infoFor({kind: 'attribute', id: 'toughness'})!;
  expect(card.title).toBe('Toughness');
  expect(card.subtitle).toBe('Earth · holding');
  expect(card.what).toBe('Holding load.');
  // "Sign: Taurus" used to end this card. It changed nothing and
  // explained nothing to anyone who did not already hold the frame.
  expect(JSON.stringify(card.meta)).not.toContain('Sign:');
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

/**
 * `what` is the first line under a card's title and has no heading of
 * its own (InfoSheet.tsx). So a `what` that repeats the title, or that
 * talks about something else, leaves the one question the card exists to
 * answer unanswered — which is exactly what an event card did: its
 * fallback was `event.name`, printing the title twice.
 */
describe('every card answers "what is this?"', () => {
  const ids = {
    event: STANDARD_EVENTS.map(e => e.id),
    metric: BUILTIN_METRICS.map(m => m.id),
  };

  it('never answers with the title again', () => {
    for (const kind of ['event', 'metric'] as const) {
      for (const id of ids[kind]) {
        const card = infoFor({kind, id});
        if (!card) {
          continue;
        }
        expect(card.what.trim()).not.toBe(card.title.trim());
        expect(card.what.length).toBeGreaterThan(card.title.length);
      }
    }
  });

  it('names the thing it is describing', () => {
    // A fallback that opens "Measured the same way every time" never says
    // what was measured. Whatever the source, the subject appears.
    for (const id of ids.metric) {
      const card = infoFor({kind: 'metric', id});
      if (!card) {
        continue;
      }
      expect(card.what.length).toBeGreaterThan(12);
    }
  });
});
