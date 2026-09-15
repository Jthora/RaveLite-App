/**
 * DailySetsSheet — Daily Sets in full, opened from Today's set meters:
 * today's tracks with their rounds, max tests, level ups and track on/off,
 * and Goals.
 *
 * Goals shows in this same sheet, not as a sheet over it: on Android, once
 * a sheet opened over another has been touched, Back stops reaching it.
 * Back from Goals returns to Daily Sets; Back again closes the sheet.
 */
import React, {useEffect, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';
import {DailySetsSection} from './DailySetsSection';
import {Goals} from './Goals';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type View_ = 'sets' | 'goals';

export function DailySetsSheet({visible, onClose}: Props) {
  const [showing, setShowing] = useState<View_>('sets');
  const accent = ELEMENTS.heart.accent;
  const goals = showing === 'goals';

  // Every opening starts on Daily Sets.
  useEffect(() => {
    if (!visible) {
      setShowing('sets');
    }
  }, [visible]);

  const back = () => (goals ? setShowing('sets') : onClose());

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>
            {goals ? 'Goals' : 'Daily Sets'}
          </Text>
          <View style={styles.actions}>
            {goals ? (
              <Tap
                testID="sets-back"
                variant="plain"
                onPress={() => setShowing('sets')}
                accessibilityRole="button"
                accessibilityLabel="Back to Daily Sets"
                style={styles.close}>
                <Text style={[styles.closeText, {color: accent}]}>
                  Daily Sets
                </Text>
              </Tap>
            ) : (
              <Tap
                testID="goals-open"
                variant="plain"
                onPress={() => setShowing('goals')}
                accessibilityRole="button"
                accessibilityLabel="Goals: push-ups today, the fitness tests and a goal for each element"
                style={styles.close}>
                <Text style={[styles.closeText, {color: accent}]}>Goals</Text>
              </Tap>
            )}
            <Tap
              variant="plain"
              onPress={onClose}
              accessibilityRole="button"
              style={styles.close}>
              <Text style={styles.closeText}>Close</Text>
            </Tap>
          </View>
        </View>
        {goals ? (
          <Goals />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <DailySetsSection />
          </ScrollView>
        )}
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
});
