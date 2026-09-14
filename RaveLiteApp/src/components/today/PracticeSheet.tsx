import React from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CardGrid} from '../CardGrid';
import {ExerciseRow} from '../ExerciseRow';
import {Tap} from '../Tap';
import type {CircuitLeg} from '../../domain/circuit/circuit';
import {exercisesFor} from '../../domain/exercises/library';
import {CircuitsPanel} from '../../screens/heart/CircuitsPanel';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEngageLegs: (legs: CircuitLeg[]) => void;
}

/**
 * Practice on demand, off the home screen, in one scroll: the Pentagram
 * and saved circuits, then the Heart drill library.
 */
export function PracticeSheet({visible, onClose, onEngageLegs}: Props) {
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
        <CircuitsPanel
          onEngageLegs={onEngageLegs}
          footer={
            <View style={styles.drills}>
              <Text style={styles.sectionLabel}>HEART DRILLS</Text>
              <CardGrid>
                {exercisesFor('heart').map(ex => (
                  <ExerciseRow key={ex.id} exercise={ex} />
                ))}
              </CardGrid>
            </View>
          }
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
  drills: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.4,
  },
});
