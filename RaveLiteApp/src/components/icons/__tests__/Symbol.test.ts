/**
 * A symbol is looked up by name and destructured, so a missing one is not
 * a blank space — it is a crash, on whichever screen forgot. These check
 * that every set of things the app draws has a picture for every member.
 */
import {hueOf, type SymbolName} from '../Symbol';
import {hues} from '../../../theme/hues';
import {ARCHETYPES} from '../../../domain/profile/archetypes';
import {PACKS} from '../../../domain/profile/packs';
import {MODES} from '../../../domain/profile/mode';
import {KIT_ITEMS} from '../../../domain/profile/kit';
import {DAY_SHAPES} from '../../../domain/program/density';
import {STARTING_POINTS} from '../../../domain/profile/starting';
import {ARCHETYPE_SYMBOL} from '../../../screens/heart/ArchetypePanel';
import {PACK_SYMBOL} from '../../../screens/heart/PacksPanel';
import {MODE_SYMBOL} from '../../../screens/heart/ModePanel';

const drawable = (name: SymbolName) => {
  const hue = hueOf(name);
  expect(typeof hue).toBe('string');
  expect(hue).toMatch(/^#[0-9A-Fa-f]{6}$/);
};

it('every archetype has a picture and a colour', () => {
  for (const archetype of ARCHETYPES) {
    expect(ARCHETYPE_SYMBOL[archetype.id]).toBeDefined();
    drawable(ARCHETYPE_SYMBOL[archetype.id]);
  }
});

it('every pack has a picture and a colour', () => {
  for (const pack of PACKS) {
    expect(PACK_SYMBOL[pack.id]).toBeDefined();
    drawable(PACK_SYMBOL[pack.id]);
  }
});

it('every mode has a picture and a colour', () => {
  for (const mode of MODES) {
    expect(MODE_SYMBOL[mode.id]).toBeDefined();
    drawable(MODE_SYMBOL[mode.id]);
  }
});

it('every day shape, kit item and starting point can be drawn', () => {
  for (const shape of DAY_SHAPES) {
    drawable(shape.id as SymbolName);
  }
  for (const item of KIT_ITEMS) {
    drawable(item as SymbolName);
  }
  for (const point of STARTING_POINTS) {
    drawable(point.id as SymbolName);
  }
});

it('every hue is a real colour, light enough to read on the background', () => {
  for (const [name, hex] of Object.entries(hues)) {
    expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    // Rough perceived brightness. The page is #06070A; anything under
    // about 70 disappears into it, which is how a label becomes a rumour.
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    expect({name, brightness: Math.round(brightness)}).toEqual({
      name,
      brightness: expect.any(Number),
    });
    expect(brightness).toBeGreaterThan(70);
  }
});
