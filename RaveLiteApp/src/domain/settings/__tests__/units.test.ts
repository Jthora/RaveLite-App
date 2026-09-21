/**
 * The app assumed one country: miles, inches, and a temperature line
 * whose units type nobody ever passed. The fix must not move the ground
 * under anybody already standing on it.
 */
import {
  LEGACY_UNITS,
  formatDistance,
  formatHeight,
  guessUnitsOnce,
  heightToInches,
  heightUnitLabel,
  loadUnits,
  setUnits,
  tempUnits,
  unitsChosen,
  unitsForCountry,
} from '../units';
import {store} from '../../../storage';

const locale = (country: string) => async () => ({country});

beforeEach(() => {
  store.clearAll();
});

it('leaves an install that was already running exactly as it was', async () => {
  // Not fresh: the guess must not run, whatever the phone says.
  await guessUnitsOnce(false, locale('US'));
  expect(unitsChosen()).toBe(false);
  expect(loadUnits()).toBe(LEGACY_UNITS);
  expect(tempUnits()).toBe('C');
});

it('guesses from the phone on a fresh install, and only once', async () => {
  const seeded: string[] = [];
  expect(await guessUnitsOnce(true, locale('US'), u => seeded.push(u))).toBe(
    'imperial',
  );
  expect(seeded).toEqual(['F']);

  // A second boot does not guess again, so a choice survives.
  setUnits('metric');
  expect(await guessUnitsOnce(true, locale('US'))).toBe('metric');
});

it('never guesses when the build cannot say what country this is', async () => {
  expect(await guessUnitsOnce(true, async () => null)).toBe('metric');
});

it('knows the three countries that actually use imperial', () => {
  expect(unitsForCountry('US')).toBe('imperial');
  expect(unitsForCountry('LR')).toBe('imperial');
  expect(unitsForCountry('MM')).toBe('imperial');
  expect(unitsForCountry('us')).toBe('imperial');
  // The UK is metric here on purpose: miles on the road, Celsius in the
  // forecast, feet for a person — no single system fits.
  expect(unitsForCountry('GB')).toBe('metric');
  expect(unitsForCountry('DE')).toBe('metric');
  expect(unitsForCountry(undefined)).toBe('metric');
});

it('says distances and heights the way each side would say them', () => {
  expect(formatDistance(5000, 'metric')).toBe('5.0 km');
  expect(formatDistance(5000, 'imperial')).toBe('3.1 mi');
  expect(formatHeight(70, 'imperial')).toBe('5 ft 10 in');
  expect(formatHeight(70, 'metric')).toBe('178 cm');
  expect(heightUnitLabel('metric')).toBe('centimetres');
});

it('stores height in inches whatever was typed', () => {
  expect(heightToInches(70, 'imperial')).toBe(70);
  expect(Math.round(heightToInches(178, 'metric'))).toBe(70);
});
