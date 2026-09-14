import React, {useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CardGrid} from '../CardGrid';
import {ExerciseRow} from '../ExerciseRow';
import {Tap} from '../Tap';
import type {CircuitLeg} from '../../domain/circuit/circuit';
import {exercisesFor} from '../../domain/exercises/library';
import {CircuitsPanel} from '../../screens/heart/CircuitsPanel';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

type PracticeTab = 'circuits' | 'drills';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEngageLegs: (legs: CircuitLeg[]) => void;
}

/**
 * Practice on demand, off the home screen: the Pentagram and saved
 * circuits, and the Heart drill library.
 */
export function PracticeSheet({visible, onClose, onEngageLegs}: Props) {
  const [tab, setTab] = useState<PracticeTab>('circuits');
  const accent = ELEMENTS.heart.accent;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>Practice</Text>
          <Tap
            variant="plain"
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Tap>
        </View>
        <View style={styles.tabs}>
          {(['circuits', 'drills'] as const).map(key => {
            const on = tab === key;
            return (
              <Tap
                key={key}
                variant="plain"
                color={accent}
                onPress={() => setTab(key)}
                accessibilityRole="tab"
                accessibilityState={{selected: on}}
                style={[styles.tab, on && {borderColor: accent}]}>
                <Text style={[styles.tabText, on && {color: accent}]}>
                  {key === 'circuits' ? 'Circuits' : 'Heart drills'}
                </Text>
              </Tap>
            );
          })}
        </View>
        {tab === 'circuits' ? (
          <CircuitsPanel onEngageLegs={onEngageLegs} />
        ) : (
          <ScrollView contentContainerStyle={styles.drills}>
            <CardGrid>
              {exercisesFor('heart').map(ex => (
                <ExerciseRow key={ex.id} exercise={ex} />
              ))}
            </CardGrid>
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  tabText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  drills: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
