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
 * Skippable at any point. The defaults are a working program, and an app
 * that will not let you in until you have answered it is worse than one
 * that guesses.
 */
import React, {useCallback, useMemo, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {previewDay, previewLine} from '../../domain/profile/preview';
import {finishSetup} from '../../domain/profile/repository';
import {ArchetypePanel} from '../heart/ArchetypePanel';
import {KitPanel} from '../heart/KitPanel';
import {PacksPanel} from '../heart/PacksPanel';
import {ShapePanel} from '../heart/ShapePanel';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Step {
  key: string;
  title: string;
  /** Why this question is being asked, in the second person. */
  why: string;
  panel: React.ComponentType;
}

const STEPS: readonly Step[] = [
  {
    key: 'archetype',
    title: 'What are you training for?',
    why: 'Pick the closest one. It fills in everything after this, and you can change any of it.',
    panel: ArchetypePanel,
  },
  {
    key: 'kit',
    title: 'What have you got?',
    why: 'The program only ever asks for things this list says you have.',
    panel: KitPanel,
  },
  {
    key: 'shape',
    title: 'How much day have you got?',
    why: 'Not how hard you want it. How many times a day you can stop and move.',
    panel: ShapePanel,
  },
  {
    key: 'packs',
    title: 'Anything you want to learn?',
    why: 'On top of the base program, which you get either way.',
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
    onDone();
  }, [onDone]);

  const preview = useMemo(
    () => previewDay(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [at, version],
  );

  const last = at >= STEPS.length;
  const step = STEPS[Math.min(at, STEPS.length - 1)];
  const Panel = step.panel;

  return (
    <Modal visible animationType="slide" onRequestClose={done}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
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
                    } of curriculum to work through`
                  : 'the base program to work through'}
                . Each element aims for {preview.par} points a day; all five at
                par is a Harmony day.
              </Text>
              <Text style={styles.why}>
                That's it. The rest is more of that — answer the chimes, and the
                app follows what you actually do.
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
