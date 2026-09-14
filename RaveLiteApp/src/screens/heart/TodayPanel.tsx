/**
 * TodayPanel — Heart, the home screen, on one page.
 *
 * Top to bottom: live status with My day, the clock and Settings; the chime
 * to answer (or the next one); today's balance with the week behind it;
 * water; Daily Sets meters; and the whole day's list from every source.
 * Settings, Daily Sets in full, logging a session and practice open as
 * sheets, so the page itself stays a glance.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AppState, ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {BalanceStrip} from '../../components/today/BalanceStrip';
import {ChimeCard, type DoneAdjust} from '../../components/today/ChimeCard';
import {DayList} from '../../components/today/DayList';
import {CatchUpSheet} from '../../components/today/CatchUpSheet';
import {LateLogSheet} from '../../components/today/LateLogSheet';
import {LoggedSheet} from '../../components/today/LoggedSheet';
import {MyDaySheet} from '../../components/today/MyDaySheet';
import {PracticeSheet} from '../../components/today/PracticeSheet';
import {SetsMeters} from '../../components/today/SetsMeters';
import {StatusLine} from '../../components/today/StatusLine';
import {WaterCounter} from '../../components/today/WaterCounter';
import {TrainingLogSheet} from '../../components/training/TrainingLogSheet';
import {takeBack} from '../../domain/activity/corrections';
import {logWaterGlass} from '../../domain/activity/record';
import {setActiveHours} from '../../domain/ambient/activeHours';
import {
  gatherHealthInputs,
  summarizeHealth,
} from '../../domain/ambient/healthChecks';
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

/** +5 on the next chime pushes it back by this much. */
const PLUS_FIVE_MS = 5 * 60_000;

interface Props {
  permission: 'unknown' | 'granted' | 'denied';
  onElementPress: (id: ElementId) => void;
  onEngageLegs: (legs: CircuitLeg[]) => void;
}

/**
 * How many Stay alive checks warn, re-read when the app comes back to the
 * front (after a trip to system settings) or on demand.
 */
function useHealthWarnings(): [number, () => void] {
  const [warnings, setWarnings] = useState(0);
  const [asked, setAsked] = useState(0);
  const recheck = useCallback(() => setAsked(n => n + 1), []);

  useEffect(() => {
    let live = true;
    gatherHealthInputs()
      .then(inputs => {
        if (live) {
          setWarnings(summarizeHealth(inputs).warnings);
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [asked]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        recheck();
      }
    });
    return () => sub.remove();
  }, [recheck]);

  return [warnings, recheck];
}

export function TodayPanel({permission, onElementPress, onEngageLegs}: Props) {
  const model = useTodayModel();
  const [warnings, recheckHealth] = useHealthWarnings();
  const [myDayOpen, setMyDayOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingLogEntry | undefined>();
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
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
  // A Train entry opens for edit, a missed or skipped chime opens to be
  // logged, and anything else logged opens to keep or remove.
  const onRowPress = useCallback((row: DayRow) => {
    if (row.status === 'missed' || row.status === 'skipped') {
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
    }
  }, []);

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
        <StatusLine
          now={model.now}
          myDay={model.myDay}
          pauseUntil={model.pauseUntil}
          onEditMyDay={() => setMyDayOpen(true)}
          onPause={key => setPause(key)}
          onOpenSettings={() => setSettingsOpen(true)}
          settingsAlert={permission === 'denied' || warnings > 0}
        />
        <ChimeCard
          now={model.now}
          active={model.active}
          next={next}
          onDone={onDone}
          onSnooze={() => snoozeActive()}
          onSkip={() => resolveActive('skipped')}
          onDeferNext={onDeferNext}
          onSkipNext={onSkipNext}
        />
        <BalanceStrip
          points={model.points}
          week={model.week}
          onElementPress={onElementPress}
        />
        <WaterCounter glasses={model.glasses} onAdd={() => logWaterGlass()} />
        <SetsMeters sets={model.sets} onPress={() => setSetsOpen(true)} />

        <View style={styles.sectionRow}>
          <Text testID="today-header" style={styles.section}>
            {(model.streak > 0
              ? `Today · ${model.streak}-day streak`
              : 'Today') + (model.harmony ? ' · Harmony' : '')}
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
          <Tap
            variant="ghost"
            color={accent}
            onPress={() => setLogOpen(true)}
            accessibilityRole="button"
            style={styles.link}>
            <Text style={[styles.linkText, {color: accent}]}>
              + Log a session
            </Text>
          </Tap>
          <Tap
            variant="ghost"
            color={palette.textDim}
            onPress={() => setPracticeOpen(true)}
            accessibilityRole="button"
            style={styles.link}>
            <Text style={styles.linkText}>Practice ›</Text>
          </Tap>
        </View>

        <MyDaySheet
          visible={myDayOpen}
          value={model.myDay}
          onClose={() => setMyDayOpen(false)}
          onSave={value => {
            setActiveHours(value);
            setMyDayOpen(false);
          }}
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
          onClose={() => setPracticeOpen(false)}
          onEngageLegs={legs => {
            setPracticeOpen(false);
            onEngageLegs(legs);
          }}
        />
        <SettingsSheet
          visible={settingsOpen}
          permission={permission}
          onClose={() => {
            setSettingsOpen(false);
            recheckHealth();
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
  },
  catchUp: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  catchUpText: {
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  links: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  link: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
  },
  linkText: {
    ...t.subtitle,
    color: palette.text,
  },
});
