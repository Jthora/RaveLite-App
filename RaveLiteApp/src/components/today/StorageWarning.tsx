/**
 * One line on Today when saving is not working — and nothing otherwise.
 *
 * Two cases, both of which used to be silent. The phone refused a write
 * (a full disk, a broken database): what is on screen will not survive a
 * restart, so the one useful thing is an export, now. Or the saved data
 * could not be read at start-up: the app has stopped writing so that
 * today's empty-looking state cannot be saved over a year of training.
 */
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {
  persistenceHealth,
  subscribePersistence,
} from '../../storage/persistence';
import {palette, radius, spacing, type as t} from '../../theme';

const WARN = '#FF9F0A';

export function StorageWarning() {
  const [health, setHealth] = useState(() => ({...persistenceHealth()}));
  useEffect(
    () => subscribePersistence(() => setHealth({...persistenceHealth()})),
    [],
  );

  if (!health.readFailed && health.failures === 0) {
    return null;
  }
  return (
    <View
      testID="storage-warning"
      accessibilityRole="alert"
      style={styles.root}>
      <Text style={styles.title}>
        {health.readFailed
          ? 'Saved data could not be read'
          : 'Some changes were not saved'}
      </Text>
      <Text style={styles.body}>
        {health.readFailed
          ? 'Nothing is saved until this is fixed, so your data is not overwritten. Close RaveLite and open it again. If this keeps happening, restart the phone.'
          : 'Export your data now: Settings › The app › Your data.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: WARN,
    backgroundColor: palette.surface,
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
