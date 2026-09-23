/**
 * Stay alive can read the standard settings, and those are not the ones
 * that kill this app. Every maker's own gates are invisible to any app,
 * so the most the app can do is name them exactly — for the phone in the
 * person's hand, and only when something has actually gone wrong.
 */
import {expect, it} from '@jest/globals';

import {fightsBackgroundApps, keepAliveSteps} from '../keepAlive';

it('names the maker for every phone a tester is likely to have', () => {
  const cases: [manufacturer: string, maker: string, mentions: string][] = [
    ['Xiaomi', 'Xiaomi', 'Autostart'],
    ['Redmi', 'Xiaomi', 'Autostart'],
    ['POCO', 'Xiaomi', 'Autostart'],
    ['samsung', 'Samsung', 'Never sleeping'],
    ['realme', 'realme', 'pop-up'],
    ['OPPO', 'Oppo and OnePlus', 'auto-launch'],
    ['OnePlus', 'Oppo and OnePlus', 'auto-launch'],
    ['vivo', 'vivo', 'Autostart'],
    ['HUAWEI', 'Huawei and Honor', 'App launch'],
    ['HONOR', 'Huawei and Honor', 'App launch'],
    ['TECNO', 'Tecno, Infinix and itel', 'Phone Master'],
    ['Infinix', 'Tecno, Infinix and itel', 'Phone Master'],
    ['motorola', 'Motorola', 'Improve battery'],
    ['Sony', 'Sony', 'STAMINA'],
  ];
  for (const [manufacturer, maker, mentions] of cases) {
    const got = keepAliveSteps(manufacturer);
    expect({manufacturer, maker: got.maker}).toEqual({manufacturer, maker});
    expect({
      manufacturer,
      says: got.steps.some(s => s.includes(mentions)),
    }).toEqual({manufacturer, says: true});
    // Every step names where to go, so none of them is a vague gesture.
    expect({
      manufacturer,
      paths: got.steps.filter(s => s.includes('→')).length > 0,
    }).toEqual({manufacturer, paths: true});
  }
});

it('gives a phone that does not fight its apps the plain answer', () => {
  for (const stock of ['Google', 'Nothing', 'Fairphone', '', undefined]) {
    const got = keepAliveSteps(stock);
    expect(got.steps).toHaveLength(2);
    expect(got.steps[0]).toContain('Unrestricted');
    expect(fightsBackgroundApps(stock)).toBe(false);
  }
  expect(keepAliveSteps('Google').maker).toBe('Google');
  expect(keepAliveSteps(undefined).maker).toBe('This phone');
});

it('knows which makers are the ones that stop apps', () => {
  for (const hard of ['Xiaomi', 'samsung', 'HUAWEI', 'TECNO', 'vivo']) {
    expect({hard, fights: fightsBackgroundApps(hard)}).toEqual({
      hard,
      fights: true,
    });
  }
});
