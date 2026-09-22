/**
 * SettingsSheet — an index of one-line rows, each opening a page inside
 * the same sheet.
 *
 * It used to be four and a half screens of panels in one scroll. Now the
 * front page fits on a phone without scrolling: what today is (a mode),
 * the four groups the model is made of, and the two ways to be walked
 * through it again. Pages render in this sheet rather than as sheets of
 * their own, because a modal over a modal breaks Back on Android.
 */
import React, {useEffect, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {formatHM} from '../../components/ambient/format';
import {Tap} from '../../components/Tap';
import {MyDaySheet} from '../../components/today/MyDaySheet';
import {getActiveHours, readPauseUntil} from '../../domain/ambient/activeHours';
import {setPause, type PauseDurationKey} from '../../domain/ambient/pause';
import {
  loadPlan,
  savePlan,
  subscribePlan,
} from '../../domain/reminders/repository';
import {hasMealChecks} from '../../domain/reminders/defaultPlan';
import {moveMyDay, setMealChecks} from '../../domain/reminders/moveDay';
import {getPlace} from '../../domain/conditions/weather';
import type {Plan} from '../../domain/reminders/types';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import {Symbol, hueOf, type SymbolName} from '../../components/icons/Symbol';
import {tint} from '../../theme/hues';
import {requestSetup} from '../../domain/profile/setupRequest';
import {loadMode} from '../../domain/profile/repository';
import {modeLabel} from '../../domain/profile/mode';
import {AlivePanel} from './AlivePanel';
import {ArchetypePanel} from './ArchetypePanel';
import {ChimesPanel} from './ChimesPanel';
import {DataPanel} from './DataPanel';
import {FlawsPanel} from './FlawsPanel';
import {KitPanel} from './KitPanel';
import {MODE_SYMBOL, ModePanel} from './ModePanel';
import {PacksPanel} from './PacksPanel';
import {ShapePanel} from './ShapePanel';
import {PlanPanel} from './PlanPanel';
import {StayAlivePanel} from './StayAlivePanel';
import {ThemePanel} from './ThemePanel';
import {WeatherPanel} from './WeatherSheet';
import {exitDemo, isDemo, subscribeDemo} from '../../domain/demo/demo';

const WARN = '#FFD60A';

interface Props {
  visible: boolean;
  onClose: () => void;
  permission: 'unknown' | 'granted' | 'denied';
}

/** When the v2 migration replaced a saved plan, and the backup still exists. */
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const PAUSES: {key: PauseDurationKey; label: string}[] = [
  {key: 'p30', label: '30 min'},
  {key: 'p2h', label: '2 hours'},
  {key: 'tonight', label: 'Till morning'},
];

function daysLabel(mask: number): string {
  return mask === 0b1111111
    ? 'every day'
    : DAY_LETTERS.filter((_, i) => (mask & (1 << i)) !== 0).join(' ');
}

function replacedPlanAt(): number | undefined {
  const at = store.getNumber(KEYS.planReplacedAt);
  return at !== undefined && store.getString(KEYS.planBackupV1)
    ? at
    : undefined;
}

/** The four boxes the app is actually built from, plus the app itself. */
type Page =
  | 'index'
  | 'mode'
  | 'you'
  | 'day'
  | 'program'
  | 'app'
  | 'weather'
  | 'plan';

/**
 * Pages that open from another page, and the page Back returns to.
 * Weather and the plan used to be sheets over this one — the pattern that
 * loses Back on the phone.
 */
const PARENT: Partial<Record<Page, Page>> = {weather: 'day', plan: 'day'};
const SUB_TITLE: Partial<Record<Page, string>> = {
  weather: 'Weather',
  plan: 'Plan',
};

const GROUPS: readonly {
  id: Exclude<Page, 'index' | 'weather' | 'plan'>;
  title: string;
  holds: string;
  symbol: SymbolName;
}[] = [
  {
    id: 'you',
    title: 'You',
    holds: 'Where you train, your kit, noise limits and posture problems',
    symbol: 'you',
  },
  {
    id: 'day',
    title: 'The day',
    holds: 'My day, chimes, how often you can move, weather, the plan',
    symbol: 'time',
  },
  {
    id: 'program',
    title: 'The program',
    holds: 'Your training goal and the skills you want to learn',
    symbol: 'program',
  },
  {
    id: 'app',
    title: 'The app',
    holds: 'Theme, motion, and your data',
    symbol: 'pack',
  },
];

export function SettingsSheet({visible, onClose, permission}: Props) {
  const [page, setPage] = useState<Page>('index');
  // Demo mode is for screenshots, so Today does not say it is on. Here does.
  const [demo, setDemo] = useState(isDemo);
  useEffect(() => subscribeDemo(setDemo), []);
  const [confirmFresh, setConfirmFresh] = useState(false);
  // Armed, it erases everything on the next tap — so it never stays armed:
  // not for longer than a few seconds, and not across closing Settings.
  useEffect(() => {
    if (!confirmFresh) {
      return;
    }
    const timer = setTimeout(() => setConfirmFresh(false), 6000);
    return () => clearTimeout(timer);
  }, [confirmFresh]);
  useEffect(() => {
    if (!visible) {
      setConfirmFresh(false);
    }
  }, [visible]);
  const [plan, setPlan] = useState(loadPlan);
  const place = getPlace();
  const [myDayOpen, setMyDayOpen] = useState(false);
  const [, setVersion] = useState(0);
  const myDay = getActiveHours();
  const pauseUntil = readPauseUntil();
  const paused = pauseUntil !== undefined && pauseUntil > Date.now();
  const pause = (key: PauseDurationKey) => {
    setPause(key);
    setVersion(v => v + 1);
  };
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
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() =>
        page === 'index' ? onClose() : setPage(PARENT[page] ?? 'index')
      }>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          {page === 'index' ? null : (
            <Tap
              testID="settings-back"
              variant="plain"
              onPress={() => setPage(PARENT[page] ?? 'index')}
              accessibilityRole="button"
              accessibilityLabel={
                PARENT[page] ? 'Back to The day' : 'Back to Settings'
              }
              style={styles.close}>
              <Text style={[styles.closeText, {color: accent}]}>
                {PARENT[page] ? '‹ The day' : '‹ Settings'}
              </Text>
            </Tap>
          )}
          <Text
            accessibilityRole="header"
            style={[styles.title, {color: accent}]}
            numberOfLines={1}>
            {page === 'index'
              ? 'Settings'
              : page === 'mode'
              ? "Today I'm…"
              : SUB_TITLE[page] ??
                GROUPS.find(g => g.id === page)?.title ??
                'Settings'}
          </Text>
          <Tap
            variant="plain"
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Tap>
        </View>
        <ScrollView
          // Keyed by page so each one opens at its top — Back from a
          // scrolled page otherwise lands on the index part-way down.
          key={page}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {demo ? (
            <View testID="demo-banner" style={styles.banner}>
              <Text style={styles.bannerTitle}>Demo mode is on</Text>
              <Text style={styles.bannerBody}>
                This is example data. Nothing you log now is kept. Your own data
                is safe and comes back when you leave.
              </Text>
              <Tap
                testID="demo-leave"
                variant="ghost"
                color={accent}
                onPress={() => exitDemo()}
                accessibilityRole="button"
                style={styles.rowBtn}>
                <Text style={[styles.rowBtnText, {color: accent}]}>
                  Leave demo
                </Text>
              </Tap>
            </View>
          ) : null}
          {permission === 'denied' ? (
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>⚠ Notifications are off</Text>
              <Text style={styles.bannerBody}>
                Android has turned off RaveLite notifications, so chimes are
                silent. Turn them on in Settings → Apps → RaveLite →
                Notifications.
              </Text>
            </View>
          ) : null}

          {page === 'index' ? (
            <>
              {/* Temporary and frequently used, so it is the first row —
                  but one row, saying what is on, not the whole panel. */}
              {(() => {
                const mode = loadMode();
                const symbol: SymbolName = mode
                  ? MODE_SYMBOL[mode.id]
                  : 'travelling';
                return (
                  <Tap
                    testID="settings-mode"
                    variant="plain"
                    onPress={() => setPage('mode')}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mode
                        ? `Today I'm ${modeLabel(mode, Date.now())}`
                        : "Today I'm… Nothing on"
                    }
                    style={[
                      styles.navRow,
                      mode && {borderWidth: 1, borderColor: hueOf(symbol)},
                    ]}>
                    <View style={styles.groupRow}>
                      <View
                        style={[
                          styles.badge,
                          {backgroundColor: tint(hueOf(symbol))},
                        ]}>
                        <Symbol name={symbol} size={20} />
                      </View>
                      <View style={styles.rowText}>
                        <Text style={[styles.rowTitle, {color: hueOf(symbol)}]}>
                          Today I'm…
                        </Text>
                        <Text style={styles.rowValue}>
                          {mode
                            ? modeLabel(mode, Date.now())
                            : 'Away, hurt, at a festival, or taking the day off'}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </Tap>
                );
              })()}

              {GROUPS.map(group => (
                <Tap
                  key={group.id}
                  testID={`settings-group-${group.id}`}
                  variant="plain"
                  onPress={() => setPage(group.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${group.title}. ${group.holds}`}
                  style={styles.navRow}>
                  <View style={styles.groupRow}>
                    <View
                      style={[
                        styles.badge,
                        {backgroundColor: tint(hueOf(group.symbol))},
                      ]}>
                      <Symbol name={group.symbol} size={20} />
                    </View>
                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowTitle, {color: hueOf(group.symbol)}]}>
                        {group.title}
                      </Text>
                      <Text style={styles.rowValue}>{group.holds}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Tap>
              ))}

              <Text accessibilityRole="header" style={styles.eyebrow}>
                IF YOU ARE NOT SURE
              </Text>
              <Tap
                testID="settings-revisit"
                variant="plain"
                onPress={() => {
                  requestSetup('revisit');
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel="Walk me through my settings"
                style={styles.navRow}>
                <View style={styles.groupRow}>
                  <View
                    style={[
                      styles.badge,
                      {backgroundColor: tint(hueOf('learn'))},
                    ]}>
                    <Symbol name="learn" size={20} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, {color: hueOf('learn')}]}>
                      Walk me through it
                    </Text>
                    <Text style={styles.rowValue}>
                      Go through the setup questions again, with your answers
                      filled in. Change any of them, or leave.
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Tap>
              <Tap
                testID="settings-fresh"
                variant="plain"
                onPress={() => {
                  if (!confirmFresh) {
                    setConfirmFresh(true);
                    return;
                  }
                  requestSetup('fresh');
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  confirmFresh
                    ? 'Tap again to erase everything and set up from scratch'
                    : 'Set up from scratch'
                }
                style={[
                  styles.navRow,
                  confirmFresh && {borderWidth: 1, borderColor: palette.danger},
                ]}>
                <View style={styles.groupRow}>
                  <View
                    style={[
                      styles.badge,
                      {backgroundColor: tint(hueOf('erase'))},
                    ]}>
                    <Symbol name="erase" size={20} />
                  </View>
                  <View style={styles.rowText}>
                    <Text
                      style={[
                        styles.rowTitle,
                        {color: confirmFresh ? palette.danger : hueOf('erase')},
                      ]}>
                      {confirmFresh ? 'Tap to confirm' : 'Set up from scratch'}
                    </Text>
                    <Text style={styles.rowValue}>
                      {confirmFresh
                        ? 'This erases everything on this phone first. Export your data before you do this.'
                        : 'Start again as a new install. Erases everything first.'}
                    </Text>
                  </View>
                </View>
              </Tap>
            </>
          ) : null}

          {page === 'mode' ? <ModePanel showTitle={false} /> : null}
          {page === 'weather' ? <WeatherPanel /> : null}
          {page === 'plan' ? <PlanPanel scroll={false} /> : null}

          {page === 'you' ? (
            <>
              <KitPanel />
              <FlawsPanel />
            </>
          ) : null}

          {page === 'program' ? (
            <>
              <ArchetypePanel />
              <PacksPanel />
            </>
          ) : null}

          {page === 'app' ? (
            <>
              <AlivePanel />
              <ThemePanel />
              <DataPanel />
            </>
          ) : null}

          {page === 'day' ? (
            <>
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>My day</Text>
                  <Text style={styles.rowValue}>
                    {myDay.start}–{myDay.end} · {daysLabel(myDay.daysMask)} ·
                    chimes and a bright screen
                  </Text>
                </View>
                <Tap
                  testID="myday-edit"
                  variant="ghost"
                  color={palette.textDim}
                  onPress={() => setMyDayOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit My day"
                  style={styles.rowBtn}>
                  <Text style={styles.rowBtnText}>Edit</Text>
                </Tap>
              </View>

              <View style={styles.stack}>
                <Text style={styles.rowTitle}>
                  {paused && pauseUntil !== undefined
                    ? `Chimes paused until ${formatHM(pauseUntil)}`
                    : 'Pause chimes'}
                </Text>
                <View style={styles.pills}>
                  {paused ? (
                    <Tap
                      testID="pause-off"
                      variant="ghost"
                      color={palette.textDim}
                      onPress={() => pause('off')}
                      accessibilityRole="button"
                      style={styles.pill}>
                      <Text style={styles.rowBtnText}>Resume</Text>
                    </Tap>
                  ) : (
                    PAUSES.map(option => (
                      <Tap
                        key={option.key}
                        testID={`pause-${option.key}`}
                        variant="ghost"
                        color={palette.textDim}
                        onPress={() => pause(option.key)}
                        accessibilityRole="button"
                        accessibilityLabel={`Pause chimes for ${option.label}`}
                        style={styles.pill}>
                        <Text style={styles.rowBtnText}>{option.label}</Text>
                      </Tap>
                    ))
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Weather & place</Text>
                  <Text style={styles.rowValue}>
                    {place
                      ? `${place.name}: sunrise, rain, heat and bugs`
                      : 'Set your place for sunrise and weather'}
                  </Text>
                </View>
                <Tap
                  testID="weather-open"
                  variant="ghost"
                  color={palette.textDim}
                  onPress={() => setPage('weather')}
                  accessibilityRole="button"
                  accessibilityLabel="Open weather and place"
                  style={styles.rowBtn}>
                  <Text style={styles.rowBtnText}>
                    {place ? 'Open' : 'Set'}
                  </Text>
                </Tap>
              </View>

              <ShapePanel />
              <ChimesPanel />
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
                  onPress={() => setPage('plan')}
                  accessibilityRole="button"
                  accessibilityLabel="Open the plan editor"
                  style={styles.rowBtn}>
                  <Text style={styles.rowBtnText}>Open</Text>
                </Tap>
              </View>

              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Meal check-ins</Text>
                  <Text style={styles.rowValue}>
                    {hasMealChecks(plan)
                      ? 'On: one before lunch and one before dinner.'
                      : 'Off. Turn on for a check-in before lunch and dinner.'}
                  </Text>
                </View>
                <Tap
                  testID="meals-toggle"
                  variant="ghost"
                  color={palette.textDim}
                  onPress={() => setMealChecks(!hasMealChecks(plan))}
                  accessibilityRole="switch"
                  accessibilityState={{checked: hasMealChecks(plan)}}
                  accessibilityLabel="Meal check-ins"
                  style={styles.rowBtn}>
                  <Text style={styles.rowBtnText}>
                    {hasMealChecks(plan) ? 'Turn off' : 'Turn on'}
                  </Text>
                </Tap>
              </View>

              {replacedAt !== undefined ? (
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Previous plan</Text>
                    <Text style={styles.rowValue}>
                      Replaced by the smaller default plan on{' '}
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
            </>
          ) : null}
        </ScrollView>

        <MyDaySheet
          visible={myDayOpen}
          value={myDay}
          onClose={() => setMyDayOpen(false)}
          onSave={value => {
            moveMyDay(value);
            setMyDayOpen(false);
          }}
        />
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
  stack: {
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // A tappable row. Not `row`: Tap wraps its children in one inner view,
  // and a row-direction container shrinks that view to its content — the
  // text column then gets no width at all, which on a phone renders as a
  // tall empty card.
  navRow: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    ...t.subtitle,
    color: palette.textDim,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
    marginTop: spacing.lg,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
