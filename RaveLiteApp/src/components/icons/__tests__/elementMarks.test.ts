import {
  COMMANDER_WIDTH,
  MARKS,
  MARK_GRID,
  commanderPolygons,
  star5Frame,
} from '../elementMarks';

it('puts the Commander chevrons where the reference image has them', () => {
  const frame = star5Frame(COMMANDER_WIDTH);
  const top = frame.cy - frame.R;
  const bottom = frame.cy + frame.R * Math.sin((54 * Math.PI) / 180);
  const {apexes, polygons} = commanderPolygons(frame);
  // Down the center line of CommanderIcon.png (1024 px): the star runs
  // from 80 to 945, its body to 486, the chevrons 551–615 and 677–740.
  const measured = [486.5, 550.5, 615.5, 676.5, 740.5].map(
    y => (y - 79.5) / (945.5 - 79.5),
  );
  apexes.forEach((y, i) =>
    expect((y - top) / (bottom - top)).toBeCloseTo(measured[i], 2),
  );
  expect(polygons.map(p => p.length)).toEqual([8, 6, 6]);
});

it('centers every pointed mark on the grid', () => {
  for (const id of ['fire', 'water', 'star5', 'star6', 'commander'] as const) {
    const values = MARKS[id]
      .flatMap(shape => [
        ...shape.d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g),
      ])
      .map(m => [Number(m[1]), Number(m[2])] as const);
    const xs = values.map(([x]) => x);
    const ys = values.map(([, y]) => y);
    const middle = MARK_GRID / 2;
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(middle, 1);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(middle, 1);
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...ys)).toBeLessThan(MARK_GRID);
  }
});

it('has a mark for every element and Core theme', () => {
  expect(Object.keys(MARKS).sort()).toEqual(
    [
      'air',
      'commander',
      'core',
      'earth',
      'fire',
      'heart',
      'star5',
      'star6',
      'water',
    ].sort(),
  );
});
