import {restoreSubTabMap} from '../ElementShell';

describe('restoreSubTabMap', () => {
  it('always opens Heart on Today', () => {
    expect(restoreSubTabMap({heart: 'always-on'}).heart).toBe('today');
    expect(restoreSubTabMap({heart: 'setup'}).heart).toBe('today');
  });

  it('brings other elements back to their last tab', () => {
    expect(restoreSubTabMap({fire: 'train', air: 'log'})).toMatchObject({
      fire: 'train',
      air: 'log',
      earth: 'now',
    });
  });

  it('falls back when a stored tab no longer exists', () => {
    expect(restoreSubTabMap({water: 'aos'}).water).toBe('now');
  });

  it('opens every element on its first tab when nothing is stored', () => {
    expect(restoreSubTabMap(undefined)).toEqual({
      fire: 'now',
      air: 'now',
      earth: 'now',
      water: 'now',
      heart: 'today',
    });
  });
});
