/**
 * Single source of truth for orientation + tablet decisions in the shell.
 *
 * Keeps `useWindowDimensions` calls out of leaf components — they should
 * receive their layout decisions as props from the shell.
 */
import {useWindowDimensions} from 'react-native';

export type Orientation = 'portrait' | 'landscape';

export interface OrientationInfo {
  orientation: Orientation;
  isTablet: boolean;
  width: number;
  height: number;
}

/** Material guidance: smaller dimension ≥ 600dp ⇒ tablet form factor. */
const TABLET_MIN_DP = 600;

export function useOrientation(): OrientationInfo {
  const {width, height} = useWindowDimensions();
  return {
    orientation: width > height ? 'landscape' : 'portrait',
    isTablet: Math.min(width, height) >= TABLET_MIN_DP,
    width,
    height,
  };
}
