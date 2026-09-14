import type {MetricKind, TrainingLogEntry} from '../../training/types';
import type {ActivityItem} from '../activity';
import {buildDayRibbon, elementStatLine, itemsForElement} from '../elementDay';

const DAY = 86_400_000;
const NOON = new Date(2026, 8, 14, 12, 0);

const item = (
  over: Partial<ActivityItem> & Pick<ActivityItem, 'id' | 'at'>,
): ActivityItem => ({
  element: 'fire',
  source: 'manual',
  label: 'Drill',
  ref: {store: 'journal', id: over.id},
  ...over,
});

describe('buildDayRibbon', () => {
  it('lays out the last days oldest first, counting days and marking Train days', () => {
    const ribbon = buildDayRibbon({
      items: [
        item({id: 'a', at: NOON.getTime()}),
        item({id: 'b', at: NOON.getTime() - 2 * DAY, source: 'train'}),
        item({id: 'c', at: NOON.getTime() - 2 * DAY}),
        item({id: 'old', at: NOON.getTime() - 20 * DAY}),
      ],
      days: 14,
      now: NOON,
    });
    expect(ribbon).toHaveLength(14);
    expect(ribbon[0].dayStart).toBe(new Date(2026, 8, 1).getTime());
    expect(ribbon[13]).toMatchObject({
      count: 1,
      hasTrain: false,
      isToday: true,
    });
    expect(ribbon[11]).toMatchObject({
      count: 2,
      hasTrain: true,
      isToday: false,
    });
    expect(ribbon.reduce((sum, d) => sum + d.count, 0)).toBe(3);
  });
});

describe('elementStatLine', () => {
  it('reads today, the week and a streak when there is one', () => {
    expect(elementStatLine({today: 3, week: 12, streak: 4})).toBe(
      '3 today · 12 this week · 4-day streak',
    );
    expect(elementStatLine({today: 0, week: 2, streak: 0})).toBe(
      '0 today · 2 this week',
    );
  });
});

describe('itemsForElement', () => {
  const kind = (over: Partial<MetricKind> & Pick<MetricKind, 'id'>) =>
    ({
      label: over.id,
      category: 'custom',
      unit: 'seconds',
      inputMode: 'mmss',
      element: 'any',
      builtIn: false,
      ...over,
    } as MetricKind);
  const bike = kind({id: 'custom.bike', label: 'Bike'});
  const anyRun = kind({id: 'custom.run', category: 'run'});
  const metricFor = (id: string) => [bike, anyRun].find(m => m.id === id);
  const entry = (
    over: Partial<TrainingLogEntry> & Pick<TrainingLogEntry, 'id' | 'kindId'>,
  ): TrainingLogEntry => ({at: NOON.getTime(), value: 60, ...over});

  it('lists its own items plus Train entries of any-element kinds', () => {
    const out = itemsForElement({
      items: [
        item({id: 'air', at: NOON.getTime() - 1000, element: 'air'}),
        item({id: 'own', at: NOON.getTime() - 2000}),
      ],
      train: [
        entry({id: 'bike', kindId: 'custom.bike'}),
        entry({id: 'tagged', kindId: 'custom.bike', element: 'heart'}),
      ],
      element: 'water',
      metricFor,
    });
    expect(out.map(i => [i.id, i.element])).toEqual([['train:bike', 'water']]);
  });

  it('does not repeat an entry already credited to the element', () => {
    const out = itemsForElement({
      items: [
        item({
          id: 'train:run',
          at: NOON.getTime(),
          source: 'train',
          ref: {store: 'train', id: 'run'},
        }),
      ],
      train: [entry({id: 'run', kindId: 'custom.run'})],
      element: 'fire',
      metricFor,
    });
    expect(out.map(i => i.id)).toEqual(['train:run']);
  });
});
