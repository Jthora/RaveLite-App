import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {ScreenScaffold} from '../components/ScreenScaffold';
import {ExerciseRow} from '../components/ExerciseRow';
import {CardGrid} from '../components/CardGrid';
import {Mandala} from '../components/Mandala';
import {CircuitChamber} from '../components/CircuitChamber';
import {Tap} from '../components/Tap';
import {PlanPanel} from './heart/PlanPanel';
import {CircuitsPanel} from './heart/CircuitsPanel';
import {InsightsPanel} from './heart/InsightsPanel';
import {AlwaysOnPanel} from './heart/AlwaysOnPanel';
import {ThemePanel} from './heart/ThemePanel';
import {SetsPanel} from './heart/SetsPanel';
import {ChimesPanel} from './heart/ChimesPanel';
import {StayAlivePanel} from './heart/StayAlivePanel';
import type {CircuitLeg} from '../domain/circuit/circuit';
import {ELEMENTS} from '../theme/elements';
import {exercisesFor} from '../domain/exercises/library';
import {loadPlan} from '../domain/reminders/repository';
import {nextFireForElement} from '../domain/reminders/nextFire';
import {
  buildPayload,
  pickDrillForSlot,
} from '../domain/reminders/scheduler';
import {
  notifeeScheduler,
  requestNotificationPermission,
} from '../domain/reminders/notifeeScheduler';
import {enqueueNow as enqueuePulseNow} from '../domain/ambient/pulseRuntime';
import {
  completionsToday,
  completionsTodayByElement,
  currentStreakDays,
} from '../domain/journal/stats';
import {useLayout} from '../hooks/useLayout';
import {palette, radius, spacing, type as t} from '../theme';

/** Heart's sub-pages. The shell registry is the single source of truth
 *  for the icon/label list — this type just narrows our local switch. */
type HeartSubSlug =
  | 'dash'
  | 'sets'
  | 'plan'
  | 'circuits'
  | 'always-on'
  | 'insights'
  | 'settings';

interface HeartScreenProps {
  subTab: string;
  onSubTabChange: (slug: string) => void;
  onElementChange?: (next: import('../theme/elements').ElementId) => void;
}

/**
 * Heart screen — the conductor.
 *
 * Sub-tab state lives in `ElementShell` and arrives as a prop. The shell
 * also renders the SubTabRail itself, so this screen just branches on
 * `subTab` for body content.
 *
 * Layout is responsive: on tablets in landscape ("expanded"), the Today
 * card and Plan card sit side-by-side; on phones they stack.
 */
const HeartScreen: React.FC<HeartScreenProps> = ({subTab: subTabProp, onElementChange}) => {
  // Narrow the incoming string to the local slug union. Unknown slugs
  // fall back to 'dash' so a stale persisted slug never blanks the screen.
  const subTab: HeartSubSlug = (
    ['dash', 'sets', 'plan', 'circuits', 'always-on', 'insights', 'settings'] as const
  ).includes(subTabProp as HeartSubSlug)
    ? (subTabProp as HeartSubSlug)
    : 'dash';
  const heartDrills = exercisesFor('heart');
  const [plan, setPlan] = useState(() => loadPlan());
  const [permission, setPermission] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');
  const [chamberOpen, setChamberOpen] = useState(false);
  /** When set, the chamber runs this custom sequence instead of the
   *  built-in pentagram. Cleared when the chamber closes so the next
   *  open of the dash launcher reverts to the default. */
  const [chamberLegs, setChamberLegs] = useState<CircuitLeg[] | undefined>(undefined);

  const onEngageLegs = useCallback((legs: CircuitLeg[]) => {
    setChamberLegs(legs);
    setChamberOpen(true);
  }, []);
  const [stats, setStats] = useState(() => ({
    total: completionsToday(),
    streak: currentStreakDays(),
    byElement: completionsTodayByElement(),
  }));
  const layout = useLayout();
  const sideBySide = layout.size === 'expanded';

  const refreshStats = useCallback(() => {
    setStats({
      total: completionsToday(),
      streak: currentStreakDays(),
      byElement: completionsTodayByElement(),
    });
  }, []);

  // Mount = focus in the new shell (only the active element's screen is
  // mounted), so useEffect on mount replaces useFocusEffect.
  useEffect(() => {
    setPlan(loadPlan());
    refreshStats();
    // Request notification permission lazily on first Heart visit so
    // the prompt arrives in context ("these are your reminders") rather
    // than at cold start.
    requestNotificationPermission().then(ok =>
      setPermission(ok ? 'granted' : 'denied'),
    );
  }, [refreshStats]);

  const onTestPulse = async () => {
    try {
      const slot = plan.windows[0]?.slots.find(s => s.element === 'air');
      if (!slot) {return;}
      const drill = pickDrillForSlot(slot);
      if (!drill) {return;}
      // Slice 5 \u2014 route through the pulse runtime so the Always-On
      // ribbon picks up the active state. The runtime will fire the
      // notifee notification for us as part of `reminder.fired`.
      enqueuePulseNow({
        element: drill.element,
        exerciseId: drill.id,
      });
    } catch (e) {
      // Surface the failure instead of letting it become an unhandled
      // promise rejection. Common causes: notification permission denied,
      // channel mis-config (caught and downgraded in ensureChannels).
      // eslint-disable-next-line no-console
      console.warn('[HeartScreen] Test Pulse failed:', e);
    }
  };

  const onApplyPlan = async () => {
    try {
      await notifeeScheduler.applyPlan(plan);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[HeartScreen] Apply Plan failed:', e);
    }
  };

  // Called by PlanPanel after it persists a draft. Update local state
  // so the planCard summary stays in sync, and re-arm the scheduler.
  const onPlanCommitted = useCallback(
    (next: typeof plan) => {
      setPlan(next);
      notifeeScheduler.applyPlan(next).catch(e => {
        // eslint-disable-next-line no-console
        console.warn('[HeartScreen] applyPlan after commit failed:', e);
      });
    },
    [],
  );

  const todayCard = (
    <View style={styles.todayCard}>
      <View
        pointerEvents="none"
        style={[styles.cardTopEdge, {backgroundColor: ELEMENTS.heart.color}]}
      />
      <Text style={styles.cardEyebrow}>Today — live grid</Text>
      <Mandala counts={stats.byElement} />
      <View style={styles.streakRow}>
        <Text style={[styles.streakValue, {color: ELEMENTS.heart.accent}]}>
          {stats.streak}
        </Text>
        <Text style={styles.streakLabel}>
          day{stats.streak === 1 ? '' : 's'} unbroken · {stats.total} pulses logged
        </Text>
      </View>
    </View>
  );

  const planCard = (
    <View style={styles.planCard}>
      <View
        pointerEvents="none"
        style={[styles.cardTopEdge, {backgroundColor: ELEMENTS.heart.color}]}
      />
      <Text style={styles.planTitle}>Active Plan</Text>
      <Text style={styles.planName}>{plan.name}</Text>
      {plan.windows.map(w => (
        <View key={w.id} style={styles.window}>
          <Text style={styles.windowLabel}>
            {w.label}  ·  {w.startTime}–{w.endTime}
          </Text>
          {w.slots.map((s, i) => {
            const el = ELEMENTS[s.element];
            return (
              <Text key={i} style={[styles.slot, {color: el.color}]}>
                {el.glyph}  {el.name} every {s.everyMinutes} min
              </Text>
            );
          })}
        </View>
      ))}
      <View style={styles.btnRow}>
        <Tap
          variant="solid"
          color={ELEMENTS.heart.color}
          onPress={onApplyPlan}
          style={styles.btn}>
          <Text style={styles.btnText}>Apply Plan</Text>
        </Tap>
        <Tap
          variant="ghost"
          color={ELEMENTS.heart.accent}
          onPress={onTestPulse}
          style={styles.btn}>
          <Text style={[styles.btnText, {color: ELEMENTS.heart.accent}]}>
            Test Pulse
          </Text>
        </Tap>
      </View>
    </View>
  );

  return (
    <ScreenScaffold
      element={ELEMENTS.heart}
      nextFireTs={nextFireForElement(plan, 'heart')?.ts}
      everyMinutes={nextFireForElement(plan, 'heart')?.everyMinutes}>
      {subTab === 'dash' && (
        <>
          {/* Stats: Mandala + streak. Plan summary moved to Plan tab. */}
          {sideBySide ? (
            <View style={styles.cardRow}>
              <View style={styles.cardRowItem}>{todayCard}</View>
              <View style={[styles.cardRowItem, {marginLeft: spacing.lg}]}>
                {planCard}
              </View>
            </View>
          ) : (
            todayCard
          )}

          {/* Pentagram circuit launcher — the dashboard's anchor action. */}
          <Pressable
            onPress={() => setChamberOpen(true)}
            style={({pressed}) => [
              styles.circuitCard,
              {
                borderColor: ELEMENTS.heart.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View
              pointerEvents="none"
              style={[
                styles.cardTopEdge,
                {backgroundColor: ELEMENTS.heart.accent, opacity: 0.7},
              ]}
            />
            <Text style={[styles.circuitEyebrow, {color: ELEMENTS.heart.accent}]}>
              ⬠  PENTAGRAM CIRCUIT
            </Text>
            <Text style={styles.circuitTitle}>Run the circuit</Text>
            <Text style={styles.circuitBody}>
              Air → Fire → Earth → Water → Heart. Five legs, each
              sealed in turn. About three minutes.
            </Text>
            <Text style={[styles.circuitCta, {color: ELEMENTS.heart.color}]}>
              Engage →
            </Text>
          </Pressable>

          <Text style={styles.section}>Heart drills</Text>
          <CardGrid>
            {heartDrills.map(ex => (
              <ExerciseRow key={ex.id} exercise={ex} onCompleted={refreshStats} />
            ))}
          </CardGrid>
        </>
      )}

      {subTab === 'sets' && <SetsPanel />}

      {subTab === 'plan' && (
        <PlanPanel onPlanCommitted={onPlanCommitted} />
      )}

      {subTab === 'circuits' && (
        <CircuitsPanel onEngageLegs={onEngageLegs} />
      )}

      {subTab === 'settings' && (
        <ScrollView
          style={styles.settingsScroll}
          contentContainerStyle={styles.settingsContent}
          showsVerticalScrollIndicator={false}>
          {/* Signal banner — system voice, real permission state. */}
          {permission === 'denied' ? (
            <View style={[styles.notifBanner, styles.notifBannerWarn]}>
              <Text style={styles.notifTitle}>⚠  Signal: blocked</Text>
              <Text style={styles.notifBody}>
                Android has muted RaveLite's pulses. Open Settings →
                Apps → RaveLite → Notifications to re-arm the channel,
                or every pulse fires silently.
              </Text>
            </View>
          ) : (
            <View style={[styles.notifBanner, styles.notifBannerOk]}>
              <Text style={[styles.notifTitle, {color: ELEMENTS.heart.accent}]}>
                ●  Signal: live
              </Text>
              <Text style={styles.notifBody}>
                Tap <Text style={styles.kbd}>Test Pulse</Text> to fire one Air
                pulse now — cue, vibration and notification. Your plan and
                Daily Sets chime on their own; nothing needs arming.
              </Text>
            </View>
          )}
          <View style={styles.btnRow}>
            <Tap
              variant="ghost"
              color={ELEMENTS.heart.accent}
              onPress={onTestPulse}
              style={styles.btn}>
              <Text style={[styles.btnText, {color: ELEMENTS.heart.accent}]}>
                Test Pulse
              </Text>
            </Tap>
            <Tap
              variant="solid"
              color={ELEMENTS.heart.color}
              onPress={onApplyPlan}
              style={styles.btn}>
              <Text style={styles.btnText}>Apply Plan</Text>
            </Tap>
          </View>
          <StayAlivePanel />
          <ChimesPanel />
          <ThemePanel />
        </ScrollView>
      )}

      {subTab === 'always-on' && <AlwaysOnPanel />}

      {subTab === 'insights' && (
        <InsightsPanel onElementChange={onElementChange} />
      )}

      <CircuitChamber
        visible={chamberOpen}
        legs={chamberLegs}
        onClose={() => {
          setChamberOpen(false);
          setChamberLegs(undefined);
          refreshStats();
        }}
      />
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  settingsScroll: {flex: 1},
  settingsContent: {paddingBottom: spacing.xxl},
  notifBanner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  notifBannerWarn: {
    backgroundColor: '#2A1F0A',
    borderColor: '#FFD60A',
  },
  notifBannerOk: {
    // Dark plum — Heart's chromatic family, not Earth's green.
    backgroundColor: '#160A18',
    borderColor: ELEMENTS.heart.accent,
  },
  notifTitle: {
    color: '#FFD60A',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  notifBody: {color: palette.textDim, fontSize: 13, lineHeight: 18},
  cardRow: {flexDirection: 'row', alignItems: 'flex-start'},
  cardRowItem: {flex: 1},
  todayCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: ELEMENTS.heart.tint,
    overflow: 'hidden',
  },
  /** Element-color hairline along the top of every Heart card. */
  cardTopEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.55,
  },
  cardEyebrow: {
    ...t.caption,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  streakValue: {fontSize: 28, fontWeight: '800', letterSpacing: -0.5},
  streakLabel: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
  },
  kbd: {color: ELEMENTS.heart.accent, fontWeight: '700'},
  planCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: ELEMENTS.heart.tint,
    overflow: 'hidden',
  },
  planTitle: {...t.caption, color: palette.textDim, textTransform: 'uppercase'},
  planName: {
    ...t.title,
    color: palette.text,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  window: {marginBottom: spacing.md},
  windowLabel: {
    ...t.subtitle,
    color: palette.text,
    marginBottom: spacing.xs,
  },
  slot: {...t.body, lineHeight: 22},
  btnRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md},
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnText: {color: palette.bg, fontWeight: '700', letterSpacing: 0.5},
  section: {
    ...t.subtitle,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  /** Quiet copy for stub sub-pages while their content is in flight. */
  placeholder: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    lineHeight: 21,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  circuitCard: {
    backgroundColor: '#1A0A1F',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  circuitEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  circuitTitle: {
    ...t.display,
    color: palette.text,
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  circuitBody: {
    ...t.body,
    color: palette.textDim,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  circuitCta: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default HeartScreen;
