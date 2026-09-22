/**
 * `loadFacts()` is four things at once now — the room, an injury, the
 * packs and a mode — and the day is built on top of it. These are the
 * combinations, including the contradictory ones: away from home, hurt,
 * carrying nothing, with no packs on.
 */
import {setsToday} from '../../ambient/setScheduler';
import {canDo} from '../kit';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {loadProgram} from '../../program/repository';
import {ALL_PACKS, type PackId} from '../packs';
import {store} from '../../../storage';
import {
  __resetProfileCache,
  authorProfile,
  loadFacts,
  loadMode,
  saveProfile,
  setInjury,
  setMode,
  setPacks,
} from '../repository';
import {trainsUnder} from '../mode';
import type {ModeId} from '../mode';
import type {Region} from '../loads';

// Monday, mid-morning, in program week 1.
const NOW = new Date(2026, 8, 14, 10).getTime();

const BY_ID = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

const MODES: (ModeId | undefined)[] = [
  undefined,
  'travelling',
  'festival',
  'rest',
];
const INJURIES: (Region | undefined)[] = [undefined, 'shoulder', 'knee'];
const KITS: {name: string; bare: boolean}[] = [
  {name: "the author's places", bare: false},
  {name: 'a bare room', bare: true},
];
const PACKS: PackId[][] = [[...ALL_PACKS], []];

it('builds a day for every combination of room, injury, packs and mode', () => {
  for (const mode of MODES) {
    for (const injured of INJURIES) {
      for (const kit of KITS) {
        for (const packs of PACKS) {
          const where = `${mode ?? 'no mode'} · ${injured ?? 'unhurt'} · ${
            kit.name
          } · ${packs.length} packs`;
          store.clearAll();
          __resetProfileCache();
          const profile = authorProfile();
          saveProfile(
            kit.bare
              ? {...profile, facts: {...profile.facts, kit: [], places: []}}
              : profile,
          );
          setPacks(packs);
          if (injured) {
            setInjury(injured, NOW);
          }
          if (mode) {
            setMode(mode, {}, NOW);
          }

          const facts = loadFacts(NOW);
          expect({where, injured: facts.injured}).toEqual({
            where,
            injured,
          });
          const today = setsToday(NOW);

          // Sets are never negative, and a round never asks for the same
          // track twice.
          for (const fire of today.fires) {
            const p = fire.prescription;
            expect({where, sets: p.sets >= 0 && p.amount >= 0}).toEqual({
              where,
              sets: true,
            });
            const tracks = (p.moves ?? []).map(m => m.trackId);
            expect({where, unique: new Set(tracks).size}).toEqual({
              where,
              unique: tracks.length,
            });
            // Every drill in a round is one this person can do here.
            for (const move of p.moves ?? []) {
              const drill = BY_ID.get(move.exerciseId);
              expect({
                where,
                id: move.exerciseId,
                can: !drill || canDo(drill, facts),
              }).toEqual({where, id: move.exerciseId, can: true});
            }
          }

          // A day is empty only when the mode says so.
          const trains = trainsUnder(loadMode(NOW));
          expect({where, empty: today.fires.length === 0}).toEqual({
            where,
            empty: !trains,
          });
          // The program is still readable afterwards.
          expect(
            Object.keys(loadProgram(new Date(NOW)).tracks).length > 0,
          ).toBe(true);
        }
      }
    }
  }
});
