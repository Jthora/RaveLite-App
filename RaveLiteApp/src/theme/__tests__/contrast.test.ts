import {execSync} from 'child_process';

import {palette} from '..';

/** WCAG relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

it('keeps every text colour readable on the background and on cards', () => {
  for (const colour of [palette.text, palette.textDim, palette.textFaint]) {
    expect(contrast(colour, palette.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colour, palette.surface)).toBeGreaterThanOrEqual(4.4);
  }
});

it('uses the muted colour for no words (the night veil aside)', () => {
  // A text style is a `color:` key in a StyleSheet, or placeholder text.
  const hits = execSync(
    'grep -rn "color: palette.textMuted\\|placeholderTextColor={palette.textMuted}" src --include=\'*.tsx\' || true',
    {encoding: 'utf8'},
  )
    .split('\n')
    .filter(
      line =>
        line &&
        !line.includes('NightVeil') &&
        !line.includes('backgroundColor'),
    );
  expect(hits).toEqual([]);
});
