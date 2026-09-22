import {store} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {addEntry, loadEntries} from '../../training/repository';
import {readErrors} from '../errorLog';

beforeEach(() => store.clearAll());

it('keeps an unreadable Train log before the next save replaces it', () => {
  // A torn write, a bad edit: the log no longer parses. It used to read as
  // empty, and the next run logged saved a one-item list over a year.
  const broken = '[{"id":"r1","at":1,"kindId":"builtin.run-2mi","value":10';
  store.set(KEYS.trainingEntries, broken);

  expect(loadEntries()).toEqual([]);
  addEntry({at: 2, kindId: 'builtin.run-2mi', value: 1040});

  expect(loadEntries()).toHaveLength(1);
  expect(store.getString(`quarantine.${KEYS.trainingEntries}`)).toBe(broken);
  expect(
    readErrors().some(
      e => e.where === `storage.unreadable.${KEYS.trainingEntries}`,
    ),
  ).toBe(true);
});

it('keeps the first bad copy, not the latest', () => {
  store.set(KEYS.trainingEntries, 'first bad');
  loadEntries();
  store.set(KEYS.trainingEntries, 'second bad');
  loadEntries();
  expect(store.getString(`quarantine.${KEYS.trainingEntries}`)).toBe(
    'first bad',
  );
});
