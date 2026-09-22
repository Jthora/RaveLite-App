import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

import {formatHM} from '../ambient/format';
import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import type {DayRow} from '../../domain/today/dayList';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  /** The logged row; the sheet is open while set. */
  row?: DayRow;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * For something already logged: keep it, or remove it if it didn't happen.
 * A removal can be put back from the undo bar for a few seconds.
 */
export function LoggedSheet({row, onRemove, onClose}: Props) {
  if (!row) {
    return null;
  }
  const el = ELEMENTS[row.element];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <View style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.eyebrow}>
            LOGGED · {formatHM(row.at)}
          </Text>
          <View style={styles.head}>
            {row.move ? (
              <View style={[styles.tile, {backgroundColor: `${el.color}29`}]}>
                <MoveIcon move={row.move} color={el.color} size={28} />
              </View>
            ) : null}
            <View style={styles.headText}>
              <Text style={styles.title} numberOfLines={2}>
                {row.label}
              </Text>
              {row.detail ? (
                <Text style={styles.detail} numberOfLines={2}>
                  {row.detail}
                </Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.note}>
            If this didn't happen or was logged by mistake, remove it. It will
            stop counting everywhere.
          </Text>
          <View style={styles.actions}>
            <Tap
              testID="logged-remove"
              variant="ghost"
              color={palette.danger}
              onPress={onRemove}
              accessibilityRole="button"
              style={styles.btn}>
              <Text style={[styles.btnText, {color: palette.danger}]}>
                Remove
              </Text>
            </Tap>
            <Tap
              variant="ghost"
              color={palette.textDim}
              onPress={onClose}
              accessibilityRole="button"
              style={styles.btn}>
              <Text style={styles.btnText}>Keep</Text>
            </Tap>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.6,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
  },
  title: {
    ...t.subtitle,
    fontSize: 18,
    color: palette.text,
  },
  detail: {
    ...t.body,
    color: palette.textDim,
    marginTop: 2,
  },
  note: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  btnText: {
    ...t.subtitle,
    color: palette.text,
  },
});
