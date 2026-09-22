/**
 * First run: four questions and a day.
 *
 * Every card here is a panel Settings already uses. That is the whole
 * design — there is no second UI to keep in step, and someone who
 * finishes setup has already been taught where everything lives, because
 * the screen they change it on later is the screen they set it on now.
 *
 * Under each card is the same line, recomputed from the real program as
 * tiles are tapped: `9 chimes · 16 tracks · 142 drills · par 20`. It is
 * not a description of what the answers will do, it is what they have
 * already done — the preview and the thing are the same object.
 *
 * Skippable at any point. Opening it writes gentle defaults — the base
 * program, fewer chimes, a beginner's numbers (`beginSetup`) — so Skip, a
 * question left alone or a killed app never leaves somebody on the
 * author's program. Android Back steps back a card; it does not skip.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {previewDay, previewLine} from '../../domain/profile/preview';
import {finishSetup} from '../../domain/profile/repository';
import {beginSetup} from '../../domain/profile/setup';
import {enqueueNow} from '../../domain/ambient/pulseRuntime';
import {ArchetypePanel} from '../heart/ArchetypePanel';
import {KitPanel} from '../heart/KitPanel';
import {PacksPanel} from '../heart/PacksPanel';
import {ShapePanel} from '../heart/ShapePanel';
import {DisclaimerCard} from './DisclaimerCard';
import {MyDayPanel} from './MyDayPanel';
import {StartingPanel} from './StartingPanel';
import {Symbol, hueOf, type SymbolName} from '../../components/icons/Symbol';
import {tint} from '../../theme/hues';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

/** Needs no kit, no floor and no room: safe to fire at anybody. */
const TUTORIAL_DRILL = 'air.chin-tuck';

interface Step {
  key: string;
  title: string;
  /** Why this question is being asked, in the second person. */
  why: string;
  panel: React.ComponentType;
  /** Drawn beside the question, so the page is not four grey headings. */
  symbol: SymbolName;
}

const STEPS: readonly Step[] = [
  {
    key: 'disclaimer',
    symbol: 'warning',
    title: 'Before you start',
    why: 'This takes about 30 seconds.',
    panel: DisclaimerCard,
  },
  {
    key: 'archetype',
    symbol: 'operator',
    title: 'What are you training for?',
    why: 'Pick the closest one. It sets the answers that follow. You can change any of them.',
    panel: ArchetypePanel,
  },
  {
    key: 'kit',
    symbol: 'carry',
    title: 'What do you have?',
    why: 'The program only asks for things you mark here.',
    panel: KitPanel,
  },
  {
    key: 'hours',
    symbol: 'sun',
    title: 'When does your day run?',
    why: 'Chimes only sound inside these hours.',
    panel: MyDayPanel,
  },
  {
    key: 'shape',
    symbol: 'desk',
    title: 'What is your day like?',
    why: 'This sets how many times a day the app asks you to move.',
    panel: ShapePanel,
  },
  {
    key: 'starting',
    symbol: 'new',
    title: 'Where are you starting?',
    why: 'This sets your first numbers. After that, the app adjusts to what you do.',
    panel: StartingPanel,
  },
  {
    key: 'packs',
    symbol: 'learn',
    title: 'Anything you want to learn?',
    why: 'These add to the base program. You get the base program either way.',
    panel: PacksPanel,
  },
];

export function SetupFlow({onDone}: {onDone: () => void}) {
  const [at, setAt] = useState(0);
  /** Bumped on every step change so the preview re-reads the program. */
  const [version, setVersion] = useState(0);
  const accent = ELEMENTS.heart.accent;

  const done = useCallback(() => {
    finishSetup();
    // The tutorial is a real chime, so fire one: chin tucks need no kit,
    // no floor and no room, which makes them the one drill that is safe
    // to promise before knowing anything about where this person is.
    enqueueNow({element: 'air', exerciseId: TUTORIAL_DRILL});
    onDone();
  }, [onDone]);

  // App.tsx has usually done this already; a wipe from Settings has not.
  useEffect(() => {
    beginSetup();
    setVersion(v => v + 1);
  }, []);

  /** Back steps back. On the first card it leaves the app, as Android does. */
  const back = useCallback(() => {
    if (at > 0) {
      setAt(n => n - 1);
    } else {
      BackHandler.exitApp();
    }
  }, [at]);

  const preview = useMemo(
    () => previewDay(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [at, version],
  );

  const last = at >= STEPS.length;
  const step = STEPS[Math.min(at, STEPS.length - 1)];
  const Panel = step.panel;

  return (
    <Modal visible animationType="slide" onRequestClose={back}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: tint(last ? accent : hueOf(step.symbol), '1F'),
              },
            ]}>
            <Symbol
              name={last ? 'star' : step.symbol}
              size={20}
              color={last ? accent : undefined}
            />
          </View>
          <Text style={[styles.title, {color: accent}]}>
            {last ? "Here's your day" : step.title}
          </Text>
          <Tap
            testID="setup-skip"
            variant="plain"
            onPress={done}
            accessibilityRole="button"
            accessibilityLabel="Skip setup and use the defaults"
            style={styles.close}>
            <Text style={styles.closeText}>{last ? '' : 'Skip'}</Text>
          </Tap>
        </View>

        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.pip,
                {backgroundColor: i <= at ? accent : palette.border},
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {last ? (
            <View style={styles.card}>
              <Text style={styles.big}>{preview.rounds}</Text>
              <Text style={styles.cardLine}>
                chimes a day, across {preview.tracks}{' '}
                {preview.tracks === 1 ? 'track' : 'tracks'}.
              </Text>
              <Text style={styles.why}>
                {preview.drills} drills fit what you have, and{' '}
                {preview.lessons > 0
                  ? `${preview.lessons} ${
                      preview.lessons === 1 ? 'section' : 'sections'
                    } of lessons to work through`
                  : 'the base program to work through'}
                . Each element has a goal of {preview.par} points a day. Reach
                it in all five for a Harmony day.
              </Text>
              <Text style={styles.why}>
                Answer the chimes. The app adjusts to what you do.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.why}>{step.why}</Text>
              <View onTouchEnd={() => setVersion(v => v + 1)}>
                <Panel />
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.foot}>
          <Text testID="setup-preview" style={styles.preview}>
            {previewLine(preview)}
          </Text>
          <View style={styles.buttons}>
            {at > 0 ? (
              <Tap
                testID="setup-back"
                variant="ghost"
                color={palette.textDim}
                onPress={() => setAt(n => Math.max(0, n - 1))}
                accessibilityRole="button"
                style={styles.btn}>
                <Text style={styles.btnText}>Back</Text>
              </Tap>
            ) : null}
            <Tap
              testID="setup-next"
              variant="solid"
              color={accent}
              onPress={() => (last ? done() : setAt(n => n + 1))}
              accessibilityRole="button"
              accessibilityLabel={last ? 'Start' : 'Next question'}
              style={[styles.btn, styles.grow]}>
              <Text style={styles.btnOn}>{last ? 'Start' : 'Next'}</Text>
            </Tap>
          </View>
        </View>
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
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...t.title,
    flex: 1,
  },
  close: {
    minHeight: 48,
    minWidth: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  progress: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  pip: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  why: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  card: {
    marginTop: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  big: {
    fontSize: 48,
    fontWeight: '700',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  cardLine: {
    ...t.subtitle,
    color: palette.text,
  },
  foot: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.sm,
  },
  preview: {
    ...t.caption,
    color: palette.textDim,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  btnText: {
    ...t.subtitle,
    color: palette.text,
  },
  btnOn: {
    ...t.subtitle,
    color: palette.bg,
    fontWeight: '700',
  },
});
