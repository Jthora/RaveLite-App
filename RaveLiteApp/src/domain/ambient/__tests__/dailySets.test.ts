import {store} from '../../../storage';
import {entriesForDay} from '../../journal/journal';
import type {CompletionEntry} from '../../journal/types';
import type {SetPrescription} from '../../program/types';
import {handleNotificationAction} from '../notificationActions';
import {ALWAYS_PAGE, emptyQueue, enqueue, tick} from '../pulseQueue';
import * as runtime from '../pulseRuntime';
import {__test as setSchedulerTest} from '../setScheduler';

/**
 * The chime → set → answer loop for Daily Sets, end to end through the
 * pure queue, the runtime and notification buttons.
 */

// Monday 14 Sep 2026, 10:00 local — inside default active hours.
const NOW = new Date(2026, 8, 14, 10, 0).getTime();

const rx: SetPrescription = {
  trackId: 'push',
  label: 'Push-ups',
  unit: 'reps',
  amount: 10,
  setIndex: 2,
  sets: 6,
};

const completions = (): CompletionEntry[] =>
  entriesForDay(new Date(NOW)).filter(
    (e): e is CompletionEntry => e.kind === 'completion',
  );

beforeEach(() => {
  store.clearAll();
  runtime.__test.reset();
  setSchedulerTest.reset();
});

describe('pulse queue', () => {
  it('carries the prescription to the active pulse and stamps trackId on reminder.fired', () => {
    let r = enqueue(emptyQueue(), {
      id: 'sets:2026-09-14:push:2',
      fireAt: NOW,
      element: 'fire',
      prescription: rx,
    });
    r = tick(r.state, NOW, ALWAYS_PAGE);
    expect(r.state.pulses[0].prescription).toEqual(rx);
    expect(r.writes[0]).toMatchObject({
      kind: 'reminder.fired',
      trackId: 'push',
    });
  });
});

describe('answering a set', () => {
  it('sealing the live pulse logs the adjusted amount against the track', () => {
    runtime.enqueue({
      id: 'sets:x:push:2',
      fireAt: NOW,
      element: 'fire',
      exerciseId: 'fire.pushup-groove',
      prescription: rx,
    });
    runtime.tickNow(NOW);
    expect(runtime.getActivePulseSummary()?.prescription).toEqual(rx);
    runtime.sealActive({amount: 12, at: NOW + 20_000});
    expect(runtime.getActivePulseSummary()).toBeUndefined();
    expect(completions()).toEqual([
      expect.objectContaining({
        pulseId: 'sets:x:push:2',
        trackId: 'push',
        amount: 12,
      }),
    ]);
  });

  it('the notification Done button seals the live pulse', async () => {
    runtime.enqueue({
      id: 'sets:x:push:2',
      fireAt: NOW,
      element: 'fire',
      exerciseId: 'fire.pushup-groove',
      prescription: rx,
    });
    runtime.tickNow(NOW);
    await handleNotificationAction(
      {
        actionId: 'seal',
        data: {pulseId: 'sets:x:push:2', trackId: 'push', amount: '10'},
      },
      NOW + 5_000,
    );
    expect(runtime.getActivePulseSummary()).toBeUndefined();
    expect(completions()).toEqual([
      expect.objectContaining({
        source: 'notification',
        trackId: 'push',
        amount: 10,
      }),
    ]);
  });

  it('Done still counts when the runtime lost the pulse, and only once', async () => {
    const action = {
      actionId: 'seal' as const,
      data: {
        pulseId: 'sets:x:push:4',
        trackId: 'push',
        amount: '10',
        element: 'fire',
        exerciseId: 'fire.pushup-groove',
      },
    };
    await handleNotificationAction(action, NOW);
    await handleNotificationAction(action, NOW + 1_000);
    expect(completions()).toEqual([
      expect.objectContaining({
        pulseId: 'sets:x:push:4',
        trackId: 'push',
        amount: 10,
        element: 'fire',
      }),
    ]);
  });

  it('Skip on a lost pulse records a skip, not a completion', async () => {
    await handleNotificationAction(
      {actionId: 'skip', data: {pulseId: 'sets:x:push:5', trackId: 'push'}},
      NOW,
    );
    const today = entriesForDay(new Date(NOW));
    expect(
      today.some(
        e => e.kind === 'reminder.skipped' && e.pulseId === 'sets:x:push:5',
      ),
    ).toBe(true);
    expect(completions()).toEqual([]);
  });
});

describe('answering a round', () => {
  const round: SetPrescription = {
    trackId: 'push',
    label: 'Push-ups',
    unit: 'reps',
    amount: 5,
    setIndex: 1,
    sets: 4,
    roundIndex: 1,
    rounds: 9,
    moves: [
      {
        trackId: 'push',
        exerciseId: 'fire.pushup-groove',
        element: 'fire',
        label: 'Push-ups',
        unit: 'reps',
        amount: 5,
        setIndex: 1,
        sets: 4,
      },
      {
        trackId: 'squat',
        exerciseId: 'earth.squat',
        element: 'earth',
        label: 'Squats',
        unit: 'reps',
        amount: 10,
        setIndex: 1,
        sets: 4,
      },
    ],
    partner: {
      exerciseId: 'air.doorway-pec-stretch',
      element: 'air',
      label: 'Doorway pec stretch',
      seconds: 30,
    },
    water: true,
  };

  it('one Done records every move, the partner and the glass', () => {
    runtime.enqueue({
      id: 'sets:x:round:1',
      fireAt: NOW,
      element: 'fire',
      exerciseId: 'fire.pushup-groove',
      prescription: round,
    });
    runtime.tickNow(NOW);
    runtime.sealActive({amounts: {squat: 8}, at: NOW + 20_000});
    const [entry] = completions();
    expect(completions()).toHaveLength(1);
    expect(entry).toMatchObject({
      pulseId: 'sets:x:round:1',
      moves: [
        {trackId: 'push', amount: 5},
        {trackId: 'squat', amount: 8},
      ],
      partnerExerciseId: 'air.doorway-pec-stretch',
      partnerSec: 30,
      water: true,
    });
    expect(entry.trackId).toBeUndefined();
  });
});
