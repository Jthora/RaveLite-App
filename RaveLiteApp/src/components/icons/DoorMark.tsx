/**
 * DoorMark — one of Today's door marks (`doorMarks.ts`), drawn like an
 * element mark: same grid, same line, round caps and joins.
 */
import React, {memo} from 'react';
import Svg, {Path} from 'react-native-svg';

import {DOOR_MARKS, type DoorId} from './doorMarks';
import {MARK_GRID, MARK_STROKE} from './elementMarks';

export const DoorMark = memo(function DoorMark({
  door,
  size,
  color,
}: {
  door: DoorId;
  /** Rendered size in dp. */
  size: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${MARK_GRID} ${MARK_GRID}`}>
      {DOOR_MARKS[door].map((shape, i) =>
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
});
