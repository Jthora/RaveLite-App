import {buildCircuit, CIRCUIT_ORDER} from '../circuit';

describe('buildCircuit', () => {
  const circuit = buildCircuit();

  it('walks the pentagram in air → fire → earth → water → heart order', () => {
    expect(circuit.map(l => l.element)).toEqual(CIRCUIT_ORDER);
  });

  it('picks one exercise per element', () => {
    expect(circuit).toHaveLength(5);
    for (const leg of circuit) {
      expect(leg.exercise.element).toBe(leg.element);
    }
  });

  it('caps each leg between 25 and 45 seconds', () => {
    for (const leg of circuit) {
      expect(leg.durationSec).toBeGreaterThanOrEqual(25);
      expect(leg.durationSec).toBeLessThanOrEqual(45);
    }
  });

  it('keeps the full circuit under 4 minutes total', () => {
    const total = circuit.reduce((s, l) => s + l.durationSec, 0);
    expect(total).toBeLessThanOrEqual(4 * 60);
  });
});
