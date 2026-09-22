import {store} from '../../../storage';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
} from '../../profile/repository';
import {getElementPrefs} from '../elementPrefs';

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it("starts Air on nobody else's corrections", () => {
  expect(getElementPrefs('air').focusTargets).toEqual([]);
});

it('starts Air on the corrections this person marked, plus breath', () => {
  // The author's three: the same filter Air always opened on.
  saveProfile(authorProfile());
  expect(getElementPrefs('air').focusTargets).toEqual([
    'UCS',
    'Hourglass',
    'Breath',
  ]);
  expect(getElementPrefs('fire').focusTargets).toEqual([]);
});
