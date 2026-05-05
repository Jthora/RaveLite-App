import {useEffect, useState} from 'react';
import {Dimensions, ScaledSize} from 'react-native';

/**
 * Layout breakpoints in dp. Mirrors common Material Design tablet bands.
 *   compact    < 600  → phones in portrait, narrow phones
 *   medium    600-959 → small tablets, phones in landscape
 *   expanded  ≥ 960   → large tablets, foldables, the Galaxy Tab A7 landscape
 */
export type LayoutSize = 'compact' | 'medium' | 'expanded';

export interface Layout {
  width: number;
  height: number;
  size: LayoutSize;
  isLandscape: boolean;
  /** Suggested grid column count for card lists. */
  columns: number;
  /** Whether the device should be treated as a tablet for typography scale. */
  isTablet: boolean;
}

function compute(s: ScaledSize): Layout {
  const isLandscape = s.width >= s.height;
  const size: LayoutSize =
    s.width < 600 ? 'compact' : s.width < 960 ? 'medium' : 'expanded';
  const columns = size === 'expanded' ? 3 : size === 'medium' ? 2 : 1;
  const isTablet = Math.min(s.width, s.height) >= 600;
  return {width: s.width, height: s.height, size, isLandscape, columns, isTablet};
}

/**
 * Subscribes to dimension changes — recomputes on rotation.
 * Single source of truth for responsive decisions.
 */
export function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>(() =>
    compute(Dimensions.get('window')),
  );
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({window}) => {
      setLayout(compute(window));
    });
    return () => sub.remove();
  }, []);
  return layout;
}
