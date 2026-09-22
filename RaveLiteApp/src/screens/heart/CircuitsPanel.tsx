/**
 * CircuitsPanel — circuits in Today's Practice sheet.
 *
 * Layer 1: Pentagram launcher card (built-in) + saved custom circuits
 *          list + "+ New circuit" action.
 * Layer 2: CircuitEditor takeover when editingId is set.
 *   (Layer 3 LegEditor is owned by CircuitEditor itself.)
 *
 * Engaging a circuit (built-in or custom) bubbles the leg array up to
 * HeartScreen, which owns the CircuitChamber instance.
 */
import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {CircuitEditor} from '../../components/circuit/CircuitEditor';
import {CircuitListRow} from '../../components/circuit/CircuitListRow';
import {Tap} from '../../components/Tap';

import {buildCircuit, type CircuitLeg} from '../../domain/circuit/circuit';
import {legsFromCustomCircuit} from '../../domain/circuit/legsFromCustomCircuit';
import {
  deleteCircuit,
  listCircuits,
  loadCircuit,
  makeCircuit,
  saveCircuit,
} from '../../domain/circuit/customRepository';
import type {CustomCircuit} from '../../domain/circuit/customTypes';
import {useBackHandler} from '../../components/BackStack';

import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  /** HeartScreen owns the CircuitChamber; this fires it with given legs. */
  onEngageLegs: (legs: CircuitLeg[]) => void;
  /** Shown before the circuits, in the same scroll (hidden while editing). */
  header?: React.ReactNode;
  /** Shown after the circuits, in the same scroll (hidden while editing). */
  footer?: React.ReactNode;
}

export function CircuitsPanel({onEngageLegs, header, footer}: Props) {
  const [list, setList] = useState<CustomCircuit[]>(() => listCircuits());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  /** A new circuit, not saved until Save: Back used to leave "Untitled". */
  const [draft, setDraft] = useState<CustomCircuit | null>(null);

  const accent = ELEMENTS.heart.color;
  const accentDim = ELEMENTS.heart.accent;

  const refresh = useCallback(() => setList(listCircuits()), []);

  const onNewCircuit = useCallback(() => {
    const fresh = makeCircuit('Untitled');
    setDraft(fresh);
    setNewlyAddedId(fresh.id);
    setEditingId(fresh.id);
  }, []);

  const onCircuitSave = useCallback(
    (updated: CustomCircuit) => {
      saveCircuit(updated);
      refresh();
      setEditingId(null);
      setNewlyAddedId(null);
      setDraft(null);
    },
    [refresh],
  );

  const onCircuitDelete = useCallback(() => {
    if (!editingId) {
      return;
    }
    deleteCircuit(editingId);
    refresh();
    setEditingId(null);
    setNewlyAddedId(null);
    setDraft(null);
  }, [editingId, refresh]);

  const onCircuitCancel = useCallback(() => {
    // A new circuit was never saved, so there is nothing to clean up; one
    // that was run (and so saved) stays.
    refresh();
    setEditingId(null);
    setNewlyAddedId(null);
    setDraft(null);
  }, [refresh]);

  // Android Back closes the editor, not the whole Practice sheet.
  useBackHandler(editingId !== null, onCircuitCancel);

  const onCircuitEngage = useCallback(
    (draft: CustomCircuit) => {
      if (draft.legs.length === 0) {
        return;
      }
      // Persist any unsaved changes first so a crashed run doesn't
      // lose the user's edits.
      saveCircuit(draft);
      refresh();
      onEngageLegs(legsFromCustomCircuit(draft));
    },
    [onEngageLegs, refresh],
  );

  // Layer 2 — Editor takeover.
  if (editingId) {
    const circuit =
      draft?.id === editingId
        ? loadCircuit(editingId) ?? draft
        : loadCircuit(editingId);
    if (circuit) {
      return (
        <CircuitEditor
          circuit={circuit}
          isNew={newlyAddedId === editingId}
          onSave={onCircuitSave}
          onDelete={onCircuitDelete}
          onCancel={onCircuitCancel}
          onEngage={onCircuitEngage}
        />
      );
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {header}
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.eyebrow, {color: accentDim}]}>
          ▸ CIRCUITS
        </Text>
        <Text style={styles.subtitle}>
          The Five Elements circuit, plus circuits you make.
        </Text>
      </View>

      {/* Built-in pentagram card */}
      <View style={[styles.card, {borderColor: accent}]}>
        <Text style={[styles.cardEyebrow, {color: accentDim}]}>▸ BUILT-IN</Text>
        <Text style={styles.cardTitle}>Five Elements</Text>
        <Text style={styles.cardMeta}>
          Air → Fire → Earth → Water → Heart · ~3 minutes
        </Text>
        <Tap
          variant="solid"
          color={accent}
          onPress={() => onEngageLegs(buildCircuit())}
          style={styles.engageBtn}>
          <Text style={styles.engageText}>Start ⟶</Text>
        </Tap>
      </View>

      {/* Saved custom circuits */}
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionLabel}>
          SAVED CIRCUITS
        </Text>
        {list.map(c => (
          <CircuitListRow
            key={c.id}
            circuit={c}
            onPress={() => setEditingId(c.id)}
          />
        ))}
        {list.length === 0 && (
          <Text style={styles.emptyText}>
            No saved circuits yet. Tap + New circuit to make one.
          </Text>
        )}
      </View>

      {/* + New circuit */}
      <Tap
        testID="circuit-new"
        variant="ghost"
        color={accentDim}
        onPress={onNewCircuit}
        style={styles.newBtn}>
        <Text style={[styles.newBtnText, {color: accentDim}]}>
          + New circuit
        </Text>
      </Tap>
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    ...t.subtitle,
    color: palette.textDim,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: palette.surface,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...t.title,
    color: palette.text,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    color: palette.textDim,
    fontSize: 12,
    marginBottom: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  engageBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  engageText: {
    color: palette.bg,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.8,
  },
  section: {marginTop: spacing.xl},
  sectionLabel: {
    color: palette.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...t.body,
    color: palette.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  newBtn: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
