import {store} from '../../../storage';
import {addEntry} from '../../training/repository';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
} from '../../profile/repository';
import {buildTodayModel} from '../../../hooks/useTodayModel';
import {doneOnDay, trainDoneByTrack} from '../progress';

const NOON = new Date(2026, 8, 14, 12).getTime();

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
  saveProfile(authorProfile());
});

it('counts push-ups logged with + Log on the Push meter', () => {
  addEntry({at: NOON, kindId: 'builtin.pushups-amrap', value: 30});
  expect(doneOnDay(new Date(NOON)).push).toEqual({amount: 30, sets: 1});
  const push = buildTodayModel(NOON + 60_000).sets.tracks.find(
    t => t.trackId === 'push',
  )!;
  expect(push.done).toBeGreaterThan(0);
});

it('reads a plank or a hang in seconds, and ignores kinds with no track', () => {
  expect(
    trainDoneByTrack([
      {id: 'a', at: NOON, kindId: 'builtin.plank', value: 90},
      {id: 'b', at: NOON, kindId: 'builtin.deadhang', value: 40},
      {id: 'c', at: NOON, kindId: 'builtin.run-2mi', value: 1040},
    ]),
  ).toEqual({plank: {amount: 90, sets: 1}, hang: {amount: 40, sets: 1}});
});

it('leaves another day alone', () => {
  addEntry({at: NOON - 86_400_000, kindId: 'builtin.pushups-amrap', value: 30});
  expect(doneOnDay(new Date(NOON)).push).toBeUndefined();
});
