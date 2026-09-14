/**
 * MoveIcon — the pictogram for a move (push, row, hang, drink…), drawn from
 * `moveGlyphs.json` on a 24-unit grid in one bold weight and tinted by the
 * caller, usually with the element's color.
 *
 * Body glyphs are stick figures: a solid head and 2.6-unit limbs with round
 * caps. Non-body glyphs (breath, fuel, presence…) are Lucide shapes (ISC)
 * at a lighter 2.2 so their finer detail holds. The same data generates the
 * Android status-bar icons: run `node scripts/gen-move-drawables.js` after
 * editing the JSON.
 */
import React, {memo} from 'react';
import Svg, {Circle, Line, Path, Polyline} from 'react-native-svg';

import type {MoveId} from '../../domain/exercises/moves';
import glyphData from './moveGlyphs.json';

type Shape = [string, ...Array<number | string>];

interface Glyph {
  /** Drawn from Lucide: a lighter stroke. */
  lucide?: boolean;
  shapes: Shape[];
}

const GLYPHS = glyphData as unknown as Record<MoveId, Glyph>;

const STROKE = 2.6;
const LUCIDE_STROKE = 2.2;
const HEAD_RADIUS = 2.45;
/** Ground lines, bars and door frames sit back behind the figure. */
const GROUND_SCALE = 0.62;
const GROUND_OPACITY = 0.5;

interface Props {
  move: MoveId;
  color: string;
  /** Rendered size in dp. */
  size?: number;
}

export const MoveIcon = memo(function MoveIcon({
  move,
  color,
  size = 20,
}: Props) {
  const glyph = GLYPHS[move];
  if (!glyph) {
    return null;
  }
  const width = glyph.lucide ? LUCIDE_STROKE : STROKE;
  const stroke = {
    stroke: color,
    strokeWidth: width,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph.shapes.map(([kind, ...a], i) => {
        const n = a as number[];
        switch (kind) {
          case 'head':
            return (
              <Circle
                key={i}
                cx={n[0]}
                cy={n[1]}
                r={HEAD_RADIUS}
                fill={color}
              />
            );
          case 'ring':
            return <Circle key={i} cx={n[0]} cy={n[1]} r={n[2]} {...stroke} />;
          case 'line': {
            const points = [];
            for (let p = 0; p < n.length; p += 2) {
              points.push(`${n[p]},${n[p + 1]}`);
            }
            return <Polyline key={i} points={points.join(' ')} {...stroke} />;
          }
          case 'path':
            return <Path key={i} d={a[0] as string} {...stroke} />;
          case 'ground':
            return (
              <Line
                key={i}
                x1={n[0]}
                y1={n[1]}
                x2={n[2]}
                y2={n[3]}
                {...stroke}
                strokeWidth={width * GROUND_SCALE}
                strokeOpacity={GROUND_OPACITY}
              />
            );
          default:
            return null;
        }
      })}
    </Svg>
  );
});
