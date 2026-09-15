import React, {useEffect, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {ElementGlyph} from '../icons/ElementGlyph';

import {formatHM} from '../ambient/format';
import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import type {DayRow} from '../../domain/today/dayList';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  visible: boolean;
  /** Today's missed chimes, in time order. */
  rows: readonly DayRow[];
  onLog: (rows: DayRow[]) => void;
  onClose: () => void;
}

/**
 * Every chime missed today in one list: tick what you did and log them
 * together, each at the time it chimed. A round logs as prescribed; adjust
 * a round's moves by opening its row in the day list instead.
 */
export function CatchUpSheet({visible, rows, onLog, onClose}: Props) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setPicked(new Set());
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const accent = ELEMENTS.heart.accent;
  const chosen = rows.filter(row => picked.has(row.id));
  const toggle = (id: string) =>
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <View style={styles.sheet}>
          <Text style={styles.eyebrow}>CATCH UP · {rows.length} MISSED</Text>
          <Text style={styles.lead}>
            Tick what you did. Each is logged at the time it chimed.
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {rows.map(row => {
              const el = ELEMENTS[row.element];
              const on = picked.has(row.id);
              return (
                <Tap
                  key={row.id}
                  testID={`catch-up-row-${row.id}`}
                  variant="plain"
                  color={el.color}
                  onPress={() => toggle(row.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: on}}
                  accessibilityLabel={`${row.label} at ${formatHM(row.at)}`}
                  style={styles.rowTap}>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.box,
                        {borderColor: el.color},
                        on && {backgroundColor: el.color},
                      ]}>
                      {on ? <Text style={styles.tick}>✓</Text> : null}
                    </View>
                    <Text style={styles.time}>{formatHM(row.at)}</Text>
                    {row.move ? (
                      <MoveIcon move={row.move} color={el.color} size={18} />
                    ) : (
                      <View style={styles.glyphBox}>
                        <ElementGlyph
                          element={el}
                          size={18}
                          style={styles.glyph}
                        />
                      </View>
                    )}
                    <View style={styles.body}>
                      <Text style={styles.label} numberOfLines={1}>
                        {row.label}
                      </Text>
                      {row.detail ? (
                        <Text style={styles.detail} numberOfLines={1}>
                          {row.detail}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Tap>
              );
            })}
          </ScrollView>
          <View style={styles.actions}>
            <Tap
              testID="catch-up-log"
              variant="solid"
              color={accent}
              disabled={chosen.length === 0}
              onPress={() => onLog(chosen)}
              accessibilityRole="button"
              style={styles.btn}>
              <Text style={styles.logText}>
                {chosen.length > 0 ? `Log ${chosen.length}` : 'Log'}
              </Text>
            </Tap>
            <Tap
              variant="ghost"
              color={palette.textDim}
              onPress={onClose}
              accessibilityRole="button"
              style={styles.btn}>
              <Text style={styles.closeText}>Close</Text>
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
  lead: {
    ...t.body,
    color: palette.text,
  },
  list: {
    maxHeight: 360,
  },
  rowTap: {
    minHeight: 52,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  time: {
    ...t.caption,
    color: palette.textDim,
    width: 40,
    fontVariant: ['tabular-nums'],
  },
  glyphBox: {
    width: 18,
    alignItems: 'center',
  },
  glyph: {
    width: 18,
    fontSize: 15,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    ...t.body,
    color: palette.text,
  },
  detail: {
    ...t.caption,
    color: palette.textDim,
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
  logText: {
    ...t.subtitle,
    color: palette.bg,
    fontWeight: '800',
  },
  closeText: {
    ...t.subtitle,
    color: palette.text,
  },
});
