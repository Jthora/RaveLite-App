import {Text, TextInput} from 'react-native';

import {MAX_FONT_SCALE, cappedScale, capTextScaling} from '../textScaling';

it('lets text grow, but not far enough to fold the layout', () => {
  // Android's largest setting asks for roughly double.
  expect(cappedScale(2)).toBe(MAX_FONT_SCALE);
  expect(cappedScale(1.15)).toBe(1.15);
  expect(cappedScale(1)).toBe(1);
  // Never shrinks below what the OS asked for.
  expect(cappedScale(0.85)).toBe(0.85);
  expect(MAX_FONT_SCALE).toBeGreaterThan(1.2);
});

it('says it once, for every Text in the app', () => {
  capTextScaling();
  for (const component of [Text, TextInput] as unknown as {
    defaultProps?: {maxFontSizeMultiplier?: number};
  }[]) {
    expect(component.defaultProps?.maxFontSizeMultiplier).toBe(MAX_FONT_SCALE);
  }
});

it('leaves any other defaults alone', () => {
  const text = Text as unknown as {defaultProps?: Record<string, unknown>};
  text.defaultProps = {...(text.defaultProps ?? {}), testID: 'kept'};
  capTextScaling();
  expect(text.defaultProps?.testID).toBe('kept');
  expect(text.defaultProps?.maxFontSizeMultiplier).toBe(MAX_FONT_SCALE);
});
