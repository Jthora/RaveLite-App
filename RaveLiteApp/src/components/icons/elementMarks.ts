/**
 * Element marks — every element's glyph as SVG on one 24-unit grid, so
 * they share a center, a size and a line weight wherever they sit
 * together: Today's balance strip, a page header, the theme picker.
 *
 * Sizes follow Lucide's keylines, measured on the line's center: round
 * shapes (Core's ring, Heart) run about 19.5 units across, pointed ones
 * (the triangles and stars) 21 to 22.5, because points carry less weight
 * than curves. Every outline uses the same line, `MARK_STROKE`, with round
 * joins. The Star Commander mark is filled; its chevrons come out close to
 * that line's thickness.
 *
 *   fire, water   an equilateral triangle, point up / point down
 *   air, earth    the same with a bar across, nearer the wide side
 *   core          a ring with a solid center dot
 *   heart         Lucide's heart (ISC license)
 *   star5         a regular five-pointed star, in lines
 *   star6         Æther's Merkaba: Fire's triangle and Water's crossing,
 *                 drawn as two paths so the crossing lines show
 *   commander     the Starcom mark: a regular five-pointed star whose lower legs are cut into
 *                 two chevrons: below the body, four equal bands parallel to
 *                 the legs' inner edges (gap, chevron, gap, chevron). Traced
 *                 from the CommanderIcon reference; `svg/star-commander.svg`
 *                 is the same shape as a file.
 */
import type {GlyphIconId} from '../../theme/elements';

export const MARK_STROKE = 1.75;
export const MARK_GRID = 24;

export interface MarkShape {
  d: string;
  /** Filled instead of drawn as a line. */
  fill?: boolean;
}

export type Point = readonly [number, number];

const DEG = Math.PI / 180;
const C = MARK_GRID / 2;
/** Inner to outer radius of a regular five-pointed star. */
const STAR5_INNER = 0.381966;
/** A five-pointed star's lower legs meet the ground at 36°. */
const LEG_SLOPE = Math.tan(36 * DEG);

const at = (x: number, y: number): Point => [x, y];
const polar = (cx: number, cy: number, radius: number, deg: number): Point =>
  at(cx + radius * Math.cos(deg * DEG), cy + radius * Math.sin(deg * DEG));
const n = (v: number) => Number(v.toFixed(3));

const polygon = (points: readonly Point[]) =>
  `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`;
const line = ([x1, y1]: Point, [x2, y2]: Point) =>
  `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
const circle = (r: number) =>
  `M${n(C - r)} ${C}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(
    -2 * r,
  )} 0Z`;

// ── Triangles ─────────────────────────────────────────────────────────

const TRIANGLE_SIDE = 21;
/** A bar reaches this far past the triangle's sides. */
const BAR_OVERHANG = 1.25;
/** How far down from the point the bar sits, as a share of the height. */
const BAR_AT = 0.56;

function triangle(up: boolean) {
  const h = (TRIANGLE_SIDE * Math.sqrt(3)) / 2;
  const tip = up ? C - h / 2 : C + h / 2;
  const base = up ? C + h / 2 : C - h / 2;
  const points = [
    at(C, tip),
    at(C + TRIANGLE_SIDE / 2, base),
    at(C - TRIANGLE_SIDE / 2, base),
  ];
  // The bar, nearer the wide side, running a little past both sides.
  const y = tip + (base - tip) * BAR_AT;
  const half = (TRIANGLE_SIDE / 2) * BAR_AT + BAR_OVERHANG;
  return {
    outline: polygon(points),
    bar: line(at(C - half, y), at(C + half, y)),
  };
}

// ── Stars ─────────────────────────────────────────────────────────────

export interface StarFrame {
  cx: number;
  cy: number;
  R: number;
}

/** A point-up five-pointed star `width` across, centered in the grid. */
export function star5Frame(width: number): StarFrame {
  const R = width / (2 * Math.cos(18 * DEG));
  const height = R * (1 + Math.sin(54 * DEG));
  return {cx: C, cy: C - height / 2 + R, R};
}

function star5Points(
  {cx, cy, R}: StarFrame,
  inner: number = STAR5_INNER,
): Point[] {
  const points: Point[] = [];
  for (let k = 0; k < 5; k++) {
    points.push(polar(cx, cy, R, -90 + 72 * k));
    points.push(polar(cx, cy, R * inner, -54 + 72 * k));
  }
  return points;
}

/**
 * Æther as a Merkaba: Fire's triangle and Water's, superimposed.
 *
 * It used to be a six-pointed star traced as one outline, which reads as
 * a star and says nothing. Drawn as two crossing triangles it says the
 * true thing — the fifth element is not a sixth shape, it is the four
 * held together. The crossing lines are the point, so the triangles stay
 * two separate paths rather than being merged into a hexagram.
 *
 * They are the elemental triangles at `MERKABA_SCALE`, so Æther sits
 * beside Fire, Air, Earth and Water as visibly the same geometry. A
 * hexagram is wider than a single triangle at equal side length, so the
 * scale brings the whole mark back inside the others' keyline.
 */
function merkabaTriangle(up: boolean): string {
  const side = TRIANGLE_SIDE * MERKABA_SCALE;
  const h = (side * Math.sqrt(3)) / 2;
  // Each triangle's centroid sits at the grid centre, so the two cross
  // symmetrically instead of one riding high.
  const tip = up ? C - (h * 2) / 3 : C + (h * 2) / 3;
  const base = up ? C + h / 3 : C - h / 3;
  return polygon([at(C, tip), at(C + side / 2, base), at(C - side / 2, base)]);
}

/**
 * The Star Commander mark as three polygons (body, upper chevron, lower
 * chevron) in `frame`, with the heights where the bands meet the center
 * line.
 */
export function commanderPolygons(frame: StarFrame): {
  polygons: Point[][];
  apexes: number[];
} {
  const {cx, cy, R} = frame;
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

/** Width of the outlined five-pointed star, on the line's center. */
export const STAR5_WIDTH = 22;
/** The outlined star opens its middle a little, so the line doesn't close it up small. */
const STAR5_OUTLINE_INNER = 0.42;
/**
 * The filled Starcom mark is as wide as the outlined Star measures to the
 * outside of its line, so the two read the same size side by side.
 */
export const COMMANDER_WIDTH = STAR5_WIDTH + MARK_STROKE;
/**
 * The Merkaba's triangles, relative to the elemental ones.
 *
 * A hexagram with a point top and bottom is taller than it is wide by
 * 2/√3, so scaling by √3/2 makes its *height* land on the pointed-shape
 * keyline (21) rather than its width — which is what the eye measures on
 * a star, and what keeps it the same size as Star beside it.
 */
const MERKABA_SCALE = Math.sqrt(3) / 2;
const RING_RADIUS = 9.75;
const DOT_RADIUS = 2.25;

const fireTriangle = triangle(true);
const waterTriangle = triangle(false);

export const MARKS: Record<GlyphIconId, readonly MarkShape[]> = {
  fire: [{d: fireTriangle.outline}],
  air: [{d: fireTriangle.outline}, {d: fireTriangle.bar}],
  water: [{d: waterTriangle.outline}],
  earth: [{d: waterTriangle.outline}, {d: waterTriangle.bar}],
  core: [{d: circle(RING_RADIUS)}, {d: circle(DOT_RADIUS), fill: true}],
  heart: [
    {
      d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
    },
  ],
  star5: [
    {d: polygon(star5Points(star5Frame(STAR5_WIDTH), STAR5_OUTLINE_INNER))},
  ],
  star6: [{d: merkabaTriangle(true)}, {d: merkabaTriangle(false)}],
  commander: commanderPolygons(star5Frame(COMMANDER_WIDTH)).polygons.map(
    points => ({d: polygon(points), fill: true}),
  ),
};
