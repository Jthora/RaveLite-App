import {store} from '../../../storage';
import {BUILTIN_METRICS} from '../builtinMetrics';
import {
  addCustomMetric,
  addEntry,
  loadEntriesForElement,
  loadMetricsForElement,
} from '../repository';

beforeEach(() => store.clearAll());

describe('built-in metric catalog', () => {
  it.each(['fire', 'air', 'water', 'earth'] as const)(
    '%s has at least three built-ins',
    el => {
      const count = BUILTIN_METRICS.filter(m => m.element === el).length;
      expect(count).toBeGreaterThanOrEqual(3);
    },
  );

  it('every built-in has an explicit element (none "any")', () => {
    for (const m of BUILTIN_METRICS) {
      // Core's own page logs its Still sit, a Goals test.
      expect(['fire', 'air', 'heart', 'water', 'earth']).toContain(m.element);
    }
  });
});

describe('loadMetricsForElement', () => {
  it('returns only matching element + any', () => {
    addCustomMetric({
      label: 'Custom universal',
      category: 'custom',
      unit: 'misc',
      inputMode: 'integer',
      element: 'any',
    });
    addCustomMetric({
      label: 'Custom fire-only',
      category: 'custom',
      unit: 'misc',
      inputMode: 'integer',
      element: 'fire',
    });
    const air = loadMetricsForElement('air');
    expect(air.some(m => m.label === 'Custom universal')).toBe(true);
    expect(air.some(m => m.label === 'Custom fire-only')).toBe(false);
    expect(air.every(m => m.element === 'air' || m.element === 'any')).toBe(
      true,
    );
  });
});

describe('loadEntriesForElement', () => {
  it('filters by entry.element when set', () => {
    addEntry({at: Date.now(), kindId: 'builtin.run-3mi', value: 1080, element: 'fire'});
    addEntry({at: Date.now(), kindId: 'builtin.breath-hold', value: 90, element: 'air'});
    expect(loadEntriesForElement('fire')).toHaveLength(1);
    expect(loadEntriesForElement('air')).toHaveLength(1);
    expect(loadEntriesForElement('water')).toHaveLength(0);
  });

  it('falls back to kind.element for legacy untagged entries', () => {
    // Legacy entry without `element` field; must resolve via kind.
    addEntry({at: Date.now(), kindId: 'builtin.deadhang', value: 45});
    expect(loadEntriesForElement('earth')).toHaveLength(1);
    expect(loadEntriesForElement('fire')).toHaveLength(0);
  });
});
