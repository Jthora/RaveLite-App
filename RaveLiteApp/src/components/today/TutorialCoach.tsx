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
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Lesson {
  title: string;
  body: string;
}

const LESSONS: readonly Lesson[] = [
  {
    title: 'This is a chime',
    body: 'A real one, not a demo. Do it now if you like — it only takes a few seconds, and it counts.',
  },
  {
    title: 'Three taps, and that is all',
    body: "Done logs it. +5 min pushes it back when you're mid-something. Skip it says not today, with no guilt attached.",
  },
  {
    title: 'Anything can explain itself',
    body: 'Tap ⓘ on a drill, a track or an attribute to see what it is, how to do it and why it is here.',
  },
  {
    title: "That's it",
    body: 'The rest is more of that. The app follows what you actually do — miss a week and it eases off, keep up and it climbs.',
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
      <Text testID="coach-title" style={[styles.title, {color: accent}]}>
        {lesson.title}
      </Text>
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
