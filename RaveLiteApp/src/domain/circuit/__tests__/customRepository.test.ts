import {
  clearAllCircuits,
  deleteCircuit,
  listCircuits,
  loadCircuit,
  makeCircuit,
  saveCircuit,
} from '../customRepository';

describe('customCircuit repository', () => {
  beforeEach(() => clearAllCircuits());

  it('round-trips save/load', () => {
    const c = saveCircuit(makeCircuit('Test'));
    expect(loadCircuit(c.id)?.name).toBe('Test');
  });

  it('lists circuits in updatedAt-desc order', async () => {
    const a = saveCircuit(makeCircuit('A'));
    // Force a distinct timestamp without sleeping.
    await new Promise(r => setTimeout(r, 5));
    const b = saveCircuit(makeCircuit('B'));
    const list = listCircuits();
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });

  it('updates updatedAt on save', async () => {
    const c = saveCircuit(makeCircuit('Stamp'));
    await new Promise(r => setTimeout(r, 5));
    const c2 = saveCircuit({...c, name: 'Stamped'});
    expect(c2.updatedAt).toBeGreaterThan(c.updatedAt);
    expect(loadCircuit(c.id)?.name).toBe('Stamped');
  });

  it('deletes a circuit', () => {
    const c = saveCircuit(makeCircuit('Doomed'));
    deleteCircuit(c.id);
    expect(loadCircuit(c.id)).toBeUndefined();
    expect(listCircuits()).toHaveLength(0);
  });

  it('survives corrupt blob', () => {
    saveCircuit(makeCircuit('X'));
    // Simulate corruption.
    const {store} = require('../../../storage');
    const {KEYS} = require('../../../storage/keys');
    store.set(KEYS.circuitsAll, '{not json');
    expect(listCircuits()).toEqual([]);
  });
});
