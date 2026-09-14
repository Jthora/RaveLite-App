/**
 * TodayPanel — Heart › Today, the home screen.
 *
 * One scroll, top to bottom: live status and My day; the chime to answer
 * (or the next one); today's balance across the elements; water; Daily
 * Sets at a glance; and the whole day's list from every source. Logging a
 * session and practice live at the bottom, out of the way.
 */
import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {BalanceStrip} from '../../components/today/BalanceStrip';
import {ChimeCard, type DoneAdjust} from '../../components/today/ChimeCard';
import {DayList} from '../../components/today/DayList';
import {MyDaySheet} from '../../components/today/MyDaySheet';
import {PracticeSheet} from '../../components/today/PracticeSheet';
import {SetsSummaryLine} from '../../components/today/SetsSummaryLine';
import {StatusLine} from '../../components/today/StatusLine';
import {WaterCounter} from '../../components/today/WaterCounter';
import {TrainingLogSheet} from '../../components/training/TrainingLogSheet';
import {logWaterGlass} from '../../domain/activity/record';
import {setActiveHours} from '../../domain/ambient/activeHours';
import {setPause} from '../../domain/ambient/pause';
import {
  cancelQueued,
  deferQueued,
  resolveActive,
  sealActive,
  snoozeActive,
} from '../../domain/ambient/pulseRuntime';
import type {CircuitLeg} from '../../domain/circuit/circuit';
import {append} from '../../domain/journal/journal';
import {useTodayModel} from '../../hooks/useTodayModel';
import {ElementProvider} from '../../theme/elementContext';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** +5 on the next chime pushes it back by this much. */
const PLUS_FIVE_MS = 5 * 60_000;

interface Props {
  onOpenProgress: () => void;
  onElementPress: (id: ElementId) => void;
  onEngageLegs: (legs: CircuitLeg[]) => void;
}

export function TodayPanel({
  onOpenProgress,
  onElementPress,
  onEngageLegs,
}: Props) {
  const model = useTodayModel();
  const [myDayOpen, setMyDayOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
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
        <BalanceStrip counts={model.counts} onElementPress={onElementPress} />
        <WaterCounter glasses={model.glasses} onAdd={() => logWaterGlass()} />
        <SetsSummaryLine sets={model.sets} onPress={onOpenProgress} />

        <Text style={styles.section}>Today</Text>
        <DayList rows={model.rows} />

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
        <TrainingLogSheet visible={logOpen} onClose={() => setLogOpen(false)} />
        <PracticeSheet
          visible={practiceOpen}
          onClose={() => setPracticeOpen(false)}
          onEngageLegs={legs => {
            setPracticeOpen(false);
            onEngageLegs(legs);
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
  section: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
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
