import React, {useEffect, useState} from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {formatHM} from '../ambient/format';
import {InfoCardView, useInfoStack} from '../info/InfoSheet';
import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {AmountRow, cardForRow, moveCard, type DoneAdjust} from './ChimeCard';
import {EYE_BREAK_SECONDS} from '../../domain/activity/record';
import {EXERCISE_LIBRARY} from '../../domain/exercises/library';
import type {SetPrescription, TrackId} from '../../domain/program/types';
import type {DayRow} from '../../domain/today/dayList';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  /** The missed or skipped chime; the sheet is open while set. */
  row?: DayRow;
  /** A round's moves, partner and glass, when the chime was a round. */
  prescription?: SetPrescription;
  onDone: (adjust: DoneAdjust) => void;
  onClose: () => void;
}

/**
 * For a chime whose answer window closed: "I did it, I just didn't tap
 * Done". Shows what the chime asked for — a round's moves with −/+, or the
 * drill and its dose — and logs it at the chime's time.
 */
export function LateLogSheet({row, prescription: rx, onDone, onClose}: Props) {
  const info = useInfoStack();
  const moves = rx?.moves;
  const [amounts, setAmounts] = useState<Partial<Record<TrackId, number>>>({});
  const [amount, setAmount] = useState(0);

  // Start from what the chime asked for each time a row opens.
  useEffect(() => {
    setAmounts(
      Object.fromEntries((rx?.moves ?? []).map(m => [m.trackId, m.amount])),
    );
    setAmount(rx?.amount ?? 0);
  }, [row?.id, rx]);

  if (!row) {
    return null;
  }
  const close = () => {
    info.close();
    onClose();
  };
  const back = () =>
    info.card ? (info.depth > 1 ? info.back() : info.close()) : close();
  const el = ELEMENTS[row.element];
  const drill = EXERCISE_LIBRARY.find(ex => ex.id === row.exerciseId);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={back}>
      <TouchableWithoutFeedback onPress={back}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {info.card ? (
                <View style={styles.card}>
                  <InfoCardView
                    card={info.card}
                    canGoBack={info.depth > 1}
                    onOpen={info.open}
                    onBack={info.back}
                    onClose={info.close}
                  />
                </View>
              ) : (
                <>
                  <Text style={styles.eyebrow}>
                    {row.status === 'skipped' ? 'SKIPPED' : 'MISSED'} ·{' '}
                    {formatHM(row.at)}
                  </Text>
                  <Tap
                    testID="late-info"
                    variant="plain"
                    onPress={() => info.show(cardForRow(row))}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.label}. What is this?`}
                    style={styles.headTap}>
                    {/* Tap wraps its children in one column view, so the row
                        layout has to sit inside it, not on the Tap. */}
                    <View style={styles.head}>
                      {row.move ? (
                        <View
                          style={[
                            styles.tile,
                            {backgroundColor: `${el.color}29`},
                          ]}>
                          <MoveIcon
                            move={row.move}
                            color={el.color}
                            size={28}
                          />
                        </View>
                      ) : null}
                      <View style={styles.headText}>
                        <Text style={styles.title} numberOfLines={2}>
                          {row.label} <Text style={{color: el.color}}>ⓘ</Text>
                        </Text>
                        {moves ? null : drill ? (
                          <Text style={styles.detail}>{drill.dose}</Text>
                        ) : row.detail ? (
                          <Text style={styles.detail}>{row.detail}</Text>
                        ) : null}
                      </View>
                    </View>
                  </Tap>

                  {moves ? (
                    moves.map(m => (
                      <AmountRow
                        key={m.trackId}
                        label={m.label}
                        unit={m.unit}
                        value={amounts[m.trackId] ?? m.amount}
                        color={ELEMENTS[m.element].color}
                        onChange={v =>
                          setAmounts(a => ({...a, [m.trackId]: v}))
                        }
                        onInfo={() => info.show(moveCard(m))}
                      />
                    ))
                  ) : rx ? (
                    <AmountRow
                      label={rx.label}
                      unit={rx.unit}
                      value={amount}
                      color={el.color}
                      onChange={setAmount}
                    />
                  ) : null}
                  {rx?.partner ? (
                    <Text style={styles.extra}>
                      then {rx.partner.seconds} s · {rx.partner.label}
                    </Text>
                  ) : null}
                  {rx?.water ? (
                    <Text style={styles.extra}>+ a glass of water</Text>
                  ) : null}
                  {rx?.water || drill?.targets.includes('Hydration') ? (
                    <Text style={styles.extra}>
                      then {EYE_BREAK_SECONDS} s · eyes on something far away
                    </Text>
                  ) : null}

                  <Text style={styles.note}>
                    Did it but didn't tap Done? This logs it at{' '}
                    {formatHM(row.at)}.
                  </Text>
                  <View style={styles.actions}>
                    <Tap
                      testID="late-done"
                      variant="solid"
                      color={el.color}
                      onPress={() =>
                        onDone(moves ? {amounts} : rx ? {amount} : {})
                      }
                      accessibilityRole="button"
                      style={styles.done}>
                      <Text style={styles.doneText}>Done</Text>
                    </Tap>
                    <Tap
                      variant="ghost"
                      color={palette.textDim}
                      onPress={close}
                      accessibilityRole="button"
                      style={styles.cancel}>
                      <Text style={styles.cancelText}>Not this one</Text>
                    </Tap>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    height: 460,
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
  headTap: {
    alignSelf: 'stretch',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
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
  extra: {
    ...t.body,
    color: palette.textDim,
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
  done: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  doneText: {
    ...t.subtitle,
    color: palette.bg,
    fontWeight: '800',
  },
  cancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  cancelText: {
    ...t.subtitle,
    color: palette.text,
  },
});
