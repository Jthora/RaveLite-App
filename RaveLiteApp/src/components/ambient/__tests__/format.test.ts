import {formatDuration, formatEta, formatHM} from '../format';

describe('formatDuration', () => {
  it('clamps negatives to 0s', () => {
    expect(formatDuration(-1000)).toBe('0s');
  });

  it('renders seconds-only under one minute', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });

  it('renders M:SS under one hour', () => {
    expect(formatDuration(12 * 60_000 + 40_000)).toBe('12m 40s');
  });

  it('drops seconds when over one hour', () => {
    expect(formatDuration(60 * 60_000 + 4 * 60_000)).toBe('1h 4m');
  });
});

describe('formatEta', () => {
  it('returns "now" when 0 or negative', () => {
    expect(formatEta(0)).toBe('now');
    expect(formatEta(-1)).toBe('now');
  });

  it('returns "+Xm" under one hour', () => {
    expect(formatEta(12 * 60_000)).toBe('+12m');
  });

  it('returns "+Xh Ym" over one hour', () => {
    expect(formatEta(60 * 60_000 + 4 * 60_000)).toBe('+1h 4m');
  });

  it('falls back to seconds under one minute', () => {
    expect(formatEta(20_000)).toBe('+20s');
  });
});

describe('formatHM', () => {
  it('zero-pads both fields', () => {
    const d = new Date(2026, 4, 3, 7, 5).getTime();
    expect(formatHM(d)).toBe('07:05');
  });
});
