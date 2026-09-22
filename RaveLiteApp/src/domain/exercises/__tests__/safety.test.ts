import {EXERCISE_LIBRARY} from '../library';
import {packById} from '../../profile/packs';
import {STOP_LINE, isSafetyCue, safetyFirst} from '../safety';

it('moves the lines that keep you safe to the front, and keeps the rest in order', () => {
  expect(
    safetyFirst([
      'Hands under the shoulders',
      'Lower slowly',
      'Stop if a wrist hurts',
      'Breathe out on the way up',
    ]),
  ).toEqual([
    'Stop if a wrist hurts',
    'Hands under the shoulders',
    'Lower slowly',
    'Breathe out on the way up',
  ]);
});

it('knows a safety line from a technique line', () => {
  for (const cue of [
    STOP_LINE,
    'Test the hang point first',
    'Practice props only; clear space around and above you',
    'Rise back up on both feet; stop if you feel sharp pain',
    'Use a quiet street or a painted line; watch for traffic',
  ]) {
    expect(isSafetyCue(cue)).toBe(true);
  }
  for (const cue of [
    'Stop the clock when your hips drop or rise',
    'Stop it flat again on the same side; keep each stop level and steady',
    'Use sharp shapes on accents and liquid on smooth parts',
  ]) {
    expect(isSafetyCue(cue)).toBe(false);
  }
});

it('opens every test drill with the stop line', () => {
  const tests = packById('military-tests')!.extras!;
  expect(tests).toEqual(
    expect.arrayContaining(['fire.pushups', 'fire.situps']),
  );
  for (const id of tests) {
    const drill = EXERCISE_LIBRARY.find(e => e.id === id)!;
    expect([id, drill.cues?.[0]]).toEqual([id, STOP_LINE]);
  }
});

it('shows a safety line within the three cues the chime card has room for', () => {
  const buried = EXERCISE_LIBRARY.filter(e => {
    const cues = e.cues ?? [];
    return (
      cues.some(isSafetyCue) && !safetyFirst(cues).slice(0, 3).some(isSafetyCue)
    );
  });
  expect(buried.map(e => e.id)).toEqual([]);
});
