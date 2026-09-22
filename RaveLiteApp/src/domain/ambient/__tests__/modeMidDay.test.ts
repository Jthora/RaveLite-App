/**
 * A mode is chosen in the middle of a day that is already queued. Rounds
 * and plan chimes are picked when they are queued, so until the next
 * reconcile a chime kept asking for the pull-up bar after they said they
 * were away from home, or chimed at all after "taking the day off".
 */
import {queuedPulses} from '../pulseRuntime';
import {startSetScheduler, stopSetScheduler} from '../setScheduler';
import {EXERCISE_LIBRARY} from '../../exercises/library';
import {canDo} from '../../profile/kit';
import {
  __resetProfileCache,
  authorProfile,
  loadFacts,
  saveProfile,
  setMode,
} from '../../profile/repository';
import {store} from '../../../storage';

const BY_ID = new Map(EXERCISE_LIBRARY.map(e => [e.id, e]));
// Monday, mid-morning: the day still has rounds ahead of it.
const NOW = new Date(2026, 8, 14, 9, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  store.clearAll();
  __resetProfileCache();
  saveProfile(authorProfile());
});

afterEach(() => {
  stopSetScheduler();
  jest.useRealTimers();
});

const setPulses = () =>
  queuedPulses().filter(p => !p.id.startsWith('plan:') && p.exerciseId);

it('re-picks what is queued the moment a mode starts', () => {
  startSetScheduler();
  expect(setPulses().length).toBeGreaterThan(0);

  setMode('travelling', {}, NOW.getTime());
  const facts = loadFacts(NOW.getTime());
  for (const pulse of setPulses()) {
    const drill = BY_ID.get(pulse.exerciseId!);
    expect({id: pulse.exerciseId, can: !drill || canDo(drill, facts)}).toEqual({
      id: pulse.exerciseId,
      can: true,
    });
  }
});

it('empties the day when they say they are taking it off', () => {
  startSetScheduler();
  expect(setPulses().length).toBeGreaterThan(0);
  setMode('rest', {}, NOW.getTime());
  expect(setPulses()).toEqual([]);
});
