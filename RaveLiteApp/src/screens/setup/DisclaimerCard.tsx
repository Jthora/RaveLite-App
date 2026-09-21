/**
 * Said once, before anything else, and not dressed up.
 *
 * This app tells strangers to do physical work, picked by a program that
 * has never met them, in rooms it cannot see. That deserves a plain
 * sentence at the start rather than a line in a licence nobody opens.
 *
 * It is the first card in setup rather than the last, so that somebody
 * who taps Skip on the very first screen has still had it in front of
 * them. A disclaimer only shown to people patient enough to finish is a
 * disclaimer shown to the wrong people.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Symbol, hueOf} from '../../components/icons/Symbol';
import {palette, radius, spacing, type as t} from '../../theme';

export function DisclaimerCard() {
  return (
    <View style={styles.root}>
      <View style={[styles.card, {borderColor: hueOf('warning')}]}>
        <View style={styles.head}>
          <Symbol name="warning" size={18} />
          <Text
            testID="disclaimer"
            style={[styles.title, {color: hueOf('warning')}]}>
            Read this first
          </Text>
        </View>
        <Text style={styles.body}>
          RaveLite is not a medical device and gives no medical advice. It is
          one person's training app, and the program is chosen by rules in a
          phone — not by anyone who has met you.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.strong}>Stop if it hurts.</Text> Sharp pain, a
          joint that complains, dizziness, chest pain, or anything that feels
          wrong: stop, and do not push through it because a chime asked.
        </Text>
        <Text style={styles.body}>
          Talk to a doctor before starting if you are pregnant, recovering from
          injury or surgery, have a heart or blood-pressure condition, or have
          been still for a long time.
        </Text>
      </View>
      <View style={[styles.card, {borderColor: palette.border}]}>
        <View style={styles.head}>
          <Symbol name="idea" size={18} />
          <Text style={[styles.title, {color: hueOf('idea')}]}>
            How this goes
          </Text>
        </View>
        <Text style={styles.body}>
          Four questions, then a day. You can skip any of it — the answers are
          all in Settings afterwards, and the defaults are a working program.
        </Text>
        <Text style={styles.body}>
          Everything you log stays on this phone. There is no account, and
          nothing is sent anywhere.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
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
    ...t.body,
    color: palette.textDim,
    lineHeight: 21,
  },
  strong: {
    color: palette.text,
    fontWeight: '700',
  },
});
