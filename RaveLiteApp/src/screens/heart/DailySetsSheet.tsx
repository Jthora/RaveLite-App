/**
 * DailySetsSheet — Daily Sets in full, opened from Today's set meters:
 * today's tracks with their rounds, max tests, level ups and track on/off,
 * and the fitness standards.
 */
import React, {useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';
import {DailySetsSection} from './DailySetsSection';
import {StandardsSheet} from './StandardsSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DailySetsSheet({visible, onClose}: Props) {
  const [standardsOpen, setStandardsOpen] = useState(false);
  const accent = ELEMENTS.heart.accent;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>Daily Sets</Text>
          <View style={styles.actions}>
            <Tap
              testID="standards-open"
              variant="plain"
              onPress={() => setStandardsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Standards: push-ups today, fitness tests and targets"
              style={styles.close}>
              <Text style={[styles.closeText, {color: accent}]}>Standards</Text>
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
        <StandardsSheet
          visible={standardsOpen}
          onClose={() => setStandardsOpen(false)}
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
