/**
 * SettingsSheet — everything set once and left alone, behind the ⚙ on
 * Today: how chimes sound (with a test per element), what keeps them
 * firing on this phone, the plan editor, restoring a plan the v2
 * migration replaced, motion and the Heart theme. My day is edited from
 * Today's status chip.
 */
import React, {useEffect, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {
  loadPlan,
  savePlan,
  subscribePlan,
} from '../../domain/reminders/repository';
import {getPlace} from '../../domain/conditions/weather';
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
import {WeatherSheet} from './WeatherSheet';

const WARN = '#FFD60A';

interface Props {
  visible: boolean;
  onClose: () => void;
  permission: 'unknown' | 'granted' | 'denied';
}

/** When the v2 migration replaced a saved plan, and the backup still exists. */
function replacedPlanAt(): number | undefined {
  const at = store.getNumber(KEYS.planReplacedAt);
  return at !== undefined && store.getString(KEYS.planBackupV1)
    ? at
    : undefined;
}

export function SettingsSheet({visible, onClose, permission}: Props) {
  const [plan, setPlan] = useState(loadPlan);
  const [planOpen, setPlanOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const place = getPlace();
  const [replacedAt, setReplacedAt] = useState(replacedPlanAt);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => subscribePlan(setPlan), []);

  const accent = ELEMENTS.heart.accent;

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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>Settings</Text>
          <Tap
            variant="plain"
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Tap>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {permission === 'denied' ? (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>⚠ Notifications are off</Text>
              <Text style={styles.bannerBody}>
                Android has muted RaveLite. Open Settings → Apps → RaveLite →
                Notifications, or chimes arrive silently.
              </Text>
            </View>
          ) : null}

          <ChimesPanel />
          <StayAlivePanel />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Weather & place</Text>
              <Text style={styles.rowValue}>
                {place
                  ? `${place.name}: sunrise, rain, heat and bugs`
                  : 'Not set: chimes ignore the weather'}
              </Text>
            </View>
            <Tap
              testID="weather-open"
              variant="ghost"
              color={palette.textDim}
              onPress={() => setWeatherOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open weather and place"
              style={styles.rowBtn}>
              <Text style={styles.rowBtnText}>Open</Text>
            </Tap>
          </View>

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
        </ScrollView>

        <WeatherSheet
          visible={weatherOpen}
          onClose={() => setWeatherOpen(false)}
        />
        <Modal
          visible={planOpen}
          animationType="slide"
          onRequestClose={() => setPlanOpen(false)}>
          <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <Text style={[styles.title, {color: accent}]}>Plan</Text>
              <Tap
                variant="plain"
                onPress={() => setPlanOpen(false)}
                accessibilityRole="button"
                style={styles.close}>
                <Text style={styles.closeText}>Close</Text>
              </Tap>
            </View>
            <PlanPanel />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: {
    ...t.title,
  },
  close: {
    minHeight: 48,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  banner: {
    borderWidth: 1,
    borderColor: WARN,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: palette.surface,
  },
  bannerTitle: {
    color: WARN,
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
});
