/**
 * The focus wheel on the Daily Sets page: today's focus with its morning
 * block, and the week ahead (see `domain/program/week.ts`).
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';

import {EXERCISE_LIBRARY} from '../../domain/exercises/library';
import type {BlockPiece} from '../../domain/program/morning';
import type {RunDay} from '../../domain/run/plan';
import {
  DAILY_CORE,
  attributeById,
  type AttributeId,
  type DayFocus,
} from '../../domain/program/week';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const drillName = (id: string) =>
  EXERCISE_LIBRARY.find(e => e.id === id)?.name ?? id;

/** Attribute names in their elements' colors, dot-separated. */
function Attributes({
  ids,
  style,
}: {
  ids: readonly AttributeId[];
  style?: object;
}) {
  return (
    <Text style={style} numberOfLines={1}>
      {ids.flatMap((id, i) => {
        const attribute = attributeById(id);
        return [
          i > 0 ? (
            <Text key={`dot-${id}`} style={styles.dot}>
              {' · '}
            </Text>
          ) : null,
          <Text key={id} style={{color: ELEMENTS[attribute.element].color}}>
            {attribute.name}
          </Text>,
        ];
      })}
    </Text>
  );
}

/** Today's focus, the morning block piece by piece, and the daily core. */
export function TodayFocus({
  focus,
  pieces,
  onOpen,
}: {
  focus: DayFocus;
  /** The block with the run plan's run in place; the plain block otherwise. */
  pieces?: readonly BlockPiece[];
  /** Opens the attributes today's focus leans on. */
  onOpen?: () => void;
}) {
  const shown = pieces ?? focus.block.pieces.map(id => ({exerciseId: id}));
  const body = (
    <>
      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>Today's focus</Text>
        {onOpen ? <Text style={styles.more}>Character ›</Text> : null}
      </View>
      <Attributes ids={focus.focus} style={styles.focusLine} />
      <Text style={styles.blockTitle}>
        Morning: {focus.block.title}
        {focus.test && focus.test.name !== focus.block.title
          ? ` · ${focus.test.name}`
          : ''}
      </Text>
      {shown.map((piece: BlockPiece, i) => (
        <View key={`${piece.exerciseId}-${i}`}>
          <Text style={styles.piece}>
            {i + 1}. {drillName(piece.exerciseId)}
          </Text>
          {piece.run ? (
            <Text style={styles.runDetail}>{piece.run.detail}</Text>
          ) : null}
        </View>
      ))}
      <Text style={styles.caption}>
        Every day's rounds:{' '}
        {DAILY_CORE.map(id => attributeById(id).name).join(' · ')}
      </Text>
    </>
  );

  return onOpen ? (
    <Tap
      testID="today-focus"
      variant="plain"
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Today's focus: ${focus.focus
        .map(id => attributeById(id).name)
        .join(', ')}. Open the character sheet`}
      style={styles.card}>
      {body}
    </Tap>
  ) : (
    <View testID="today-focus" style={styles.card}>
      {body}
    </View>
  );
}

/** The next seven days, today first: focus and morning block or test. */
export function WeekFocus({
  days,
}: {
  days: readonly {date: Date; focus: DayFocus; run?: RunDay}[];
}) {
  return (
    <View testID="week-focus">
      <Text style={styles.section}>This week</Text>
      {days.map(({date, focus, run}, i) => (
        <View
          key={date.toDateString()}
          style={[styles.row, i === 0 && styles.today]}>
          <Text style={[styles.day, i === 0 && styles.dayToday]}>
            {i === 0 ? 'Today' : DAY_NAMES[date.getDay()]}
          </Text>
          <View style={styles.rowBody}>
            <Attributes ids={focus.focus} style={styles.rowFocus} />
            <Text style={styles.caption} numberOfLines={1}>
              {(focus.test ? focus.test.name : focus.block.title) +
                (run ? ` · ${run.short}` : '')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  more: {
    ...t.caption,
    color: ELEMENTS.heart.color,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  focusLine: {
    ...t.subtitle,
  },
  dot: {
    color: palette.textDim,
  },
  blockTitle: {
    ...t.body,
    color: palette.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  piece: {
    ...t.body,
    color: palette.text,
  },
  runDetail: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
    marginLeft: spacing.md,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
  },
  section: {
    ...t.subtitle,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  today: {
    backgroundColor: palette.surface,
  },
  day: {
    ...t.caption,
    width: 44,
    color: palette.textDim,
    fontWeight: '700',
  },
  dayToday: {
    color: palette.text,
  },
  rowBody: {
    flex: 1,
  },
  rowFocus: {
    ...t.body,
  },
});
