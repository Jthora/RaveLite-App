import {store} from '../../../storage';
import {
  __resetProfileCache,
  authorProfile,
  saveProfile,
  setPacks,
} from '../../profile/repository';
import {beginSetup} from '../../profile/setup';
import {FIRST_TEST_WEEK, saturdayTests} from '../repository';
import {SATURDAY_TESTS, dayFocus} from '../week';

const SATURDAY = new Date(2026, 8, 19);

beforeEach(() => {
  store.clearAll();
  __resetProfileCache();
});

it('gives a Saturday with no tests strides and an easy run', () => {
  const day = dayFocus(SATURDAY, 1, {tests: false});
  expect(day.test).toBeUndefined();
  expect(day.block).toBe(SATURDAY_TESTS.max.block);
});

it('never tests a stranger who skipped setup', () => {
  beginSetup();
  expect(saturdayTests(1)).toBe(false);
  expect(saturdayTests(20)).toBe(false);
});

it('tests somebody who chose the pack, after a block of training', () => {
  beginSetup();
  setPacks(['military-tests']);
  expect(saturdayTests(1)).toBe(false);
  expect(saturdayTests(FIRST_TEST_WEEK - 1)).toBe(false);
  expect(saturdayTests(FIRST_TEST_WEEK)).toBe(true);
});

it("keeps the author's rotation", () => {
  // From before setup: every pack, tested from week 1 as it always was.
  saveProfile(authorProfile());
  expect(saturdayTests(1)).toBe(true);
});
