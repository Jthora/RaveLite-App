/**
 * The tutorial is a real chime.
 *
 * Not a slideshow, and not a tour of a screen nobody has used yet: setup
 * ends by firing a genuine chime for something any room can do, and this
 * card sits above it naming the three taps that are the whole app. The
 * chime underneath is live throughout — answering it is the lesson, and
 * doing so finishes the tutorial rather than interrupting it.
 *
 * It renders nothing once taught. Skippable from the first step, because
 * somebody who already knows should not have to be told four times.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {Symbol, type SymbolName} from '../icons/Symbol';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Lesson {
  title: string;
  body: string;
  symbol: SymbolName;
}

const LESSONS: readonly Lesson[] = [
  {
    title: 'This is a chime',
    symbol: 'time',
    body: 'This is a real chime. It takes a few seconds, and it counts if you do it now.',
  },
  {
    title: 'Three buttons',
    symbol: 'body',
    body: 'Done logs it. +5 min moves it 5 minutes later. Skip it skips this chime.',
  },
  {
    title: 'Below the chime',
    symbol: 'idea',
    body: 'The five tiles are your elements: tap one to open it. + Log, Session, Practice and Settings are at the bottom of this page.',
  },
  {
    title: 'The ⓘ button',
    symbol: 'learn',
    body: 'Tap ⓘ on a drill, a track or an attribute to see what it is, how to do it and why it is here.',
  },
  {
    title: "That's it",
    symbol: 'star',
    body: 'The app adjusts to what you do. Miss a week and it gets easier. Keep up and it gets harder.',
  },
];

export function TutorialCoach({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const [at, setAt] = useState(0);

  if (!visible) {
    return null;
  }
  const accent = ELEMENTS.heart.accent;
  const lesson = LESSONS[Math.min(at, LESSONS.length - 1)];
  const last = at >= LESSONS.length - 1;

  return (
    <View style={[styles.root, {borderColor: accent}]}>
      <View style={styles.head}>
        <Symbol name={lesson.symbol} size={18} />
        <Text testID="coach-title" style={[styles.title, {color: accent}]}>
          {lesson.title}
        </Text>
      </View>
      <Text style={styles.body}>{lesson.body}</Text>
      <View style={styles.row}>
        <View style={styles.pips}>
          {LESSONS.map((l, i) => (
            <View
              key={l.title}
              style={[
                styles.pip,
                {backgroundColor: i <= at ? accent : palette.border},
              ]}
            />
          ))}
        </View>
        <Tap
          testID="coach-skip"
          variant="ghost"
          color={palette.textDim}
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Skip the walkthrough"
          style={styles.btn}>
          <Text style={styles.btnText}>Skip</Text>
        </Tap>
        <Tap
          testID="coach-next"
          variant="solid"
          color={accent}
          onPress={() => (last ? onDone() : setAt(n => n + 1))}
          accessibilityRole="button"
          accessibilityLabel={last ? 'Finish the walkthrough' : 'Next'}
          style={styles.btn}>
          <Text style={styles.btnOn}>{last ? 'Got it' : 'Next'}</Text>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...t.subtitle,
    fontWeight: '700',
  },
  body: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pips: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  pip: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    ...t.caption,
    color: palette.textDim,
  },
  btnOn: {
    ...t.caption,
    color: palette.bg,
    fontWeight: '700',
  },
});
