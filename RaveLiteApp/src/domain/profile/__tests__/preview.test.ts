import {store} from '../../../storage';
import {__resetProfileCache} from '../repository';
import {beginSetup} from '../setup';
import {previewDay, previewLine} from '../preview';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('counts every chime of the day, not only the rounds', () => {
  beginSetup();
  const preview = previewDay(new Date(2026, 8, 14, 9));
  // The morning intent, the evening review and some water calls at least.
  expect(preview.chimes).toBeGreaterThanOrEqual(preview.rounds + 3);
  expect(previewLine(preview)).toBe(
    `${preview.chimes} chimes a day · ${preview.drills} drills`,
  );
});
