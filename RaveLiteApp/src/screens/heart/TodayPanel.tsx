/**
 * TodayPanel — Heart, the home screen, on one page.
 *
 * Top to bottom: the chime to answer (or the next one, or the pause);
 * today's balance with the week behind it, which is also the way to each
 * element's page;
 * water; Daily Sets meters; and the whole day's list from every source.
 * Settings, Daily Sets in full, logging a session and practice open as
 * sheets, so the page itself stays a glance.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {BalanceStrip} from '../../components/today/BalanceStrip';
import {
  ChimeCard,
  cardForRow,
  type DoneAdjust,
} from '../../components/today/ChimeCard';
import {InfoSheet, useInfoStack} from '../../components/info/InfoSheet';
import {ConditionsLine} from '../../components/today/ConditionsLine';
import {DayList} from '../../components/today/DayList';
import {CatchUpSheet} from '../../components/today/CatchUpSheet';
import {LateLogSheet} from '../../components/today/LateLogSheet';
import {LoggedSheet} from '../../components/today/LoggedSheet';
import {PracticeSheet} from '../../components/today/PracticeSheet';
import {
  clearInjury,
  clearMode,
  finishTutorial,
  isNewcomer,
  loadInjured,
  loadMode,
  needsTutorial,
  setInjury,
} from '../../domain/profile/repository';
import {TutorialCoach} from '../../components/today/TutorialCoach';
import {ModeChip} from '../../components/today/ModeChip';
import {StorageWarning} from '../../components/today/StorageWarning';
import {NotificationsOff} from '../../components/today/NotificationsOff';
import {SessionBanner, SessionSheet} from '../../components/today/SessionSheet';
import {SetsMeters} from '../../components/today/SetsMeters';
import {WaterCounter} from '../../components/today/WaterCounter';
import {TrainingLogSheet} from '../../components/training/TrainingLogSheet';
import {takeBack} from '../../domain/activity/corrections';
import {logWaterGlass} from '../../domain/activity/record';
import {logMissedChime} from '../../domain/ambient/lateDone';
import {setPause} from '../../domain/ambient/pause';
import {
  cancelQueued,
  deferQueued,
  resolveActive,
  sealActive,
  snoozeActive,
} from '../../domain/ambient/pulseRuntime';
import {setsToday} from '../../domain/ambient/setScheduler';
import type {CircuitLeg} from '../../domain/circuit/circuit';
import {append, entriesForDay} from '../../domain/journal/journal';
import type {DayRow} from '../../domain/today/dayList';
import {loadEntries} from '../../domain/training/repository';
import type {TrainingLogEntry} from '../../domain/training/types';
import {useTodayModel} from '../../hooks/useTodayModel';
import {ElementProvider} from '../../theme/elementContext';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';
import {DailySetsSheet} from './DailySetsSheet';
import {SettingsSheet} from './SettingsSheet';
import {WeatherSheet} from './WeatherSheet';
import {subscribePracticeRequest} from '../../shell/practiceRequest';
import type {DisciplineId} from '../../domain/exercises/disciplines';
import {DoorMark} from '../../components/icons/DoorMark';
import {DOOR_COLOR, type DoorId} from '../../components/icons/doorMarks';

/** +5 on the next chime pushes it back by this much. */
const PLUS_FIVE_MS = 5 * 60_000;

interface Props {
  permission: 'unknown' | 'granted' | 'denied';
  onElementPress: (id: ElementId) => void;
  onEngageLegs: (legs: CircuitLeg[]) => void;
}

export function TodayPanel({permission, onElementPress, onEngageLegs}: Props) {
  const model = useTodayModel();
  const info = useInfoStack();
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingLogEntry | undefined>();
  const [practiceOpen, setPracticeOpen] = useState(false);
  /** The path Practice opens on, when a page asked for one. */
  const [practicePath, setPracticePath] = useState<DisciplineId | undefined>();
  useEffect(
    () =>
      subscribePracticeRequest(path => {
        setPracticePath(path);
        setPracticeOpen(true);
      }),
    [],
  );
  const [sessionOpen, setSessionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  /** Re-read whenever Settings closes, since that is where one is picked. */
  const [mode, setMode] = useState(() => loadMode());
  const [injured, setInjured] = useState(() => loadInjured());
  /** First run only; ends the moment a chime is answered unaided. */
  const [teaching, setTeaching] = useState(needsTutorial);
  /** A missed or skipped chime being logged after the fact. */
  const [late, setLate] = useState<DayRow | undefined>();
  /** A logged row being kept or removed. */
  const [logged, setLogged] = useState<DayRow | undefined>();
  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const next = model.next;

  // Sealing writes the completion; the sets scheduler trims later rounds
  // from the journal on its own.
  const onDone = useCallback((adjust: DoneAdjust) => {
    sealActive(adjust);
    // Answering a chime is the lesson. Once it has been done unaided,
    // carrying on explaining it would be a lecture.
    setTeaching(teachingNow => {
      if (teachingNow) {
        finishTutorial();
      }
      return false;
    });
  }, []);
  const onDeferNext = useCallback(() => {
    if (next) {
      deferQueued(next.id, PLUS_FIVE_MS);
    }
  }, [next]);
  const onSkipNext = useCallback(() => {
    if (!next) {
      return;
    }
    cancelQueued([next.id]);
    append({kind: 'reminder.skipped', pulseId: next.id, respondedAfterMs: 0});
  }, [next]);
  // A chime still to come opens what it is; a Train entry opens for edit,
  // a missed or skipped chime opens to be logged, and anything else logged
  // opens to keep or remove.
  /**
   * One row sheet at a time.
   *
   * Each branch below used to set its own state and leave the others
   * alone, so a missed row followed by an upcoming one left the log sheet
   * open *underneath* an info card. Two stacked modals is the state this
   * app already knows breaks Back and touch handling on Android, and from
   * the outside it looks like a tap that flashes and opens nothing.
   *
   * Closing everything first costs a line and removes the whole class.
   */
  const onRowPress = useCallback(
    (row: DayRow) => {
      info.close();
      setLate(undefined);
      setLogged(undefined);
      setEditing(undefined);

      if (row.status === 'upcoming') {
        info.show(cardForRow(row));
        return;
      }
      if (
        row.status === 'missed' ||
        row.status === 'skipped' ||
        row.status === 'unsounded'
      ) {
        setLate(row);
        return;
      }
      if (row.status === 'done' && row.ref?.store === 'journal') {
        setLogged(row);
        return;
      }
      const id = row.ref?.store === 'train' ? row.ref.id : undefined;
      const entry = id ? loadEntries().find(e => e.id === id) : undefined;
      if (entry) {
        setEditing(entry);
        return;
      }
      // A Train row whose entry has been deleted: say so rather than
      // flashing and doing nothing, which is indistinguishable from the
      // app being broken.
      info.show({
        title: row.label,
        element: row.element,
        what: 'This was in the Train log, but that entry has been deleted. Nothing else is affected.',
      });
    },
    [info],
  );

  // A round's moves, partner and glass, looked up when its row opens.
  const lateRound = useMemo(
    () =>
      late
        ? setsToday(Date.now()).fires.find(f => f.id === late.id)
        : undefined,
    [late],
  );

  const missed = useMemo(
    () => model.rows.filter(row => row.status === 'missed'),
    [model.rows],
  );

  const removeLogged = useCallback(() => {
    const ref = logged?.ref;
    if (logged && ref?.store === 'journal') {
      const entry = entriesForDay(new Date(logged.at)).find(
        e => e.id === ref.id,
      );
      if (entry?.kind === 'completion') {
        takeBack(entry, {announce: true});
      }
    }
    setLogged(undefined);
  }, [logged]);

  // Each ticked chime logs at its own time; rounds as prescribed.
  const catchUp = useCallback((rows: DayRow[]) => {
    const fires = setsToday(Date.now()).fires;
    for (const row of rows) {
      const fire = fires.find(f => f.id === row.id);
      logMissedChime({
        pulseId: row.id,
        at: row.at,
        element: fire?.element ?? row.element,
        exerciseId: fire?.exerciseId ?? row.exerciseId,
        prescription: fire?.prescription,
      });
    }
    setCatchUpOpen(false);
  }, []);

  const accent = ELEMENTS.heart.accent;

  return (
    <ElementProvider element="heart">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Always shown: with no place it is the only way to set one. */}
        <ConditionsLine
          weather={model.weather}
          onPress={() => setWeatherOpen(true)}
          quickActions={[
            {
              name: 'settings',
              label: 'Open Settings',
              run: () => setSettingsOpen(true),
            },
            {
              name: 'practice',
              label: 'Open Practice',
              run: () => setPracticeOpen(true),
            },
            {name: 'log', label: 'Log a session', run: () => setLogOpen(true)},
            {
              name: 'session',
              label: 'Time a session',
              run: () => setSessionOpen(true),
            },
            {
              name: 'sets',
              label: 'Open Daily Sets',
              run: () => setSetsOpen(true),
            },
          ]}
        />
        {/* These render nothing at all unless they are wanted. */}
        <StorageWarning />
        <NotificationsOff permission={permission} />
        <TutorialCoach
          visible={teaching}
          onDone={() => {
            finishTutorial();
            setTeaching(false);
          }}
        />
        <ModeChip
          mode={mode}
          injured={injured}
          now={model.now}
          onClear={() => {
            // The mode first; an injury stays until it is ended itself.
            if (mode && mode.id !== 'injured') {
              clearMode();
            } else {
              clearInjury();
            }
            setMode(loadMode());
            setInjured(loadInjured());
          }}
        />
        <SessionBanner onPress={() => setSessionOpen(true)} />
        <ChimeCard
          now={model.now}
          active={model.active}
          pauseUntil={model.pauseUntil}
          onResume={() => setPause('off')}
          next={next}
          onDone={onDone}
          onSnooze={() => snoozeActive()}
          onSkip={() => resolveActive('skipped')}
          onHurt={region => {
            // The injury first: it marks today as rest, so the ramp does
            // not read a pain-skip as quitting.
            setInjury(region);
            resolveActive('skipped', Date.now(), 'hurt');
            setInjured(loadInjured());
          }}
          onDeferNext={onDeferNext}
          onSkipNext={onSkipNext}
          onInfo={info.show}
        />
        <BalanceStrip
          points={model.points}
          week={model.week}
          onElementPress={onElementPress}
          showNames={isNewcomer(model.now)}
        />
        <WaterCounter
          glasses={model.glasses}
          target={model.waterTarget}
          reason={model.waterReason}
          onAdd={() => logWaterGlass()}
        />
        <SetsMeters
          sets={model.sets}
          onPress={() => setSetsOpen(true)}
          focus={model.focus}
        />

        <View style={styles.sectionRow}>
          <Text
            testID="today-header"
            accessibilityRole="header"
            style={styles.section}>
            {(model.streak > 0
              ? `Today · ${model.streak}-day streak`
              : 'Today') +
              (model.harmony ? ' · Harmony' : '') +
              (model.activeMinutes > 0
                ? ` · ${model.activeMinutes} min active`
                : '')}
          </Text>
          {missed.length >= 2 ? (
            <Tap
              testID="catch-up-open"
              variant="plain"
              color={accent}
              onPress={() => setCatchUpOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Catch up on ${missed.length} missed chimes`}
              style={styles.catchUp}>
              <Text style={[styles.catchUpText, {color: accent}]}>
                Catch up {missed.length} ›
              </Text>
            </Tap>
          ) : null}
        </View>
        <DayList rows={model.rows} onRowPress={onRowPress} />

        <View style={styles.links}>
          <Door
            testID="log-open"
            door="log"
            color={accent}
            label="+ Log"
            onPress={() => setLogOpen(true)}
            accessibilityLabel="Log a session"
          />
          <Door
            testID="session-open"
            door="session"
            color={DOOR_COLOR.session}
            label="Session"
            onPress={() => setSessionOpen(true)}
            accessibilityLabel="Time a session"
          />
          <Door
            testID="practice-open"
            door="practice"
            color={DOOR_COLOR.practice}
            label="Practice"
            onPress={() => setPracticeOpen(true)}
            accessibilityLabel="Practice"
          />
          <Door
            testID="settings-open"
            door="settings"
            color={DOOR_COLOR.settings}
            label="Settings"
            onPress={() => setSettingsOpen(true)}
            accessibilityLabel="Settings"
          />
        </View>

        <InfoSheet stack={info} />
        <SessionSheet
          visible={sessionOpen}
          onClose={() => setSessionOpen(false)}
        />
        <TrainingLogSheet
          visible={logOpen || editing !== undefined}
          editing={editing}
          onClose={() => {
            setLogOpen(false);
            setEditing(undefined);
          }}
        />
        <PracticeSheet
          visible={practiceOpen}
          openOn={practicePath}
          onClose={() => {
            setPracticeOpen(false);
            setPracticePath(undefined);
          }}
          onEngageLegs={legs => {
            setPracticeOpen(false);
            setPracticePath(undefined);
            onEngageLegs(legs);
          }}
        />
        <WeatherSheet
          visible={weatherOpen}
          onClose={() => setWeatherOpen(false)}
        />
        <SettingsSheet
          visible={settingsOpen}
          permission={permission}
          onClose={() => {
            setSettingsOpen(false);
            // Settings is where a mode is picked; pick the chip up on the
            // way out rather than polling for it.
            setMode(loadMode());
            setInjured(loadInjured());
          }}
        />
        <DailySetsSheet visible={setsOpen} onClose={() => setSetsOpen(false)} />
        <CatchUpSheet
          visible={catchUpOpen}
          rows={missed}
          onLog={catchUp}
          onClose={() => setCatchUpOpen(false)}
        />
        <LoggedSheet
          row={logged}
          onRemove={removeLogged}
          onClose={() => setLogged(undefined)}
        />
        <LateLogSheet
          row={late}
          prescription={lateRound?.prescription}
          onClose={() => setLate(undefined)}
          onDone={adjust => {
            if (late) {
              logMissedChime(
                {
                  pulseId: late.id,
                  at: late.at,
                  element: lateRound?.element ?? late.element,
                  exerciseId: lateRound?.exerciseId ?? late.exerciseId,
                  prescription: lateRound?.prescription,
                },
                adjust,
              );
            }
            setLate(undefined);
          }}
        />
      </ScrollView>
    </ElementProvider>
  );
}

/** One of Today's four doors: its own mark and colour, and a label. */
function Door({
  door,
  color,
  label,
  onPress,
  accessibilityLabel,
  testID,
}: {
  door: DoorId;
  color: string;
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  return (
    <Tap
      testID={testID}
      variant="ghost"
      color={color}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.link}>
      <View style={styles.linkRow}>
        <DoorMark door={door} size={18} color={color} />
        <Text style={[styles.linkText, {color}]}>{label}</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    minHeight: 44,
  },
  section: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    // Wraps to a second line rather than pushing Catch up off the screen.
    flexShrink: 1,
  },
  catchUp: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  catchUpText: {
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  // Two by two, so every label fits on one line.
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  link: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 48,
    borderRadius: radius.md,
  },
  linkText: {
    ...t.subtitle,
    fontSize: 15,
    color: palette.text,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
