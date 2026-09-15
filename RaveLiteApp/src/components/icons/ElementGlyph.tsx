/**
 * ElementGlyph — an element's mark, tinted by the caller: its Unicode glyph,
 * or for the white Core themes an SVG shape on a 100-unit grid.
 *
 *   star5      a regular five-pointed star (Star)
 *   star6      a six-pointed star (Æther)
 *   commander  the Star Commander mark: a regular five-pointed star whose
 *              lower legs are cut into two chevrons. The line under the
 *              star's body runs through its two lower inner corners, and
 *              the space below splits into four equal bands parallel to the
 *              legs' inner edges: gap, chevron, gap, chevron. Traced from
 *              the CommanderIcon reference; `svg/star-commander.svg` is the
 *              same shape as a file.
 */
import React, {memo} from 'react';
import {Text, type StyleProp, type TextStyle} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import type {ElementIdentity, GlyphIconId} from '../../theme/elements';

export type Point = readonly [number, number];

const DEG = Math.PI / 180;
/** Inner to outer radius of a regular five-pointed star. */
const STAR5_INNER = 0.381966;
/** A star's lower legs meet the ground at 36°. */
const LEG_SLOPE = Math.tan(36 * DEG);
const STAR6_INNER = 0.5;

const at = (x: number, y: number): Point => [x, y];
const polar = (cx: number, cy: number, radius: number, deg: number): Point =>
  at(cx + radius * Math.cos(deg * DEG), cy + radius * Math.sin(deg * DEG));

const toPath = (polygons: readonly (readonly Point[])[]) =>
  polygons
    .map(
      points =>
        `M${points
          .map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`)
          .join('L')}Z`,
    )
    .join('');

/** A point-up five-pointed star, 92 units wide, centered in the box. */
export function star5Frame() {
  const R = 92 / (2 * Math.cos(18 * DEG));
  const height = R * (1 + Math.sin(54 * DEG));
  return {cx: 50, cy: (100 - height) / 2 + R, R};
}

function star5Points(): Point[] {
  const {cx, cy, R} = star5Frame();
  const points: Point[] = [];
  for (let k = 0; k < 5; k++) {
    points.push(polar(cx, cy, R, -90 + 72 * k));
    points.push(polar(cx, cy, R * STAR5_INNER, -54 + 72 * k));
  }
  return points;
}

function star6Points(): Point[] {
  const points: Point[] = [];
  for (let k = 0; k < 12; k++) {
    points.push(
      polar(50, 50, k % 2 === 0 ? 48 : 48 * STAR6_INNER, -90 + 30 * k),
    );
  }
  return points;
}

/**
 * The Star Commander mark as three polygons (body, upper chevron, lower
 * chevron), with the heights where the bands meet the center line.
 */
export function commanderPolygons(): {polygons: Point[][]; apexes: number[]} {
  const {cx, cy, R} = star5Frame();
  const r = R * STAR5_INNER;
  const outer = (k: number) => polar(cx, cy, R, -90 + 72 * k);
  const inner = (k: number) => polar(cx, cy, r, -54 + 72 * k);

  // The body's lower edge is a V through the lower inner corners; the
  // bands below it end at the bottom inner corner.
  const [ix, iy] = inner(1);
  const bodyApex = iy - LEG_SLOPE * (ix - cx);
  const band = (cy + r - bodyApex) / 4;
  const apexes = [0, 1, 2, 3, 4].map(i => bodyApex + i * band);

  // Where a band edge with apex height `a` meets the left leg's outer edge.
  const onLeftLeg = (a: number): Point => {
    const [x1, y1] = inner(3);
    const [x2, y2] = outer(3);
    const t =
      (a + LEG_SLOPE * (cx - x1) - y1) / (y2 - y1 + LEG_SLOPE * (x2 - x1));
    return at(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
  };
  const mirror = ([x, y]: Point): Point => at(2 * cx - x, y);

  const body = [
    outer(0),
    inner(0),
    outer(1),
    inner(1),
    at(cx, apexes[0]),
    inner(3),
    outer(4),
    inner(4),
  ];
  const upper = [
    onLeftLeg(apexes[1]),
    at(cx, apexes[1]),
    mirror(onLeftLeg(apexes[1])),
    mirror(onLeftLeg(apexes[2])),
    at(cx, apexes[2]),
    onLeftLeg(apexes[2]),
  ];
  const lower = [
    onLeftLeg(apexes[3]),
    at(cx, apexes[3]),
    mirror(onLeftLeg(apexes[3])),
    outer(2),
    at(cx, apexes[4]),
    outer(3),
  ];
  return {polygons: [body, upper, lower], apexes};
}

export const GLYPH_PATHS: Record<GlyphIconId, string> = {
  star5: toPath([star5Points()]),
  star6: toPath([star6Points()]),
  commander: toPath(commanderPolygons().polygons),
};

interface Props {
  element: Pick<ElementIdentity, 'glyph' | 'icon' | 'color'>;
  /** Rendered size in dp. */
  size: number;
  /** Defaults to the element's color. */
  color?: string;
  /** For the Unicode glyph only. */
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
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d={GLYPH_PATHS[element.icon]} fill={color} />
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
