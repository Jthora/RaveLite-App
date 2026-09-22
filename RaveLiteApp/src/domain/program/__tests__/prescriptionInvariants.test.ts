/**
 * Pass 2: what a day may ask for, whoever is asking. Every archetype, in
 * every day shape, with and without a mode — a few hundred days, all
 * cheap — against the rules that hold for all of them.
 */
import {setsToday} from '../../ambient/setScheduler';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {ARCHETYPES} from '../../profile/archetypes';
import {canDo} from '../../profile/kit';
import {trainsUnder} from '../../profile/mode';
import type {ModeId} from '../../profile/mode';
import {
  __resetProfileCache,
  dailyPar,
  loadFacts,
  loadMode,
  setMode,
  setShape,
} from '../../profile/repository';
import {applyArchetype} from '../../profile/setup';
import {store} from '../../../storage';
import {DAY_SHAPES} from '../density';
import {TRACKS} from '../tracks';

const BY_ID = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
// Monday of program week 1, early enough that the day is still ahead.
const NOW = new Date(2026, 8, 14, 7).getTime();
const MODES: (ModeId | undefined)[] = [undefined, 'travelling', 'festival'];

it('asks only for what the day, the room and the mode allow', () => {
  for (const archetype of ARCHETYPES) {
    for (const shape of DAY_SHAPES) {
      for (const mode of MODES) {
        const where = `${archetype.id} · ${shape.id} · ${mode ?? 'no mode'}`;
        store.clearAll();
        __resetProfileCache();
        applyArchetype(archetype.id);
        setShape(shape.id);
        if (mode) {
          setMode(mode, {}, NOW);
        }

        const facts = loadFacts(NOW);
        const today = setsToday(NOW);
        const trains = trainsUnder(loadMode(NOW));

        // A day that trains has rounds; one that doesn't has none.
        expect({where, has: today.fires.length > 0}).toEqual({
          where,
          has: trains,
        });
        // Par is a real number to aim at.
        expect({where, par: dailyPar() > 0}).toEqual({where, par: true});

        const rounds = new Set<number>();
        for (const fire of today.fires) {
          const p = fire.prescription;
          rounds.add(p.roundIndex ?? 0);
          const moves = p.moves ?? [{trackId: p.trackId, amount: p.amount}];
          expect({
            where,
            ok:
              p.sets >= 1 &&
              p.setIndex >= 1 &&
              p.setIndex <= p.sets &&
              moves.every(m => m.amount > 0),
          }).toEqual({where, ok: true});
          // No track twice in a round, and every track is a real one.
          const ids = moves.map(m => m.trackId);
          expect({where, unique: new Set(ids).size === ids.length}).toEqual({
            where,
            unique: true,
          });
          for (const id of ids) {
            expect({where, id, real: TRACKS.some(t => t.id === id)}).toEqual({
              where,
              id,
              real: true,
            });
          }
          // Every drill is one this person can do in this room.
          for (const move of moves) {
            const drill = BY_ID.get(
              (move as {exerciseId?: string}).exerciseId ?? fire.exerciseId,
            );
            expect({where, can: !drill || canDo(drill, facts)}).toEqual({
              where,
              can: true,
            });
          }
        }
        // Rounds are numbered from one, without gaps.
        if (trains) {
          const numbers = [...rounds].sort((a, b) => a - b);
          expect({where, numbers}).toEqual({
            where,
            numbers: numbers.map((_, i) => i + 1),
          });
        }
      }
    }
  }
});
