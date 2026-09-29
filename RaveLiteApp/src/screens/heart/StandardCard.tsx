/**
 * The standard, answered before it is explained.
 *
 * This is read at the door on the way out, not studied. So the verdict
 * comes first and large — READY, or the count of what is not held — and
 * the six rows underneath say which and what to do about it. Somebody
 * who is ready should be able to shut the phone after one word.
 *
 * Shown only for an archetype that carries a standard. Most do not, and
 * that is the normal case: a standard is for somebody who has to be
 * ready for other people.
 *
 * Nothing here is a gate. The app cannot stop anybody working a night
 * and should not pretend to — a Knight who is short on the run still
 * knows it, which is the entire point of saying so.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  markNeeded,
  readinessLine,
  type Readiness,
  type RequirementState,
  type RequirementStatus,
} from '../../domain/standards/readiness';
import {formatDuration} from '../../domain/training/grading';
import type {StandardEvent} from '../../domain/standards/standards';
import type {InfoRef} from '../../domain/info/info';
import type {Sex} from '../../domain/standards/standards';
import {hues} from '../../theme/hues';
import {palette, radius, spacing, type as t} from '../../theme';

/** Same shape of value formatting Goals uses, so a mark reads alike. */
const formatValue = (event: StandardEvent, value: number): string =>
  event.unit === 'seconds'
    ? formatDuration(value)
    : event.unit === 'percent'
    ? `${Math.round(value)}%`
    : event.unit === 'ratio'
    ? value.toFixed(2)
    : String(Math.round(value));

const shortDate = (at: number): string =>
  new Date(at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});

const GLYPH: Record<RequirementState, string> = {
  met: '✓',
  short: '✗',
  stale: '⟳',
  untested: '○',
};

const COLOR: Record<RequirementState, string> = {
  met: hues.success,
  short: hues.danger,
  stale: hues.warning,
  untested: palette.textFaint,
};

/** Said aloud by a screen reader, where a glyph says nothing. */
const SPOKEN: Record<RequirementState, string> = {
  met: 'held',
  short: 'under the mark',
  stale: 'out of date',
  untested: 'not tested',
};

/** The right-hand column: what to do, or how long it lasts. */
function noteFor(status: RequirementStatus, sex: Sex): string {
  const {event, requirement, state} = status;
  switch (state) {
    case 'met':
      return status.daysLeft === undefined
        ? ''
        : `${status.daysLeft} ${status.daysLeft === 1 ? 'day' : 'days'} left`;
    case 'short': {
      const mark = markNeeded(event, sex, requirement.grade);
      return mark === undefined
        ? 'under the mark'
        : `needs ${formatValue(event, mark)}`;
    }
    case 'stale':
      return status.testedAt === undefined
        ? 'out of date'
        : `last ${shortDate(status.testedAt)}`;
    case 'untested':
      return 'not tested';
  }
}

export function StandardCard({
  readiness,
  sex,
  onInfo,
}: {
  readiness: Readiness;
  sex: Sex;
  onInfo?: (ref: InfoRef) => void;
}) {
  const {standard, ready} = readiness;
  const verdict = ready ? 'READY' : `${readiness.outstanding} TO DO`;
  const verdictColor = ready ? hues.success : hues.warning;

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.eyebrow}>
        {standard.name.toUpperCase()}
      </Text>

      <Text style={[styles.verdict, {color: verdictColor}]}>{verdict}</Text>
      <Text style={styles.line}>{readinessLine(readiness)}</Text>
      <Text style={styles.why}>{standard.why}</Text>

      <View style={styles.rows}>
        {readiness.statuses.map(status => {
          const {event, state} = status;
          const note = noteFor(status, sex);
          const value =
            status.value !== undefined && state !== 'untested'
              ? formatValue(event, status.value)
              : '—';
          return (
            <Tap
              key={event.id}
              testID={`standard-${event.id}`}
              variant="plain"
              onPress={
                onInfo ? () => onInfo({kind: 'event', id: event.id}) : undefined
              }
              disabled={!onInfo}
              accessibilityRole="button"
              accessibilityLabel={`${event.name}: ${SPOKEN[state]}. ${
                note || ''
              } What is this?`}
              style={styles.row}>
              <View style={styles.rowInner}>
                <Text style={[styles.glyph, {color: COLOR[state]}]}>
                  {GLYPH[state]}
                </Text>
                <Text style={styles.name} numberOfLines={1}>
                  {event.name}
                </Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={[styles.note, {color: COLOR[state]}]}>{note}</Text>
              </View>
            </Tap>
          );
        })}
      </View>

      <Text style={styles.foot}>
        Held for {standard.requirements[0]?.withinDays ?? 90} days from the day
        you test. Nothing here stops you working; it only says where you stand.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: palette.textDim,
  },
  verdict: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  line: {
    ...t.subtitle,
    color: palette.text,
  },
  why: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  rows: {
    marginTop: spacing.md,
    gap: 2,
  },
  row: {
    borderRadius: radius.sm,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  glyph: {
    fontSize: 15,
    width: 16,
    textAlign: 'center',
  },
  name: {
    ...t.body,
    color: palette.text,
    flex: 1,
  },
  value: {
    ...t.body,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  note: {
    ...t.caption,
    width: 92,
    textAlign: 'right',
  },
  foot: {
    ...t.caption,
    color: palette.textFaint,
    marginTop: spacing.md,
    lineHeight: 17,
  },
});
