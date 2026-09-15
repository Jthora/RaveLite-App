import {GLYPH_PATHS, commanderPolygons, star5Frame} from '../ElementGlyph';

it('puts the Commander chevrons where the reference image has them', () => {
  const {cx, cy, R} = star5Frame();
  const top = cy - R;
  const bottom = cy + R * Math.sin((54 * Math.PI) / 180);
  const {apexes, polygons} = commanderPolygons();
  // Down the center line of CommanderIcon.png (1024 px): the star runs
  // from 80 to 945, its body to 486, the chevrons 551–615 and 677–740.
  const measured = [486.5, 550.5, 615.5, 676.5, 740.5].map(
    y => (y - 79.5) / (945.5 - 79.5),
  );
  apexes.forEach((y, i) =>
    expect((y - top) / (bottom - top)).toBeCloseTo(measured[i], 2),
  );
  expect(polygons.map(p => p.length)).toEqual([8, 6, 6]);
  expect(cx).toBe(50);
});

it('draws every glyph shape as closed paths', () => {
  for (const d of Object.values(GLYPH_PATHS)) {
    expect(d).toMatch(/^M[-\d. L]+Z(M[-\d. L]+Z)*$/);
  }
});
