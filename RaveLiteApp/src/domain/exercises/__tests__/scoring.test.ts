import {rankDrillsFor, type DrillContext} from '../scoring';
import {DEFAULT_FACTS, canDo} from '../../profile/kit';
import {ELEMENT_ORDER} from '../../../theme/elements';

const ctx = (over: Partial<DrillContext>): DrillContext => ({
  element: 'water',
  hour: 10,
  loggedTodayIds: new Set(),
  preferredTargets: [],
  ...over,
});

it('never ranks a drill the places cannot do', () => {
  // "Try this now" is the one card that says now; a poi drill there, for
  // someone who has never held poi, is the app not listening.
  for (const element of ELEMENT_ORDER) {
    const ranked = rankDrillsFor(ctx({element, facts: DEFAULT_FACTS}));
    expect(ranked.length).toBeGreaterThan(0);
    const cannot = ranked
      .map(r => r.exercise)
      .filter(ex => !canDo(ex, DEFAULT_FACTS))
      .map(ex => ex.id);
    expect(cannot).toEqual([]);
  }
});

it('ranks the whole element when no facts are given', () => {
  const all = rankDrillsFor(ctx({}));
  const mine = rankDrillsFor(ctx({facts: DEFAULT_FACTS}));
  expect(all.length).toBeGreaterThan(mine.length);
});
