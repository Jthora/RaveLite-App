import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../Tap';
import type {ActiveHours} from '../../domain/ambient/types';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** Bit order matches `ActiveHours.daysMask`: bit 0 = Monday. */
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STEP_MIN = 30;

interface Props {
  visible: boolean;
  value: ActiveHours;
  onClose: () => void;
  onSave: (next: ActiveHours) => void;
}

/** Edit My day: when it starts and ends, and which days it runs. */
export function MyDaySheet({visible, value, onClose, onSave}: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const accent = ELEMENTS.heart.accent;
  const shift = (edge: 'start' | 'end', minutes: number) =>
    setDraft(d => ({...d, [edge]: shiftHHMM(d[edge], minutes)}));
  const toggleDay = (i: number) =>
    setDraft(d => ({...d, daysMask: d.daysMask ^ (1 << i)}));
  const valid = draft.end > draft.start && draft.daysMask !== 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, {borderColor: accent}]}>
          <Text style={[styles.title, {color: accent}]}>My day</Text>
          <Text style={styles.body}>
            Chimes sound inside My day, rounds spread across it, and the screen
            dims outside it.
          </Text>
          <View style={styles.steppers}>
            <Stepper
              label="Starts"
              value={draft.start}
              onShift={m => shift('start', m)}
            />
            <Stepper
              label="Ends"
              value={draft.end}
              onShift={m => shift('end', m)}
            />
          </View>
          <View style={styles.days}>
            {DAY_LETTERS.map((letter, i) => {
              const on = (draft.daysMask & (1 << i)) !== 0;
              return (
                <Tap
                  key={DAY_NAMES[i]}
                  variant="plain"
                  color={accent}
                  onPress={() => toggleDay(i)}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: on}}
                  accessibilityLabel={DAY_NAMES[i]}
                  style={[
                    styles.day,
                    on && {backgroundColor: accent, borderColor: accent},
                  ]}>
                  <Text style={[styles.dayText, on && styles.dayTextOn]}>
                    {letter}
                  </Text>
                </Tap>
              );
            })}
          </View>
          <View style={styles.actions}>
            <Tap
              variant="ghost"
              color={palette.textDim}
              onPress={onClose}
              style={styles.btn}>
              <Text style={styles.btnText}>Cancel</Text>
            </Tap>
            <Tap
              variant="solid"
              color={accent}
              disabled={!valid}
              onPress={() => onSave(draft)}
              style={styles.btn}>
              <Text style={styles.btnSolidText}>Save</Text>
            </Tap>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({
  label,
  value,
  onShift,
}: {
  label: string;
  value: string;
  onShift: (minutes: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={() => onShift(-STEP_MIN)}
          accessibilityLabel={`${label} earlier`}
          style={styles.stepperBtn}>
          <Text style={styles.stepperBtnText}>−</Text>
        </Tap>
        <Text style={styles.stepperValue}>{value}</Text>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={() => onShift(STEP_MIN)}
          accessibilityLabel={`${label} later`}
          style={styles.stepperBtn}>
          <Text style={styles.stepperBtnText}>+</Text>
        </Tap>
      </View>
    </View>
  );
}

/** Shift "HH:MM" by minutes, kept within 05:00–23:30. */
function shiftHHMM(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.max(5 * 60, Math.min(23 * 60 + 30, h * 60 + m + minutes));
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: palette.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...t.title,
  },
  body: {
    ...t.body,
    color: palette.textDim,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  steppers: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stepper: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  stepperLabel: {
    ...t.caption,
    color: palette.textDim,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stepperBtn: {
    width: 48,
    minHeight: 48,
    paddingHorizontal: 0,
    borderRadius: radius.pill,
  },
  stepperBtnText: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepperValue: {
    ...t.title,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  day: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  dayTextOn: {
    color: palette.bg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
  },
  btnText: {
    ...t.subtitle,
    color: palette.text,
  },
  btnSolidText: {
    ...t.subtitle,
    color: palette.bg,
  },
});
