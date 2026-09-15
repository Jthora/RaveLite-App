import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {PUSHUP_GOAL, type PushupDay} from '../../domain/program/pushups';
import type {SetsSummary} from '../../domain/program/setsSummary';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  sets: SetsSummary;
  onPress: () => void;
  /** Push-ups toward today's 200, shown as the card's lead row. */
  pushups?: PushupDay;
  onPushupsPress?: () => void;
}

/** Tracks the push-up row stands in for. */
const PUSH_TRACKS: ReadonlySet<string> = new Set(['push', 'push-variants']);

/**
 * Daily Sets at a glance: sets done today; push-ups toward 200 as the lead
 * row (tap for the fitness standards); then one small meter per other track
 * (amount done against the day's quota) in its element's color. Tap the
 * card for tracks, max tests and level ups.
 */
export function SetsMeters({sets, onPress, pushups, onPushupsPress}: Props) {
  const fire = ELEMENTS.fire.color;
  const tracks = pushups
    ? sets.tracks.filter(tr => !PUSH_TRACKS.has(tr.trackId))
    : sets.tracks;
  const detail = pushups
    ? [
        `${pushups.standard} standard`,
        `${pushups.variants} variants`,
        pushups.bestSet > 0 ? `best set ${pushups.bestSet}` : undefined,
        pushups.planned > 0 ? `${pushups.planned} planned` : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Tap
      testID="sets-open"
      variant="plain"
      color={ELEMENTS.heart.accent}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        sets.total === 0
          ? 'Daily Sets, rest day. Open'
          : `Daily Sets, ${sets.done} of ${sets.total} sets. Open`
      }
      style={styles.card}>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Daily Sets
            {sets.total === 0 ? (
              ' · rest day'
            ) : (
              <Text style={styles.count}>
                {' '}
                {sets.done}/{sets.total}
              </Text>
            )}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
        {pushups ? (
          <Tap
            testID="pushups-open"
            variant="plain"
            color={fire}
            onPress={onPushupsPress ?? onPress}
            accessibilityRole="button"
            accessibilityLabel={`Push-ups: ${pushups.total} of ${PUSHUP_GOAL} today, ${detail}. Open standards`}
            style={styles.hero}>
            <View style={styles.heroTop}>
              <MoveIcon move="push" color={fire} size={16} />
              <Text style={styles.heroLabel}>Push-ups</Text>
              <View style={styles.spacer} />
              <Text
                testID="pushups-count"
                style={[
                  styles.heroTotal,
                  pushups.total >= PUSHUP_GOAL && {color: fire},
                ]}>
                {pushups.total}
                <Text style={styles.heroGoal}> / {PUSHUP_GOAL}</Text>
              </Text>
            </View>
            <View style={styles.heroBar}>
              <View
                style={[
                  styles.heroFill,
                  {
                    width: `${Math.min(1, pushups.total / PUSHUP_GOAL) * 100}%`,
                    backgroundColor: fire,
                  },
                ]}
              />
              {pushups.planned > 0 && pushups.planned < PUSHUP_GOAL ? (
                // Where today's sets add up to.
                <View
                  style={[
                    styles.planned,
                    {left: `${(pushups.planned / PUSHUP_GOAL) * 100}%`},
                  ]}
                />
              ) : null}
            </View>
            <Text style={styles.heroDetail} numberOfLines={1}>
              {detail}
            </Text>
          </Tap>
        ) : null}
        {tracks.length > 0 ? (
          <View style={styles.grid}>
            {tracks.map(tr => {
              const color = ELEMENTS[tr.element].color;
              return (
                <View key={tr.trackId} style={styles.meter}>
                  <View style={styles.meterText}>
                    <MoveIcon move={tr.move} color={color} size={14} />
                    <Text style={styles.meterName} numberOfLines={1}>
                      {tr.name}
                    </Text>
                  </View>
                  {/* The count sits beside the bar so the name keeps its room. */}
                  <View style={styles.barRow}>
                    <View style={styles.bar}>
                      <View
                        style={[
                          styles.fill,
                          {width: `${tr.fill * 100}%`, backgroundColor: color},
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.meterCount, tr.fill >= 1 && {color}]}
                      numberOfLines={1}>
                      {tr.done}/{tr.total}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 48,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Tap wraps its children in one view; the gap lives inside it.
  body: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  count: {
    color: palette.text,
    fontWeight: '700',
  },
  chevron: {
    ...t.subtitle,
    color: palette.textDim,
  },
  hero: {
    minHeight: 48,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    ...t.subtitle,
    fontSize: 15,
    color: palette.text,
  },
  spacer: {
    flex: 1,
  },
  heroTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  heroGoal: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textDim,
  },
  heroBar: {
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  heroFill: {
    height: 5,
  },
  planned: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: palette.textDim,
  },
  heroDetail: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  meter: {
    width: '33.333%',
    paddingRight: spacing.sm,
  },
  meterText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meterName: {
    ...t.caption,
    color: palette.text,
    flexShrink: 1,
  },
  meterCount: {
    ...t.caption,
    color: palette.textDim,
    fontVariant: ['tabular-nums'],
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: palette.border,
  },
  fill: {
    height: 3,
  },
});
