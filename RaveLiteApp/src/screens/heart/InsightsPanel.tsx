/**
 * InsightsPanel — Heart > Insights tab body.
 *
 * v1 surfaces three reads:
 *   1. This-week pulse total + current streak (one-line headline).
 *   2. 7-day all-elements sparkline (total volume trend).
 *   3. Per-element rows: 7-day sparkline + week count, in pentagram
 *      order. Empty elements still render at low opacity so the
 *      operator can see *which* element they're starving.
 *
 * Dataless gate: if total pulses across the week === 0, render an
 * empty-state instead of a row of flat bars.
 */
import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {MiniSparkline} from '../../components/MiniSparkline';
import {
  completionsByDay,
  completionsByDayForElement,
  completionsLastNDays,
  completionsLastNDaysByElement,
  currentStreakDays,
} from '../../domain/journal/stats';
import {ELEMENT_ORDER, ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const WINDOW_DAYS = 7;
/** Daily target for the all-elements sparkline (≈ one pulse per element). */
const TOTAL_DAILY_TARGET = 5;
/** Daily target for per-element rows (one signed pulse). */
const ELEMENT_DAILY_TARGET = 1;

export function InsightsPanel() {
  const data = useMemo(() => {
    return {
      weekTotal: completionsLastNDays(WINDOW_DAYS),
      streak: currentStreakDays(),
      byDay: completionsByDay(WINDOW_DAYS),
      byElementTotal: completionsLastNDaysByElement(WINDOW_DAYS),
      byElementSeries: ELEMENT_ORDER.reduce<Record<ElementId, number[]>>(
        (acc, el) => {
          acc[el] = completionsByDayForElement(el, WINDOW_DAYS);
          return acc;
        },
        {fire: [], air: [], earth: [], water: [], heart: []},
      ),
    };
  }, []);

  const accent = ELEMENTS.heart.accent;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, {color: accent}]}>
          ⏵  INSIGHTS  ·  LAST 7 DAYS
        </Text>
        <Text style={styles.subtitle}>
          The trace of your week. Bars fill at one signed pulse per
          element per day.
        </Text>
      </View>

      {/* Headline numbers */}
      <View style={styles.headlineRow}>
        <View style={styles.headlineCell}>
          <Text style={styles.headlineValue}>{data.weekTotal}</Text>
          <Text style={styles.headlineLabel}>pulses · 7d</Text>
        </View>
        <View style={styles.headlineDivider} />
        <View style={styles.headlineCell}>
          <Text style={[styles.headlineValue, {color: ELEMENTS.heart.color}]}>
            {data.streak}
          </Text>
          <Text style={styles.headlineLabel}>day streak</Text>
        </View>
      </View>

      {data.weekTotal === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No pulses logged yet.</Text>
          <Text style={styles.emptyBody}>
            Run a circuit, log a drill, or accept a notification pulse —
            insights light up after the first signed entry.
          </Text>
        </View>
      ) : (
        <>
          {/* Total volume sparkline */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>All elements</Text>
              <Text style={styles.cardCount}>{data.weekTotal}</Text>
            </View>
            <MiniSparkline
              data={data.byDay}
              dailyTarget={TOTAL_DAILY_TARGET}
              color={ELEMENTS.heart.color}
              height={48}
            />
            <Text style={styles.cardFoot}>
              Goal hairline = {TOTAL_DAILY_TARGET}/day
            </Text>
          </View>

          {/* Per-element rows */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BY ELEMENT</Text>
            {ELEMENT_ORDER.map(el => {
              const id = ELEMENTS[el];
              const total = data.byElementTotal[el];
              const dim = total === 0;
              return (
                <View
                  key={el}
                  style={[styles.elRow, dim && styles.elRowDim]}>
                  <View style={styles.elHead}>
                    <Text style={[styles.elGlyph, {color: id.color}]}>
                      {id.glyph}
                    </Text>
                    <View style={styles.elMeta}>
                      <Text style={[styles.elName, {color: id.accent}]}>
                        {id.name}
                      </Text>
                      <Text style={styles.elDomain}>{id.domain}</Text>
                    </View>
                    <Text
                      style={[
                        styles.elCount,
                        {color: dim ? palette.textMuted : id.color},
                      ]}>
                      {total}
                    </Text>
                  </View>
                  <MiniSparkline
                    data={data.byElementSeries[el]}
                    dailyTarget={ELEMENT_DAILY_TARGET}
                    color={id.color}
                    height={36}
                  />
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    ...t.subtitle,
    color: palette.textDim,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  headlineCell: {
    flex: 1,
    alignItems: 'center',
  },
  headlineDivider: {
    width: 1,
    backgroundColor: palette.border,
    marginHorizontal: spacing.sm,
  },
  headlineValue: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  headlineLabel: {
    fontSize: 11,
    color: palette.textDim,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  emptyTitle: {
    ...t.title,
    color: palette.text,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    ...t.body,
    color: palette.textDim,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  cardCount: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cardFoot: {
    color: palette.textMuted,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
  section: {marginTop: spacing.xl},
  sectionLabel: {
    color: palette.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  elRow: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: spacing.sm,
  },
  elRowDim: {opacity: 0.55},
  elHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  elGlyph: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  elMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  elName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  elDomain: {
    color: palette.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  elCount: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
