/**
 * SetupPanel — Heart › Setup.
 *
 * Everything that is set once and left alone, in the order it matters:
 * notification signal, My day, how chimes sound (with a test chime),
 * keeping the phone awake for them, the plan editor, restoring a plan the
 * v2 migration replaced, the alive motion level and the Heart theme.
 */
import React, {useEffect, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {MyDaySheet} from '../../components/today/MyDaySheet';
import {
  getActiveHours,
  setActiveHours,
  subscribeActiveHours,
} from '../../domain/ambient/activeHours';
import {enqueueNow} from '../../domain/ambient/pulseRuntime';
import {exercisesFor} from '../../domain/exercises/library';
import {
  loadPlan,
  savePlan,
  subscribePlan,
} from '../../domain/reminders/repository';
import type {Plan} from '../../domain/reminders/types';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import {AlivePanel} from './AlivePanel';
import {ChimesPanel} from './ChimesPanel';
import {PlanPanel} from './PlanPanel';
import {StayAlivePanel} from './StayAlivePanel';
import {ThemePanel} from './ThemePanel';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  permission: 'unknown' | 'granted' | 'denied';
}

function daysLabel(mask: number): string {
  if (mask === 0b1111111) {
    return 'every day';
  }
  return DAY_LETTERS.filter((_, i) => (mask & (1 << i)) !== 0).join(' ');
}

/** When the v2 migration replaced a saved plan, and the backup still exists. */
function replacedPlanAt(): number | undefined {
  const at = store.getNumber(KEYS.planReplacedAt);
  return at !== undefined && store.getString(KEYS.planBackupV1)
    ? at
    : undefined;
}

export function SetupPanel({permission}: Props) {
  const [myDay, setMyDay] = useState(getActiveHours);
  const [plan, setPlan] = useState(loadPlan);
  const [myDayOpen, setMyDayOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [replacedAt, setReplacedAt] = useState(replacedPlanAt);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => subscribeActiveHours(setMyDay), []);
  useEffect(() => subscribePlan(setPlan), []);

  const accent = ELEMENTS.heart.accent;

  const onTestChime = () => {
    const drill = exercisesFor('air')[0];
    enqueueNow({element: 'air', exerciseId: drill?.id});
  };

  const onRestore = () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      return;
    }
    const raw = store.getString(KEYS.planBackupV1);
    if (raw) {
      try {
        savePlan(JSON.parse(raw) as Plan);
        store.delete(KEYS.planReplacedAt);
        setReplacedAt(undefined);
      } catch {
        // A corrupt backup can't be restored; leave the current plan.
      }
    }
    setConfirmRestore(false);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {permission === 'denied' ? (
        <View style={[styles.banner, styles.bannerWarn]}>
          <Text style={styles.bannerTitle}>⚠ Notifications are off</Text>
          <Text style={styles.bannerBody}>
            Android has muted RaveLite. Open Settings → Apps → RaveLite →
            Notifications, or chimes arrive silently.
          </Text>
        </View>
      ) : (
        <View style={[styles.banner, {borderColor: accent}]}>
          <Text style={[styles.bannerTitle, {color: accent}]}>
            ● Notifications on
          </Text>
          <Text style={styles.bannerBody}>
            Rounds, water calls and check-ins chime on their own inside My day.
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>My day</Text>
          <Text style={styles.rowValue}>
            {myDay.start}–{myDay.end} · {daysLabel(myDay.daysMask)}
          </Text>
        </View>
        <Tap
          variant="ghost"
          color={accent}
          onPress={() => setMyDayOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Edit My day"
          style={styles.rowBtn}>
          <Text style={[styles.rowBtnText, {color: accent}]}>Edit</Text>
        </Tap>
      </View>

      <ChimesPanel />
      <Tap
        variant="ghost"
        color={accent}
        onPress={onTestChime}
        accessibilityRole="button"
        style={styles.wideBtn}>
        <Text style={[styles.rowBtnText, {color: accent}]}>Test chime</Text>
      </Tap>

      <StayAlivePanel />

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Plan</Text>
          <Text style={styles.rowValue}>
            {plan.windows.map(w => w.label).join(' · ') || 'no windows'}
          </Text>
        </View>
        <Tap
          variant="ghost"
          color={palette.textDim}
          onPress={() => setPlanOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open the plan editor"
          style={styles.rowBtn}>
          <Text style={styles.rowBtnText}>Open</Text>
        </Tap>
      </View>

      {replacedAt !== undefined ? (
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Previous plan</Text>
            <Text style={styles.rowValue}>
              Replaced by the leaner default on{' '}
              {new Date(replacedAt).toLocaleDateString()}.
            </Text>
          </View>
          <Tap
            variant="ghost"
            color={confirmRestore ? palette.danger : palette.textDim}
            onPress={onRestore}
            accessibilityRole="button"
            style={styles.rowBtn}>
            <Text
              style={[
                styles.rowBtnText,
                confirmRestore && {color: palette.danger},
              ]}>
              {confirmRestore ? 'Tap to confirm' : 'Restore'}
            </Text>
          </Tap>
        </View>
      ) : null}

      <AlivePanel />
      <ThemePanel />

      <MyDaySheet
        visible={myDayOpen}
        value={myDay}
        onClose={() => setMyDayOpen(false)}
        onSave={value => {
          setActiveHours(value);
          setMyDayOpen(false);
        }}
      />
      <Modal
        visible={planOpen}
        animationType="slide"
        onRequestClose={() => setPlanOpen(false)}>
        <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, {color: accent}]}>Plan</Text>
            <Tap
              variant="plain"
              onPress={() => setPlanOpen(false)}
              accessibilityRole="button"
              style={styles.modalClose}>
              <Text style={styles.rowBtnText}>Close</Text>
            </Tap>
          </View>
          <PlanPanel />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: palette.surface,
  },
  bannerWarn: {
    borderColor: '#FFD60A',
  },
  bannerTitle: {
    color: '#FFD60A',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  bannerBody: {
    ...t.body,
    color: palette.textDim,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...t.subtitle,
    color: palette.text,
  },
  rowValue: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  rowBtn: {
    minWidth: 72,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  rowBtnText: {
    ...t.subtitle,
    color: palette.text,
  },
  wideBtn: {
    minHeight: 48,
    borderRadius: radius.md,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modalTitle: {
    ...t.title,
  },
  modalClose: {
    minHeight: 48,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
