import {isDark, localNoon, seasonAt, sunTimes} from '../sun';

const MIN = 60_000;

it('matches Open-Meteo for New York on 4 September 2026 within two minutes', () => {
  // Midnight EDT is 04:00 UTC, so local noon is 16:00 UTC.
  const noon = 1_788_494_400_000 + 12 * 60 * MIN;
  const sun = sunTimes(noon, 40.7103, -73.9931);
  expect(Math.abs(sun.sunrise! - 1_788_517_558_000)).toBeLessThan(2 * MIN);
  expect(Math.abs(sun.sunset! - 1_788_564_194_000)).toBeLessThan(2 * MIN);
  const twilight = sun.sunrise! - sun.civilDawn!;
  expect(twilight).toBeGreaterThan(20 * MIN);
  expect(twilight).toBeLessThan(35 * MIN);
  // 12 h 57 min between sunrise and sunset.
  expect(sun.dayLengthMin).toBeGreaterThan(770);
  expect(sun.dayLengthMin).toBeLessThan(785);
  expect(isDark(sun.civilDawn! - MIN, sun)).toBe(true);
  expect(isDark(sun.civilDawn! + MIN, sun)).toBe(false);
  expect(isDark(sun.civilDusk! + MIN, sun)).toBe(true);
});

it('knows polar night and midnight sun', () => {
  const svalbard = [78.22, 15.65] as const;
  const winter = sunTimes(Date.UTC(2026, 11, 21, 12), ...svalbard);
  expect(winter.sunrise).toBeUndefined();
  expect(winter.dayLengthMin).toBe(0);
  expect(isDark(Date.UTC(2026, 11, 21, 12), winter)).toBe(true);
  const summer = sunTimes(Date.UTC(2026, 5, 21, 12), ...svalbard);
  expect(summer.sunset).toBeUndefined();
  expect(summer.dayLengthMin).toBe(1440);
  expect(isDark(Date.UTC(2026, 5, 21, 0), summer)).toBe(false);
});

it('names the season by month, flipped south of the equator', () => {
  const september = new Date(2026, 8, 14).getTime();
  expect(seasonAt(september, 45)).toBe('autumn');
  expect(seasonAt(september, -33)).toBe('spring');
  expect(seasonAt(new Date(2026, 0, 5).getTime(), 45)).toBe('winter');
});

it('works out the day from local noon', () => {
  expect(localNoon(new Date(2026, 8, 14, 3, 20).getTime())).toBe(
    new Date(2026, 8, 14, 12).getTime(),
  );
});
