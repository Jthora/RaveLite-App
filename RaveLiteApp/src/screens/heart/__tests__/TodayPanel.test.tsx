import React from 'react';
import {Modal, Text} from 'react-native';
import renderer, {act, type ReactTestInstance} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';

import {CatchUpSheet} from '../../../components/today/CatchUpSheet';
import {LateLogSheet} from '../../../components/today/LateLogSheet';
import {LoggedSheet} from '../../../components/today/LoggedSheet';
import {activityForDay} from '../../../domain/activity/activity';
import {store} from '../../../storage';
import * as runtime from '../../../domain/ambient/pulseRuntime';
import {DailySetsSheet} from '../DailySetsSheet';
import {SessionSheet} from '../../../components/today/SessionSheet';
import {addEntry} from '../../../domain/training/repository';
import {startSession} from '../../../domain/training/session';
import {
  __resetProfileCache,
  finishSetup,
  loadMode,
  needsTutorial,
  clearMode,
  setInjury,
  setMode,
} from '../../../domain/profile/repository';
import {SettingsSheet} from '../SettingsSheet';
import {
  clearSetupRequest,
  pendingSetup,
} from '../../../domain/profile/setupRequest';
import {InfoCardView} from '../../../components/info/InfoSheet';
import {TodayPanel} from '../TodayPanel';
import {WeatherSheet} from '../WeatherSheet';

// Monday 14 Sep 2026, 10:00 — inside My day, so a chime can sound.
const TEN_AM = new Date(2026, 8, 14, 10, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TEN_AM);
  store.clearAll();
  // The profile is cached in a module, and clearing storage does not
  // clear that — so without this a test that finishes the tutorial leaks
  // `taughtAt` into the next one.
  __resetProfileCache();
  runtime.__test.reset();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderToday() {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(
      <TodayPanel
        permission="granted"
        onElementPress={() => {}}
        onEngageLegs={() => {}}
      />,
    );
  });
  return tree!;
}

const byTestId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((node: ReactTestInstance) => node.props.testID === id)[0];

it('shows today with an empty water count', () => {
  const tree = renderToday();
  expect(byTestId(tree, 'water-count').props.children).toEqual([0, '/', 8]);
  expect(byTestId(tree, 'today-header').props.children).toBe('Today');
  act(() => tree.unmount());
});

it("today's header counts minutes of movement", () => {
  addEntry({
    at: TEN_AM.getTime() - 60 * 60_000,
    kindId: 'builtin.staff-session',
    value: 30 * 60,
  });
  const tree = renderToday();
  expect(byTestId(tree, 'today-header').props.children).toBe(
    'Today · 1-day streak · 30 min active',
  );
  act(() => tree.unmount());
});

it("the Daily Sets card names Monday's focus", () => {
  const tree = renderToday();
  expect(byTestId(tree, 'sets-open').props.accessibilityLabel).toContain(
    'Today: Power, Mobility, Presence',
  );
  act(() => tree.unmount());
});

it('+1 logs a glass; the count and the streak follow', () => {
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'water-add').props.onPress();
  });
  expect(byTestId(tree, 'water-count').props.children).toEqual([1, '/', 8]);
  expect(byTestId(tree, 'today-header').props.children).toBe(
    'Today · 1-day streak',
  );
  act(() => tree.unmount());
});

it('Done answers the chime that is sounding', () => {
  act(() => {
    runtime.enqueueNow({element: 'air', exerciseId: 'air.physiological-sigh'});
  });
  expect(runtime.getActivePulseSummary()).toBeDefined();
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'chime-done').props.onPress();
  });
  expect(runtime.getActivePulseSummary()).toBeUndefined();
  act(() => tree.unmount());
});

it('teaches the three taps only on a first run, and only once', () => {
  // Nobody who has trained ever sees it.
  expect(byTestId(renderToday(), 'coach-title')).toBeUndefined();

  store.clearAll();
  __resetProfileCache();
  finishSetup();
  const tree = renderToday();
  expect(byTestId(tree, 'coach-title').props.children).toBe('This is a chime');

  // Five lessons, then it is gone for good.
  for (let i = 0; i < 5; i += 1) {
    act(() => byTestId(tree, 'coach-next').props.onPress());
  }
  expect(byTestId(tree, 'coach-title')).toBeUndefined();
  expect(needsTutorial()).toBe(false);
  act(() => tree.unmount());
});

it('stops teaching the moment a chime is answered unaided', () => {
  store.clearAll();
  __resetProfileCache();
  finishSetup();
  act(() => {
    runtime.enqueueNow({element: 'air', exerciseId: 'air.chin-tuck'});
  });
  const tree = renderToday();
  expect(byTestId(tree, 'coach-title')).toBeDefined();

  act(() => byTestId(tree, 'chime-done').props.onPress());
  expect(byTestId(tree, 'coach-title')).toBeUndefined();
  expect(needsTutorial()).toBe(false);
  act(() => tree.unmount());
});

it('never has two sheets open at once, whatever order rows are tapped', () => {
  // Tapping a row sets one sheet's state. Nothing used to clear the
  // others, so a missed row followed by an upcoming one left the log
  // sheet open *underneath* an info card. Two stacked modals is the
  // state this codebase already knows breaks Back and touch on Android,
  // and from the outside it looks like a tap that flashes and does
  // nothing.
  const tree = renderToday();
  const rows = tree.root
    .findAll(
      (n: ReactTestInstance) =>
        typeof n.props?.testID === 'string' &&
        n.props.testID.startsWith('day-row-'),
    )
    .filter(
      (n, i, all) =>
        all.findIndex(o => o.props.testID === n.props.testID) === i,
    );
  expect(rows.length).toBeGreaterThan(4);

  const openSheets = () =>
    tree.root.findAllByType(Modal).filter(m => m.props.visible !== false)
      .length;

  for (const row of rows) {
    act(() => row.props.onPress());
    expect({row: row.props.testID, open: openSheets()}).toEqual({
      row: row.props.testID,
      open: 1,
    });
  }
  act(() => tree.unmount());
});

it('opens Settings on an index, not a page you have to scroll', () => {
  // ~4.5 screens of continuous scroll with fourteen sections and no way
  // to jump was the complaint. Four groups, one tap to each.
  const tree = renderToday();
  act(() => byTestId(tree, 'settings-open').props.onPress());

  for (const id of ['you', 'day', 'program', 'app']) {
    expect(byTestId(tree, `settings-group-${id}`)).toBeDefined();
  }
  // Nothing from inside a group is on the index.
  expect(byTestId(tree, 'kit-mat')).toBeUndefined();
  expect(byTestId(tree, 'archetype-raver')).toBeUndefined();
  expect(byTestId(tree, 'data-export')).toBeUndefined();

  // One tap in, and Back returns rather than closing the sheet.
  act(() => byTestId(tree, 'settings-group-you').props.onPress());
  expect(byTestId(tree, 'kit-mat')).toBeDefined();
  expect(byTestId(tree, 'settings-group-you')).toBeUndefined();

  act(() => byTestId(tree, 'settings-back').props.onPress());
  expect(byTestId(tree, 'settings-group-you')).toBeDefined();
  act(() => tree.unmount());
});

it('puts modes behind one row that says what is on', () => {
  // The whole mode panel on the index pushed the four groups below the
  // fold on a Redmi A3 — one row keeps the front page on one screen.
  const tree = renderToday();
  act(() => byTestId(tree, 'settings-open').props.onPress());
  expect(byTestId(tree, 'mode-travelling')).toBeUndefined();

  act(() => byTestId(tree, 'settings-mode').props.onPress());
  expect(byTestId(tree, 'mode-travelling')).toBeDefined();
  expect(byTestId(tree, 'settings-group-you')).toBeUndefined();

  act(() => byTestId(tree, 'mode-rest').props.onPress());
  act(() => byTestId(tree, 'settings-back').props.onPress());
  expect(byTestId(tree, 'settings-mode').props.accessibilityLabel).toBe(
    "Today I'm Taking the day off · today",
  );
  clearMode();
  act(() => tree.unmount());
});

it('can be asked to walk through the questions again', () => {
  const tree = renderToday();
  act(() => byTestId(tree, 'settings-open').props.onPress());
  act(() => byTestId(tree, 'settings-revisit').props.onPress());

  // It asks rather than showing it: Settings is a modal, and a modal
  // over a modal breaks Back on Android.
  expect(pendingSetup()).toBe('revisit');
  clearSetupRequest();
  act(() => tree.unmount());
});

it('disarms the erase if the second tap does not come', () => {
  // Armed, it used to wait for days — one stray tap from wiping everything.
  const tree = renderToday();
  act(() => byTestId(tree, 'settings-open').props.onPress());
  act(() => byTestId(tree, 'settings-fresh').props.onPress());
  act(() => {
    jest.advanceTimersByTime(7000);
  });
  act(() => byTestId(tree, 'settings-fresh').props.onPress());
  expect(pendingSetup()).toBeUndefined();
  act(() => tree.unmount());
});

it('will not erase everything on one tap', () => {
  const tree = renderToday();
  act(() => byTestId(tree, 'settings-open').props.onPress());

  act(() => byTestId(tree, 'settings-fresh').props.onPress());
  expect(pendingSetup()).toBeUndefined();

  act(() => byTestId(tree, 'settings-fresh').props.onPress());
  expect(pendingSetup()).toBe('fresh');
  clearSetupRequest();
  act(() => tree.unmount());
});

it('shows nothing at all about modes until there is one', () => {
  const tree = renderToday();
  expect(byTestId(tree, 'mode-chip')).toBeUndefined();
  expect(byTestId(tree, 'mode-chip-clear')).toBeUndefined();
  act(() => tree.unmount());
});

it('says so on Today while a mode is running, and ends it in one tap', () => {
  setMode('rest', {}, TEN_AM.getTime());
  const tree = renderToday();

  expect(byTestId(tree, 'mode-chip').props.children).toBe(
    'Taking the day off · today',
  );
  act(() => {
    byTestId(tree, 'mode-chip-clear').props.onPress();
  });
  expect(loadMode()).toBeUndefined();
  expect(byTestId(tree, 'mode-chip')).toBeUndefined();
  act(() => tree.unmount());
});

it('keeps an injury on Today after a day off ends', () => {
  setInjury('knee');
  setMode('rest', {}, TEN_AM.getTime());
  const tree = renderToday();
  expect(byTestId(tree, 'mode-chip').props.children).toBe(
    'Taking the day off · today · Hurt · knee',
  );
  act(() => {
    byTestId(tree, 'mode-chip-clear').props.onPress();
  });
  expect(loadMode()).toBeUndefined();
  expect(byTestId(tree, 'mode-chip').props.children).toBe('Hurt · knee');
  act(() => tree.unmount());
});

it('the gear opens Settings and the meters open Daily Sets', () => {
  const tree = renderToday();
  expect(tree.root.findByType(SettingsSheet).props.visible).toBe(false);
  expect(tree.root.findByType(DailySetsSheet).props.visible).toBe(false);
  act(() => {
    byTestId(tree, 'settings-open').props.onPress();
  });
  expect(tree.root.findByType(SettingsSheet).props.visible).toBe(true);
  act(() => {
    byTestId(tree, 'sets-open').props.onPress();
  });
  expect(tree.root.findByType(DailySetsSheet).props.visible).toBe(true);
  act(() => tree.unmount());
});

it('Session opens the timer, and a running session shows at the top', () => {
  const tree = renderToday();
  expect(tree.root.findByType(SessionSheet).props.visible).toBe(false);
  expect(byTestId(tree, 'session-banner')).toBeUndefined();
  act(() => {
    byTestId(tree, 'session-open').props.onPress();
  });
  expect(tree.root.findByType(SessionSheet).props.visible).toBe(true);
  act(() => {
    startSession('builtin.staff-session', TEN_AM.getTime() - 20 * 60_000);
  });
  expect(byTestId(tree, 'session-banner')).toBeDefined();
  act(() => tree.unmount());
});

it('a missed chime opens to be logged, and Done marks it done', () => {
  const tree = renderToday();
  const missed = tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.props.testID === 'string' &&
      node.props.testID.startsWith('day-row-') &&
      !node.props.testID.startsWith('day-row-train:') &&
      !node.props.testID.startsWith('day-row-journal:'),
  )[0];
  expect(missed).toBeDefined();
  const pulseId = missed.props.testID.replace('day-row-', '');
  act(() => {
    missed.props.onPress();
  });
  expect(tree.root.findByType(LateLogSheet).props.row?.id).toBe(pulseId);
  act(() => {
    byTestId(tree, 'late-done').props.onPress();
  });
  expect(activityForDay().some(item => item.pulseId === pulseId)).toBe(true);
  expect(tree.root.findByType(LateLogSheet).props.row).toBeUndefined();
  act(() => tree.unmount());
});

it('a logged row can be removed, and stops counting', () => {
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'water-add').props.onPress();
  });
  const row = tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.props.testID === 'string' &&
      node.props.testID.startsWith('day-row-journal:'),
  )[0];
  act(() => {
    row.props.onPress();
  });
  expect(tree.root.findByType(LoggedSheet).props.row).toBeDefined();
  act(() => {
    byTestId(tree, 'logged-remove').props.onPress();
  });
  expect(activityForDay()).toEqual([]);
  expect(byTestId(tree, 'water-count').props.children).toEqual([0, '/', 8]);
  act(() => tree.unmount());
});

it('catch up logs several missed chimes at once', () => {
  jest.setSystemTime(new Date(2026, 8, 14, 13, 0));
  const tree = renderToday();
  act(() => {
    byTestId(tree, 'catch-up-open').props.onPress();
  });
  expect(tree.root.findByType(CatchUpSheet).props.visible).toBe(true);
  const ids: string[] = [
    ...new Set(
      tree.root
        .findAll(
          (node: ReactTestInstance) =>
            typeof node.props.testID === 'string' &&
            node.props.testID.startsWith('catch-up-row-'),
        )
        .map(node => node.props.testID.replace('catch-up-row-', '')),
    ),
  ];
  expect(ids.length).toBeGreaterThanOrEqual(2);
  for (const id of ids.slice(0, 2)) {
    act(() => {
      byTestId(tree, `catch-up-row-${id}`).props.onPress();
    });
  }
  act(() => {
    byTestId(tree, 'catch-up-log').props.onPress();
  });
  const pulseIds = activityForDay().map(item => item.pulseId);
  expect(pulseIds).toEqual(expect.arrayContaining(ids.slice(0, 2)));
  expect(tree.root.findByType(CatchUpSheet).props.visible).toBe(false);
  act(() => tree.unmount());
});

it('asks what a chime is, opens each piece of it, and walks back out', () => {
  const tree = renderToday();
  const card = () => tree.root.findAllByType(InfoCardView)[0]?.props.card;
  // The last round row is still to come; earlier ones are missed by 10:00.
  const round = tree.root
    .findAll(
      (node: ReactTestInstance) =>
        String(node.props.testID ?? '').startsWith('day-row-sets:') &&
        typeof node.props.onPress === 'function',
    )
    .pop()!;
  act(() => round.props.onPress());
  expect(card().parts.length).toBeGreaterThan(1);
  act(() => byTestId(tree, 'info-part-0').props.onPress());
  // A piece explains itself: what it is, and how to do it.
  expect(card().how).toBeDefined();
  act(() => byTestId(tree, 'info-back').props.onPress());
  expect(card().parts.length).toBeGreaterThan(1);
  act(() => byTestId(tree, 'info-close').props.onPress());
  expect(card()).toBeUndefined();
  act(() => tree.unmount());
});

it('a missed chime explains itself from the sheet that logs it', () => {
  const tree = renderToday();
  const card = () => tree.root.findAllByType(InfoCardView)[0]?.props.card;
  const missed = tree.root.findAll(
    (node: ReactTestInstance) =>
      typeof node.props.testID === 'string' &&
      node.props.testID.startsWith('day-row-plan:') &&
      typeof node.props.onPress === 'function',
  )[0];
  act(() => missed.props.onPress());
  expect(tree.root.findByType(LateLogSheet).props.row).toBeDefined();
  act(() => byTestId(tree, 'late-info').props.onPress());
  // What it is and how to do it, without logging anything.
  expect(card().what).toBeTruthy();
  expect(card().element).toBeTruthy();
  act(() => byTestId(tree, 'info-close').props.onPress());
  expect(card()).toBeUndefined();
  expect(tree.root.findByType(LateLogSheet).props.row).toBeDefined();
  act(() => tree.unmount());
});

it('offers to set a place when there is none, and opens Weather', () => {
  const tree = renderToday();
  // Without a place there is no weather line to show — and it is the only
  // door to the Weather sheet, so it has to be there asking for one.
  const line = byTestId(tree, 'conditions-open');
  expect(line).toBeDefined();
  expect(JSON.stringify(tree.toJSON())).toContain('Set your place');
  // The weather line is one line, always: it shrinks rather than wraps.
  for (const text of line.findAllByType(Text)) {
    expect(text.props.numberOfLines).toBe(1);
  }
  act(() => line.props.onPress());
  expect(tree.root.findAllByType(WeatherSheet)[0].props.visible).toBe(true);
  act(() => tree.unmount());
});

it('names the element tiles for somebody new, and not for anyone else', () => {
  const names = (tree: renderer.ReactTestRenderer) =>
    JSON.stringify(tree.toJSON()).includes('"Water"');
  const before = renderToday();
  expect(names(before)).toBe(false);
  act(() => before.unmount());

  finishSetup(TEN_AM.getTime() - 60_000);
  const fresh = renderToday();
  expect(names(fresh)).toBe(true);
  act(() => fresh.unmount());
});

it('opens Weather and the plan as pages in Settings, and Back returns to The day', () => {
  const tree = renderToday();
  act(() => byTestId(tree, 'settings-open').props.onPress());
  act(() => byTestId(tree, 'settings-group-day').props.onPress());
  act(() => byTestId(tree, 'weather-open').props.onPress());
  expect(byTestId(tree, 'weather-place')).toBeDefined();
  // No sheet over the sheet: Back goes to The day, then to Settings.
  act(() => byTestId(tree, 'settings-back').props.onPress());
  expect(byTestId(tree, 'weather-open')).toBeDefined();
  act(() => byTestId(tree, 'settings-back').props.onPress());
  expect(byTestId(tree, 'settings-group-day')).toBeDefined();
  act(() => tree.unmount());
});
