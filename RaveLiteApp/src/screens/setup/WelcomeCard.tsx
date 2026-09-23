/**
 * The front door.
 *
 * Setup used to open on the medical disclaimer, which meant the first
 * thing a stranger saw was a warning about chest pain — before anything
 * had told them what the app was or what the next minute held. That is a
 * fair way to lose somebody in the first three seconds.
 *
 * So this goes first and says two things: what RaveLite does, in the
 * concrete (it chimes, you answer, that is the whole mechanic), and what
 * is about to happen (six questions, skippable, nothing leaves the
 * phone). The warning follows immediately after, and Skip is not offered
 * until it has — see SetupFlow.
 *
 * The wording tracks the store listing on purpose. Somebody who installed
 * this because of a description should meet the same sentences when it
 * opens.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Symbol, hueOf} from '../../components/icons/Symbol';
import {palette, radius, spacing, type as t} from '../../theme';

export function WelcomeCard() {
  return (
    <View style={styles.root}>
      <View style={[styles.card, {borderColor: hueOf('time')}]}>
        <View style={styles.head}>
          <Symbol name="time" size={18} />
          <Text
            testID="welcome"
            accessibilityRole="header"
            style={[styles.title, {color: hueOf('time')}]}>
            What this is
          </Text>
        </View>
        <Text style={styles.body}>
          RaveLite is a training app. It chimes through the day, and each chime
          asks for one small thing: ten push-ups, a minute of breathing, a glass
          of water, one drill.
        </Text>
        <Text style={styles.body}>
          Answer it from the notification and carry on with what you were doing.
          You never go anywhere to train.
        </Text>
      </View>
      <View style={[styles.card, {borderColor: palette.border}]}>
        <View style={styles.head}>
          <Symbol name="idea" size={18} />
          <Text
            accessibilityRole="header"
            style={[styles.title, {color: hueOf('idea')}]}>
            What setup asks
          </Text>
        </View>
        <Text style={styles.body}>
          Six questions, then your day. You can skip any of them. You can change
          every answer later in Settings. If you skip, you get the base program
          at a beginner's level.
        </Text>
        <Text style={styles.body}>
          Everything you log stays on this phone. There is no account. Nothing
          is sent anywhere.
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
});
