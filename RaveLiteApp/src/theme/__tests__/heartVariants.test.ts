import {store} from '../../storage';
import {ELEMENTS, type ElementId} from '../elements';
import {
  HEART_COLORS,
  applyHeartVariant,
  flushHeartTheme,
  getHeartColor,
  setHeartColor,
  setHeartVariant,
  subscribeHeartVariant,
} from '../heartVariants';

beforeEach(() => {
  store.clearAll();
  flushHeartTheme();
  applyHeartVariant('heart');
});

it('a mark brings its own color until one is picked; then the color stays', () => {
  setHeartVariant('star');
  expect(getHeartColor()).toBe('white');
  expect(ELEMENTS.heart).toMatchObject({
    name: 'Star',
    icon: 'star5',
    color: HEART_COLORS.white.color,
  });

  setHeartColor('violet');
  setHeartVariant('commander');
  expect(ELEMENTS.heart).toMatchObject({
    name: 'Starcom',
    icon: 'commander',
    color: HEART_COLORS.violet.color,
    tint: HEART_COLORS.violet.tint,
  });

  setHeartVariant('core');
  expect(ELEMENTS.heart.icon).toBe('core');
  expect(ELEMENTS.heart.color).toBe(HEART_COLORS.violet.color);
});

it('the app redraws once, when the picker is done', () => {
  const heard: string[] = [];
  const off = subscribeHeartVariant(id => heard.push(id));
  setHeartVariant('aether');
  setHeartColor('cyan');
  expect(heard).toEqual([]);
  flushHeartTheme();
  flushHeartTheme();
  expect(heard).toEqual(['aether']);
  off();
});

it('no Core color is one of the four elements’ colors', () => {
  const taken = (['fire', 'air', 'earth', 'water'] as ElementId[]).map(
    id => ELEMENTS[id].color,
  );
  for (const c of Object.values(HEART_COLORS)) {
    expect(taken).not.toContain(c.color);
  }
});
