import {restoreSubTabMap} from '../ElementShell';

describe('restoreSubTabMap', () => {
  it('always opens Heart on Today', () => {
    expect(restoreSubTabMap({heart: 'always-on'}).heart).toBe('today');
    expect(restoreSubTabMap({heart: 'setup'}).heart).toBe('today');
  });

  it('brings other elements back to their last tab', () => {
    expect(restoreSubTabMap({fire: 'train', air: 'history'})).toMatchObject({
      fire: 'train',
      air: 'history',
      earth: 'drills',
    });
  });

  it('moves tabs from the old layout to where their content lives now', () => {
    expect(
      restoreSubTabMap({
        fire: 'now',
        air: 'log',
        earth: 'stats',
        water: 'tune',
      }),
    ).toMatchObject({
      fire: 'drills',
      air: 'history',
      earth: 'history',
      water: 'drills',
    });
  });

  it('falls back when a stored tab no longer exists', () => {
    expect(restoreSubTabMap({water: 'aos'}).water).toBe('drills');
  });

  it('opens every element on its first tab when nothing is stored', () => {
    expect(restoreSubTabMap(undefined)).toEqual({
      fire: 'drills',
      air: 'drills',
      earth: 'drills',
      water: 'drills',
      heart: 'today',
    });
  });
});
