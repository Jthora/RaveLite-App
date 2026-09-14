import {DEFAULT_PLAN} from '../defaultPlan';
import {
  addSlot,
  addWindow,
  makeSlot,
  makeWindow,
  plansEqual,
  removeSlot,
  removeWindow,
  totalSlotCount,
  updateSlot,
  updateWindow,
} from '../planMutations';

describe('planMutations', () => {
  it('addWindow appends without mutating original', () => {
    const w = makeWindow({label: 'Test', startTime: '12:00', endTime: '13:00'});
    const next = addWindow(DEFAULT_PLAN, w);
    expect(next.windows).toHaveLength(DEFAULT_PLAN.windows.length + 1);
    expect(DEFAULT_PLAN.windows).toHaveLength(6);
    expect(next.windows[next.windows.length - 1].label).toBe('Test');
  });

  it('updateWindow patches in place by id', () => {
    const id = DEFAULT_PLAN.windows[0].id;
    const next = updateWindow(DEFAULT_PLAN, id, {label: 'Renamed'});
    expect(next.windows[0].label).toBe('Renamed');
    expect(next.windows[1]).toBe(DEFAULT_PLAN.windows[1]);
  });

  it('updateWindow no-op for unknown id', () => {
    const next = updateWindow(DEFAULT_PLAN, 'nope', {label: 'X'});
    expect(plansEqual(next, DEFAULT_PLAN)).toBe(true);
  });

  it('removeWindow drops the window', () => {
    const id = DEFAULT_PLAN.windows[1].id;
    const next = removeWindow(DEFAULT_PLAN, id);
    expect(next.windows).toHaveLength(DEFAULT_PLAN.windows.length - 1);
    expect(next.windows.find(w => w.id === id)).toBeUndefined();
  });

  it('addSlot appends to a window', () => {
    const id = DEFAULT_PLAN.windows[0].id;
    const before = DEFAULT_PLAN.windows[0].slots.length;
    const next = addSlot(DEFAULT_PLAN, id, makeSlot('air', 15));
    expect(next.windows[0].slots).toHaveLength(before + 1);
  });

  it('updateSlot patches by index', () => {
    const id = DEFAULT_PLAN.windows[0].id;
    const next = updateSlot(DEFAULT_PLAN, id, 0, {everyMinutes: 999});
    expect(next.windows[0].slots[0].everyMinutes).toBe(999);
  });

  it('updateSlot ignores out-of-range index', () => {
    const id = DEFAULT_PLAN.windows[0].id;
    const next = updateSlot(DEFAULT_PLAN, id, 99, {everyMinutes: 999});
    expect(plansEqual(next, DEFAULT_PLAN)).toBe(true);
  });

  it('removeSlot drops by index', () => {
    const id = DEFAULT_PLAN.windows[0].id;
    const before = DEFAULT_PLAN.windows[0].slots.length;
    const next = removeSlot(DEFAULT_PLAN, id, 0);
    expect(next.windows[0].slots).toHaveLength(before - 1);
  });

  it('totalSlotCount sums every window', () => {
    expect(totalSlotCount(DEFAULT_PLAN)).toBe(
      DEFAULT_PLAN.windows.reduce((s, w) => s + w.slots.length, 0),
    );
  });

  it('plansEqual treats structurally equal plans as equal', () => {
    expect(
      plansEqual(DEFAULT_PLAN, JSON.parse(JSON.stringify(DEFAULT_PLAN))),
    ).toBe(true);
  });

  it('plansEqual flags any change as dirty', () => {
    const id = DEFAULT_PLAN.windows[0].id;
    const next = updateWindow(DEFAULT_PLAN, id, {label: '!'});
    expect(plansEqual(next, DEFAULT_PLAN)).toBe(false);
  });
});
