/**
 * "That entry is gone."
 *
 * A row can outlive the thing it describes: the day's list is built from
 * the activity model, and a Train entry deleted from somewhere else
 * leaves a row pointing at nothing. Both row handlers used to do nothing
 * at all in that case — the row flashed under the finger and no sheet
 * opened, which from the outside is indistinguishable from the app being
 * broken.
 *
 * Saying so costs one small sheet and removes a whole category of "it
 * just doesn't respond".
 */
import React from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import {Symbol} from '../icons/Symbol';
import {palette, radius, spacing, type as t} from '../../theme';

export function MissingSheet({
  name,
  onClose,
}: {
  name: string | undefined;
  onClose: () => void;
}) {
  if (!name) {
    return null;
  }
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <View style={styles.head}>
            <Symbol name="warning" size={18} />
            <Text testID="missing-title" style={styles.title}>
              {name}
            </Text>
          </View>
          <Text style={styles.body}>
            This was logged in the Train log, and that entry is no longer there.
            Nothing else is affected — the row will go when the day is next
            rebuilt.
          </Text>
          <Tap
            testID="missing-close"
            variant="ghost"
            color={palette.textDim}
            onPress={onClose}
            accessibilityRole="button"
            style={styles.btn}>
            <Text style={styles.btnText}>Close</Text>
          </Tap>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: '#000000AA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  head: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  title: {...t.subtitle, color: palette.text, flex: 1},
  body: {...t.caption, color: palette.textDim, lineHeight: 18},
  btn: {
    minHeight: 44,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  btnText: {...t.caption, color: palette.text},
});
