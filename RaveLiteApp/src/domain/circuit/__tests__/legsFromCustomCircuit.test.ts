import {EXERCISE_LIBRARY} from '../../exercises/library';
import {
  legsFromCustomCircuit,
  exercisesForElement,
} from '../legsFromCustomCircuit';
import {makeCircuit} from '../customRepository';

describe('legsFromCustomCircuit', () => {
  it('resolves exerciseId to library drill', () => {
    const drill = EXERCISE_LIBRARY[0];
    const c = makeCircuit('R');
    c.legs = [{element: drill.element, exerciseId: drill.id, durationSec: 30}];
    const legs = legsFromCustomCircuit(c);
    expect(legs).toHaveLength(1);
    expect(legs[0].exercise.id).toBe(drill.id);
    expect(legs[0].durationSec).toBe(30);
  });

  it('falls back to first drill for the element when id missing', () => {
    const c = makeCircuit('Fallback');
    c.legs = [
      {element: 'air', exerciseId: 'nope.does-not-exist', durationSec: 25},
    ];
    const legs = legsFromCustomCircuit(c);
    expect(legs[0].exercise.element).toBe('air');
  });

  it('exercisesForElement returns only that element', () => {
    const list = exercisesForElement('air');
    expect(list.length).toBeGreaterThan(0);
    expect(list.every(e => e.element === 'air')).toBe(true);
  });
});
