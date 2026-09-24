import {formatClock} from '../settings/clock';

export type TempUnits = 'C' | 'F';

/** "18°", in the operator's units. */
export function formatTemp(celsius: number, units: TempUnits = 'C'): string {
  const value = units === 'F' ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(value)}°`;
}

/** "06:12", local time. */
export function clockHM(ms: number): string {
  return formatClock(ms);
}

/** "11 h 42 min" */
export function formatDayLength(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
