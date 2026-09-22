import React, {useState} from 'react';
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
  const accent = ELEMENTS.heart.accent;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, {borderColor: accent}]}>
          <Text
            accessibilityRole="header"
            style={[styles.title, {color: accent}]}>
            My day
          </Text>
          {visible ? (
            <MyDayEditor value={value} onCancel={onClose} onSave={onSave} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/**
 * The editor without a sheet around it, for a page inside another sheet
 * (Settings): a sheet over a sheet loses Back on Android.
 */
export function MyDayEditor({
  value,
  onCancel,
  onSave,
}: {
  value: ActiveHours;
  onCancel: () => void;
  onSave: (next: ActiveHours) => void;
}) {
  const [draft, setDraft] = useState(value);
  const accent = ELEMENTS.heart.accent;
  const valid = myDayProblem(draft) === null;
  return (
    <>
      <Text style={styles.body}>
        Chimes sound inside My day, rounds spread across it, and the screen dims
        outside it. It can end after midnight.
      </Text>
      <MyDayFields value={draft} onChange={setDraft} />
      <View style={styles.actions}>
        <Tap
          testID="myday-cancel"
          variant="ghost"
          color={palette.textDim}
          onPress={onCancel}
          style={styles.btn}>
          <Text style={styles.btnText}>Cancel</Text>
        </Tap>
        <Tap
          testID="myday-save"
          variant="solid"
          color={accent}
          disabled={!valid}
          onPress={() => onSave(draft)}
          style={styles.btn}>
          <Text style={styles.btnSolidText}>Save</Text>
        </Tap>
      </View>
    </>
  );
}

/** Why a My day can't be saved, or null when it can. */
export function myDayProblem(value: ActiveHours): string | null {
  if (dayLength(value) < MIN_DAY_MIN) {
    return 'My day must be at least 4 hours.';
  }
  return value.daysMask === 0 ? 'Pick at least one day.' : null;
}

/**
 * Start, end and days, with a line saying what is wrong or that the day
 * ends after midnight. Shared by this sheet and the setup question.
 */
export function MyDayFields({
  value,
  onChange,
}: {
  value: ActiveHours;
  onChange: (next: ActiveHours) => void;
}) {
  const accent = ELEMENTS.heart.accent;
  const shift = (edge: 'start' | 'end', minutes: number) =>
    onChange({...value, [edge]: shiftHHMM(value[edge], minutes)});
  const toggleDay = (i: number) =>
    onChange({...value, daysMask: value.daysMask ^ (1 << i)});
  const note =
    myDayProblem(value) ??
    (value.end < value.start ? `Ends the next day at ${value.end}.` : null);

  return (
    <>
      <View style={styles.steppers}>
        <Stepper
          label="Starts"
          value={value.start}
          onShift={m => shift('start', m)}
        />
        <Stepper
          label="Ends"
          value={value.end}
          onShift={m => shift('end', m)}
        />
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.days}>
        {DAY_LETTERS.map((letter, i) => {
          const on = (value.daysMask & (1 << i)) !== 0;
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
    </>
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
      {/* The time on its own line: beside two 48 dp buttons it ran past
          the card on a phone. */}
      <Text style={styles.stepperValue}>{value}</Text>
      <View style={styles.stepperRow}>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={() => onShift(-STEP_MIN)}
          accessibilityLabel={`${label} earlier`}
          style={styles.stepperBtn}>
          <Text style={styles.stepperBtnText}>−</Text>
        </Tap>
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

const DAY_MIN = 24 * 60;
/** Shorter than this and there is no room to spread the rounds. */
const MIN_DAY_MIN = 4 * 60;

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes from start to end. An end before the start is the next day. */
function dayLength(hours: Pick<ActiveHours, 'start' | 'end'>): number {
  return (minutesOf(hours.end) - minutesOf(hours.start) + DAY_MIN) % DAY_MIN;
}

/** Shift "HH:MM" by minutes, round the clock. */
function shiftHHMM(hhmm: string, minutes: number): string {
  const total = (((minutesOf(hhmm) + minutes) % DAY_MIN) + DAY_MIN) % DAY_MIN;
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
    marginTop: spacing.xs,
  },
  note: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.sm,
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
