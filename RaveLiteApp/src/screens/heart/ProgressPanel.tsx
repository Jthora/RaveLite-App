/**
 * ProgressPanel — Heart › Progress.
 *
 * The longer view: balance across the elements over the last week, the
 * last two weeks against your usual day, a quiet streak line, and Daily
 * Sets (tracks, max tests, level ups).
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {MiniSparkline} from '../../components/MiniSparkline';
import {
  activityInRange,
  subscribeActivity,
} from '../../domain/activity/activity';
import {
  countsByDay,
  countsByElement,
  streakDays,
} from '../../domain/activity/stats';
import {subscribeProgram} from '../../domain/program/repository';
import {ELEMENTS, ELEMENT_ORDER} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import {DailySetsSection} from './DailySetsSection';

const TREND_DAYS = 14;

export function ProgressPanel() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    const unsubscribes = [
      subscribeActivity(refresh),
      subscribeProgram(refresh),
    ];
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [refresh]);

  const view = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const days = countsByDay(TREND_DAYS, now);
    const activeDays = days.filter(n => n > 0);
    return {
      week: countsByElement(activityInRange(weekStart, now)),
      days,
      usual: activeDays.length
        ? Math.round(activeDays.reduce((a, b) => a + b, 0) / activeDays.length)
        : 1,
      streak: streakDays(now),
    };
    // `version` is the rebuild trigger; the reads go to storage directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const most = Math.max(1, ...ELEMENT_ORDER.map(id => view.week[id]));
  const accent = ELEMENTS.heart.accent;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, {color: accent}]}>▸ LAST 7 DAYS</Text>
      <Text style={styles.streak}>
        {view.streak > 0
          ? `${view.streak} day${view.streak === 1 ? '' : 's'} moving`
          : 'A fresh start today'}
      </Text>

      <View style={styles.card}>
        {ELEMENT_ORDER.map(id => {
          const el = ELEMENTS[id];
          const n = view.week[id];
          return (
            <View key={id} style={styles.barRow}>
              <Text style={[styles.barGlyph, {color: el.color}]}>
                {el.glyph}
              </Text>
              <Text style={styles.barName}>{el.name}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {backgroundColor: el.color, width: `${(n / most) * 100}%`},
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{n}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last {TREND_DAYS} days</Text>
        <MiniSparkline
          data={view.days}
          dailyTarget={view.usual}
          color={accent}
        />
        <Text style={styles.caption}>The line marks your usual day.</Text>
      </View>

      <DailySetsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  streak: {
    ...t.subtitle,
    color: palette.text,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barGlyph: {
    width: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  barName: {
    ...t.body,
    color: palette.text,
    width: 56,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: palette.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  barCount: {
    ...t.body,
    color: palette.text,
    minWidth: 28,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
