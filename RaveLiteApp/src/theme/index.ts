/**
 * Global design tokens. Element-agnostic. For element-specific tokens, see
 * ./elements.
 */

export const palette = {
  /** OLED-friendly true-ish black for rave-context low-light readability. */
  bg: '#06070A',
  /** Slightly lifted surface for cards. */
  surface: '#0E1015',
  /** Border at low alpha. */
  border: '#1F2330',
  /** Primary text. */
  text: '#F5F7FA',
  /** Secondary text. */
  textDim: '#8A93A6',
  /** Muted/disabled. */
  textMuted: '#4A5161',
  /** Universal danger (independent of fire). */
  danger: '#FF453A',
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const type = {
  display: {fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5},
  title: {fontSize: 22, fontWeight: '700' as const},
  subtitle: {fontSize: 16, fontWeight: '600' as const},
  body: {fontSize: 15, fontWeight: '400' as const},
  caption: {fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5},
  glyph: {fontSize: 22, fontWeight: '400' as const},
};

export * from './elements';
