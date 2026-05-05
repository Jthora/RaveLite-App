/**
 * elementHaptics — pattern shape contract.
 *
 * We can't unit-test the actual vibration without mocking the native
 * module, so these tests pin the *shape* of the patterns to prevent
 * accidental homogenization (e.g. someone "simplifies" all elements
 * down to one pattern, killing the body-learnable distinction).
 */
import {Vibration} from 'react-native';
import {
  pulseHaptic,
  setHapticsEnabled,
  getHapticsEnabled,
} from '../elementHaptics';

jest.mock('react-native', () => ({
  Vibration: {vibrate: jest.fn()},
}));

const vibrate = Vibration.vibrate as unknown as jest.Mock;

beforeEach(() => {
  vibrate.mockClear();
  setHapticsEnabled(true);
});

describe('pulseHaptic', () => {
  it('fires distinct seal patterns per element (no two alike)', () => {
    const seen: string[] = [];
    for (const el of ['fire', 'air', 'earth', 'water', 'heart'] as const) {
      vibrate.mockClear();
      pulseHaptic(el, 'seal');
      expect(vibrate).toHaveBeenCalledTimes(1);
      const pattern = vibrate.mock.calls[0][0] as number[];
      seen.push(JSON.stringify(pattern));
    }
    expect(new Set(seen).size).toBe(5);
  });

  it('uses softer patterns for enter than seal', () => {
    vibrate.mockClear();
    pulseHaptic('fire', 'seal');
    const sealTotal = sum(vibrate.mock.calls[0][0] as number[]);
    vibrate.mockClear();
    pulseHaptic('fire', 'enter');
    const enterTotal = sum(vibrate.mock.calls[0][0] as number[]);
    expect(enterTotal).toBeLessThan(sealTotal);
  });

  it('is a no-op when haptics are disabled', () => {
    setHapticsEnabled(false);
    pulseHaptic('fire', 'seal');
    expect(vibrate).not.toHaveBeenCalled();
    expect(getHapticsEnabled()).toBe(false);
  });
});

function sum(p: number[]): number {
  return p.reduce((a, b) => a + b, 0);
}
