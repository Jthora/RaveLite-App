import notifee from '@notifee/react-native';

import * as device from '../../../native/raveLiteDevice';
import {store} from '../../../storage';
import {
  buildPulseNotification,
  channelIdFor,
} from '../../reminders/notifeeScheduler';
import {
  chooseCueRoute,
  cueSettingsFor,
  effectiveCueVolume,
  setElementVolume,
  setMasterVolume,
  setRespectDnd,
} from '../cueVolume';
import * as runtime from '../pulseRuntime';

jest.mock('../../../native/raveLiteDevice', () => ({
  INTERRUPTION_FILTER_ALL: 1,
  hasDeviceModule: jest.fn(() => true),
  playCue: jest.fn(),
  getInterruptionFilter: jest.fn(),
  getAlarmVolume: jest.fn(),
}));

const playCue = device.playCue as jest.Mock;
const getInterruptionFilter = device.getInterruptionFilter as jest.Mock;
const display = notifee.displayNotification as jest.Mock;

// Monday 14 Sep 2026, 10:00 local — inside default active hours.
const NOW = new Date(2026, 8, 14, 10, 0).getTime();

/** Let the fire-and-forget chime chain settle. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
  playCue.mockReset();
  getInterruptionFilter.mockReset();
  display.mockClear();
});

describe('cue volume', () => {
  it('multiplies master by element level, clamped to 0–100', () => {
    expect(effectiveCueVolume(75, 100)).toBeCloseTo(0.75);
    expect(effectiveCueVolume(50, 50)).toBeCloseTo(0.25);
    expect(effectiveCueVolume(150, 50)).toBeCloseTo(0.5);
    expect(effectiveCueVolume(NaN, 100)).toBe(0);
  });

  it('defaults to 75 % master at full element level, and persists changes', () => {
    expect(cueSettingsFor('fire')).toEqual({volume: 0.75, respectDnd: false});
    setMasterVolume(50);
    setElementVolume('fire', 0);
    setRespectDnd(true);
    expect(cueSettingsFor('fire')).toEqual({volume: 0, respectDnd: true});
    expect(cueSettingsFor('air').volume).toBeCloseTo(0.5);
  });
});

describe('cue routing', () => {
  it.each([
    [{volume: 0, respectDnd: false, interruptionFilter: null}, 'silent'],
    [{volume: 0.5, respectDnd: false, interruptionFilter: 3}, 'alarm'],
    [{volume: 0.5, respectDnd: true, interruptionFilter: 1}, 'alarm'],
    [{volume: 0.5, respectDnd: true, interruptionFilter: 2}, 'channel'],
    [{volume: 0.5, respectDnd: true, interruptionFilter: null}, 'alarm'],
  ])('%j → %s', (input, route) => {
    expect(chooseCueRoute(input)).toBe(route);
  });
});

describe('pulse notification', () => {
  const payload = {
    element: 'fire' as const,
    color: '#FF3B2F',
    title: 'Push-ups · 10 reps',
    body: 'Set 1 of 4',
    exerciseId: 'fire.pushup-groove',
    pulseId: 'sets:x:push:1',
  };

  it('posts on the quiet channel only when the cue already played', () => {
    expect(buildPulseNotification(payload, {quiet: true}).android?.channelId).toBe(
      'elem.fire.quiet.v1',
    );
    expect(buildPulseNotification(payload, {quiet: false}).android?.channelId).toBe(
      'elem.fire.v3',
    );
    expect(channelIdFor('air', true)).toBe('elem.air.quiet.v1');
  });

  it('is answerable: pulse id as notification id, plus Done / +5 / Skip', () => {
    const n = buildPulseNotification(payload, {quiet: true});
    expect(n.id).toBe('sets:x:push:1');
    expect(n.android?.actions?.map(a => a.pressAction.id)).toEqual([
      'seal',
      'snooze',
      'skip',
    ]);
  });
});

describe('a firing pulse', () => {
  const fire = async () => {
    runtime.enqueue({id: 'p1', fireAt: NOW, element: 'fire'});
    runtime.tickNow(NOW);
    await flush();
  };
  const postedChannel = () =>
    display.mock.calls[display.mock.calls.length - 1]?.[0]?.android?.channelId;

  it('plays the cue on the alarm stream and posts quietly', async () => {
    playCue.mockResolvedValue(true);
    await fire();
    expect(playCue).toHaveBeenCalledWith('fire', 0.75);
    expect(postedChannel()).toBe('elem.fire.quiet.v1');
  });

  it('falls back to the sounding channel when the cue cannot play', async () => {
    playCue.mockResolvedValue(false);
    await fire();
    expect(postedChannel()).toBe('elem.fire.v3');
  });

  it('skips playback and stays quiet when the cue is Off', async () => {
    setElementVolume('fire', 0);
    await fire();
    expect(playCue).not.toHaveBeenCalled();
    expect(postedChannel()).toBe('elem.fire.quiet.v1');
  });

  it('lets Do Not Disturb mute it when Respect DND is on', async () => {
    setRespectDnd(true);
    getInterruptionFilter.mockResolvedValue(2);
    await fire();
    expect(playCue).not.toHaveBeenCalled();
    expect(postedChannel()).toBe('elem.fire.v3');
  });

  it('announces the fire to listeners with its prescription', () => {
    playCue.mockResolvedValue(true);
    const events: runtime.PulseFiredEvent[] = [];
    const off = runtime.onPulseFired(e => events.push(e));
    runtime.enqueue({
      id: 'set1',
      fireAt: NOW,
      element: 'fire',
      prescription: {
        trackId: 'push',
        label: 'Push-ups',
        unit: 'reps',
        amount: 10,
        setIndex: 1,
        sets: 4,
      },
    });
    runtime.tickNow(NOW);
    off();
    expect(events).toEqual([
      expect.objectContaining({
        pulseId: 'set1',
        element: 'fire',
        prescription: expect.objectContaining({amount: 10}),
      }),
    ]);
  });
});
