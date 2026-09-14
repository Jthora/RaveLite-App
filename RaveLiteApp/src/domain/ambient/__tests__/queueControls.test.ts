import {store} from '../../../storage';
import * as runtime from '../pulseRuntime';

// Monday 14 Sep 2026, 10:00 local — inside default active hours.
const NOW = new Date(2026, 8, 14, 10, 0).getTime();

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
});

describe('queued pulse controls', () => {
  it('deferQueued moves a queued chime later', () => {
    runtime.enqueue({id: 'p1', fireAt: NOW + 60_000, element: 'air'});
    runtime.deferQueued('p1', 5 * 60_000);
    runtime.tickNow(NOW + 61_000);
    expect(runtime.getActivePulseSummary()).toBeUndefined();
    runtime.tickNow(NOW + 6 * 60_000 + 1_000);
    expect(runtime.getActivePulseSummary()?.pulseId).toBe('p1');
  });

  it('cancelQueued drops queued chimes but never the active one', () => {
    runtime.enqueue({id: 'a', fireAt: NOW, element: 'air'});
    runtime.enqueue({id: 'b', fireAt: NOW + 60_000, element: 'fire'});
    runtime.tickNow(NOW);
    runtime.cancelQueued(['a', 'b']);
    expect(runtime.getActivePulseSummary()?.pulseId).toBe('a');
    expect(runtime.hasPulse('b')).toBe(false);
  });
});
