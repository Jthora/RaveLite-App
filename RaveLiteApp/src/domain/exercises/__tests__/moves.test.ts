import fs from 'fs';
import path from 'path';

import glyphs from '../../../components/icons/moveGlyphs.json';
import {buildPulseNotification} from '../../reminders/notifeeScheduler';
import {TRACKS} from '../../program/tracks';
import {BUILTIN_METRICS} from '../../training/builtinMetrics';
import type {MetricKind} from '../../training/types';
import {EXERCISE_LIBRARY} from '../library';
import {MOVE_IDS, moveForExercise, moveForMetric, moveForTrack} from '../moves';

it('gives every drill a move', () => {
  expect(
    EXERCISE_LIBRARY.filter(ex => !moveForExercise(ex.id)).map(ex => ex.id),
  ).toEqual([]);
});

it('gives every built-in Train kind and Daily Sets track a move', () => {
  expect(BUILTIN_METRICS.filter(m => !moveForMetric(m)).map(m => m.id)).toEqual(
    [],
  );
  expect(TRACKS.filter(tr => !moveForTrack(tr.id)).map(tr => tr.id)).toEqual(
    [],
  );
});

it('draws every move, and nothing else', () => {
  expect(Object.keys(glyphs).sort()).toEqual([...MOVE_IDS].sort());
});

it('falls back for kinds the operator added', () => {
  const custom = (category: MetricKind['category']): MetricKind => ({
    id: `custom.${category}`,
    label: category,
    category,
    unit: 'seconds',
    inputMode: 'mmss',
    element: 'any',
    builtIn: false,
  });
  expect(moveForMetric(custom('run'))).toBe('run');
  expect(moveForMetric(custom('custom'))).toBe('activity');
  expect(moveForExercise('not.a-drill')).toBeUndefined();
});

it('ships a status-bar drawable for every move', () => {
  const drawables = path.resolve(
    __dirname,
    '../../../../android/app/src/main/res/drawable',
  );
  expect(
    MOVE_IDS.filter(
      id => !fs.existsSync(path.join(drawables, `ic_move_${id}.xml`)),
    ),
  ).toEqual([]);
});

it("uses the drill's move as the notification icon", () => {
  const notify = (exerciseId: string) =>
    buildPulseNotification(
      {exerciseId, element: 'fire', title: 'Round', body: '', color: '#FF3B2F'},
      {quiet: false},
    ).android?.smallIcon;
  expect(notify('fire.doorframe-row')).toBe('ic_move_row');
  expect(notify('retro')).toBe('ic_move_pulse');
});
