/**
 * Demo mode exists to photograph the app without photographing somebody's
 * training. Its one load-bearing promise is that the real data is never
 * written to — not exported and restored, which would make every crash a
 * data-loss risk, but genuinely never touched.
 */
import {
  __resetDemo,
  enterDemo,
  exitDemo,
  handleDemoLink,
  isDemo,
} from '../demo';
import {DEMO_PROFILE} from '../seed';
import {store, __realStore} from '../../../storage';
import {KEYS} from '../../../storage/keys';
import {__resetProfileCache, loadFacts} from '../../profile/repository';
import {activityForDay} from '../../activity/activity';
import {addEntry, loadEntries} from '../../training/repository';
import {loadProgram} from '../../program/repository';
import {doneByTrack} from '../../program/progress';
import {entriesForDay} from '../../journal/journal';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {TodayPanel} from '../../../screens/heart/TodayPanel';
import {DailySetsSheet} from '../../../screens/heart/DailySetsSheet';
import {CharacterSheet} from '../../../screens/heart/CharacterSheet';
import {SettingsSheet} from '../../../screens/heart/SettingsSheet';

const NOW = new Date(2026, 8, 21, 14, 0).getTime();

beforeEach(() => {
  __resetDemo();
  __realStore.clearAll();
  __resetProfileCache();
});

afterEach(() => {
  __resetDemo();
  __resetProfileCache();
});

/** Something real, that must survive everything below. */
function aRealLife(): string {
  addEntry({at: NOW, kindId: 'builtin.run-2mi', value: 1040});
  store.set(
    KEYS.profile,
    JSON.stringify({
      version: 1,
      facts: {kit: ['floor'], noise: 'quiet', corrections: []},
    }),
  );
  return __realStore.getString(KEYS.trainingEntries)!;
}

it('never writes to the real store, even while pretending hard', () => {
  const mine = aRealLife();

  enterDemo(NOW);
  __resetProfileCache();
  // The app is now looking at somebody else entirely.
  expect(loadFacts().kit).toEqual(DEMO_PROFILE.facts.kit);
  expect(activityForDay(new Date(NOW)).length).toBeGreaterThan(0);

  // Write plenty while in there.
  addEntry({at: NOW, kindId: 'builtin.staff-session', value: 600});
  store.set('anything.at.all', 'scribble');
  store.clearAll();

  // Not one byte of it reached the real one.
  expect(__realStore.getString(KEYS.trainingEntries)).toBe(mine);
  expect(__realStore.getString('anything.at.all')).toBeUndefined();
});

it('comes back to the real life on the way out', () => {
  const mine = aRealLife();
  enterDemo(NOW);
  exitDemo();
  __resetProfileCache();

  expect(store.getString(KEYS.trainingEntries)).toBe(mine);
  expect(loadFacts().kit).toEqual(['floor']);
  expect(loadEntries()).toHaveLength(1);
});

it('survives being left on: a restart is a fresh, real app', () => {
  const mine = aRealLife();
  enterDemo(NOW);
  // No exitDemo — as if the process were killed mid-screenshot. The next
  // launch constructs everything from the real store, which never moved.
  expect(__realStore.getString(KEYS.trainingEntries)).toBe(mine);
});

it('shows a life worth photographing, not zeroes and not perfection', () => {
  enterDemo(NOW);
  __resetProfileCache();

  const today = activityForDay(new Date(NOW));
  expect(today.length).toBeGreaterThan(3);

  // Weeks of history, so streaks and charts have something to draw.
  const program = loadProgram(new Date(NOW));
  expect(program.startDay < '2026-09-01').toBe(true);
  expect(program.tracks.push.testMax).toBeGreaterThan(0);

  // Somebody real, not a machine: not every day is complete.
  const days = new Set(
    store.keysWithPrefix(KEYS.journalPrefix).map(k => k.split('.')[1]),
  );
  expect(days.size).toBeGreaterThan(30);
});

it('counts as training, not just as points — the meters have to move', () => {
  enterDemo(NOW);
  __resetProfileCache();
  // A completion without an `amount` is not a set (see doneByTrack), so
  // the first demo showed eleven weeks of history and a Daily Sets meter
  // reading zero. The screenshots were the only thing that noticed.
  const done = doneByTrack(entriesForDay(new Date(NOW)));
  const tracked = Object.values(done).filter(d => d && d.sets > 0);
  expect(tracked.length).toBeGreaterThan(3);
  for (const d of tracked) {
    expect(d!.amount).toBeGreaterThan(0);
  }
});

it('photographs nowhere anybody lives', () => {
  enterDemo(NOW);
  const place = JSON.parse(store.getString(KEYS.weatherPlace)!);
  expect(place.name).toBe('Reykjavík');
});

it('is entered only by the link, and only by the right one', () => {
  expect(handleDemoLink(undefined)).toBe(false);
  expect(handleDemoLink('https://example.com')).toBe(false);
  expect(handleDemoLink('ravelite://something-else')).toBe(false);
  expect(isDemo()).toBe(false);

  expect(handleDemoLink('ravelite://demo/on')).toBe(true);
  expect(isDemo()).toBe(true);
  // Asking twice is not an error, it is just already true.
  expect(handleDemoLink('ravelite://demo/on')).toBe(false);

  expect(handleDemoLink('ravelite://demo/off')).toBe(true);
  expect(isDemo()).toBe(false);

  expect(handleDemoLink('ravelite://demo/toggle')).toBe(true);
  expect(isDemo()).toBe(true);
});

/**
 * Every screen the screenshot walk visits has to survive demo data. A
 * crash here is a crash on the device at the exact moment nobody is
 * watching the logs, which is how the first run of this cost an hour.
 */
describe('the screens the camera visits', () => {
  const screens: [string, () => React.ReactElement][] = [
    [
      'Today',
      () => (
        <TodayPanel
          permission="granted"
          onElementPress={() => {}}
          onEngageLegs={() => {}}
        />
      ),
    ],
    ['Daily Sets', () => <DailySetsSheet visible onClose={() => {}} />],
    ['Character', () => <CharacterSheet />],
    [
      'Settings',
      () => <SettingsSheet visible onClose={() => {}} permission="granted" />,
    ],
  ];

  it.each(screens)('%s renders on somebody else’s life', (_name, build) => {
    enterDemo(NOW);
    __resetProfileCache();
    let tree: renderer.ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(build());
    });
    expect(tree!.toJSON()).toBeTruthy();
    act(() => tree!.unmount());
  });
});
