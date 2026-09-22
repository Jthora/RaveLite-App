import {store} from '../../../storage';
import {
  __resetProfileCache,
  authorProfile,
  loadFacts,
  saveProfile,
} from '../../profile/repository';
import {beginSetup, chooseStarting} from '../../profile/setup';
import {
  currentRung,
  levelDown,
  levelUp,
  neighbourStep,
  readyToLevelUp,
} from '../progression';
import {levelDownTrack, loadProgram} from '../repository';
import {TRACKS, trackById} from '../tracks';
import type {TrackState} from '../types';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('starts somebody new on the first step of every ladder', () => {
  beginSetup();
  for (const track of TRACKS) {
    expect([track.id, loadProgram().tracks[track.id].rung]).toEqual([
      track.id,
      0,
    ]);
  }
  // Not the author's full push-ups and porch pull-ups.
  expect(currentRung(trackById('push'), loadProgram().tracks.push)?.label).toBe(
    'Incline push-ups',
  );
});

it('moves the rungs back up for somebody who says they train', () => {
  beginSetup();
  chooseStarting('training');
  expect(loadProgram().tracks.push.rung).toBe(trackById('push').defaultRung);
  chooseStarting('new');
  expect(loadProgram().tracks.push.rung).toBe(0);
});

it('lets any track step back down', () => {
  saveProfile(authorProfile());
  const pull = trackById('pull');
  const state = loadProgram().tracks.pull;
  expect(neighbourStep(pull, state, -1, loadFacts())?.rung.label).toBe(
    'Pull-up negatives',
  );
  levelDownTrack('pull');
  const after = loadProgram().tracks.pull;
  expect(after.rung).toBe(state.rung - 1);
  expect(after.testMax).toBe(state.testMax * 2);
  expect(after.testedAt).toBeUndefined();
});

it('does not step down from the bottom', () => {
  const push = trackById('push');
  const bottom: TrackState = {enabled: true, rung: 0, testMax: 10};
  expect(levelDown(push, bottom)).toBe(bottom);
});

it('never offers a level up that changes nothing but the numbers', () => {
  // A room with a floor and a door: every pull-up rung above the first
  // falls back to the same door drill, so there is nowhere to go.
  saveProfile({
    version: 1,
    facts: {kit: ['floor', 'doorway'], noise: 'normal', corrections: []},
  });
  const pull = trackById('pull');
  const state: TrackState = {enabled: true, rung: 0, testMax: 40};
  const facts = loadFacts();
  const here = currentRung(pull, state, facts)!;
  const next = neighbourStep(pull, state, 1, facts);
  if (next) {
    expect(next.rung.exerciseId).not.toBe(here.exerciseId);
  } else {
    expect(readyToLevelUp(pull, state, facts)).toBe(false);
    expect(levelUp(pull, state, facts)).toBe(state);
  }
});
