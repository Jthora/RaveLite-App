/**
 * DailySetsSheet — Daily Sets in full, opened from Today's set meters:
 * today's tracks with their rounds, max tests, level ups and track on/off,
 * and Goals.
 */
import React, {useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';
import {DailySetsSection} from './DailySetsSection';
import {GoalsSheet} from './GoalsSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DailySetsSheet({visible, onClose}: Props) {
  const [goalsOpen, setGoalsOpen] = useState(false);
  const accent = ELEMENTS.heart.accent;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>Daily Sets</Text>
          <View style={styles.actions}>
            <Tap
              testID="goals-open"
              variant="plain"
              onPress={() => setGoalsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Goals: push-ups today, the fitness tests and a goal for each element"
              style={styles.close}>
              <Text style={[styles.closeText, {color: accent}]}>Goals</Text>
            </Tap>
            <Tap
              variant="plain"
              onPress={onClose}
              accessibilityRole="button"
              style={styles.close}>
              <Text style={styles.closeText}>Close</Text>
            </Tap>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <DailySetsSection />
        </ScrollView>
        <GoalsSheet visible={goalsOpen} onClose={() => setGoalsOpen(false)} />
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
