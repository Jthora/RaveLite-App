import React, {useMemo} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../icons/ElementGlyph';
import {SafeAreaView} from 'react-native-safe-area-context';

import {CardGrid} from '../CardGrid';
import {ExerciseRow} from '../ExerciseRow';
import {Tap} from '../Tap';
import {TargetFilterStrip} from '../TargetFilterStrip';
import {exercisesFor} from '../../domain/exercises/library';
import type {Target} from '../../domain/exercises/types';
import type {ElementIdentity} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  element: ElementIdentity;
  focus: readonly Target[];
  onFocusChange: (next: Target[]) => void;
}

/**
 * An element's whole drill library, filtered by focus areas. The focus
 * areas are saved per element and also steer the page's "try this now".
 */
export function LibrarySheet({
  visible,
  onClose,
  element,
  focus,
  onFocusChange,
}: Props) {
  const all = useMemo(() => exercisesFor(element.id), [element.id]);
  const shown = useMemo(
    () =>
      focus.length === 0
        ? all
        : all.filter(ex => ex.targets.some(tg => focus.includes(tg))),
    [all, focus],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ElementGlyph element={element} size={22} color={element.accent} />
            <Text style={[styles.title, {color: element.accent}]}>
              {element.name} drills
            </Text>
          </View>
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
          <TargetFilterStrip
            active={focus}
            onChange={onFocusChange}
            color={element.color}
          />
          <Text style={styles.meta}>
            {shown.length} of {all.length} {element.name.toLowerCase()} drills
            {focus.length > 0
              ? ` · ${focus.length} focus area${focus.length === 1 ? '' : 's'}`
              : ''}
          </Text>
          {shown.length === 0 ? (
            <Text style={styles.empty}>
              No drills match these focus areas. Drop a pill or two.
            </Text>
          ) : (
            <CardGrid>
              {shown.map(ex => (
                <ExerciseRow key={ex.id} exercise={ex} />
              ))}
            </CardGrid>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
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
    flexShrink: 1,
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
    gap: spacing.sm,
  },
  meta: {
    ...t.caption,
    color: palette.textDim,
  },
  empty: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
});
