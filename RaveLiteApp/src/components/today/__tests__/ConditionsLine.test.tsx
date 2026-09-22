import React from 'react';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';

import {ConditionsLine} from '../ConditionsLine';
import type {WeatherLine} from '../../../domain/conditions/weather';

const line = (over: Partial<WeatherLine>): WeatherLine =>
  ({
    place: {name: 'Swansea', lat: 38.5, lon: -90, source: 'typed'},
    units: 'imperial',
    sun: {},
    next: {kind: 'sunrise', at: new Date(2026, 8, 22, 6, 47).getTime()},
    conditions: {
      known: false,
      dark: false,
      rain: false,
      storm: false,
      heat: 'none',
      cold: false,
      icy: false,
      bugs: 'low',
    },
    hadForecast: true,
    ...over,
  } as WeatherLine);

const text = (weather: WeatherLine) => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <ConditionsLine weather={weather} onPress={() => {}} />,
    );
  });
  return tree.root.find(
    (n: ReactTestInstance) => n.props.testID === 'conditions-text',
  ).props.children as string;
};

it('says the forecast is out of date instead of letting the weather vanish', () => {
  expect(text(line({}))).toBe('Sunrise 06:47 · forecast out of date');
  expect(text(line({hadForecast: false}))).toBe(
    'Sunrise 06:47 · no forecast yet',
  );
});
