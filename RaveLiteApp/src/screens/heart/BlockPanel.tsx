/**
 * The Comeback's ramp-in and Festival Six's countdown, where the program
 * is set (Settings › The program). Renders nothing for anyone else.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {blockLine, defaultEventDate} from '../../domain/profile/blocks';
import {
  loadArchetype,
  loadBlockPhase,
  loadProfile,
  setEventDate,
} from '../../domain/profile/repository';
import {localDayKey} from '../../domain/training/grading';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const DAY_MS = 86_400_000;

/** "Sat 31 Oct" for a day key. */
function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function shift(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return localDayKey(new Date(y, m - 1, d, 12).getTime() + days * DAY_MS);
}

export function BlockPanel() {
  const [, setVersion] = useState(0);
  const archetype = loadArchetype();
  const now = Date.now();
  const line = blockLine(loadBlockPhase(now));
  const accent = ELEMENTS.heart.accent;

  if (archetype === 'comeback') {
    return line ? (
      <View style={styles.root}>
        <Text accessibilityRole="header" style={styles.eyebrow}>
          COMING BACK
        </Text>
        <Text style={styles.body}>{line}</Text>
      </View>
    ) : null;
  }
  if (archetype !== 'festival-six') {
    return null;
  }

  const event = loadProfile().eventDate;
  const today = localDayKey(now);
  const move = (days: number) => {
    const base = event ?? defaultEventDate(now);
    const next = shift(base, days);
    setEventDate(next < today ? today : next);
    setVersion(v => v + 1);
  };

  return (
    <View style={styles.root}>
      <Text accessibilityRole="header" style={styles.eyebrow}>
        YOUR FESTIVAL
      </Text>
      <Text testID="event-date" style={styles.date}>
        {event ? dayLabel(event) : 'No date yet'}
      </Text>
      {line ? <Text style={styles.body}>{line}</Text> : null}
      {event && event < today && !line ? (
        <Text style={styles.body}>
          That festival has been. Set the next one to start a new build.
        </Text>
      ) : null}
      <View style={styles.pills}>
        {(
          [
            ['−1 week', -7],
            ['−1 day', -1],
            ['+1 day', 1],
            ['+1 week', 7],
          ] as const
        ).map(([label, days]) => (
          <Tap
            key={label}
            testID={`event-${days}`}
            variant="ghost"
            color={accent}
            onPress={() => move(days)}
            accessibilityRole="button"
            accessibilityLabel={`Move the festival ${label}`}
            style={styles.pill}>
            <Text style={[styles.pillText, {color: accent}]}>{label}</Text>
          </Tap>
        ))}
      </View>
      {event && event < today ? (
        <Tap
          testID="event-next"
          variant="ghost"
          color={accent}
          onPress={() => {
            setEventDate(defaultEventDate(now));
            setVersion(v => v + 1);
          }}
          accessibilityRole="button"
          style={styles.pill}>
          <Text style={[styles.pillText, {color: accent}]}>
            Next festival in 6 weeks
          </Text>
        </Tap>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  date: {
    ...t.title,
    color: palette.text,
  },
  body: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  pillText: {
    ...t.subtitle,
  },
});
