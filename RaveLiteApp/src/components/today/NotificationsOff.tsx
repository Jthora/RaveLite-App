/**
 * One line on Today when Android has notifications off — and nothing
 * otherwise. It used to be said only inside Settings, where somebody who
 * said no at the prompt would never look.
 */
import notifee from '@notifee/react-native';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {palette, radius, spacing, type as t} from '../../theme';

const WARN = '#FF9F0A';

export function NotificationsOff({
  permission,
}: {
  permission: 'unknown' | 'granted' | 'denied';
}) {
  if (permission !== 'denied') {
    return null;
  }
  return (
    <Tap
      testID="notifications-off"
      variant="plain"
      onPress={() => {
        notifee.openNotificationSettings().catch(() => {});
      }}
      accessibilityRole="button"
      accessibilityLabel="Notifications are off. Turn them on."
      style={styles.root}>
      <View style={styles.inner}>
        <Text style={styles.title}>Notifications are off</Text>
        <Text style={styles.body}>
          Chimes can’t show outside the app or be answered from the lock screen.
          Tap to turn them on.
        </Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: WARN,
    backgroundColor: palette.surface,
  },
  inner: {
    padding: spacing.md,
    gap: 2,
  },
  title: {
    ...t.subtitle,
    color: WARN,
  },
  body: {
    ...t.caption,
    color: palette.text,
    lineHeight: 17,
  },
});
