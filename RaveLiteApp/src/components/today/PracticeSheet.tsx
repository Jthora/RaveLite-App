import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CardGrid} from '../CardGrid';
import {PracticeRunner} from './PracticeRunner';
import {SkillList} from './SkillList';
import {DisciplineView} from './DisciplineView';
import {
  disciplineById,
  type DisciplineId,
} from '../../domain/exercises/disciplines';
import type {ChartId} from '../../domain/program/charts';
import {ExerciseRow} from '../ExerciseRow';
import {Tap} from '../Tap';
import type {CircuitLeg} from '../../domain/circuit/circuit';
import type {Exercise} from '../../domain/exercises/types';
import {exercisesFor} from '../../domain/exercises/library';
import {CircuitsPanel} from '../../screens/heart/CircuitsPanel';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';
import {useBackStack} from '../BackStack';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEngageLegs: (legs: CircuitLeg[]) => void;
}

/**
 * Practice on demand, off the home screen: the skills to drill with a
 * counter, then the Pentagram and saved circuits, then the Heart drills.
 *
 * The counter shows in this same sheet, never as a sheet over it: on
 * Android, Back stops reaching a sheet opened over another once it has
 * been touched.
 */
export function PracticeSheet({visible, onClose, onEngageLegs}: Props) {
  const accent = ELEMENTS.heart.accent;
  const [drilling, setDrilling] = useState<
    {exercise: Exercise; chart?: ChartId; dose?: string} | undefined
  >();
  /** A path open on its own page, inside this sheet. */
  const [path, setPath] = useState<DisciplineId | undefined>();
  const [logged, setLogged] = useState<string | undefined>();
  const [version, setVersion] = useState(0);
  const backStack = useBackStack();

  // Every opening starts on the list.
  useEffect(() => {
    if (!visible) {
      setDrilling(undefined);
      setPath(undefined);
      setLogged(undefined);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() =>
        backStack.back()
          ? undefined
          : drilling
          ? setDrilling(undefined)
          : path
          ? setPath(undefined)
          : onClose()
      }>
      <backStack.Provider>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: accent}]}>
              {drilling ? 'Drill it' : 'Practice'}
            </Text>
            <Tap
              variant="plain"
              onPress={onClose}
              accessibilityRole="button"
              style={styles.close}>
              <Text style={styles.closeText}>Close</Text>
            </Tap>
          </View>
          {drilling ? (
            <PracticeRunner
              exercise={drilling.exercise}
              chart={drilling.chart}
              dose={drilling.dose}
              onDone={summary => {
                setLogged(summary);
                setVersion(v => v + 1);
                setDrilling(undefined);
              }}
              onCancel={() => setDrilling(undefined)}
            />
          ) : path && disciplineById(path) ? (
            <View style={styles.path}>
              {logged ? (
                <Text testID="practice-logged" style={styles.logged}>
                  Logged: {logged}
                </Text>
              ) : null}
              <DisciplineView
                discipline={disciplineById(path)!}
                version={version}
                onPick={(exercise, chart, dose) =>
                  setDrilling({exercise, chart, dose})
                }
                onBack={() => {
                  setPath(undefined);
                  setLogged(undefined);
                }}
              />
            </View>
          ) : (
            <CircuitsPanel
              onEngageLegs={onEngageLegs}
              header={
                <View>
                  {logged ? (
                    <Text testID="practice-logged" style={styles.logged}>
                      Logged: {logged}
                    </Text>
                  ) : null}
                  <SkillList
                    version={version}
                    onPick={exercise => setDrilling({exercise})}
                    onOpenDiscipline={id => {
                      setLogged(undefined);
                      setPath(id);
                    }}
                  />
                </View>
              }
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
          )}
        </SafeAreaView>
      </backStack.Provider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  logged: {
    ...t.caption,
    color: ELEMENTS.water.color,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  path: {
    flex: 1,
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
