/**
 * ElementGlyph — an element's mark, drawn from `elementMarks` on the shared
 * 24-unit grid and tinted by the caller, so every mark has the same center,
 * size and line weight wherever marks sit together. An element without an
 * `icon` falls back to its Unicode glyph.
 */
import React, {memo} from 'react';
import {Text, type StyleProp, type TextStyle} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import type {ElementIdentity} from '../../theme/elements';
import {MARKS, MARK_GRID, MARK_STROKE} from './elementMarks';

interface Props {
  element: Pick<ElementIdentity, 'glyph' | 'icon' | 'color'>;
  /** Rendered size in dp. */
  size: number;
  /** Defaults to the element's color. */
  color?: string;
  /** For the Unicode fallback only. */
  style?: StyleProp<TextStyle>;
}

export const ElementGlyph = memo(function ElementGlyph({
  element,
  size,
  color = element.color,
  style,
}: Props) {
  if (element.icon) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${MARK_GRID} ${MARK_GRID}`}>
        {MARKS[element.icon].map((shape, i) =>
          shape.fill ? (
            <Path key={i} d={shape.d} fill={color} />
          ) : (
            <Path
              key={i}
              d={shape.d}
              fill="none"
              stroke={color}
              strokeWidth={MARK_STROKE}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ),
        )}
      </Svg>
    );
  }
  return (
    <Text
      style={[
        {fontSize: size, lineHeight: Math.round(size * 1.2), color},
        style,
      ]}>
      {element.glyph}
    </Text>
  );
});
