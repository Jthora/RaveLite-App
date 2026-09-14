/**
 * DailySetsSheet — Daily Sets in full, opened from Today's set meters:
 * today's tracks with their rounds, max tests, level ups and track on/off.
 */
import React from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Tap} from '../../components/Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';
import {DailySetsSection} from './DailySetsSection';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DailySetsSheet({visible, onClose}: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: ELEMENTS.heart.accent}]}>
            Daily Sets
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
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <DailySetsSection />
        </ScrollView>
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
  },
});
